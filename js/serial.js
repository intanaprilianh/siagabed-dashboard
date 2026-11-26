/* SiagaBed · sensor USB (Web Serial, Chrome/Edge).
 *
 * Membaca keluaran Serial firmware esp32_breath_counter (115200 baud, CSV 10 sampel/dtk):
 *   t_s,f_Hz,napas_Hz,rms_Hz,bpm,status      status: OK | MENUNGGU | TIDAK_ADA_NAPAS | SINYAL_LEMAH | OSC_ERROR
 * lalu menjadikannya monitor satu bed dengan antarmuka yang sama seperti BedMonitor (engine) dan LiveBed
 * (live.js), jadi tampilan dasbor tidak perlu tahu sumbernya.
 *
 * Pembagian kerja:
 *   - firmware: frekuensi osilator, sinyal napas terfilter (napas_Hz), RMS, laju napas (median 5 periode)
 *   - di sini : deteksi napas (aturan zero-crossing yang sama dengan firmware), timer henti napas,
 *               Waspada/Kritis/Pra-alarm/Code Blue dengan ambang dan waktu tahan yang sama dengan hub,
 *               kehadiran dari level frekuensi bila sudah dikalibrasi.
 *
 * Keselamatan: firmware melaporkan SINYAL_LEMAH juga saat dada berhenti bergerak (henti napas), jadi
 * status itu TIDAK menghentikan hitung mundur. Tanpa kalibrasi kehadiran, pasien dianggap selalu ada.
 */
