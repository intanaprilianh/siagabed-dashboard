/* SiagaBed dasbor v2: layar Bangsal (S2), item antrean (S3), lembar tindak lanjut (S5), menu Tim sementara.
 *
 * Data datang dari SiagaEngine.Ward (simulasi) atau SiagaLive.LiveWard (?live). Keduanya punya antarmuka
 * yang sama (beds, byId, on, step, t, cancel, confirm, close, scenario), jadi tampilan tidak peduli sumbernya.
 * Prinsip dari design brief: hub memutuskan, dasbor menjelaskan. Item yang sedang disentuh tidak bergeser.
 */
(function () {
  'use strict';
  const E = window.SiagaEngine, CFG = E.CFG, FS = E.FS;
  const doc = document;
  const $ = (s, el) => (el || doc).querySelector(s);
  const $$ = (s, el) => Array.from((el || doc).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad2 = n => String(n).padStart(2, '0');
  const hm = d => `${pad2(d.getHours())}.${pad2(d.getMinutes())}`;
  const hms = d => `${hm(d)}.${pad2(d.getSeconds())}`;
  const durS = s => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60), r = s % 60; return m ? `${m} mnt${r ? ` ${r} dtk` : ''}` : `${r} dtk`; };
  const durM = s => { const m = Math.floor(Math.max(0, s) / 60); return m < 1 ? '< 1 mnt' : m < 60 ? `${m} mnt` : `${Math.floor(m / 60)} j ${m % 60} mnt`; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* mode privat: abaikan */ } }
  };

  /* ------------------------------------------------------------------ ikon (dari design system) */
  const ICON = {
    oct: (s = 22, c = 'var(--hi)', m = '#fff') => `<svg width="${s}" height="${s}" viewBox="0 0 22 22" aria-hidden="true"><path d="M7 1h8l6 6v8l-6 6H7l-6-6V7z" style="fill:${c}"/><rect x="9.7" y="5" width="2.6" height="7.5" style="fill:${m}"/><rect x="9.7" y="14.5" width="2.6" height="2.6" style="fill:${m}"/></svg>`,
    tri: (c = '#fff', s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 22 20" aria-hidden="true"><path d="M11 1.5l10 17H1z" style="fill:none;stroke:${c}" stroke-width="2.4" stroke-linejoin="round"/><rect x="9.8" y="7" width="2.4" height="6" style="fill:${c}"/><rect x="9.8" y="14.6" width="2.4" height="2.4" style="fill:${c}"/></svg>`,
    circ: (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7.5" style="fill:none;stroke:var(--md)" stroke-width="2.2"/><rect x="7.9" y="4.5" width="2.2" height="5.5" style="fill:var(--md)"/><rect x="7.9" y="11.3" width="2.2" height="2.2" style="fill:var(--md)"/></svg>`,
    tk: (s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 18 18" aria-hidden="true"><rect x="1.5" y="1.5" width="15" height="15" rx="3" style="fill:none;stroke:var(--lo)" stroke-width="2" stroke-dasharray="4 3"/><path d="M4.5 13.5l9-9" style="stroke:var(--lo)" stroke-width="2"/></svg>`,
    ok: (s = 10) => `<svg width="${s}" height="${s}" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4" style="fill:var(--ok)"/></svg>`,
    pause: (s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2.5" width="3.4" height="11" rx="1.2" style="fill:var(--tx2)"/><rect x="9.6" y="2.5" width="3.4" height="11" rx="1.2" style="fill:var(--tx2)"/></svg>`,
    dash: (s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="3" style="fill:none;stroke:var(--tx3)" stroke-width="1.6" stroke-dasharray="3 2.4"/></svg>`,
    siren: (c = '#fff', s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15V10a5 5 0 0 1 10 0v5z" style="fill:${c}"/><rect x="3" y="15.5" width="14" height="2.6" rx="1" style="fill:${c}"/><path d="M10 1v2.6M2.6 4.2l1.8 1.8M17.4 4.2l-1.8 1.8" style="stroke:${c}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    phone: (s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 22 22" aria-hidden="true"><path d="M4 2h4l2 5-2.5 1.5a11 11 0 0 0 6 6L15 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 4a2 2 0 0 1 2-2z" style="fill:#fff"/></svg>`,
    sound: on => `<svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z" style="fill:currentColor"/>${on
      ? '<path d="M11 5.5c1 .8 1 4.2 0 5M13 3.5c2 1.8 2 7.2 0 9" style="fill:none;stroke:currentColor" stroke-width="1.4" stroke-linecap="round"/>'
      : '<path d="M11 6l4 4M15 6l-4 4" style="stroke:currentColor" stroke-width="1.5" stroke-linecap="round"/>'}</svg>`,
    spin: (c = 'currentColor', s = 16) => `<svg class="spin" width="${s}" height="${s}" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" style="stroke:${c}" stroke-opacity=".25" stroke-width="2"/><path d="M8 2a6 6 0 0 1 6 6" fill="none" style="stroke:${c}" stroke-width="2" stroke-linecap="round"/></svg>`,
    check: (s = 26) => `<svg width="${s}" height="${s}" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="13" style="fill:var(--okSoft)"/><path d="M7.5 13.5l3.6 3.6 7.4-7.6" style="fill:none;stroke:var(--ok)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    lock: () => `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="6" width="10" height="7" rx="2" style="fill:none;stroke:currentColor" stroke-width="1.4"/><path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" style="fill:none;stroke:currentColor" stroke-width="1.4"/></svg>`
  };

  /* Status tampilan. Kunci pendek mengikuti kelas CSS: s-cb, s-pra, s-kr, ... */
  const ST = {
    cb: { word: 'Code Blue', icon: () => ICON.siren('#fff', 22) },
    pra: { word: 'Pra-alarm', icon: () => ICON.oct(22) },
    kr: { word: 'Kritis', icon: () => ICON.tri('#fff', 21) },
    ws: { word: 'Waspada', icon: () => ICON.circ(20) },
    tk: { word: 'Tidak terpantau', icon: () => ICON.tk(20) },
    ok: { word: 'Normal', icon: () => ICON.ok(10) },
    away: { word: 'Turun dari bed', icon: () => ICON.pause(18) },
    held: { word: 'Ditahan', icon: () => ICON.pause(18) },
    empty: { word: 'Bed kosong', icon: () => ICON.dash(18) },
    load: { word: 'Menunggu data', icon: () => ICON.spin('var(--tx3)', 18) }
  };
  const TALLY = [
    ['cb', 'Code Blue', z => ICON.siren(z ? 'var(--tx3)' : '#fff', 16)],
    ['pra', 'Pra-alarm', z => ICON.oct(16, z ? 'var(--tx3)' : 'var(--hi)', z ? 'var(--bg)' : '#fff')],
    ['kr', 'Kritis', z => ICON.tri(z ? 'var(--tx3)' : '#fff', 15)],
    ['ws', 'Waspada', () => ICON.circ(14)],
    ['tk', 'Tidak terpantau', () => ICON.tk(14)],
    ['ok', 'Normal', () => ICON.ok(10)],
    ['away', 'Turun dari bed', () => ICON.pause(12)],
    ['held', 'Ditahan', () => ICON.pause(12)],
    ['empty', 'Bed kosong', () => ICON.dash(12)]
  ];

  /* ------------------------------------------------------------------ data bangsal (fiktif) */
  const ROSTER = [
    { id: '301-A', room: '301', bed: 'A', name: 'Tn. S.H.', age: 67, dxs: 'Pneumonia', dx: 'Pneumonia komunitas', no_rm: '00-21-47-13', icd10_code: 'J18.9', sep_number: '1305R0011026V004213', visit_status: 'Rawat inap, hari ke-3', rr: 16, amp: 54, noise: 5 },
    { id: '301-B', room: '301', bed: 'B', name: 'Ny. R.W.', age: 54, dxs: 'Pascalaparotomi H+1', dx: 'Pascalaparotomi, hari ke-1', no_rm: '00-31-08-52', icd10_code: 'Z48.8', sep_number: '1305R0011026V004218', visit_status: 'Rawat inap, hari ke-2', rr: 14, amp: 50, noise: 4.5 },
    { id: '301-C', room: '301', bed: 'C', name: 'Tn. A.M.', age: 72, dxs: 'Gagal jantung', dx: 'Gagal jantung kongestif', no_rm: '00-18-66-04', icd10_code: 'I50.0', sep_number: '1305R0011026V004197', visit_status: 'Rawat inap, hari ke-5', rr: 19, amp: 40, noise: 5 },
    { id: '301-D', room: '301', bed: 'D', name: null, age: null, dxs: null, dx: null, no_rm: null, icd10_code: null, sep_number: null, visit_status: 'Bed siap pakai', rr: 15, amp: 50, noise: 5, present: false },
    { id: '302-A', room: '302', bed: 'A', name: 'Ny. L.K.', age: 45, dxs: 'DM tipe 2, selulitis', dx: 'Diabetes tipe 2, selulitis', no_rm: '00-27-91-35', icd10_code: 'L03.1', sep_number: '1305R0011026V004225', visit_status: 'Rawat inap, hari ke-2', rr: 13, amp: 58, noise: 5 },
    { id: '302-B', room: '302', bed: 'B', name: 'Tn. B.P.', age: 81, dxs: 'Stroke iskemik', dx: 'Stroke iskemik', no_rm: '00-09-54-70', icd10_code: 'I63.9', sep_number: '1305R0011026V004189', visit_status: 'Rawat inap, hari ke-4', rr: 12, amp: 46, noise: 5.5 },
    { id: '302-C', room: '302', bed: 'C', name: 'Ny. D.A.', age: 60, dxs: 'PPOK eksaserbasi', dx: 'PPOK eksaserbasi akut', no_rm: '00-14-33-28', icd10_code: 'J44.1', sep_number: '1305R0011026V004230', visit_status: 'Rawat inap, hari ke-1', rr: 23, amp: 38, noise: 5 },
    { id: '302-D', room: '302', bed: 'D', name: 'Tn. Y.T.', age: 38, dxs: 'DBD', dx: 'Demam berdarah dengue', no_rm: '00-35-12-89', icd10_code: 'A91', sep_number: '1305R0011026V004236', visit_status: 'Rawat inap, hari ke-2', rr: 18, amp: 52, noise: 4.5 }
  ];
  const ROOMS = [...new Set(ROSTER.map(r => r.room))];
  const CHIPS = ['Pasien sadar, napas spontan', 'Ventilasi bag-mask', 'Diberi oksigen', 'RJP dilakukan', 'DPJP dihubungi',
    'Dipindah ke ICU', 'Keluarga diberi tahu', 'Reposisi pasien', 'Artefak gerak', 'Alarm tanpa kejadian klinis'];
  const SCEN = [['normal', 'Napas normal'], ['apnea', 'Henti napas'], ['gasp', 'Henti napas + gasping'], ['perburukan', 'Perburukan (RR → 32)'],
    ['lambat', 'Napas melambat (RR → 7)'], ['gerak', 'Pasien bergerak 20 dtk'], ['turun', 'Turun dari bed'], ['naik', 'Berbaring kembali'],
    ['cabut', 'Cabut konektor pad'], ['pasang', 'Pasang konektor pad'], ['manual', 'Tombol Code Blue manual']];

  /* ------------------------------------------------------------------ sumber data */
  const PRE = 600;                                   /* detik riwayat sebelum dasbor dibuka */
  const LIVE = window.SiagaLive ? window.SiagaLive.liveOptions() : null;
  const WARD_KEY = LIVE ? LIVE.ward : 'simulasi';
  const S = {
    nurse: store.get('siagabed.perawat', 'Ns. Rina'),
    sound: false, view: 'bangsal', selected: null,
    checked: new Map(),       /* bed -> { t, by, stage } : "Sudah dicek" untuk Kritis/Waspada */
    since: new Map(),         /* 'stage:bed' | 'tk:bed' | 'away:bed' -> t */
    fu: [],                   /* item "perlu tindak lanjut" */
    sending: new Map(),       /* bed -> { kind } : perintah sedang dikirim ke hub */
    failed: new Map(),        /* bed -> { kind, pesan } */
    actor: new Map(),         /* bed -> nama perawat yang terakhir mengirim aksi dari dasbor */
    log: [], sheet: null, hold: null, order: [], frozen: false, seq: 0, alarmsSeen: new Set()
  };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
  const NOTES_KEY = `siagabed.tindaklanjut.${WARD_KEY}.${today()}`;
  S.notes = store.get(NOTES_KEY, []);

  const ward = LIVE ? new window.SiagaLive.LiveWard(ROSTER, Object.assign({ pre: PRE, user: S.nurse }, LIVE))
                    : new E.Ward(ROSTER, 20261018);
  if (LIVE) ward.notice = () => {};                  /* hasil perintah ditangani per item di send() */
  let bootWall = LIVE ? ward.base : Date.now();
  let booting = true;
  const wallAt = t => new Date(bootWall + (t - PRE) * 1000);

  /* ------------------------------------------------------------------ status satu bed */
  function stat(b) {
    const m = b.mon;
    if (LIVE && m.stage == null && !m.online) return 'load';
    switch (m.status()) {
      case 'codeblue': return 'cb';
      case 'pra': return 'pra';
      case 'teknis': return 'tk';
      case 'kosong': return b.name ? 'away' : 'empty';
      case 'ditahan': return 'held';
      case 'kritis': return 'kr';
      case 'waspada': return 'ws';
      default: return b.name || b.sim.present ? 'ok' : 'empty';
    }
  }
  const patient = b => b.name || (b.sim.present ? 'Pasien baru' : 'Bed kosong');
  const rrNow = b => (b.mon.rr == null ? null : Math.round(b.mon.rr));
  function rrArrow(b, t) {
    const now = rrNow(b), tr = b.mon.trend;
    if (now == null || !tr.length) return '';
    let old = null;
    for (let i = tr.length - 1; i >= 0; i--) { if (tr[i].t <= t - 60) { old = tr[i].rr; break; } }
    if (old == null) return '';
    return now - old >= 2 ? ' ↑' : old - now >= 2 ? ' ↓' : '';
  }
  function tkCause(b) {
    const m = b.mon;
    if (LIVE && m.isOffline()) return { short: 'hub offline', long: 'Hub tidak mengirim data', step: 'Periksa daya dan Wi-Fi hub di bedhead, lalu hubungi teknisi' };
    if (m.fault) return { short: 'pad terlepas', long: 'Pad terlepas', step: 'Periksa konektor di bedhead' };
    if (m.heldLong) return { short: 'sinyal tidak andal', long: 'Sinyal tidak andal terlalu lama', step: 'Periksa posisi pad di bawah sprei' };
    return { short: 'sinyal hilang', long: 'Sinyal hilang', step: 'Periksa pad dan hub di bedhead' };
  }
  const praLeft = (b, t) => Math.max(0, Math.ceil(CFG.verify - (t - b.mon.praT)));
  function cbSource(src) {
    const s = String(src || '');
    if (s.includes('manual') || s.includes('tombol')) return 'tombol manual di kamar';
    if (s.includes('perawat')) return 'dipanggil perawat';
    return 'otomatis, Pra-alarm tidak diverifikasi';
  }
  function stageWhy(b, t, s) {
    const rr = rrNow(b), since = S.since.get('stage:' + b.id);
    const hold = ward.demo ? CFG.holdDemo : (s === 'kr' ? CFG.holdCrit : CFG.holdWarn);
    const cond = s === 'kr' ? (rr != null && rr <= CFG.rrCritLow ? `≤ ${CFG.rrCritLow}` : `≥ ${CFG.rrCritHigh}`)
                            : (rr != null && rr <= CFG.rrWarnLow ? `≤ ${CFG.rrWarnLow}` : `> ${CFG.rrWarnHigh}`);
    return since != null ? `${cond} selama ${durS(t - since + hold)}` : `${cond} /mnt`;
  }

  /* ------------------------------------------------------------------ kejadian dari hub/engine */
  function addLog(ev) {
    S.log.push({ t: ev.t, type: ev.type, bedId: ev.bed ? ev.bed.id : null, data: ev.data || {}, hist: !!ev.hist });
    if (S.log.length > 600) S.log.shift();
  }
  function addFollowUp(b, kind, t, ev) {
    const m = b.mon, by = (ev.data && ev.data.by) || S.actor.get(b.id) || (kind === 'pra' ? 'bedhead' : null);
    S.fu.push({ id: 'fu' + (++S.seq), bedId: b.id, kind, t, start: kind === 'cb' ? m.cbT : m.praT,
      resp: kind === 'cb' ? t - m.cbT : null, source: kind === 'cb' ? m.cbSource : null, by });
    S.actor.delete(b.id);
  }
  ward.on(ev => {
    const b = ev.bed, t = ev.t;
    addLog(ev);
    if (!b) return;
    switch (ev.type) {
      case 'waspada': case 'kritis': case 'stabil':
        S.since.set('stage:' + b.id, t);
        if ((S.checked.get(b.id) || {}).stage !== (ev.type === 'kritis' ? 'kr' : 'ws')) S.checked.delete(b.id);
        if (!booting && !ev.hist) play(ev.type === 'kritis' ? 'kr' : ev.type === 'waspada' ? 'ws' : null);
        break;
      case 'teknis': case 'tahan_lama': S.since.set('tk:' + b.id, t); break;
      case 'teknis_pulih': case 'tahan_selesai': S.since.delete('tk:' + b.id); break;
      case 'kosong': S.since.set('away:' + b.id, t); break;
      case 'kembali': S.since.delete('away:' + b.id); break;
      case 'pra_batal': if (!booting && !ev.hist) addFollowUp(b, 'pra', t, ev); break;
      case 'cb_selesai': if (!booting && !ev.hist) addFollowUp(b, 'cb', t, ev); break;
    }
  });

  /* ------------------------------------------------------------------ bunyi per tingkat */
  let actx = null, lastRepeat = 0;
  const SOUND = {
    ws: [[523, 0, 0.35, 0.05]],
    kr: [[784, 0, 0.16, 0.12], [784, 0.24, 0.16, 0.12]],
    pra: [[880, 0, 0.13, 0.16], [880, 0.2, 0.13, 0.16], [880, 0.4, 0.13, 0.16]],
    cb: [[988, 0, 0.24, 0.2], [659, 0.3, 0.24, 0.2], [988, 0.6, 0.24, 0.2], [659, 0.9, 0.24, 0.2]]
  };
  function soundOn() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      S.sound = true;
    } catch (e) { S.sound = false; toast('bad', 'Suara tidak bisa dinyalakan', 'Peramban menolak memutar bunyi.'); }
  }
  function tone(f, at, d, v) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + d);
    o.connect(g); g.connect(actx.destination); o.start(at); o.stop(at + d + 0.05);
  }
  function play(kind) {
    if (!kind || !S.sound || !actx || !SOUND[kind]) return;
    const t0 = actx.currentTime + 0.03;
    for (const [f, o, d, v] of SOUND[kind]) tone(f, t0 + o, d, v);
  }
  function soundTick() {
    const st = ward.beds.map(stat), cb = st.includes('cb'), pra = st.includes('pra');
    for (const b of ward.beds) {                       /* umumkan alarm baru untuk pembaca layar */
      const s = stat(b), key = s + ':' + b.id;
      if ((s === 'cb' || s === 'pra') && !S.alarmsSeen.has(key)) { S.alarmsSeen.add(key); announce(`${ST[s].word} di ${b.id}, ${patient(b)}`); }
      if (s !== 'cb') S.alarmsSeen.delete('cb:' + b.id);
      if (s !== 'pra') S.alarmsSeen.delete('pra:' + b.id);
    }
    if (!S.sound || (!cb && !pra)) return;
    const now = performance.now(), period = cb ? 1600 : 2200;
    if (now - lastRepeat >= period) { lastRepeat = now; play(cb ? 'cb' : 'pra'); }
  }

  /* ------------------------------------------------------------------ aksi ke hub */
  function send(b, kind) {
    S.actor.set(b.id, S.nurse);
    if (!LIVE) {
      if (kind === 'cancel') ward.cancel(b);
      else if (kind === 'confirm') ward.confirm(b);
      else if (kind === 'close') ward.close(b);
      else if (kind === 'manual') ward.scenario(b, 'manual');
      render();
      return;
    }
    ward.user = S.nurse;
    const cmd = { cancel: 'CANCEL', confirm: 'CONFIRM', close: 'RESET', manual: 'MANUAL' }[kind];
    S.sending.set(b.id, { kind }); S.failed.delete(b.id); render();
    Promise.resolve(ward.command(b, cmd, true)).then(r => {
      S.sending.delete(b.id);
      if (!r || !r.ok) {
        S.failed.set(b.id, { kind, pesan: (r && r.pesan) || 'tidak ada balasan dari hub' });
        if (kind !== 'cancel') toast('bad', `${b.id} · perintah belum sampai ke hub`, (r && r.pesan) || 'Coba lagi atau lakukan di bedhead.');
      }
      render();
    });
  }
  function check(b) {
    const s = stat(b);
    if (s !== 'kr' && s !== 'ws') return;
    const t = ward.t;
    S.checked.set(b.id, { t, by: S.nurse, stage: s });
    saveNote({ bedId: b.id, t, kind: 'cek', context: `${ST[s].word} · RR ${rrNow(b) ?? '—'} /mnt`, chips: [], text: 'Sudah dicek' });
    render();
  }
  function saveNote(n) {
    const note = Object.assign({ id: 'n' + Date.now() + Math.random().toString(16).slice(2, 6), wall: Date.now(), by: S.nurse }, n);
    S.notes.push(note);
    store.set(NOTES_KEY, S.notes);
    addLog({ t: n.t, type: 'tindak_lanjut', bed: ward.byId(n.bedId), data: { text: n.text, by: S.nurse } });
    return note;
  }

  /* ------------------------------------------------------------------ antrean */
  function queueItems(t) {
    const list = [];
    for (const b of ward.beds) {
      const s = stat(b), chk = S.checked.has(b.id) ? 1 : 0;
      if (s === 'cb') list.push({ id: 'cb:' + b.id, k: 'cb', b, r: 0, o: b.mon.cbT });
      else if (s === 'pra') list.push({ id: 'pra:' + b.id, k: 'pra', b, r: 1, o: praLeft(b, t) });
      else if (s === 'kr') list.push({ id: 'kr:' + b.id, k: 'kr', b, r: 2, o: chk });
      else if (s === 'ws') list.push({ id: 'ws:' + b.id, k: 'ws', b, r: 3, o: chk });
      else if (s === 'tk') list.push({ id: 'tk:' + b.id, k: 'tk', b, r: 4, o: S.since.get('tk:' + b.id) || 0 });
    }
    for (const f of S.fu) list.push({ id: f.id, k: 'fu', b: ward.byId(f.bedId), f, r: 5, o: f.t });
    list.sort((x, y) => x.r - y.r || x.o - y.o);
    if (!S.frozen || !S.order.length) return list;
    /* Item yang sedang disentuh tidak bergeser. Code Blue dan Pra-alarm baru tetap naik ke atas. */
    const byId = new Map(list.map(x => [x.id, x]));
    const kept = S.order.filter(id => byId.has(id));
    const urgent = list.filter(x => (x.k === 'cb' || x.k === 'pra') && !kept.includes(x.id));
    const rest = list.filter(x => !kept.includes(x.id) && !urgent.includes(x));
    return [...urgent, ...kept.map(id => byId.get(id)), ...rest];
  }
  const who = (b, br) => b.name ? `<b>${esc(b.name)}</b> · ${b.age}${br ? '<br>' : ' · '}${esc(b.dxs)}` : `<b>${esc(patient(b))}</b>`;
  const ticks = n => `<div class="ticks" data-ticks>${'<i></i>'.repeat(CFG.verify)}</div>`;
  function sendingBtn(cls, onRed) { return `<span class="btn sending ${cls || ''}" role="status">${ICON.spin(onRed ? '#fff' : 'currentColor')}Mengirim ke hub…</span>`; }

  /* Tiap item: key = struktur (dibangun ulang bila berubah), v = teks dinamis (ditambal di tempat). */
  function itemView(x, idx, t) {
    const b = x.b, m = b.mon, n = String(idx + 1), sending = S.sending.get(b.id), failed = S.failed.get(b.id);
    if (x.k === 'pra' && idx === 0) {
      const fail = failed && failed.kind === 'cancel';
      return {
        key: `pra-big:${b.id}:${sending ? sending.kind : ''}:${fail ? 1 : 0}`,
        html: `<div class="qi pra" data-bed="${b.id}">
          <div class="qh"><span class="ordb" data-v="n" style="background:var(--hi);color:#fff">${n}</span>${ICON.oct(22)}<span class="lv">Pra-alarm</span><span class="s" data-v="s"></span></div>
          <div class="id"><span class="bedbig">${b.id}</span><span class="pt">${who(b, true)}</span></div>
          <div class="why"><span class="r"><span data-v="ap"></span><small>tanpa napas efektif</small></span><span class="sp"></span>${ticks()}<span class="cdt">Code Blue otomatis<b data-v="cd"></b></span></div>
          <div class="acts">${sending ? sendingBtn() : `<button type="button" class="btn call" data-act="confirm">${ICON.phone()}Panggil Code Blue sekarang</button>
            <button type="button" class="btn hold" data-act="hold">Batalkan · pasien sudah dicek <small>tahan 2 dtk</small></button>`}</div>
          ${fail ? `<div class="fail" role="alert"><div class="t"><b>Pembatalan belum sampai ke hub</b>Batalkan langsung di bedhead ${b.id}. Hitung mundur tetap berjalan.</div><button type="button" class="btn ghost" data-act="retry">Coba lagi</button></div>` : ''}
        </div>`,
        v: { n, s: `mulai ${hms(wallAt(m.praT))} · bunyi berulang`, ap: `${Math.floor(m.apneaSec)} dtk`, cd: `${praLeft(b, t)} dtk` },
        ticks: praLeft(b, t)
      };
    }
    if (x.k === 'cb' && idx === 0) {
      return {
        key: `cb-big:${b.id}:${sending ? 1 : 0}`,
        html: `<div class="qi cbk" data-bed="${b.id}">
          <div class="qh"><span class="ordb" data-v="n" style="background:#fff;color:var(--cbBg)">${n}</span>${ICON.siren('#fff', 22)}<span class="lv">Code Blue</span><span class="s" data-v="s"></span></div>
          <div class="id"><span class="bedbig">${b.id}</span><span class="pt">${who(b, true)}</span></div>
          <div class="why"><span class="r"><span data-v="r"></span><small>berjalan</small></span><span class="sp"></span><span class="t">Waktu respons dicatat saat tim<br>menekan <b>Tim sudah tiba</b></span></div>
          <div class="acts">${sending ? sendingBtn('', true) : '<button type="button" class="btn onred" data-act="close">Tim sudah tiba</button>'}<button type="button" class="btn onred2" data-act="select">Lihat di denah</button></div>
        </div>`,
        v: { n, s: `mulai ${hms(wallAt(m.cbT))} · ${cbSource(m.cbSource)} · ponsel Tim Code Blue berbunyi`, r: durS(t - m.cbT) }
      };
    }
    const row = (cls, lv, bid, pt, why, acts) => `<div class="ri ${cls}" data-bed="${b.id}"><span class="lv"><span class="ordb" data-v="n">${n}</span>${lv}</span><span class="bid">${bid}</span><span class="pt">${pt}</span><span class="why">${why}</span><span class="acts">${acts}</span></div>`;
    if (x.k === 'cb') {
      return {
        key: `cb-row:${b.id}:${sending ? 1 : 0}`,
        html: row('cbr', `${ICON.siren('#fff', 18)}Code Blue`, b.id, who(b, true), '<b data-v="r"></b><small data-v="s"></small>',
          sending ? sendingBtn('', true) : '<button type="button" class="btn onred" data-act="close">Tim sudah tiba</button>'),
        v: { n, r: `${durS(t - m.cbT)} berjalan`, s: cbSource(m.cbSource) }
      };
    }
    if (x.k === 'pra') {
      return {
        key: `pra-row:${b.id}:${sending ? 1 : 0}`,
        html: row('prar glass2', `${ICON.oct(18)}Pra-alarm`, b.id, who(b, true), `${ticks()}<span><span data-v="ap"></span><small data-v="cd"></small></span>`,
          sending ? sendingBtn() : `<button type="button" class="btn call" data-act="confirm">${ICON.phone(16)}Panggil Code Blue</button><button type="button" class="btn hold" data-act="hold">Batalkan <small>tahan 2 dtk</small></button>`),
        v: { n, ap: `${Math.floor(m.apneaSec)} dtk tanpa napas`, cd: `CB ${praLeft(b, t)} dtk` },
        ticks: praLeft(b, t)
      };
    }
    if (x.k === 'kr' || x.k === 'ws') {
      const chk = S.checked.get(b.id), kr = x.k === 'kr';
      const acts = chk
        ? `${kr ? `<span class="sendnote" data-v="chk"></span>` : ''}<button type="button" class="btn ${kr ? 'onred2' : 'ghost'}" data-act="select">Lihat tren</button>`
        : `<button type="button" class="btn ${kr ? 'onred' : 'ink'}" data-act="check">Sudah dicek</button><button type="button" class="btn ${kr ? 'onred2' : 'ghost'}" data-act="select">Lihat tren</button>`;
      return {
        key: `${x.k}:${b.id}:${chk ? 1 : 0}`,
        html: row(kr ? 'kr' : 'ws glass2', `${kr ? ICON.tri('#fff', 20) : ICON.circ(18)}${ST[x.k].word}`, b.id, who(b, kr), '<b data-v="rr"></b><small data-v="why"></small>', acts),
        v: { n, rr: `RR ${rrNow(b) ?? '—'} /mnt${rrArrow(b, t)}`, why: chk && !kr ? `✓ Dicek ${chk.by} ${hm(wallAt(chk.t))}` : stageWhy(b, t, x.k), chk: chk ? `✓ Dicek ${hm(wallAt(chk.t))}` : '' }
      };
    }
    if (x.k === 'tk') {
      const c = tkCause(b), since = S.since.get('tk:' + b.id);
      return {
        key: `tk:${b.id}`,
        html: row('tk glass2', `${ICON.tk(18)}Tidak terpantau`, b.id, who(b, false), '<span data-v="w"></span><small data-v="st"></small>', '<button type="button" class="btn ghost" data-act="select">Buka detail</button>'),
        v: { n, w: since != null ? `${c.long} sejak ${hm(wallAt(since))}` : c.long, st: c.step }
      };
    }
    /* perlu tindak lanjut */
    const f = x.f, isCb = f.kind === 'cb';
    const head = isCb ? `Code Blue ditutup ${hm(wallAt(f.t))}` : `Pra-alarm dibatalkan${f.by === 'bedhead' ? ' di bedhead' : ''} ${hm(wallAt(f.t))}`;
    const sub = isCb ? `Tim tiba · respons ${durS(f.resp)}` : f.by && f.by !== 'bedhead' ? `${f.by} · pasien sudah dicek` : 'Pasien sudah dicek';
    return {
      key: `fu:${f.id}:${S.sheet && S.sheet.id === f.id ? 1 : 0}`,
      html: `<div class="ri fu glass2${S.sheet && S.sheet.id === f.id ? ' selr' : ''}" data-bed="${b.id}" data-fu="${f.id}"><span class="lv"><span class="ordb" data-v="n">${n}</span>Tindak lanjut</span><span class="bid">${b.id}</span><span class="pt">${who(b, false)}</span><span class="why">${esc(head)}<small>${esc(sub)}</small></span><span class="acts"><button type="button" class="btn ink" data-act="write">Tulis tindak lanjut</button></span></div>`,
      v: { n }
    };
  }

  const qEl = $('#queue');
  const qNodes = new Map();                         /* id item -> { el, key } */
  function renderQueue(t) {
    const items = queueItems(t);
    S.order = items.map(x => x.id);
    $('#q-sum').textContent = items.length ? `${items.length} item · urut paling genting` : '';
    const live = new Set(items.map(x => x.id));
    for (const [id, nd] of qNodes) if (!live.has(id)) { nd.el.remove(); qNodes.delete(id); }
    const calm = $('.calm', qEl);
    if (!items.length) {
      const html = calmHTML();
      if (!calm || calm.dataset.h !== html) { qEl.innerHTML = html; qEl.firstElementChild.dataset.h = html; }
      return;
    }
    if (calm) calm.remove();
    items.forEach((x, i) => {
      const view = itemView(x, i, t);
      let nd = qNodes.get(x.id);
      if (!nd || nd.key !== view.key) {
        const tmp = doc.createElement('div'); tmp.innerHTML = view.html.trim();
        const el = tmp.firstElementChild;
        if (nd) nd.el.replaceWith(el);
        nd = { el, key: view.key }; qNodes.set(x.id, nd);
      }
      for (const [k, v] of Object.entries(view.v)) { const e = $(`[data-v="${k}"]`, nd.el); if (e && e.textContent !== v) e.textContent = v; }
      if (view.ticks != null) $$('[data-ticks] i', nd.el).forEach((e, j) => e.classList.toggle('off', j >= view.ticks));
      if (qEl.children[i] !== nd.el) qEl.insertBefore(nd.el, qEl.children[i] || null);
    });
  }
  function calmHTML() {
    if (ward.beds.every(b => stat(b) === 'load')) {
      return `<div class="calm glass" style="gap:10px"><div class="h">${ICON.spin('var(--tx3)', 26)}<h2>Menunggu data pertama dari hub</h2></div><p>Bed belum tampil sampai hub mengirim data. Bila lebih dari 10 dtk, periksa sambungan ke server.</p><div class="skel"></div><div class="skel"></div></div>`;
    }
    const last = S.log.filter(e => e.bedId && ['pra', 'codeblue', 'cb_selesai', 'pra_batal', 'kritis', 'waspada', 'teknis', 'tindak_lanjut'].includes(e.type)).slice(-3).reverse();
    const lbl = { pra: 'Pra-alarm', codeblue: 'Code Blue', cb_selesai: 'Code Blue ditutup', pra_batal: 'Pra-alarm dibatalkan', kritis: 'Kritis', waspada: 'Waspada', teknis: 'Tidak terpantau', tindak_lanjut: 'Tindak lanjut ditulis' };
    return `<div class="calm glass"><div class="h">${ICON.check(30)}<h2>Tidak ada yang perlu tindakan</h2></div>
      <p>Semua bed terpantau atau tercatat di denah. Dasbor akan berbunyi bila ada yang berubah.</p>
      ${last.length ? `<div class="k">Kejadian terakhir shift ini</div><div class="last">${last.map(e => `<div><span>${hm(wallAt(e.t))}</span><span><b>${e.bedId}</b> · ${lbl[e.type]}</span></div>`).join('')}</div>` : ''}</div>`;
  }

  /* ------------------------------------------------------------------ denah */
  const roomsEl = $('#rooms');
  roomsEl.innerHTML = ROOMS.map(r => `<div class="room" data-room="${r}"><div class="rl"><b>Kamar ${r}</b><span data-v="np"></span></div><div class="strip">${
    ROSTER.filter(x => x.room === r).map(x => `<button type="button" class="cb glass2" data-bed="${x.id}" aria-pressed="false"><div class="h"><span class="id">${x.id}</span><span class="ob" hidden></span></div><div class="gl"></div><div class="st"></div><div class="sub"></div></button>`).join('')
  }</div><div class="band-slot"></div></div>`).join('');
  const tiles = new Map($$('.cb', roomsEl).map(el => [el.dataset.bed, el]));

  function tileSub(b, s, t) {
    const m = b.mon, rr = rrNow(b);
    switch (s) {
      case 'cb': return durS(t - m.cbT);
      case 'pra': return `CB ${praLeft(b, t)} dtk`;
      case 'kr': return `RR ${rr ?? '—'}${rrArrow(b, t)}`;
      case 'ws': return `RR ${rr ?? '—'}${S.checked.has(b.id) ? ' · dicek' : ''}`;
      case 'tk': return tkCause(b).short;
      case 'away': { const s0 = S.since.get('away:' + b.id); return s0 != null ? durM(t - s0) : 'baru saja'; }
      case 'held': return 'pasien bergerak';
      case 'empty': return 'siap pakai';
      case 'load': return 'menunggu data';
      default: return `RR ${rr ?? '—'}`;
    }
  }
  function renderWard(t, order) {
    const rank = new Map(order.filter(id => !id.startsWith('fu')).map((id, i) => [id.split(':')[1], i + 1]));
    const qIndex = new Map(); S.order.forEach((id, i) => { const bed = id.includes(':') ? id.split(':')[1] : null; if (bed && !qIndex.has(bed)) qIndex.set(bed, i + 1); });
    for (const b of ward.beds) {
      const el = tiles.get(b.id), s = stat(b);
      const cls = `cb glass2 s-${s === 'held' ? 'away' : s}${S.selected === b.id ? ' sel' : ''}`;
      if (el.className !== cls) el.className = cls;
      if (el.dataset.s !== s) { el.dataset.s = s; $('.gl', el).innerHTML = ST[s].icon(); }
      const st = $('.st', el), sub = $('.sub', el), ob = $('.ob', el), word = s === 'held' ? 'Ditahan' : ST[s].word;
      if (st.textContent !== word) st.textContent = word;
      const sv = tileSub(b, s, t);
      if (sub.textContent !== sv) sub.textContent = sv;
      sub.classList.toggle('cd', s === 'pra');
      const q = qIndex.get(b.id);
      ob.hidden = !q; if (q && ob.textContent !== String(q)) ob.textContent = String(q);
      el.setAttribute('aria-pressed', String(S.selected === b.id));
      el.setAttribute('aria-label', `${b.id}, ${word}, ${sv}`);
    }
    void rank;
    for (const r of ROOMS) {
      const n = ward.beds.filter(b => b.room === r && (b.name || b.sim.present)).length;
      const e = $(`.room[data-room="${r}"] [data-v="np"]`, roomsEl), v = `${n} pasien`;
      if (e.textContent !== v) e.textContent = v;
    }
    /* hitungan per status */
    const cnt = {};
    for (const b of ward.beds) { const s = stat(b); cnt[s] = (cnt[s] || 0) + 1; }
    const tally = TALLY.filter(([k]) => cnt[k] || ['cb', 'pra', 'kr', 'ws', 'tk', 'ok'].includes(k))
      .map(([k, w, ic]) => { const z = !cnt[k]; return `<span class="lgc s-${k === 'held' ? 'away' : k}${z ? ' zero' : ''}">${ic(z)}<span class="n">${cnt[k] || 0}</span>${w}</span>`; }).join('')
      + (cnt.load ? `<span class="lgc s-load">${ICON.spin('var(--tx2)', 12)}<span class="n">${cnt.load}</span>Menunggu data</span>` : '');
    const tEl = $('#tally');
    if (tEl.dataset.h !== tally) { tEl.innerHTML = tally; tEl.dataset.h = tally; }
    renderBand(t);
  }

  function spark(b, t) {
    const raw = b.mon.trend.filter(p => p.t >= t - 1800);
    if (raw.length < 2) return '<div class="hint muted" style="font-size:13px">Tren belum cukup</div>';
    /* rata-rata per ember (±30 titik) supaya garisnya terbaca sekilas, bukan derau per 2 dtk */
    const W = 230, t0 = raw[0].t, span = Math.max(1, t - t0), nb = 30, pts = [];
    for (let k = 0; k < nb; k++) {
      const a = t0 + span * k / nb, z = t0 + span * (k + 1) / nb;
      const vs = raw.filter(p => p.t >= a && (p.t < z || k === nb - 1) && p.rr != null).map(p => p.rr);
      const any = raw.some(p => p.t >= a && p.t < z);
      if (any || k === nb - 1) pts.push({ t: (a + z) / 2, rr: vs.length ? vs.reduce((s, v) => s + v, 0) / vs.length : null });
    }
    const y = rr => (127.4 - 3.54 * Math.max(6, Math.min(34, rr))).toFixed(1);
    const segs = []; let cur = [];
    for (const p of pts) {
      if (p.rr == null) { if (cur.length) segs.push(cur); cur = []; continue; }
      cur.push(`${(((p.t - t0) / span) * W).toFixed(1)},${y(p.rr)}`);
    }
    if (cur.length) segs.push(cur);
    const last = pts[pts.length - 1], s = stat(b);
    const dotC = s === 'kr' || s === 'pra' || s === 'cb' ? 'var(--hi)' : s === 'ws' ? 'var(--mdDot)' : 'var(--ok)';
    const halo = 'paint-order:stroke;stroke:var(--solid);stroke-width:4px;stroke-linejoin:round';
    return `<svg width="230" height="110" viewBox="0 0 230 110" style="overflow:visible" role="img" aria-label="Tren laju napas ${b.id}">
      <line x1="0" x2="230" y1="21.2" y2="21.2" style="stroke:var(--hiEdge)" stroke-width="1.2" stroke-dasharray="4 4"/>
      <line x1="0" x2="230" y1="56.6" y2="56.6" style="stroke:var(--mdDot)" stroke-width="1.2" stroke-dasharray="4 4" opacity=".8"/>
      <text x="0" y="16.2" style="fill:var(--hiText);font-size:11px;font-weight:600;${halo}">30 Kritis</text>
      <text x="0" y="51.6" style="fill:var(--md);font-size:11px;font-weight:600;${halo}">20 Waspada</text>
      ${segs.map(sg => `<polyline points="${sg.join(' ')}" style="fill:none;stroke:var(--tx)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`).join('')}
      ${last.rr != null ? `<circle cx="230" cy="${y(last.rr)}" r="4.5" style="fill:${dotC}"/>` : ''}
      <text x="0" y="108" style="fill:var(--tx3);font-size:11px">${hm(wallAt(t0))}</text>
      <text x="230" y="108" text-anchor="end" style="fill:var(--tx3);font-size:11px">${hm(wallAt(t))}</text></svg>`;
  }
  let bandKey = '', bandTrend = -1;
  const DENSE = window.matchMedia('(max-width: 1599px)');
  function renderBand(t) {
    const b = S.selected && ward.byId(S.selected);
    if (!b) { if (bandKey) { $$('.band', roomsEl).forEach(e => e.remove()); bandKey = ''; } return; }
    const s = stat(b), chk = S.checked.has(b.id), i = ROSTER.filter(x => x.room === b.room).findIndex(x => x.id === b.id);
    const dense = DENSE.matches, cols = dense ? 2 : 4, gap = dense ? 8 : 10, col = i % cols;
    const notch = `calc((100% - ${gap * (cols - 1)}px) / ${cols} * ${col + 0.5} + ${col * gap}px - 8px)`;
    const key = `${b.id}:${s}:${chk ? 1 : 0}:${cols}`;
    const slot = $(`.room[data-room="${b.room}"] .band-slot`, roomsEl);
    if (key !== bandKey) {
      $$('.band', roomsEl).forEach(e => e.remove());
      const edge = { kr: 'var(--hiEdge)', pra: 'var(--hi)', cb: 'var(--cbBg)', ws: 'var(--mdDot)', tk: 'var(--lo)' }[s] || 'var(--hair)';
      const rrc = { kr: 'var(--hiText)', pra: 'var(--hiText)', cb: 'var(--hiText)', ws: 'var(--md)', tk: 'var(--lo)' }[s] || 'var(--tx2)';
      const canCheck = (s === 'kr' || s === 'ws') && !chk;
      slot.innerHTML = `<div class="band" style="--notch:${notch};--bandEdge:${edge};--rrc:${rrc}" data-bed="${b.id}">
        <div><div class="who">${b.name ? `${esc(b.name)} · ${b.age}` : esc(patient(b))}<small>${b.name ? `${esc(b.dxs)}<br>` : ''}<span data-v="meta"></span></small></div>
          <div class="rrv"><span data-v="rr"></span><small data-v="unit"></small></div><div class="rrc" data-v="rrc"></div></div>
        <div class="spark" data-spark></div>
        <div class="acts">${canCheck ? '<button type="button" class="btn ink" data-act="check">Sudah dicek</button>' : ''}
          ${s === 'pra' ? `<button type="button" class="btn call" data-act="confirm">${ICON.phone(18)}Panggil Code Blue</button>` : ''}
          <button type="button" class="btn ghost close" data-act="unselect">× Tutup</button></div></div>`;
      bandKey = key; bandTrend = -1;
    }
    const band = $('.band', slot), m = b.mon, rr = rrNow(b);
    const age = LIVE ? (m.lastStWall ? Math.max(0, Math.round((Date.now() - m.lastStWall) / 1000)) : null) : 1;
    const vals = {
      meta: b.name ? `No. RM ${b.no_rm}${age != null ? ` · data ${age} dtk lalu` : ''}` : (b.visit_status || ''),
      rr: s === 'empty' || s === 'away' ? '—' : rr == null ? '—' : String(rr),
      unit: s === 'empty' || s === 'away' ? '' : `/mnt${rrArrow(b, t)}`,
      rrc: s === 'kr' || s === 'ws' ? stageWhy(b, t, s) + (chk ? ` · dicek ${S.checked.get(b.id).by} ${hm(wallAt(S.checked.get(b.id).t))}` : '')
        : s === 'pra' ? `${Math.floor(m.apneaSec)} dtk tanpa napas efektif · CB ${praLeft(b, t)} dtk`
        : s === 'cb' ? `Code Blue berjalan ${durS(t - m.cbT)}`
        : s === 'tk' ? `${tkCause(b).long} · ${tkCause(b).step}`
        : s === 'away' ? `Turun dari bed ${tileSub(b, s, t)}` : s === 'held' ? 'Pasien bergerak · sinyal ditahan, tidak dibunyikan'
        : s === 'empty' ? 'Bed siap pakai' : 'Napas dalam batas normal'
    };
    for (const [k, v] of Object.entries(vals)) { const e = $(`[data-v="${k}"]`, band); if (e && e.textContent !== v) e.textContent = v; }
    if (m.trend.length !== bandTrend) { bandTrend = m.trend.length; $('[data-spark]', band).innerHTML = spark(b, t); }
  }

  /* ------------------------------------------------------------------ bilah atas dan footer */
  function renderTop(t) {
    const terp = ward.beds.filter(b => { const s = stat(b); return s !== 'tk' && s !== 'load'; }).length;
    const all = ward.beds.length, terpTxt = `${terp}/${all}`;
    const pTerp = $('#p-terp'), h = `<b>${terpTxt}</b> terpantau`;
    if (pTerp.innerHTML !== h) pTerp.innerHTML = h;
    $('#w-terp').textContent = terpTxt;
    const snd = $('#p-sound'), sh = `${ICON.sound(S.sound)}<b>${S.sound ? 'Suara aktif' : 'Suara mati'}</b>`;
    if (snd.dataset.h !== sh) { snd.innerHTML = sh; snd.dataset.h = sh; }
    snd.classList.toggle('warn', !S.sound);
    snd.setAttribute('aria-pressed', String(S.sound));
    snd.title = S.sound ? 'Matikan suara' : 'Nyalakan suara';
    const src = $('#p-src');
    let sh2, cls = '';
    if (!LIVE) sh2 = `<span class="dot sim"></span><b>Simulasi</b> · ${all} bed`;
    else if (ward.conn !== 'tersambung') { sh2 = `<span class="dot bad"></span><b>Live</b> · broker ${esc(ward.conn)}`; cls = 'bad'; }
    else {
      const up = ward.beds.filter(b => !b.mon.isOffline()).length;
      sh2 = up === all ? `<span class="dot"></span><b>Live</b> · ${all} hub` : `<span class="dot warn"></span><b>Live</b> · ${up}/${all} hub`;
      if (up < all) cls = 'warn';
    }
    if (src.dataset.h !== sh2) { src.innerHTML = sh2; src.dataset.h = sh2; }
    src.className = `pill glass2${cls ? ' ' + cls : ''}`;
    $('#p-nurse').innerHTML = `<b>${esc(S.nurse)}</b> · jaga`;
    const c = hm(new Date());
    if ($('#clock').textContent !== c) $('#clock').textContent = c;
    void t;
  }
  function renderFoot(t) {
    const quiet = ward.beds.map(b => ({ b, s: stat(b) })).filter(x => x.s === 'away' || x.s === 'held' || x.s === 'empty');
    const el = $('#foot');
    if (!quiet.length) { el.hidden = true; return; }
    const html = `<span>Tidak dibunyikan, tetap terlihat di denah:</span>${quiet.map(({ b, s }) =>
      `<span><b>${b.id}</b> ${s === 'away' ? `turun dari bed · ${tileSub(b, s, t)}` : s === 'held' ? 'pasien bergerak, sinyal ditahan' : 'bed kosong'}</span>`).join('')}`;
    if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
    el.hidden = false;
  }

  /* ------------------------------------------------------------------ lembar tindak lanjut (S5) */
  const sheetEl = $('#sheet');
  function openSheet(fuId) {
    const f = S.fu.find(x => x.id === fuId);
    if (!f) return;
    S.sheet = { id: fuId, chips: new Set(), text: '' };
    setView('bangsal');
    renderSheet();
    const ta = $('textarea', sheetEl); if (ta) ta.focus();
  }
  function closeSheet() { S.sheet = null; renderSheet(); render(); }
  function renderSheet() {
    const open = !!S.sheet, f = open && S.fu.find(x => x.id === S.sheet.id);
    $('#wrap').classList.toggle('sheet-open', !!f);
    sheetEl.hidden = !f;
    $('#ward').hidden = !!f || S.view !== 'bangsal';
    if (!f) { sheetEl.innerHTML = ''; return; }
    const b = ward.byId(f.bedId), isCb = f.kind === 'cb';
    const ctx = isCb
      ? [['Kejadian', `Code Blue · ${cbSource(f.source)}`], ['Pasien', b.name ? `${b.name} · ${b.age} · ${b.dxs}` : patient(b)],
         ['Waktu', `Mulai ${hms(wallAt(f.start))} · tim tiba ${hms(wallAt(f.t))}`], ['Respons', durS(f.resp)]]
      : [['Kejadian', 'Pra-alarm dibatalkan'], ['Pasien', b.name ? `${b.name} · ${b.age} · ${b.dxs}` : patient(b)],
         ['Waktu', `Mulai ${hms(wallAt(f.start))} · dibatalkan ${hms(wallAt(f.t))}`], ['Oleh', f.by === 'bedhead' ? 'Tombol di bedhead' : (f.by || '—')]];
    sheetEl.innerHTML = `<div class="fh"><div><div class="k">Tindak lanjut</div><div class="t">${b.id} · ${isCb ? 'Code Blue' : 'Pra-alarm'}</div></div><span class="sp"></span><button type="button" class="x" data-act="sheet-close" aria-label="Tutup lembar">×</button></div>
      <div class="ctx glass2">${ctx.map(([k, v]) => `<span>${k}</span><b>${esc(v)}</b>`).join('')}</div>
      <div><div class="k" style="margin-bottom:10px">Frasa cepat</div><div class="chips2">${CHIPS.map(c => `<button type="button" class="chip" data-chip="${esc(c)}" aria-pressed="${S.sheet.chips.has(c)}">${esc(c)}</button>`).join('')}</div></div>
      <div><label class="k" for="ta-note" style="display:block;margin-bottom:10px">Catatan</label><textarea id="ta-note" class="ta" maxlength="1000" placeholder="Apa yang dilakukan dan kondisi pasien sekarang">${esc(S.sheet.text)}</textarea></div>
      <div class="cnt2"><span data-v="len">${S.sheet.text.length}/1000</span></div>
      <div class="meta2"><span>Ditulis oleh <b>${esc(S.nurse)}</b></span><span>Waktu <b data-v="now">${hm(new Date())}</b> · otomatis</span></div>
      <div class="lock">${ICON.lock()}<span>Setelah disimpan, catatan tidak bisa diubah atau dihapus. Koreksi ditulis sebagai catatan baru dan muncul di riwayat bed serta log.${LIVE ? ' Catatan tersimpan di perangkat ini; penyimpanan ke server menyusul.' : ''}</span></div>
      <div class="facts"><button type="button" class="btn ink" data-act="sheet-save">Simpan tindak lanjut</button><button type="button" class="btn ghost" data-act="sheet-close">Batal</button></div>`;
  }
  function saveSheet() {
    const f = S.sheet && S.fu.find(x => x.id === S.sheet.id);
    if (!f) return;
    const chips = [...S.sheet.chips], text = S.sheet.text.trim();
    if (!chips.length && !text) { toast('bad', 'Catatan masih kosong', 'Pilih frasa cepat atau tulis catatan singkat.'); return; }
    saveNote({ bedId: f.bedId, t: ward.t, kind: f.kind, context: f.kind === 'cb' ? 'Code Blue' : 'Pra-alarm dibatalkan', chips, text });
    S.fu = S.fu.filter(x => x.id !== f.id);
    S.sheet = null;
    toast('ok', `Tindak lanjut ${f.bedId} tersimpan`, 'Tidak bisa diubah; koreksi ditulis sebagai catatan baru.');
    renderSheet(); render();
  }

  /* ------------------------------------------------------------------ menu Tim (sementara) */
  const timEl = $('#tim');
  function renderTim() {
    const pref = store.get('siagabed.tampilan', {});
    const bedOpts = ward.beds.map(b => `<option value="${b.id}"${(S.timBed || S.selected || '301-B') === b.id ? ' selected' : ''}>${b.id} · ${esc(patient(b))}</option>`).join('');
    timEl.innerHTML = `<div><h2>Menu tim</h2><p>Khusus tim SiagaBed. Mode demo dan Kontrol hub menyusul; untuk sekarang menu ini berisi kontrol simulasi dan tampilan.</p></div>
      ${LIVE ? `<div><div class="k" style="margin-bottom:8px">Mode live</div><p>Data dari hub lewat broker MQTT. Skenario simulasi tidak tersedia. Uji jalur tombol Code Blue manual:</p>
        <div class="row" style="margin-top:10px"><select id="tim-bed" aria-label="Bed">${bedOpts}</select><button type="button" class="btn ghost" data-act="tim-manual">Kirim MANUAL ke hub</button></div></div>`
      : `<div><div class="k" style="margin-bottom:8px">Skenario simulasi</div><div class="row" style="margin-bottom:10px"><select id="tim-bed" aria-label="Bed">${bedOpts}</select></div>
        <div class="grid">${SCEN.map(([k, l]) => `<button type="button" class="btn ghost" data-scen="${k}">${l}</button>`).join('')}</div></div>
        <label class="switch"><input type="checkbox" id="tim-demo"${ward.demo ? ' checked' : ''}> Waktu tahan singkat (${CFG.holdDemo} dtk), untuk latihan</label>`}
      <div><div class="k" style="margin-bottom:8px">Tampilan</div>
        <div class="row"><select id="tim-tema" aria-label="Tema"><option value="">Ikuti sistem</option><option value="terang"${pref.tema === 'terang' ? ' selected' : ''}>Terang</option><option value="gelap"${pref.tema === 'gelap' ? ' selected' : ''}>Gelap</option></select>
        <label class="switch"><input type="checkbox" id="tim-ringan"${doc.documentElement.dataset.render === 'ringan' ? ' checked' : ''}> Tampilan ringan (tanpa blur)</label></div></div>
      <div><div class="k" style="margin-bottom:8px">Perawat jaga</div><div class="row"><select id="tim-nurse" aria-label="Perawat jaga">${['Ns. Rina', 'Ns. Dewi', 'Ns. Sari', 'Ns. Bayu'].map(n => `<option${n === S.nurse ? ' selected' : ''}>${n}</option>`).join('')}</select></div></div>`;
  }
  function setView(v) {
    S.view = v;
    $$('.nav button').forEach(btn => { if (btn.dataset.view === v) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current'); });
    timEl.hidden = v !== 'tim';
    if (v === 'tim') { renderTim(); S.sheet = null; renderSheet(); }
    $('#ward').hidden = v !== 'bangsal' || !!(S.sheet);
  }

  /* ------------------------------------------------------------------ toast dan pengumuman */
  function toast(kind, title, text) {
    const el = doc.createElement('div');
    el.className = `toast glass2${kind === 'bad' ? ' bad' : ''}`;
    el.setAttribute('role', kind === 'bad' ? 'alert' : 'status');
    el.innerHTML = `${kind === 'bad' ? ICON.tri('var(--hiText)', 18) : ICON.check(20)}<div><b>${esc(title)}</b>${esc(text || '')}</div>`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), kind === 'bad' ? 9000 : 5000);
  }
  function announce(text) { const a = $('#announce'); a.textContent = ''; setTimeout(() => { a.textContent = text; }, 30); }

  /* ------------------------------------------------------------------ interaksi */
  function bedOf(el) { const host = el.closest('[data-bed]'); return host ? ward.byId(host.dataset.bed) : null; }
  doc.addEventListener('click', e => {
    const tile = e.target.closest('.cb[data-bed]');
    if (tile) { S.selected = S.selected === tile.dataset.bed ? null : tile.dataset.bed; if (S.sheet || S.view !== 'bangsal') { S.sheet = null; renderSheet(); setView('bangsal'); } render(); return; }
    const nav = e.target.closest('.nav button[data-view]');
    if (nav && !nav.disabled) { setView(nav.dataset.view === S.view && S.view === 'tim' ? 'bangsal' : nav.dataset.view); render(); return; }
    if (e.target.closest('#p-sound')) { if (S.sound) S.sound = false; else { soundOn(); play('ws'); } render(); return; }
    const chip = e.target.closest('[data-chip]');
    if (chip && S.sheet) { const c = chip.dataset.chip; if (S.sheet.chips.has(c)) S.sheet.chips.delete(c); else S.sheet.chips.add(c); chip.setAttribute('aria-pressed', String(S.sheet.chips.has(c))); return; }
    const scen = e.target.closest('[data-scen]');
    if (scen && !LIVE) { const b = ward.byId($('#tim-bed').value); S.timBed = b.id; if (scen.dataset.scen === 'manual') send(b, 'manual'); else ward.scenario(b, scen.dataset.scen); toast('ok', `${b.id} · ${scen.textContent}`, 'Skenario simulasi dijalankan.'); render(); return; }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const b = bedOf(act);
    switch (act.dataset.act) {
      case 'confirm': if (b) send(b, 'confirm'); break;
      case 'close': if (b) send(b, 'close'); break;
      case 'check': if (b) check(b); break;
      case 'select': if (b) { S.selected = b.id; setView('bangsal'); S.sheet = null; renderSheet(); } break;
      case 'unselect': S.selected = null; break;
      case 'retry': if (b) { const f = S.failed.get(b.id); if (f) send(b, f.kind); } break;
      case 'write': openSheet(act.closest('[data-fu]').dataset.fu); break;
      case 'sheet-close': closeSheet(); return;
      case 'sheet-save': saveSheet(); return;
      case 'tim-manual': { const tb = ward.byId($('#tim-bed').value); if (tb) send(tb, 'manual'); break; }
      default: return;
    }
    render();
  });
  doc.addEventListener('input', e => {
    if (e.target.id === 'ta-note' && S.sheet) { S.sheet.text = e.target.value; $('[data-v="len"]', sheetEl).textContent = `${e.target.value.length}/1000`; }
  });
  doc.addEventListener('change', e => {
    const id = e.target.id;
    if (id === 'tim-demo') { ward.setDemo(e.target.checked); }
    else if (id === 'tim-bed') { S.timBed = e.target.value; }
    else if (id === 'tim-tema' || id === 'tim-ringan') {
      const pref = { tema: $('#tim-tema').value || undefined, ringan: $('#tim-ringan').checked || undefined };
      store.set('siagabed.tampilan', pref);
      const r = doc.documentElement;
      if (pref.tema === 'gelap') r.dataset.theme = 'dark'; else if (pref.tema === 'terang') r.dataset.theme = 'light'; else delete r.dataset.theme;
      if (pref.ringan) r.dataset.render = 'ringan'; else delete r.dataset.render;
    } else if (id === 'tim-nurse') { S.nurse = e.target.value; store.set('siagabed.perawat', S.nurse); ward.user = S.nurse; render(); }
  });
  /* Batalkan Pra-alarm: tahan 2 dtk (sengaja dibuat lebih disengaja daripada Panggil Code Blue). */
  function holdButtons() { return S.hold ? $$(`[data-bed="${S.hold.bedId}"] [data-act="hold"]`) : []; }
  function startHold(btn) {
    const b = bedOf(btn); if (!b || S.hold) return;
    S.hold = { bedId: b.id, t0: performance.now() };
    requestAnimationFrame(holdTick);
  }
  function holdTick() {
    if (!S.hold) return;
    const p = Math.min(1, (performance.now() - S.hold.t0) / 2000);
    holdButtons().forEach(el => { el.classList.add('holding'); el.style.setProperty('--p', p.toFixed(3)); });
    if (p >= 1) { const b = ward.byId(S.hold.bedId); endHold(); if (b && stat(b) === 'pra') send(b, 'cancel'); return; }
    requestAnimationFrame(holdTick);
  }
  function endHold() { holdButtons().forEach(el => { el.classList.remove('holding'); el.style.removeProperty('--p'); }); S.hold = null; }
  doc.addEventListener('pointerdown', e => { const btn = e.target.closest('[data-act="hold"]'); if (btn && e.button === 0) { e.preventDefault(); startHold(btn); } });
  doc.addEventListener('pointerup', endHold);
  doc.addEventListener('pointercancel', endHold);
  doc.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat && e.target.matches('[data-act="hold"]')) { e.preventDefault(); startHold(e.target); }
    if (e.key === 'Escape') { if (S.sheet) closeSheet(); else if (S.selected) { S.selected = null; render(); } }
  });
  doc.addEventListener('keyup', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act="hold"]')) endHold(); });
  /* Antrean tidak bergeser selama disentuh atau difokus. */
  const left = $('.left');
  left.addEventListener('pointerenter', () => { S.frozen = true; });
  left.addEventListener('pointerleave', () => { S.frozen = left.contains(doc.activeElement); });
  left.addEventListener('focusin', () => { S.frozen = true; });
  left.addEventListener('focusout', e => { if (!left.contains(e.relatedTarget)) S.frozen = left.matches(':hover'); });

  /* ------------------------------------------------------------------ jalan */
  function render() {
    const t = ward.t;
    renderTop(t);
    renderQueue(t);
    renderWard(t, S.order);
    renderFoot(t);
    if (S.sheet) { const e = $('[data-v="now"]', sheetEl); if (e) e.textContent = hm(new Date()); }
    for (const [id] of S.failed) { const b = ward.byId(id); if (b && stat(b) !== 'pra' && S.failed.get(id).kind === 'cancel') S.failed.delete(id); }
  }

  if (LIVE) {
    ward.start();
  } else {
    ward.setDemo(false);                             /* waktu tahan sesuai aturan hub: Waspada 2 mnt, Kritis 1 mnt */
    /* Keadaan awal simulasi: satu Kritis, satu Waspada, satu pad terlepas, satu pasien turun dari bed. */
    const plan = [[60, '301-C', b => { b.sim.rrTarget = 22; b.sim.rrRate = 0.05; }],
      [300, '302-C', b => ward.scenario(b, 'perburukan', { rate: 0.06 })],
      [PRE - 160, '302-B', b => ward.scenario(b, 'cabut')],
      [PRE - 135, '302-D', b => ward.scenario(b, 'turun')]];
    let next = 0;
    for (let i = 0; i < PRE * FS; i++) {
      while (next < plan.length && ward.t >= plan[next][0]) { plan[next][2](ward.byId(plan[next][1])); next++; }
      ward.step();
    }
    bootWall = Date.now();
  }
  booting = false;
  render();

  let lastReal = performance.now(), acc = 0;
  setInterval(() => {
    const now = performance.now();
    acc += Math.min(5, (now - lastReal) / 1000); lastReal = now;
    let n = 0;
    while (acc >= E.DT && n < 150) { ward.step(); acc -= E.DT; n++; }
    if (n >= 150) acc = 0;
    soundTick();
  }, 40);
  setInterval(render, 250);
  window.SiagaApp = { ward, state: S, render, stat };   /* untuk uji dan konsol pengembang */
})();
