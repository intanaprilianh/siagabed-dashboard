/* SiagaBed mode Live.
 *
 * Mengganti mesin simulasi (SiagaEngine.Ward) dengan data dari hub SiagaBed sungguhan atau hub palsu:
 *   - data real-time: broker MQTT lewat WebSocket (topik siagabed/<bangsal>/<bed>/status|st|ev|wave)
 *   - riwayat log hari ini, tren, dan pengiriman perintah: backend SiagaBed (API HTTP)
 * LiveWard sengaja meniru antarmuka Ward (beds, byId, on, step, t, demo, setDemo, scenario, cancel, confirm,
 * close) supaya tampilan dasbor tidak perlu ditulis ulang. Keputusan alarm tetap dari hub; dasbor hanya
 * menampilkan dan meneruskan aksi perawat.
 *
 * Aktif bila URL berisi ?live. Opsi: &ws=ws://host:9001 &api=http://host:8080 &ward=melati
 * Format pesan: siagabed-backend/KONTRAK_MQTT.md
 */
(function (root) {
  'use strict';
  const E = root.SiagaEngine, FS = E.FS, DT = E.DT, CFG = E.CFG;
  const STALE_MS = 5000;           /* st tidak datang selama ini -> hub dianggap terputus */
  const MQTT_LOCAL = 'vendor/mqtt.min.js';
  const MQTT_CDN = 'https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js';

  function liveOptions() {
    const q = new URLSearchParams(root.location.search);
    if (!q.has('live')) return null;
    const loc = root.location;
    const host = (loc.protocol === 'file:' || !loc.hostname || loc.hostname.endsWith('github.io')) ? 'localhost' : loc.hostname;
    /* dibuka dari backend (http://host:8080/dashboard/) -> API di origin yang sama */
    const sameOrigin = loc.protocol.startsWith('http') && loc.pathname.startsWith('/dashboard');
    return {
      ws: q.get('ws') || `ws://${host}:9001`,
      api: (q.get('api') || (sameOrigin ? loc.origin : `http://${host}:8080`)).replace(/\/$/, ''),
      ward: q.get('ward') || 'melati',
      prefix: q.get('prefix') || 'siagabed'
    };
  }

  /* Satu bed: meniru field BedMonitor yang dibaca tampilan. */
  class LiveBed {
    constructor() {
      this.N = FS * 30; this.head = 0;
      this.bufX = new Float32Array(this.N).fill(NaN);
      this.bufB = new Float32Array(this.N).fill(NaN);
      this.bufH = new Uint8Array(this.N);
      this.lastT = 0; this.breaths = []; this.trend = []; this.queue = [];
      this.online = false; this.lastStWall = 0; this.lastWaveWall = 0; this.trendAcc = 0;
      this.stage = null; this.rrStage = 'stabil'; this.alarm = 'none';
      this.rr = null; this.apneaSec = 0; this.sqi = 0; this.h = 6; this.demo = false;
      this.present = true; this.fault = false; this.held = false; this.heldLong = false;
      this.praT = 0; this.praSince = 0; this.cbT = 0; this.cbSource = 'otomatis';
      this.dc = 0; this.delta = 1; this.lastF = 0; this.lastX = NaN; this.lowsqiSince = null;
      this.sensor = null; this.hubFw = null;   /* dari topik status: "FAKE" = hub palsu (simulasi) */
      this.faultCause = null;                  /* hub USB: "usb" (ESP32 diam) | "osc" (osilator) */
      this.fwSt = null; this.sps = null;       /* hub USB: status firmware ESP32 dan laju sampel */
    }
    isOffline() { return !this.online || Date.now() - this.lastStWall > STALE_MS; }
    status() {
      if (this.alarm === 'cb') return 'codeblue';   /* hub terputus saat alarm: tampilkan keadaan terakhir */
      if (this.alarm === 'pra') return 'pra';
      if (this.isOffline() || this.fault || this.heldLong) return 'teknis';
      if (!this.present) return 'kosong';
      if (this.held) return 'ditahan';
      return this.rrStage;
    }
    setStage(stage) {
      this.stage = stage;
      if (stage === 'normal') this.rrStage = 'stabil';
      if (stage === 'waspada' || stage === 'kritis') this.rrStage = stage;
      this.present = stage !== 'absent';
      this.fault = stage === 'fault';
      this.held = stage === 'lowsqi';
      if (!this.held) this.heldLong = false;
      if (stage !== 'pra' && stage !== 'codeblue') this.alarm = 'none';
    }
    applySt(m, t, cal) {
      this.lastStWall = Date.now(); this.online = true;
      const wasCb = this.alarm === 'cb';
      this.setStage(m.stage);
      if (m.stage === 'pra') {
        this.alarm = 'pra';
        if (m.pra != null) this.praT = t - (CFG.verify - m.pra);
        this.praSince = t - (m.ap || 0);
      } else if (m.stage === 'codeblue') {
        this.alarm = 'cb';
        if (!wasCb) this.cbT = t;
      }
      this.rr = m.rr != null ? m.rr : null;
      this.apneaSec = m.ap || 0; this.sqi = m.sqi || 0; this.h = m.h || 6; this.demo = !!m.demo;
      this.lastF = m.dc || 0;
      if (m.stage === 'fault') { if (m.fault_cause) this.faultCause = m.fault_cause; } else this.faultCause = null;
      this.fwSt = m.fw_st || null; this.sps = m.sps != null ? m.sps : null;
      if (cal && cal.empty != null && cal.occ != null && cal.empty !== cal.occ) {
        this.lastX = Math.abs(this.lastF - cal.empty);
        this.dc = this.lastX; this.delta = Math.abs(cal.occ - cal.empty);
      } else {
        this.lastX = NaN; this.dc = this.present ? 1 : 0; this.delta = 1;
      }
      if (++this.trendAcc >= 2) {
        this.trendAcc = 0;
        const mon = ['normal', 'waspada', 'kritis'].includes(m.stage) && this.rr !== null;
        this.trend.push({ t, rr: mon ? Math.round(this.rr) : null });
        if (this.trend.length > 300) this.trend.shift();
      }
    }
    onWave(m) {
      this.lastWaveWall = Date.now();
      const y = m.y || [], n = y.length, step = 1000 / (m.fs || FS);
      const marks = new Map();
      for (const [tb, eff] of (m.b || [])) marks.set(Math.max(0, Math.min(n - 1, Math.round((tb - m.t0) / step))), eff);
      const base = isFinite(this.lastX) ? this.lastX : 0, held = this.held ? 1 : 0;
      for (let k = 0; k < n; k++) {
        const v = y[k];
        this.queue.push({ b: v == null ? NaN : v, x: v == null ? NaN : base + v, h: held, br: marks.has(k) ? marks.get(k) : null });
      }
    }
    /* dipanggil 25x per detik: gelombang diputar mulus dengan tunda ~1 dtk */
    step() {
      if (this.queue.length > 2 * FS) this.queue.splice(0, this.queue.length - FS);
      let s = this.queue.shift();
      if (!s) {
        if (Date.now() - this.lastWaveWall < 3000) return;   /* tunggu kiriman berikutnya */
        s = { b: NaN, x: NaN, h: 0, br: null };              /* tidak ada data: garis putus */
      }
      this.bufX[this.head] = s.x; this.bufB[this.head] = s.b; this.bufH[this.head] = s.h;
      this.head = (this.head + 1) % this.N; this.lastT += DT;
      if (s.br !== null && s.b === s.b) {
        this.breaths.push({ t: this.lastT, v: s.b, eff: !!s.br });
        if (this.breaths.length > 60) this.breaths.shift();
      }
    }
  }

  class LiveWard {
    constructor(roster, opts) {
      this.live = true; this.opts = opts; this.PRE = opts.pre || 0;
      this.base = Date.now(); this.listeners = []; this.demo = false;
      this.seen = new Set(); this.ready = false; this.pending = [];
      this.conn = 'menyambung'; this.apiOk = null; this.client = null; this.waitAck = new Map();
      this.user = opts.user || null; this.notice = () => {};
      this.beds = roster.map(r => {
        const mon = new LiveBed();
        const b = Object.assign({}, r, { mon, cal: null, key: `${r.room}${r.bed}` });
        b.sim = { get present() { return mon.present; }, get connected() { return !mon.fault; }, leaveAt: 0, mode: 'normal' };
        return b;
      });
      this.byKey = new Map(this.beds.map(b => [b.key, b]));
    }
    get t() { return this.PRE + (Date.now() - this.base) / 1000; }
    tOf(ms) { return this.PRE + ((ms || Date.now()) - this.base) / 1000; }
    byId(id) { return this.beds.find(b => b.id === id); }
    on(fn) { this.listeners.push(fn); }
    emit(bed, ev) { for (const fn of this.listeners) fn(Object.assign({}, ev, { bed })); }
    step() { for (const b of this.beds) b.mon.step(); }

    /* ---------- aksi dari dasbor -> hub ---------- */
    setDemo(v) { this.demo = v; for (const b of this.beds) if (!b.mon.isOffline()) this.command(b, `DEMO ${v ? 1 : 0}`, true); }
    scenario(b, name) { if (name === 'manual') this.command(b, 'MANUAL'); }
    cancel(b) { this.command(b, 'CANCEL'); }
    confirm(b) { this.command(b, 'CONFIRM'); }
    close(b) { this.command(b, 'RESET'); }
    async command(b, cmd, quiet) {
      const where = `Kamar ${b.room} · Bed ${b.bed}`;
      const report = r => {
        if (!r.ok || !quiet) this.notice(r.ok, r.ok ? `${cmd} diterima hub` : `${cmd} ${r.ack === false ? 'tidak dibalas hub' : 'ditolak hub'}`, where, r.pesan || '');
      };
      if (this.apiOk !== false) {
        try {
          const res = await fetch(`${this.opts.api}/api/beds/${encodeURIComponent(this.opts.ward)}/${b.key}/cmd`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cmd, by: this.user })
          });
          const r = await res.json();
          if (res.ok) { report(r); return r; }
          if (res.status !== 503) { report({ ok: false, pesan: r.detail || res.statusText }); return r; }
        } catch (e) { this.apiOk = false; }
      }
      /* tanpa backend: kirim langsung lewat MQTT (tidak tercatat di database) */
      if (!this.client || this.conn !== 'tersambung') { report({ ok: false, ack: false, pesan: 'tidak tersambung ke broker' }); return null; }
      const req = Math.random().toString(16).slice(2, 14);
      const r = await new Promise(resolve => {
        const timer = setTimeout(() => { this.waitAck.delete(req); resolve({ ok: false, ack: false, pesan: 'hub tidak membalas dalam 3 dtk' }); }, 3000);
        this.waitAck.set(req, m => { clearTimeout(timer); resolve({ ok: !!m.ok, ack: true }); });
        this.client.publish(`${this.opts.prefix}/${this.opts.ward}/${b.key}/cmd`, JSON.stringify({ cmd, req, by: this.user }), { qos: 1 });
      });
      report(r);
      return r;
    }

    /* ---------- koneksi ---------- */
    start() {
      const load = src => new Promise((ok, fail) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
      const go = () => { this.connect(); this.loadHistory(); };
      if (root.mqtt) go();
      else load(MQTT_LOCAL).catch(() => load(MQTT_CDN)).then(go, () => { this.conn = 'pustaka MQTT gagal dimuat'; this.loadHistory(); });
    }
    connect() {
      const o = this.opts, c = root.mqtt.connect(o.ws, { clientId: 'siagabed-dash-' + Math.random().toString(16).slice(2, 8), reconnectPeriod: 2000, connectTimeout: 5000 });
      this.client = c;
      c.on('connect', () => {
        this.conn = 'tersambung';
        for (const k of ['status', 'st', 'ev', 'wave']) c.subscribe(`${o.prefix}/${o.ward}/+/${k}`, { qos: k === 'ev' || k === 'status' ? 1 : 0 });
      });
      c.on('close', () => { if (this.conn === 'tersambung') this.conn = 'terputus'; });
      c.on('offline', () => { this.conn = 'terputus'; });
      c.on('error', () => { this.conn = 'terputus'; });
      const dec = new TextDecoder();
      c.on('message', (topic, payload) => {
        const p = topic.split('/');
        if (p.length !== 4 || !payload || !payload.length) return;
        const b = this.byKey.get(p[2]);
        if (!b) return;   /* bed tidak ada di daftar pasien dasbor */
        let m;
        try { m = JSON.parse(dec.decode(payload)); } catch (e) { return; }
        if (!m || typeof m !== 'object') return;
        if (!this.ready && (p[3] === 'ev' || p[3] === 'status')) { this.pending.push([b, p[3], m]); return; }
        this.handle(b, p[3], m, false);
      });
    }
    async loadHistory() {
      const api = this.opts.api, ward = encodeURIComponent(this.opts.ward);
      try {
        const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
        const [beds, events] = await Promise.all([
          fetch(`${api}/api/beds?ward=${ward}`).then(r => r.json()),
          fetch(`${api}/api/events?ward=${ward}&since=${midnight.getTime()}&limit=1000`).then(r => r.json())
        ]);
        this.apiOk = true;
        for (const row of beds) {
          const b = this.byKey.get(row.bed);
          if (b) { b.mon.online = !!row.online; b.mon.known = true; if (row.sensor) b.mon.sensor = row.sensor; if (row.fw) b.mon.hubFw = row.fw; }
        }
        for (const row of events.slice().reverse()) {
          const b = this.byKey.get(row.bed);
          if (!b) continue;
          if (row.kind === 'ev') this.handle(b, 'ev', row.payload, true);
          else if (row.kind === 'status') this.emitHub(b, row.ev === 'HUB_ONLINE', row.ts, true);
        }
        const since = Date.now() - 11 * 60 * 1000;
        await Promise.all(this.beds.map(b => fetch(`${api}/api/trend/${ward}/${b.key}?since=${since}`).then(r => r.json()).then(pts => {
          const old = pts.map(p => ({ t: this.tOf(p.ts), rr: p.rr != null && ['normal', 'waspada', 'kritis'].includes(p.stage) ? Math.round(p.rr) : null }));
          b.mon.trend = old.concat(b.mon.trend).slice(-300);
        }).catch(() => {})));
      } catch (e) {
        this.apiOk = false;
      }
      this.ready = true;
      this.emit(null, { t: this.t, type: 'mulai', hist: true, data: { text: this.apiOk
        ? `Mode live · log hari ini dimuat dari server ${this.opts.api}`
        : `Mode live · server ${this.opts.api} tidak terjangkau: log hanya sejak dasbor dibuka, perintah dikirim langsung ke hub` } });
      for (const [b, kind, m] of this.pending) this.handle(b, kind, m, false);
      this.pending = [];
    }

    /* ---------- pesan dari hub ---------- */
    handle(b, kind, m, hist) {
      const mon = b.mon;
      if (kind === 'st') { mon.applySt(m, this.tOf(m.ts), b.cal); this.demo = this.beds.some(x => !x.mon.isOffline() && x.mon.demo); return; }
      if (kind === 'wave') { mon.onWave(m); return; }
      if (kind === 'status') {
        if (m.cal_empty != null && m.cal_occ != null) b.cal = { empty: m.cal_empty, occ: m.cal_occ };
        else if (m.online && 'cal_empty' in m) b.cal = null;   /* kalibrasi dihapus di hub */
        if (m.sensor) mon.sensor = m.sensor;
        if (m.fw) mon.hubFw = m.fw;
        const online = !!m.online;
        if (mon.known && online !== mon.online) this.emitHub(b, online, m.ts || Date.now(), false);
        mon.online = online; mon.known = true;
        if (online) mon.lastStWall = Math.max(mon.lastStWall, Date.now() - STALE_MS + 2000);  /* beri waktu st pertama */
        return;
      }
      if (kind !== 'ev') return;
      if (m.k === 'ack') { const w = this.waitAck.get(m.req); if (w) { this.waitAck.delete(m.req); w(m); } return; }
      if (m.k !== 'ev') return;
      if (m.seq != null) {
        const key = `${b.key}|${m.boot || ''}|${m.seq}`;
        if (this.seen.has(key)) return;
        this.seen.add(key);
      }
      const t = this.tOf(m.ts), x = e => this.emit(b, Object.assign({ t, hist }, e));
      const rr = Math.round(m.rr || mon.rr || 0);
      switch (m.ev) {
        case 'STAGE': {
          const from = m.from, to = m.to;
          if (to === 'waspada') x({ type: 'waspada', data: { rr, prev: from } });
          else if (to === 'kritis') x({ type: 'kritis', data: { rr } });
          else if (to === 'normal' && (from === 'waspada' || from === 'kritis')) x({ type: 'stabil', data: { rr } });
          if (to === 'absent') x({ type: 'kosong' });
          else if (from === 'absent' && to !== 'absent') x({ type: 'kembali' });
          if (to === 'lowsqi') mon.lowsqiSince = t;
          else if (from === 'lowsqi' && mon.lowsqiSince !== null) {
            const dur = t - mon.lowsqiSince; mon.lowsqiSince = null;
            if (dur >= 10) x({ type: 'tahan_selesai', data: { dur } });
          }
          if (!hist && to !== 'pra' && to !== 'codeblue') mon.setStage(to);
          break;
        }
        case 'PRA':
          mon.alarm = 'pra'; mon.praT = t; mon.praSince = t - (m.apnea || CFG.apnea);
          x({ type: 'pra', data: { since: mon.praSince } }); break;
        case 'CODEBLUE': {
          const src = /manual/.test(m.src || '') ? 'manual' : /perawat/.test(m.src || '') ? 'perawat' : 'otomatis';
          mon.alarm = 'cb'; mon.cbT = t; mon.cbSource = src;
          x({ type: 'codeblue', data: { source: src, since: t - (m.apnea || 0) } }); break;
        }
        case 'CANCEL': mon.alarm = 'none'; x({ type: 'pra_batal' }); break;
        case 'RESUME': mon.alarm = 'none'; x({ type: 'pra_selesai' }); break;
        case 'RESET': mon.alarm = 'none'; x({ type: 'cb_selesai' }); break;
        case 'FAULT': mon.fault = true; mon.faultCause = m.cause || null; x({ type: 'teknis' }); break;
        case 'FAULT_CLEAR': mon.fault = false; mon.faultCause = null; x({ type: 'teknis_pulih' }); break;
        case 'TECH': mon.heldLong = true; x({ type: 'tahan_lama' }); break;
        case 'CAL_OK':
          b.cal = { empty: m.empty, occ: m.occ };
          x({ type: 'kalibrasi', data: { delta: m.delta } }); break;
      }
    }
    emitHub(b, online, ts, hist) {
      this.emit(b, { t: this.tOf(ts), hist, type: online ? 'hub_on' : 'hub_off' });
    }
  }

  root.SiagaLive = { liveOptions, LiveWard };
})(typeof window !== 'undefined' ? window : globalThis);