(function (root) {
  'use strict';
  const E = root.SiagaEngine, FS = E.FS, CFG = E.CFG;
  const MIN_RMS = 20;              /* BreathDsp::MIN_RMS_HZ di firmware */
  const STALE_S = 2;               /* tanpa sampel lebih dari ini: ESP32 dianggap tidak mengirim data */
  const supported = typeof navigator !== 'undefined' && 'serial' in navigator;

  class SerialBed {
    constructor(opts) {
      this.serial = true;
      this.clock = opts.clock;     /* () => waktu ward (dtk) */
      this.emitFn = opts.emit;     /* (kejadian) => void, langsung ke pendengar ward */
      this.demo = !!opts.demo;
      this.cal = opts.cal || null; /* { empty, occ } dalam Hz, hasil kalibrasi di dasbor */
      this.N = FS * 30; this.head = 0;
      this.bufX = new Float32Array(this.N).fill(NaN);
      this.bufB = new Float32Array(this.N).fill(NaN);
      this.bufH = new Uint8Array(this.N);
      this.events = [];            /* sengaja kosong: kejadian dikirim lewat emitFn */
      this.lastT = 0; this.breaths = []; this.trend = [];
      this.stage = null; this.online = false; this.known = true;
      this.alarm = 'none'; this.praT = 0; this.cbT = 0; this.cbSource = ''; this.praSince = 0;
      this.rr = null; this.rrStage = 'stabil'; this.apneaSec = 0; this.sqi = 0; this.h = 6;
      this.present = true; this.fault = false; this.held = false; this.heldLong = false;
      this.critT = 0; this.warnT = 0; this.ncwT = 0; this.normT = 0; this.secAcc = 0; this.trendAcc = 0;
      this.lastEffT = 0; this.effAfterPra = 0; this.armed = false;
      this.prev = null; this.last = null; this.lastSampleT = null; this.samples = 0;
      this.fw = { status: '', f: NaN, rms: NaN, bpm: null, tDev: null };
      this.rateWin = []; this.rate = 0; this.recording = null;
      this.shadow = opts.shadow || null; /* monitor lama bed ini (simulasi/hub), tetap dijalankan di belakang */
    }
    isOffline() { return this.lastSampleT == null || this.clock() - this.lastSampleT > STALE_S; }
    status() {
      if (this.alarm === 'cb') return 'codeblue';
      if (this.alarm === 'pra') return 'pra';
      if (this.fault) return 'teknis';
      if (!this.present) return 'kosong';
      return this.rrStage;
    }
    emit(t, type, data) { this.emitFn({ t, type, data: data || {}, usb: true }); }
    /* LiveWard (mode live) memanggil ini untuk pesan hub: diteruskan ke monitor lama supaya tetap mutakhir */
    applySt(...a) { if (this.shadow && this.shadow.applySt) this.shadow.applySt(...a); }
    onWave(...a) { if (this.shadow && this.shadow.onWave) this.shadow.onWave(...a); }
    setStage(...a) { if (this.shadow && this.shadow.setStage) this.shadow.setStage(...a); }
    calibrated() { return !!(this.cal && Number.isFinite(this.cal.empty) && Number.isFinite(this.cal.occ)); }

    /* satu sampel dari firmware */
    sample(s) {
      const t = this.clock();
      if (this.stage == null) { this.stage = 'normal'; this.lastEffT = t; }
      this.online = true;
      this.prev = this.last; this.last = { t, v: s.napas };
      this.lastSampleT = t; this.samples++;
      this.fw = { status: s.status, f: s.f, rms: s.rms, bpm: s.bpm, tDev: s.t };
      this.rateWin.push(t);
      while (this.rateWin.length && t - this.rateWin[0] > 5) this.rateWin.shift();
      this.rate = this.rateWin.length / 5;
      const osc = s.status !== 'OSC_ERROR' && Number.isFinite(s.f);
      if (this.recording && osc) { this.recording.sum += s.f; this.recording.n++; }
      /* kehadiran dari level frekuensi, dengan histeresis (hanya bila dua titik kalibrasi ada) */
      if (osc && this.calibrated() && Math.abs(this.cal.occ - this.cal.empty) > 1) {
        const pos = (s.f - this.cal.empty) / (this.cal.occ - this.cal.empty);   /* 0 = kosong, 1 = terisi */
        const was = this.present;
        if (was && pos < 0.35) this.present = false;
        else if (!was && pos > 0.65) this.present = true;
        if (was !== this.present) {
          if (this.present) { this.lastEffT = t; this.breaths.length = 0; }
          this.emit(t, this.present ? 'kembali' : 'kosong');
        }
      }
      /* deteksi napas: aturan firmware (naik melewati +0,3·RMS setelah turun di bawah −0,3·RMS, RMS ≥ 20 Hz) */
      if (osc && Number.isFinite(s.napas) && Number.isFinite(s.rms)) {
        const h = 0.3 * s.rms;
        if (s.napas < -h) this.armed = true;
        if (this.armed && s.napas > h && s.rms >= MIN_RMS) {
          this.armed = false;
          this.breaths.push({ t, v: s.napas, eff: true });
          if (this.breaths.length > 60) this.breaths.shift();
          this.lastEffT = t;
          if (this.alarm === 'pra') this.effAfterPra++;
        }
      }
      this.sqi = Number.isFinite(s.rms) ? Math.max(0, Math.min(1, s.rms / (2 * MIN_RMS))) : 0;
      this.h = Number.isFinite(s.rms) ? Math.max(6, 0.3 * s.rms) : 6;
      this.rr = osc && s.bpm != null && Number.isFinite(s.bpm) ? s.bpm : null;
    }

    /* dipanggil ward 25 kali/dtk: gelombang, gangguan, dan aturan alarm */
    step(_f, tArg) {
      const t = Number.isFinite(tArg) ? tArg : this.clock();
      if (this.shadow) {                             /* kejadiannya dibuang: yang tampil hanya data sensor USB */
        try { this.shadow.step(_f, t); } catch (e) { /* abaikan */ }
        if (this.shadow.events) this.shadow.events.length = 0;
      }
      let v = NaN;
      if (this.last && t - this.last.t <= 0.35) {    /* interpolasi 10 Hz → 25 Hz, tertunda satu sampel; data berhenti: garis putus */
        const tr = t - 0.1, p = this.prev || this.last, q = this.last;
        v = tr <= p.t ? p.v : tr >= q.t || q.t === p.t ? q.v : p.v + (q.v - p.v) * (tr - p.t) / (q.t - p.t);
      }
      this.bufB[this.head] = v; this.bufX[this.head] = NaN; this.bufH[this.head] = 0;
      this.head = (this.head + 1) % this.N; this.lastT = t;
      if (this.stage == null) return;                /* belum ada data pertama */
      const fault = this.isOffline() || this.fw.status === 'OSC_ERROR';
      if (fault !== this.fault) {
        this.fault = fault;
        if (fault) this.rr = null;
        this.emit(t, fault ? 'teknis' : 'teknis_pulih');
        if (!fault) this.lastEffT = t;
      }
      const monitoring = !this.fault && this.present;
      if (!monitoring && this.alarm === 'none') this.lastEffT = t;
      this.apneaSec = Math.max(0, t - this.lastEffT);
      if (this.alarm === 'none' && monitoring && this.apneaSec >= CFG.apnea) {
        this.alarm = 'pra'; this.praT = t; this.praSince = this.lastEffT; this.effAfterPra = 0;
        this.emit(t, 'pra', { since: this.lastEffT });
      }
      if (this.alarm === 'pra') {
        if (monitoring && this.effAfterPra >= 2) { this.alarm = 'none'; this.emit(t, 'pra_selesai'); }
        else if (t - this.praT >= CFG.verify) {
          this.alarm = 'cb'; this.cbT = t; this.cbSource = 'otomatis';
          this.emit(t, 'codeblue', { source: 'otomatis', since: this.praSince });
        }
      }
      this.secAcc += 1 / FS;
      if (this.secAcc >= 1 - 1e-9) { this.secAcc -= 1; this.perSecond(t, monitoring); }
    }
    perSecond(t, monitoring) {
      const hw = this.demo ? CFG.holdDemo : CFG.holdWarn;
      const hc = this.demo ? CFG.holdDemo : CFG.holdCrit;
      const hn = this.demo ? CFG.holdDemo : CFG.holdNorm;
      if (monitoring && this.rr !== null) {
        const rr = Math.round(this.rr);
        const crit = rr <= CFG.rrCritLow || rr >= CFG.rrCritHigh;
        const warn = rr <= CFG.rrWarnLow || rr > CFG.rrWarnHigh;
        this.critT = crit ? this.critT + 1 : 0;
        this.warnT = warn ? this.warnT + 1 : 0;
        this.ncwT = warn && !crit ? this.ncwT + 1 : 0;
        this.normT = warn ? 0 : this.normT + 1;
        let s = this.rrStage;
        if (this.critT >= hc) s = 'kritis';
        else if (s === 'stabil' && this.warnT >= hw) s = 'waspada';
        else if (s === 'kritis' && this.ncwT >= hw) s = 'waspada';
        if (s !== 'stabil' && this.normT >= hn) s = 'stabil';
        if (s !== this.rrStage) { const prev = this.rrStage; this.rrStage = s; this.emit(t, s, { rr, prev }); }
      }
      this.trendAcc += 1;
      if (this.trendAcc >= 2) {
        this.trendAcc = 0;
        this.trend.push({ t, rr: monitoring && this.rr !== null ? Math.round(this.rr) : null });
        if (this.trend.length > 300) this.trend.shift();
      }
    }
    cancelPra(t) { if (this.alarm !== 'pra') return; this.alarm = 'none'; this.lastEffT = t; this.emit(t, 'pra_batal'); }
    confirmCB(t) { if (this.alarm !== 'pra') return; this.alarm = 'cb'; this.cbT = t; this.cbSource = 'perawat'; this.emit(t, 'codeblue', { source: 'perawat' }); }
    manualCB(t) { if (this.alarm === 'cb') return; this.alarm = 'cb'; this.cbT = t; this.cbSource = 'manual'; this.emit(t, 'codeblue', { source: 'manual' }); }
    closeCB(t) { if (this.alarm !== 'cb') return; this.alarm = 'none'; this.lastEffT = t; this.emit(t, 'cb_selesai'); }
    /* kalibrasi kehadiran: rata-rata frekuensi selama perekaman */
    startCal(kind) { this.recording = { kind, sum: 0, n: 0 }; }
    finishCal() {
      const r = this.recording; this.recording = null;
      if (!r || !r.n) return null;
      const f = r.sum / r.n;
      this.cal = Object.assign({}, this.cal, { [r.kind]: f });
      return f;
    }
  }

  /* Sambungan Web Serial ke ESP32. Membaca baris, memilah CSV/Plotter, mengirim perintah satu huruf. */
  class SerialLink {
    constructor(onSample, onState) {
      this.onSample = onSample; this.onState = onState;
      this.port = null; this.reader = null; this.closing = false;
      this.state = 'idle'; this.msg = ''; this.info = []; this.lines = 0; this.bad = 0;
    }
    set(state, msg) { this.state = state; this.msg = msg; if (this.onState) this.onState(state, msg); }
    async connect(port) {
      try {
        this.port = port || await navigator.serial.requestPort();
      } catch (e) { this.set('idle', 'Tidak ada port yang dipilih'); return false; }
      try {
        await this.port.open({ baudRate: 115200 });
      } catch (e) {
        this.set('error', `Port tidak bisa dibuka (${e.message}). Tutup Serial Monitor Arduino lalu coba lagi.`);
        this.port = null;
        return false;
      }
      this.set('on', 'Tersambung, menunggu data');
      this.write('c');                                /* pastikan firmware di mode CSV */
      this.loop = this.readLoop();
      return true;
    }
    async readLoop() {
      const dec = new TextDecoder();
      let buf = '';
      while (this.port && this.port.readable && !this.closing) {
        this.reader = this.port.readable.getReader();
        try {
          for (;;) {
            const { value, done } = await this.reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            let i;
            while ((i = buf.indexOf('\n')) >= 0) { this.line(buf.slice(0, i)); buf = buf.slice(i + 1); }
            if (buf.length > 4096) buf = '';
          }
        } catch (e) {
          if (this.closing) { /* diputus sendiri */ }
          else if (this.port && this.port.readable) console.warn('SiagaSerial: gangguan baca, lanjut membaca', e);
          else this.set('error', 'Kabel USB tercabut atau ESP32 berhenti mengirim data');
        } finally {
          try { this.reader.releaseLock(); } catch (e) { /* sudah dilepas */ }
          this.reader = null;
        }
        if (this.closing || !this.port || !this.port.readable) break;
      }
      if (!this.closing) {
        if (this.state === 'on') this.set('error', 'ESP32 terlepas atau berhenti mengirim data');
        try { if (this.port) await this.port.close(); } catch (e) { /* sudah tertutup */ }   /* supaya bisa dibuka lagi saat dicolok ulang */
      }
    }
    line(raw) {
      const s = raw.replace(/\r$/, '').trim();
      if (!s) return;
      if (s[0] === '#') { this.info.push(s.slice(1).trim()); if (this.info.length > 4) this.info.shift(); return; }
      if (s.startsWith('t_s,')) return;
      let r = null;
      if (s.includes('napas_Hz:')) {                /* mode Serial Plotter ('p') */
        const kv = {};
        for (const part of s.split(',')) { const [k, v] = part.split(':'); kv[(k || '').trim()] = Number(v); }
        r = { t: null, f: NaN, napas: kv.napas_Hz, rms: NaN, bpm: kv.bpm > 0 ? kv.bpm : null, status: 'PLOTTER' };
      } else {
        const p = s.split(',');
        if (p.length >= 6) {
          const num = x => (x === '' ? null : Number(x));
          r = { t: num(p[0]), f: num(p[1]), napas: num(p[2]), rms: num(p[3]), bpm: num(p[4]), status: p[5].trim() };
        }
      }
      if (!r || !Number.isFinite(r.napas)) { this.bad++; return; }
      this.lines++;
      if (!this.closing && (this.state !== 'on' || this.msg !== 'Menerima data')) this.set('on', 'Menerima data');
      this.onSample(r);
    }
    async write(text) {
      if (!this.port || !this.port.writable) return;
      try { const w = this.port.writable.getWriter(); await w.write(new TextEncoder().encode(text)); w.releaseLock(); } catch (e) { /* abaikan */ }
    }
    async disconnect() {
      this.closing = true;
      try { if (this.reader) await this.reader.cancel(); } catch (e) { /* sudah tertutup */ }
      try { await this.loop; } catch (e) { /* loop baca sudah selesai */ }
      try { if (this.port) await this.port.close(); } catch (e) { /* sudah tertutup */ }
      this.port = null;
      this.set('idle', 'Diputus');
    }
  }

  root.SiagaSerial = { supported, SerialBed, SerialLink, MIN_RMS, STALE_S };
})(typeof window !== 'undefined' ? window : globalThis);
