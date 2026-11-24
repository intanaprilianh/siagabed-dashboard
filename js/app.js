/* SiagaBed dasbor v2 (desain Phase 3).
 *
 * Layar: S1 Mulai shift, S10 Ringkasan shift, S2 Bangsal (antrean + denah), S3 item antrean,
 * S4 Detail bed (gaya monitor), S5 lembar tindak lanjut, menu Tim (sementara: simulasi dan tampilan).
 *
 * Data datang dari SiagaEngine.Ward (simulasi) atau SiagaLive.LiveWard (?live). Keduanya punya antarmuka
 * yang sama (beds, byId, on, step, t, cancel, confirm, close, scenario), jadi tampilan tidak peduli sumbernya.
 * Prinsip dari design brief: hub memutuskan, dasbor menjelaskan. Item yang sedang disentuh tidak bergeser.
 *
 * Opsi URL: ?live (data hub), ?langsung (lewati Mulai shift, untuk kiosk dan uji), ?tema=gelap|terang, ?ringan.
 */
(function () {
  'use strict';
  const E = window.SiagaEngine, CFG = E.CFG, FS = E.FS;
  const doc = document, Q = new URLSearchParams(location.search);
  const $ = (s, el) => (el || doc).querySelector(s);
  const $$ = (s, el) => Array.from((el || doc).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad2 = n => String(n).padStart(2, '0');
  const hm = d => `${pad2(d.getHours())}.${pad2(d.getMinutes())}`;
  const hms = d => `${hm(d)}.${pad2(d.getSeconds())}`;
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const tanggal = d => `${HARI[d.getDay()]}, ${d.getDate()} ${BLN[d.getMonth()]} ${d.getFullYear()}`;
  const durS = s => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60), r = s % 60; return m ? `${m} mnt${r ? ` ${r} dtk` : ''}` : `${r} dtk`; };
  const durM = s => { const m = Math.floor(Math.max(0, s) / 60); return m < 1 ? '< 1 mnt' : m < 60 ? `${m} mnt` : `${Math.floor(m / 60)} j ${m % 60} mnt`; };
  const dec = (v, n) => v.toFixed(n).replace('.', ',');
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
    lock: () => `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="6" width="10" height="7" rx="2" style="fill:none;stroke:currentColor" stroke-width="1.4"/><path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" style="fill:none;stroke:currentColor" stroke-width="1.4"/></svg>`,
    coil: () => `<svg width="28" height="28" viewBox="0 0 30 30" fill="none" aria-hidden="true"><rect x="1.5" y="1.5" width="27" height="27" rx="8" style="stroke:var(--tx)" stroke-width="2.2"/><rect x="7.5" y="7.5" width="15" height="15" rx="4.5" style="stroke:var(--tx)" stroke-width="2.2"/><rect x="12" y="12" width="6" height="6" rx="2" style="fill:var(--tx)"/></svg>`
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
  const CHIP_ICON = { cb: () => ICON.siren('#fff', 18), pra: () => ICON.oct(18), kr: () => ICON.tri('#fff', 18), ws: () => ICON.circ(18), tk: () => ICON.tk(18),
    ok: () => ICON.ok(12), away: () => ICON.pause(16), held: () => ICON.pause(16), empty: () => ICON.dash(16), load: () => ICON.spin('var(--tx2)', 16) };
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
  const NURSES = ['Ns. Rina', 'Ns. Dewi', 'Ns. Andi', 'Ns. Sari', 'Ns. Budi'];
  const TEAM = ['dr. Yoga', 'Ns. Fajar', 'Ns. Maya', 'Ns. Rudi'];
  const ROLES = [['ns', 'Nurse station', 'layar meja'], ['perawat', 'Ponsel perawat', 'perawat keliling'], ['tim', 'Tim Code Blue', 'panggilan saja']];
  const NARROW = window.matchMedia('(max-width: 760px)');
  const SHIFTS = { pagi: { name: 'Pagi', from: 7, to: 14 }, siang: { name: 'Siang', from: 14, to: 21 }, malam: { name: 'Malam', from: 21, to: 7 } };
  const SHIFT_ORDER = ['pagi', 'siang', 'malam'];
  const shiftOf = d => { const h = d.getHours(); return h >= 7 && h < 14 ? 'pagi' : h >= 14 && h < 21 ? 'siang' : 'malam'; };
  const shiftPrev = k => SHIFT_ORDER[(SHIFT_ORDER.indexOf(k) + 2) % 3];
  const shiftNext = k => SHIFT_ORDER[(SHIFT_ORDER.indexOf(k) + 1) % 3];
  const shiftHours = k => `${pad2(SHIFTS[k].from)}.00–${pad2(SHIFTS[k].to)}.00`;
  const CHIPS = ['Pasien sadar, napas spontan', 'Ventilasi bag-mask', 'Diberi oksigen', 'RJP dilakukan', 'DPJP dihubungi',
    'Dipindah ke ICU', 'Keluarga diberi tahu', 'Reposisi pasien', 'Artefak gerak', 'Alarm tanpa kejadian klinis'];
  const SCEN = [['normal', 'Napas normal'], ['apnea', 'Henti napas'], ['gasp', 'Henti napas + gasping'], ['perburukan', 'Perburukan (RR → 32)'],
    ['lambat', 'Napas melambat (RR → 7)'], ['gerak', 'Pasien bergerak 20 dtk'], ['turun', 'Turun dari bed'], ['naik', 'Berbaring kembali'],
    ['cabut', 'Cabut konektor pad'], ['pasang', 'Pasang konektor pad'], ['manual', 'Tombol Code Blue manual']];

  /* ------------------------------------------------------------------ sumber data dan keadaan */
  const PRE = 600;                                   /* detik riwayat sebelum dasbor dibuka */
  const LIVE = window.SiagaLive ? window.SiagaLive.liveOptions() : null;
  const WARD_KEY = LIVE ? LIVE.ward : 'simulasi';
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
  const NOTES_KEY = `siagabed.tindaklanjut.${WARD_KEY}.${today()}`;
  const HANDOVER_KEY = `siagabed.serahterima.${WARD_KEY}`;
  const S = {
    nurse: store.get('siagabed.perawat', 'Ns. Rina'),
    extraNurses: store.get('siagabed.perawat.lain', []),
    shift: shiftOf(new Date()),
    sessionStart: null, prevSession: store.get(`siagabed.sesi.${WARD_KEY}`, null),
    role: ['ns', 'perawat', 'tim'].includes(Q.get('peran')) ? Q.get('peran') : (NARROW.matches ? 'perawat' : 'ns'),
    teamName: store.get('siagabed.tim', 'dr. Yoga'), phTab: 'antrean', phSel: null, demo: null, lastClosed: null,
    sound: false, view: 'mulai', summaryMode: 'masuk', selected: null, detailBed: null,
    checked: new Map(),       /* bed -> { t, by, stage } : "Sudah dicek" untuk Kritis/Waspada */
    since: new Map(),         /* 'stage:bed' | 'tk:bed' | 'away:bed' -> t */
    fu: [],                   /* item "perlu tindak lanjut" */
    sending: new Map(),       /* bed -> { kind } : perintah sedang dikirim ke hub */
    failed: new Map(),        /* bed -> { kind, pesan } */
    actor: new Map(),         /* bed -> nama perawat yang terakhir mengirim aksi dari dasbor */
    notes: store.get(NOTES_KEY, []),
    log: [], sheet: null, hold: null, order: [], frozen: false, seq: 0, alarmsSeen: new Set(), addingNurse: false
  };
  if (Q.has('langsung')) S.view = S.role === 'ns' ? 'bangsal' : 'ponsel';
  if (Q.has('demo')) S.view = 'demo';
  const me = () => S.role === 'tim' ? S.teamName : S.nurse;

  const ward = LIVE ? new window.SiagaLive.LiveWard(ROSTER, Object.assign({ pre: PRE, user: S.nurse }, LIVE))
                    : new E.Ward(ROSTER, 20261018);
  if (LIVE) ward.notice = () => {};                  /* hasil perintah ditangani per item di send() */
  let bootWall = LIVE ? ward.base : Date.now();
  let booting = true;
  const wallAt = t => new Date(bootWall + (t - PRE) * 1000);
  const tAtWall = ms => PRE + (ms - bootWall) / 1000;

  /* ------------------------------------------------------------------ status satu bed */
  const isLiveBed = m => typeof m.isOffline === 'function';
  function stat(b) {
    const m = b.mon;
    if (isLiveBed(m) && m.stage == null && !m.online) return 'load';
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
    if (isLiveBed(m) && m.isOffline()) return { short: 'hub offline', long: 'Hub tidak mengirim data', step: 'Periksa daya dan Wi-Fi hub di bedhead, lalu hubungi teknisi' };
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
  /* Satu kalimat keadaan bed, dipakai pita detail, detail bed, dan lembar catatan. */
  function stateLine(b, t, s) {
    const m = b.mon;
    switch (s) {
      case 'kr': case 'ws': { const c = S.checked.get(b.id); return stageWhy(b, t, s) + (c ? ` · dicek ${c.by} ${hm(wallAt(c.t))}` : ''); }
      case 'pra': return `${Math.floor(m.apneaSec)} dtk tanpa napas efektif · CB ${praLeft(b, t)} dtk`;
      case 'cb': return `Code Blue berjalan ${durS(t - m.cbT)} · ${cbSource(m.cbSource)}`;
      case 'tk': { const c = tkCause(b); return `${c.long} · ${c.step}`; }
      case 'away': { const s0 = S.since.get('away:' + b.id); return `Turun dari bed${s0 != null ? ` ${durM(t - s0)}` : ''} · tidak dibunyikan`; }
      case 'held': return 'Pasien bergerak · sinyal ditahan, tidak dibunyikan';
      case 'empty': return 'Bed siap pakai';
      case 'load': return 'Menunggu data pertama dari hub';
      default: return 'Napas dalam batas normal';
    }
  }
  const RRC = { kr: 'var(--hiText)', pra: 'var(--hiText)', cb: 'var(--hiText)', ws: 'var(--md)', tk: 'var(--lo)' };

  /* ------------------------------------------------------------------ kejadian dari hub/engine */
  function addLog(ev) {
    S.log.push({ t: ev.t, type: ev.type, bedId: ev.bed ? ev.bed.id : null, data: ev.data || {}, hist: !!ev.hist });
    if (S.log.length > 800) S.log.shift();
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
      case 'cb_selesai':
        if (!booting && !ev.hist) {
          S.lastClosed = { bedId: b.id, t, by: (ev.data && ev.data.by) || S.actor.get(b.id) || null, resp: t - b.mon.cbT };
          addFollowUp(b, 'cb', t, ev);
        }
        break;
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
  function play(kind, force) {
    if (!kind || !actx || !SOUND[kind] || (!S.sound && !force)) return;
    if (S.role === 'tim' && kind !== 'cb' && !force) return;       /* ponsel tim hanya untuk Code Blue */
    const t0 = actx.currentTime + 0.03;
    for (const [f, o, d, v] of SOUND[kind]) tone(f, t0 + o, d, v);
  }
  function soundTick() {
    const st = ward.beds.map(stat), cb = st.includes('cb'), pra = S.role !== 'tim' && st.includes('pra');
    for (const b of ward.beds) {                       /* umumkan alarm baru untuk pembaca layar */
      const s = stat(b), key = s + ':' + b.id;
      if ((s === 'cb' || s === 'pra') && !S.alarmsSeen.has(key)) { S.alarmsSeen.add(key); announce(`${ST[s].word} di ${b.id}, ${patient(b)}`); }
      if (s !== 'cb') S.alarmsSeen.delete('cb:' + b.id);
      if (s !== 'pra') S.alarmsSeen.delete('pra:' + b.id);
    }
    if (!S.sound || (!cb && !pra)) return;
    if (S.view === 'demo' && !LIVE) return;           /* demo simulasi: hanya bunyi ward demo */
    const now = performance.now(), period = cb ? 1600 : 2200;
    if (now - lastRepeat >= period) { lastRepeat = now; play(cb ? 'cb' : 'pra'); }
  }

  /* ------------------------------------------------------------------ aksi ke hub */
  function send(b, kind) {
    S.actor.set(b.id, me());
    if (!LIVE) {
      if (kind === 'cancel') ward.cancel(b);
      else if (kind === 'confirm') ward.confirm(b);
      else if (kind === 'close') ward.close(b);
      else if (kind === 'manual') ward.scenario(b, 'manual');
      render();
      return;
    }
    ward.user = me();
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
    S.checked.set(b.id, { t, by: me(), stage: s });
    saveNote({ bedId: b.id, t, kind: 'cek', context: `${ST[s].word} · RR ${rrNow(b) ?? '—'} /mnt`, chips: [], text: 'Sudah dicek' });
    render();
  }
  function saveNote(n) {
    const note = Object.assign({ id: 'n' + Date.now() + Math.random().toString(16).slice(2, 6), wall: Date.now(), by: me() }, n);
    S.notes.push(note);
    store.set(NOTES_KEY, S.notes);
    addLog({ t: n.t, type: 'tindak_lanjut', bed: ward.byId(n.bedId), data: { text: n.text, chips: n.chips, by: me() } });
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
  const ticks = () => `<div class="ticks" data-ticks>${'<i></i>'.repeat(CFG.verify)}</div>`;
  const sendingBtn = (cls, onRed) => `<span class="btn sending ${cls || ''}" role="status">${ICON.spin(onRed ? '#fff' : 'currentColor')}Mengirim ke hub…</span>`;

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
          <div class="acts">${sending ? sendingBtn('', true) : '<button type="button" class="btn onred" data-act="close">Tim sudah tiba</button>'}<button type="button" class="btn onred2" data-act="detail">Buka detail</button></div>
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
        ? `${kr ? `<span class="sendnote" data-v="chk"></span>` : ''}<button type="button" class="btn ${kr ? 'onred2' : 'ghost'}" data-act="detail">Lihat tren</button>`
        : `<button type="button" class="btn ${kr ? 'onred' : 'ink'}" data-act="check">Sudah dicek</button><button type="button" class="btn ${kr ? 'onred2' : 'ghost'}" data-act="detail">Lihat tren</button>`;
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
        html: row('tk glass2', `${ICON.tk(18)}Tidak terpantau`, b.id, who(b, false), '<span data-v="w"></span><small data-v="st"></small>', '<button type="button" class="btn ghost" data-act="detail">Buka detail</button>'),
        v: { n, w: since != null ? `${c.long} sejak ${hm(wallAt(since))}` : c.long, st: c.step }
      };
    }
    /* perlu tindak lanjut */
    const f = x.f, isCb = f.kind === 'cb', active = S.sheet && S.sheet.fuId === f.id;
    const head = isCb ? `Code Blue ditutup ${hm(wallAt(f.t))}` : `Pra-alarm dibatalkan${f.by === 'bedhead' ? ' di bedhead' : ''} ${hm(wallAt(f.t))}`;
    const sub = isCb ? `Tim tiba · respons ${durS(f.resp)}` : f.by && f.by !== 'bedhead' ? `${f.by} · pasien sudah dicek` : 'Pasien sudah dicek';
    return {
      key: `fu:${f.id}:${active ? 1 : 0}`,
      html: `<div class="ri fu glass2${active ? ' selr' : ''}" data-bed="${b.id}" data-fu="${f.id}"><span class="lv"><span class="ordb" data-v="n">${n}</span>Tindak lanjut</span><span class="bid">${b.id}</span><span class="pt">${who(b, false)}</span><span class="why">${esc(head)}<small>${esc(sub)}</small></span><span class="acts"><button type="button" class="btn ink" data-act="write">Tulis tindak lanjut</button></span></div>`,
      v: { n }
    };
  }

  const qEl = $('#queue');
  const qNodes = new Map();                         /* id item -> { el, key } */
  function renderQueue(t) {
    const items = queueItems(t);
    S.order = items.map(x => x.id);
    const sum = items.length ? `${items.length} item · urut paling genting` : '';
    if ($('#q-sum').textContent !== sum) $('#q-sum').textContent = sum;
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
      patchVals(nd.el, view.v);
      if (view.ticks != null) $$('[data-ticks] i', nd.el).forEach((e, j) => e.classList.toggle('off', j >= view.ticks));
      if (qEl.children[i] !== nd.el) qEl.insertBefore(nd.el, qEl.children[i] || null);
    });
  }
  function patchVals(root, vals) {
    for (const [k, v] of Object.entries(vals)) { const e = $(`[data-v="${k}"]`, root); if (e && e.textContent !== v) e.textContent = v; }
  }
  const LOGWORD = { pra: 'Pra-alarm', codeblue: 'Code Blue', cb_selesai: 'Code Blue ditutup', pra_batal: 'Pra-alarm dibatalkan', pra_selesai: 'Pra-alarm berhenti sendiri',
    kritis: 'Kritis', waspada: 'Waspada', stabil: 'Kembali normal', teknis: 'Tidak terpantau', teknis_pulih: 'Terpantau lagi', kosong: 'Turun dari bed',
    kembali: 'Kembali ke bed', tahan_lama: 'Sinyal ditahan lama', tindak_lanjut: 'Tindak lanjut ditulis' };
  function calmHTML() {
    if (ward.beds.every(b => stat(b) === 'load')) {
      return `<div class="calm glass" style="gap:10px"><div class="h">${ICON.spin('var(--tx3)', 26)}<h2>Menunggu data pertama dari hub</h2></div><p>Bed belum tampil sampai hub mengirim data. Bila lebih dari 10 dtk, periksa sambungan ke server.</p><div class="skel"></div><div class="skel"></div></div>`;
    }
    const last = S.log.filter(e => e.bedId && ['pra', 'codeblue', 'cb_selesai', 'pra_batal', 'kritis', 'waspada', 'teknis', 'tindak_lanjut'].includes(e.type)).slice(-3).reverse();
    return `<div class="calm glass"><div class="h">${ICON.check(30)}<h2>Tidak ada yang perlu tindakan</h2></div>
      <p>Semua bed terpantau atau tercatat di denah. Dasbor akan berbunyi bila ada yang berubah.</p>
      ${last.length ? `<div class="k">Kejadian terakhir shift ini</div><div class="last">${last.map(e => `<div><span>${hm(wallAt(e.t))}</span><span><b>${e.bedId}</b> · ${LOGWORD[e.type]}</span></div>`).join('')}</div>` : ''}</div>`;
  }

  /* ------------------------------------------------------------------ denah */
  const DENSE = window.matchMedia('(max-width: 1599px)');
  const roomsEl = $('#rooms');
  const tileHTML = (x, extra) => `<button type="button" class="cb glass2${extra || ''}" data-bed="${x.id}" aria-pressed="false"><div class="h"><span class="id">${x.id}</span><span class="ob" hidden></span></div><div class="gl"></div><div class="st"></div><div class="sub"></div></button>`;
  roomsEl.innerHTML = ROOMS.map(r => `<div class="room" data-room="${r}"><div class="rl"><b>Kamar ${r}</b><span data-v="np"></span></div><div class="strip">${
    ROSTER.filter(x => x.room === r).map(x => tileHTML(x)).join('')
  }</div><div class="band-slot"></div></div>`).join('');
  const tiles = new Map($$('.cb', roomsEl).map(el => [el.dataset.bed, el]));

  /* ctx = sumber "sudah dicek" dan waktu mulai (S untuk ward kerja, keadaan demo untuk ward demo) */
  function tileSub(b, s, t, ctx) {
    const m = b.mon, rr = rrNow(b), C = ctx || S;
    switch (s) {
      case 'cb': return durS(t - m.cbT);
      case 'pra': return `CB ${praLeft(b, t)} dtk`;
      case 'kr': return `RR ${rr ?? '—'}${rrArrow(b, t)}`;
      case 'ws': return `RR ${rr ?? '—'}${C.checked.has(b.id) ? ' · dicek' : ''}`;
      case 'tk': return tkCause(b).short;
      case 'away': { const s0 = C.since.get('away:' + b.id); return s0 != null ? durM(t - s0) : 'baru saja'; }
      case 'held': return 'pasien bergerak';
      case 'empty': return 'siap pakai';
      case 'load': return 'menunggu data';
      default: return `RR ${rr ?? '—'}`;
    }
  }
  const queueIndex = () => { const q = new Map(); S.order.forEach((id, i) => { const bed = id.includes(':') ? id.split(':')[1] : null; if (bed && !q.has(bed)) q.set(bed, i + 1); }); return q; };
  /* Isi satu tile (dipakai denah dan panel samping ringkasan shift). */
  function paintTile(el, b, t, qIndex, selected, mini, ctx) {
    const s = stat(b);
    const cls = `cb glass2 s-${s === 'held' ? 'away' : s}${mini ? ' mini' : ''}${selected ? ' sel' : ''}`;
    if (el.className !== cls) el.className = cls;
    if (el.dataset.s !== s) { el.dataset.s = s; $('.gl', el).innerHTML = ST[s].icon(); }
    const st = $('.st', el), sub = $('.sub', el), ob = $('.ob', el), word = ST[s].word;
    if (st.textContent !== word) st.textContent = word;
    const sv = tileSub(b, s, t, ctx);
    if (sub.textContent !== sv) sub.textContent = sv;
    sub.classList.toggle('cd', s === 'pra');
    const q = qIndex.get(b.id);
    ob.hidden = !q; if (q && ob.textContent !== String(q)) ob.textContent = String(q);
    el.setAttribute('aria-pressed', String(!!selected));
    el.setAttribute('aria-label', `${b.id}, ${word}, ${sv}`);
  }
  function tallyHTML(w) {
    const cnt = {};
    for (const b of (w || ward).beds) { const s = stat(b); cnt[s] = (cnt[s] || 0) + 1; }
    return TALLY.filter(([k]) => cnt[k] || ['cb', 'pra', 'kr', 'ws', 'tk', 'ok'].includes(k))
      .map(([k, w, ic]) => { const z = !cnt[k]; return `<span class="lgc s-${k === 'held' ? 'away' : k}${z ? ' zero' : ''}">${ic(z)}<span class="n">${cnt[k] || 0}</span>${w}</span>`; }).join('')
      + (cnt.load ? `<span class="lgc s-load">${ICON.spin('var(--tx2)', 12)}<span class="n">${cnt.load}</span>Menunggu data</span>` : '');
  }
  function renderWard(t) {
    const qIndex = queueIndex(), mini = DENSE.matches;
    for (const b of ward.beds) paintTile(tiles.get(b.id), b, t, qIndex, S.selected === b.id, mini);
    for (const r of ROOMS) {
      const n = ward.beds.filter(b => b.room === r && (b.name || b.sim.present)).length;
      const e = $(`.room[data-room="${r}"] [data-v="np"]`, roomsEl), v = `${n} pasien`;
      if (e.textContent !== v) e.textContent = v;
    }
    const tally = tallyHTML(), tEl = $('#tally');
    if (tEl.dataset.h !== tally) { tEl.innerHTML = tally; tEl.dataset.h = tally; }
    renderBand(t);
  }

  /* Grafik tren laju napas: rata-rata per ember supaya terbaca sekilas, bukan derau per 2 dtk. */
  function spark(b, t, W, H, opt) {
    opt = opt || {};
    const raw = b.mon.trend.filter(p => p.t >= t - 1800);
    if (raw.length < 2) return '<div class="hint muted" style="font-size:13px">Tren belum cukup</div>';
    const t0 = raw[0].t, span = Math.max(1, t - t0), nb = opt.buckets || 30, pts = [];
    for (let k = 0; k < nb; k++) {
      const a = t0 + span * k / nb, z = t0 + span * (k + 1) / nb;
      const vs = raw.filter(p => p.t >= a && (p.t < z || k === nb - 1) && p.rr != null).map(p => p.rr);
      if (raw.some(p => p.t >= a && p.t < z) || k === nb - 1) pts.push({ t: (a + z) / 2, rr: vs.length ? vs.reduce((s, v) => s + v, 0) / vs.length : null });
    }
    const top = 6, bot = H - (opt.noTime ? 4 : 16);
    const y = rr => (top + (34 - Math.max(6, Math.min(34, rr))) / 28 * (bot - top)).toFixed(1);
    const segs = []; let cur = [];
    for (const p of pts) {
      if (p.rr == null) { if (cur.length) segs.push(cur); cur = []; continue; }
      cur.push(`${(((p.t - t0) / span) * W).toFixed(1)},${y(p.rr)}`);
    }
    if (cur.length) segs.push(cur);
    const last = pts[pts.length - 1], s = stat(b);
    const dotC = s === 'kr' || s === 'pra' || s === 'cb' ? 'var(--hi)' : s === 'ws' ? 'var(--mdDot)' : 'var(--ok)';
    const halo = 'paint-order:stroke;stroke:var(--solid);stroke-width:4px;stroke-linejoin:round';
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible;display:block" role="img" aria-label="Tren laju napas ${b.id}">
      <line x1="0" x2="${W}" y1="${y(30)}" y2="${y(30)}" style="stroke:var(--hiEdge)" stroke-width="1.2" stroke-dasharray="4 4"/>
      <line x1="0" x2="${W}" y1="${y(20)}" y2="${y(20)}" style="stroke:var(--mdDot)" stroke-width="1.2" stroke-dasharray="4 4" opacity=".8"/>
      <text x="0" y="${(y(30) - 5).toFixed(1)}" style="fill:var(--hiText);font-size:11px;font-weight:600;${halo}">30 Kritis</text>
      <text x="0" y="${(y(20) - 5).toFixed(1)}" style="fill:var(--md);font-size:11px;font-weight:600;${halo}">20 Waspada</text>
      ${segs.map(sg => `<polyline points="${sg.join(' ')}" style="fill:none;stroke:var(--tx)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`).join('')}
      ${last.rr != null ? `<circle cx="${W}" cy="${y(last.rr)}" r="4.5" style="fill:${dotC}"/>` : ''}
      ${opt.noTime ? '' : `<text x="0" y="${H - 2}" style="fill:var(--tx3);font-size:11px">${hm(wallAt(t0))}</text><text x="${W}" y="${H - 2}" text-anchor="end" style="fill:var(--tx3);font-size:11px">${hm(wallAt(t))}</text>`}</svg>`;
  }
  let bandKey = '', bandTrend = -1;
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
      const canCheck = (s === 'kr' || s === 'ws') && !chk;
      slot.innerHTML = `<div class="band" style="--notch:${notch};--bandEdge:${edge};--rrc:${RRC[s] || 'var(--tx2)'}" data-bed="${b.id}">
        <div><div class="who">${b.name ? `${esc(b.name)} · ${b.age}` : esc(patient(b))}<small>${b.name ? `${esc(b.dxs)}<br>` : ''}<span data-v="meta"></span></small></div>
          <div class="rrv"><span data-v="rr"></span><small data-v="unit"></small></div><div class="rrc" data-v="rrc"></div></div>
        <div class="spark" data-spark></div>
        <div class="acts">${canCheck ? '<button type="button" class="btn ink" data-act="check">Sudah dicek</button>' : ''}
          ${s === 'pra' ? `<button type="button" class="btn call" data-act="confirm">${ICON.phone(18)}Panggil Code Blue</button>` : ''}
          ${s !== 'empty' ? '<button type="button" class="btn ghost" data-act="detail">Buka detail bed →</button>' : ''}
          <button type="button" class="btn ghost close" data-act="unselect">× Tutup</button></div></div>`;
      bandKey = key; bandTrend = -1;
    }
    const band = $('.band', slot), m = b.mon, rr = rrNow(b), quiet = s === 'empty' || s === 'away';
    patchVals(band, {
      meta: b.name ? `No. RM ${b.no_rm}${dataAge(b) != null ? ` · data ${dataAge(b)} dtk lalu` : ''}` : (b.visit_status || ''),
      rr: quiet || rr == null ? '—' : String(rr),
      unit: quiet ? '' : `/mnt${rrArrow(b, t)}`,
      rrc: stateLine(b, t, s)
    });
    if (m.trend.length !== bandTrend) { bandTrend = m.trend.length; $('[data-spark]', band).innerHTML = spark(b, t, 230, 110); }
  }
  const dataAge = b => LIVE ? (b.mon.lastStWall ? Math.max(0, Math.round((Date.now() - b.mon.lastStWall) / 1000)) : null) : 1;

  /* ------------------------------------------------------------------ bilah atas, strip alarm, footer */
  function terpantau() {
    const all = ward.beds.length;
    return { n: ward.beds.filter(b => { const s = stat(b); return s !== 'tk' && s !== 'load'; }).length, all };
  }
  function srcLine() {
    if (!LIVE) return { html: `<span class="dot sim"></span><b>Simulasi</b> · ${ward.beds.length} bed`, cls: '' };
    if (ward.conn !== 'tersambung') return { html: `<span class="dot bad"></span><b>Live</b> · broker ${esc(ward.conn)}`, cls: 'bad' };
    const up = ward.beds.filter(b => !b.mon.isOffline()).length, all = ward.beds.length;
    return up === all ? { html: `<span class="dot"></span><b>Live</b> · ${all} hub`, cls: '' } : { html: `<span class="dot warn"></span><b>Live</b> · ${up}/${all} hub`, cls: 'warn' };
  }
  function setHTML(el, h) { if (el.dataset.h !== h) { el.innerHTML = h; el.dataset.h = h; } }
  function renderTop() {
    const tp = terpantau(), terpTxt = `${tp.n}/${tp.all}`;
    setHTML($('#p-terp'), `<b>${terpTxt}</b> terpantau`);
    $('#w-terp').textContent = terpTxt;
    const snd = $('#p-sound');
    setHTML(snd, `${ICON.sound(S.sound)}<b>${S.sound ? 'Suara aktif' : 'Suara mati'}</b>`);
    snd.classList.toggle('warn', !S.sound);
    snd.setAttribute('aria-pressed', String(S.sound));
    snd.title = S.sound ? 'Matikan suara' : 'Nyalakan suara';
    const src = srcLine(), sEl = $('#p-src');
    setHTML(sEl, src.html);
    sEl.className = `pill glass2${src.cls ? ' ' + src.cls : ''}`;
    setHTML($('#p-nurse'), `<b>${esc(S.nurse)}</b> · jaga`);
    const c = hm(new Date());
    if ($('#clock').textContent !== c) $('#clock').textContent = c;
  }
  /* Pra-alarm dan Code Blue terlihat di semua layar: strip di bawah bilah atas saat antrean tidak terlihat. */
  function renderGStrip(t) {
    const el = $('#gstrip');
    const show = S.view === 'detail';
    const alarms = show ? ward.beds.filter(b => b.id !== S.detailBed && ['cb', 'pra'].includes(stat(b))) : [];
    if (!alarms.length) { if (!el.hidden) { el.hidden = true; el.innerHTML = ''; el.dataset.h = ''; } return; }
    alarms.sort((x, y) => (stat(x) === 'cb' ? 0 : 1) - (stat(y) === 'cb' ? 0 : 1) || (stat(x) === 'cb' ? x.mon.cbT - y.mon.cbT : praLeft(x, t) - praLeft(y, t)));
    const b = alarms[0], s = stat(b), sending = S.sending.get(b.id);
    const key = `${b.id}:${s}:${sending ? 1 : 0}:${alarms.length}`;
    if (el.dataset.key !== key) {
      el.dataset.key = key;
      el.className = `gstrip${s === 'cb' ? ' cbs' : ''}`;
      el.dataset.bed = b.id;
      el.innerHTML = s === 'cb'
        ? `${ICON.siren('#fff', 22)}<span><b>${b.id} · ${esc(patient(b))}</b> CODE BLUE · <span data-v="d"></span></span><span class="sp"></span>
           ${alarms.length > 1 ? `<span class="more">+${alarms.length - 1} alarm lain</span>` : ''}
           ${sending ? sendingBtn('', true) : '<button type="button" class="btn onred" data-act="close">Tim sudah tiba</button>'}<button type="button" class="btn onred2" data-act="to-bangsal">Ke antrean</button>`
        : `${ICON.oct(22)}<span><b>${b.id} · ${esc(patient(b))}</b> Pra-alarm · <span data-v="d"></span></span><span class="cd" data-v="cd"></span><span class="sp"></span>
           ${alarms.length > 1 ? `<span class="more">+${alarms.length - 1} alarm lain</span>` : ''}
           ${sending ? sendingBtn() : `<button type="button" class="btn call" data-act="confirm">${ICON.phone(16)}Panggil Code Blue</button>`}<button type="button" class="btn ghost" data-act="to-bangsal">Ke antrean</button>`;
    }
    patchVals(el, s === 'cb' ? { d: `${durS(t - b.mon.cbT)} berjalan` } : { d: `${Math.floor(b.mon.apneaSec)} dtk tanpa napas efektif`, cd: `CB ${praLeft(b, t)} dtk` });
    el.hidden = false;
  }
  function renderFoot(t) {
    const quiet = ward.beds.map(b => ({ b, s: stat(b) })).filter(x => x.s === 'away' || x.s === 'held' || x.s === 'empty');
    const el = $('#foot');
    if (!quiet.length) { el.hidden = true; return; }
    setHTML(el, `<span>Tidak dibunyikan, tetap terlihat di denah:</span>${quiet.map(({ b, s }) =>
      `<span><b>${b.id}</b> ${s === 'away' ? `turun dari bed · ${tileSub(b, s, t)}` : s === 'held' ? 'pasien bergerak, sinyal ditahan' : 'bed kosong'}</span>`).join('')}`);
    el.hidden = false;
  }

  /* ------------------------------------------------------------------ S1 Mulai shift */
  const startEl = $('#start');
  const allNurses = () => [...NURSES, ...S.extraNurses.filter(n => !NURSES.includes(n))];
  function renderStart() {
    const now = new Date(), tim = S.role === 'tim', cur = me();
    const names = tim ? [...TEAM, ...S.extraNurses.filter(n => !TEAM.includes(n) && !NURSES.includes(n))] : allNurses();
    const showRole = NARROW.matches || S.role !== 'ns' || Q.has('peran');
    const nameBtns = names.map(n => `<button type="button" data-nurse="${esc(n)}" aria-pressed="${n === cur}" class="glass2"><span class="av">${esc(n.replace(/^(Ns|dr)\.\s*/i, '').charAt(0))}</span>${esc(n)}</button>`).join('')
      + (S.addingNurse ? `<input id="nurse-new" type="text" placeholder="Ns. Nama" aria-label="Nama perawat lain" maxlength="40">`
        : '<button type="button" class="more glass2" data-act="nurse-add">+ Nama lain</button>');
    startEl.innerHTML = `<div class="s1">
      <div class="card glass">
        <div style="display:flex;align-items:center;gap:14px"><span class="mk glass2">${ICON.coil()}</span>
          <div><div class="k">SiagaBed · ${tanggal(now)} · <span data-v="clock">${hm(now)}</span></div><h1>Mulai jaga</h1></div></div>
        <div class="fl"><div class="k">Bangsal</div><div class="selbox glass2">Bangsal Melati · Lantai 3<span class="muted" style="font-weight:500;font-size:15px">${LIVE ? `${esc(LIVE.ward)} · live` : 'simulasi'}</span></div></div>
        <div class="fl"><div class="k" id="k-shift">Shift</div><div class="seg2" role="group" aria-labelledby="k-shift">${SHIFT_ORDER.map(k => `<button type="button" data-shift="${k}" aria-pressed="${k === S.shift}">${SHIFTS[k].name}<small>${shiftHours(k)}</small></button>`).join('')}</div></div>
        ${showRole ? `<div class="fl"><div class="k" id="k-role">Peran di perangkat ini</div><div class="seg2" role="group" aria-labelledby="k-role">${ROLES.map(([k, l, d]) => `<button type="button" data-role="${k}" aria-pressed="${k === S.role}">${l}<small>${d}</small></button>`).join('')}</div></div>` : ''}
        <div class="fl"><div class="k" id="k-nurse">${tim ? 'Anggota tim' : 'Perawat jaga'}</div><div class="names" role="group" aria-labelledby="k-nurse">${nameBtns}</div></div>
        <div class="fl"><div class="k">Cek suara</div><div class="snd">${[['ws', 'Waspada'], ['kr', 'Kritis'], ['pra', 'Pra-alarm'], ['cb', 'Code Blue']].map(([k, l]) => `<button type="button" class="btn ghost" data-snd="${k}">▶ ${l}</button>`).join('')}</div>
          <div class="note">Tombol Mulai jaga sekaligus menyalakan suara di layar ini. Pastikan speaker nurse station tidak dibisukan.</div></div>
        <button type="button" class="btn ink go" data-act="mulai">${tim ? 'Mulai siaga' : 'Mulai jaga'} sebagai ${esc(cur)}</button>
      </div>
      <div class="side" data-side></div></div>`;
    renderStartSide();
    const inp = $('#nurse-new'); if (inp) inp.focus();
  }
  function renderStartSide() {
    const side = $('[data-side]', startEl);
    if (!side) return;
    const tp = terpantau(), src = srcLine();
    const tk = ward.beds.filter(b => stat(b) === 'tk');
    const open = openItems();
    const ho = handoverNote();
    const prev = shiftPrev(S.shift);
    setHTML(side, `<div class="card glass"><div class="k">Keadaan bangsal sekarang</div>
        <div class="line">${src.html}</div>
        <div class="line"><b style="font-size:28px">${tp.n}/${tp.all}</b>&nbsp;bed terpantau</div>
        ${tk.map(b => `<div class="line">${ICON.tk(18)}<span><b>${b.id}</b> tidak terpantau · ${esc(tkCause(b).short)}${S.since.has('tk:' + b.id) ? ` sejak ${hm(wallAt(S.since.get('tk:' + b.id)))}` : ''}</span></div>`).join('')}</div>
      <div class="card glass"><div class="k">Dari shift ${SHIFTS[prev].name.toLowerCase()}</div>
        ${open.length ? `<div class="line"><span><b>${open.length}</b> hal masih terbuka</span></div><div class="line" style="color:var(--tx2);font-size:14px">${open.slice(0, 3).map(o => esc(o.short)).join(' · ')}</div>`
          : '<div class="line" style="color:var(--tx2)">Tidak ada yang tertunda.</div>'}
        ${ho ? `<div class="line" style="color:var(--tx2);font-size:14px">Ada catatan serah terima dari ${esc(ho.by)}.</div>` : ''}
        <button type="button" class="btn ghost" style="height:44px;font-size:15px;align-self:flex-start" data-act="to-summary">Lihat ringkasan serah terima</button></div>`);
  }
  function startShift() {
    soundOn();
    play('ws', true);
    ward.user = me();
    if (S.role === 'tim') { store.set('siagabed.tim', S.teamName); setView('ponsel'); return; }
    store.set('siagabed.perawat', S.nurse);
    S.sessionStart = Date.now();
    const rec = { nurse: S.nurse, shift: S.shift, wall: S.sessionStart };
    S.prevSession = store.get(`siagabed.sesi.${WARD_KEY}`, null);
    store.set(`siagabed.sesi.${WARD_KEY}`, rec);
    addLog({ t: ward.t, type: 'mulai_jaga', bed: null, data: { by: S.nurse, shift: S.shift } });
    if (S.role === 'perawat') { setView('ponsel'); return; }
    S.summaryMode = 'masuk';
    setView('ringkasan');
  }

  /* ------------------------------------------------------------------ S10 Ringkasan shift */
  /* Catatan serah terima terakhir (ditulis shift sebelumnya), berlaku 16 jam. */
  function handoverNote() {
    const h = store.get(HANDOVER_KEY, null);
    return h && Date.now() - h.wall < 16 * 3600e3 ? h : null;
  }
  /* Hal yang masih terbuka: bed tidak terpantau, tindak lanjut belum ditulis, Kritis/Waspada belum dicek. */
  function openItems() {
    const out = [];
    for (const b of ward.beds) {
      const s = stat(b), t = ward.t;
      if (s === 'cb') out.unshift({ b, icon: ICON.siren('var(--cbBg)', 16), short: `${b.id} Code Blue`, text: `Code Blue berjalan ${durS(t - b.mon.cbT)} · ${cbSource(b.mon.cbSource)}`, act: 'detail', label: 'Buka detail' });
      else if (s === 'pra') out.unshift({ b, icon: ICON.oct(16), short: `${b.id} Pra-alarm`, text: `Pra-alarm · ${Math.floor(b.mon.apneaSec)} dtk tanpa napas efektif`, act: 'detail', label: 'Buka detail' });
      else if (s === 'tk') out.push({ b, icon: ICON.tk(16), short: `${b.id} tidak terpantau`, text: `Tidak terpantau · ${tkCause(b).short}${S.since.has('tk:' + b.id) ? ` sejak ${hm(wallAt(S.since.get('tk:' + b.id)))}` : ''}`, act: 'detail', label: 'Buka detail' });
      else if ((s === 'kr' || s === 'ws') && !S.checked.has(b.id)) out.push({ b, icon: s === 'kr' ? ICON.tri('var(--hiText)', 16) : ICON.circ(16), short: `${b.id} ${ST[s].word}`, text: `${ST[s].word} ${S.since.has('stage:' + b.id) ? `sejak ${hm(wallAt(S.since.get('stage:' + b.id)))}` : ''} · belum dicek`, act: 'detail', label: 'Buka detail' });
    }
    for (const f of S.fu) {
      const b = ward.byId(f.bedId);
      out.push({ b, f, icon: ICON.check(16), short: `${b.id} tindak lanjut`, text: `${f.kind === 'cb' ? 'Code Blue ditutup' : 'Pra-alarm dibatalkan'} ${hm(wallAt(f.t))} · tindak lanjut belum ditulis`, act: 'write', label: 'Tulis tindak lanjut' });
    }
    return out;
  }
  function summaryCounts(fromWall, toWall) {
    const c = { cb: 0, pra: 0, kr: 0, ws: 0, tk: 0 }, praList = [];
    for (const e of S.log) {
      if (!e.bedId) continue;
      const w = wallAt(e.t).getTime();
      if (w < fromWall || w > toWall) continue;
      if (e.type === 'codeblue') c.cb++;
      else if (e.type === 'pra') { c.pra++; praList.push(e); }
      else if (e.type === 'kritis') c.kr++;
      else if (e.type === 'waspada') c.ws++;
      else if (e.type === 'teknis' || e.type === 'tahan_lama') c.tk++;
    }
    return { c, praList };
  }
  function countsHTML(c) {
    return '<div class="cnts">' + [['cb', 'Code Blue'], ['pra', 'Pra-alarm'], ['kr', 'Kritis'], ['ws', 'Waspada'], ['tk', 'Tidak terpantau']].map(([k, w]) => {
      const z = !c[k], ic = TALLY.find(x => x[0] === k)[2](z);
      return `<span class="lgc s-${k}${z ? ' zero' : ''}">${ic}<span class="n">${c[k]}</span>${w}</span>`;
    }).join('') + '</div>';
  }
  function renderSummary() {
    const keluar = S.summaryMode === 'keluar', now = Date.now();
    const cur = S.shift, prev = shiftPrev(cur), next = shiftNext(cur);
    const from = keluar ? (S.sessionStart || now - 8 * 3600e3) : now - 8 * 3600e3;
    const to = keluar ? Infinity : (S.sessionStart || now);
    const { c, praList } = summaryCounts(from, to);
    const open = openItems(), ho = keluar ? null : handoverNote();
    const prevNurse = S.prevSession && S.prevSession.nurse !== S.nurse ? S.prevSession.nurse : null;
    const quiet = !Object.values(c).some(v => v) && !open.length;
    const praLine = praList.length ? `<div style="font-size:15px;color:var(--tx2);margin-top:10px">Pra-alarm ${praList.length}×: ${praList.slice(-3).map(e => {
      const done = S.log.find(x => x.bedId === e.bedId && x.t > e.t && ['pra_batal', 'pra_selesai', 'codeblue'].includes(x.type));
      return `<b style="color:var(--tx)">${e.bedId} ${hm(wallAt(e.t))}</b>${done ? `, ${done.type === 'pra_batal' ? 'dibatalkan' : done.type === 'pra_selesai' ? 'napas kembali sendiri' : 'jadi Code Blue'}` : ''}`;
    }).join('; ')}.</div>` : '';
    const title = keluar ? `Serah terima shift ${SHIFTS[cur].name.toLowerCase()}` : `Ringkasan shift ${SHIFTS[prev].name.toLowerCase()}`;
    const whoLine = keluar ? `${shiftHours(cur)} · <b>${esc(S.nurse)}</b> → shift ${SHIFTS[next].name.toLowerCase()}`
      : `${shiftHours(prev)} · ${prevNurse ? `<b>${esc(prevNurse)}</b> → ` : ''}<b>${esc(S.nurse)}</b>`;
    startEl.innerHTML = `<div class="s10">
      <section class="xcard glass">
        <div><div class="k">Serah terima · ${tanggal(new Date())} · ${hm(new Date())}</div><h1 style="margin-top:6px">${title}</h1><div class="who" style="margin-top:6px">${whoLine}</div></div>
        ${quiet && !keluar ? `<div class="calm2">${ICON.check(30)}<div><b>Shift ${SHIFTS[prev].name.toLowerCase()} tanpa kejadian</b><span>Semua bed terpantau. Tidak ada hal yang masih terbuka.</span></div></div>` : ''}
        <div><div class="k" style="margin-bottom:10px">${keluar ? 'Kejadian shift ini' : 'Kejadian shift sebelumnya'}</div>${countsHTML(c)}${praLine}</div>
        ${open.length ? `<div><div class="k" style="margin-bottom:10px">Masih terbuka · ${open.length}</div><div style="display:flex;flex-direction:column;gap:8px">${open.map(o =>
          `<div class="orow glass2" data-bed="${o.b.id}"${o.f ? ` data-fu="${o.f.id}"` : ''}>${o.icon}<b>${o.b.id}</b><span>${esc(o.text)}</span><button type="button" class="btn ${o.act === 'write' ? 'ink' : 'ghost'}" data-act="${o.act}">${o.label}</button></div>`).join('')}</div></div>` : ''}
        ${ho ? `<div><div class="k" style="margin-bottom:10px">Catatan dari ${esc(ho.by)}</div><div class="quote glass2">${esc(ho.text)}<small>Ditulis ${hm(new Date(ho.wall))}</small></div></div>` : ''}
        ${keluar ? `<div><label class="k" for="ta-handover" style="display:block;margin-bottom:10px">Catatan untuk shift ${SHIFTS[next].name.toLowerCase()}</label>
          <textarea id="ta-handover" class="ta" maxlength="1000" placeholder="Pasien yang perlu dipantau, rencana DPJP, hal teknis yang belum beres"></textarea></div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="btn ink go2" style="flex:1" data-act="handover-save">Simpan catatan serah terima</button><button type="button" class="btn ghost go2" data-act="to-bangsal">Kembali ke Bangsal</button></div>`
        : `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="btn ink go2" style="flex:1" data-act="to-bangsal">Lanjut ke Bangsal</button></div>`}
      </section>
      <section class="xcard glass sideb" data-sideb></section></div>`;
    renderSummarySide();
  }
  const sideTiles = new Map();
  function renderSummarySide() {
    const side = $('[data-sideb]', startEl);
    if (!side) return;
    const t = ward.t, tp = terpantau(), src = srcLine();
    if (!side.dataset.built) {
      side.dataset.built = '1';
      side.innerHTML = `<div class="k">Bangsal sekarang · <span data-v="clock"></span></div><div class="line" data-v-src></div>
        <div class="line"><b style="font-size:28px" data-v="terp"></b>&nbsp;bed terpantau</div>
        ${ROOMS.map(r => `<div class="rl2"><b>KAMAR ${r}</b><span data-v="np${r}"></span></div><div class="g2">${ROSTER.filter(x => x.room === r).map(x => tileHTML(x, ' mini')).join('')}</div>`).join('')}`;
      sideTiles.clear();
      $$('.cb', side).forEach(el => sideTiles.set(el.dataset.bed, el));
    }
    setHTML($('[data-v-src]', side), src.html);
    const vals = { clock: hm(new Date()), terp: `${tp.n}/${tp.all}` };
    for (const r of ROOMS) vals['np' + r] = `${ward.beds.filter(b => b.room === r && (b.name || b.sim.present)).length} pasien`;
    patchVals(side, vals);
    const qIndex = new Map();
    for (const b of ward.beds) paintTile(sideTiles.get(b.id), b, t, qIndex, false, true);
  }

  /* ------------------------------------------------------------------ S4 Detail bed (gaya monitor) */
  const detailEl = $('#detail');
  let detailKey = '', detailTrendLen = -1, detailW = 0;
  function renderDetail(t) {
    const b = ward.byId(S.detailBed);
    if (!b) return;
    const s = stat(b), m = b.mon, chk = S.checked.get(b.id), sending = S.sending.get(b.id);
    const key = `${b.id}:${s}:${chk ? 1 : 0}:${sending ? 1 : 0}`;
    if (key !== detailKey) {
      detailKey = key; detailTrendLen = -1;
      let acts = '';
      if (sending) acts = sendingBtn();
      else if (s === 'pra') acts = `<button type="button" class="btn call" data-act="confirm">${ICON.phone(18)}Panggil Code Blue</button><button type="button" class="btn hold" data-act="hold">Batalkan <small>tahan 2 dtk</small></button>`;
      else if (s === 'cb') acts = '<button type="button" class="btn ink" data-act="close">Tim sudah tiba</button>';
      else {
        if ((s === 'kr' || s === 'ws') && !chk) acts += '<button type="button" class="btn ink" data-act="check">Sudah dicek</button>';
        if (s !== 'empty') acts += '<button type="button" class="btn ghost" data-act="note">Tulis tindak lanjut</button>';
      }
      const why = s === 'ok' ? 'Kenapa Normal' : s === 'empty' ? 'Keadaan bed' : `Kenapa ${ST[s].word}`;
      const reasonEdge = { kr: 'var(--hiEdge)', pra: 'var(--hi)', cb: 'var(--cbBg)', ws: 'var(--mdDot)', tk: 'var(--lo)' }[s];
      detailEl.innerHTML = `<div class="hdr" data-bed="${b.id}"><button type="button" class="back glass2" data-act="to-bangsal">← Bangsal</button><span class="hbed">${b.id}</span>
          <span class="kchip s-${s}">${CHIP_ICON[s]()}${ST[s].word}</span>
          <span class="hpt">${b.name ? `<b>${esc(b.name)}</b> · ${b.age}<br>${esc(b.dxs)}` : `<b>${esc(patient(b))}</b>`}</span><span class="acts">${acts}</span></div>
        <div class="mon glass" style="--rrc:${RRC[s] || 'var(--tx)'}">
          <div class="wavebox"><div style="display:flex;align-items:center;gap:16px"><div class="k">Gelombang napas · live</div><span class="sp"></span>
            <span class="legendw"><span><i></i>napas efektif</span><span>${FS} sampel/dtk</span></span></div>
            <canvas id="wave" aria-label="Gelombang napas 30 detik terakhir ${b.id}" role="img"></canvas><div class="wl"><span>−30 dtk</span><span>sekarang</span></div>
            <div data-wide style="margin-top:6px"></div></div>
          <div class="side"><div><div class="k">Laju napas</div><div class="rrbig"><span data-v="rr"></span><small data-v="unit"></small></div><div class="rrwhy" data-v="rrwhy"></div></div>
            <div><div class="k" style="margin-bottom:6px">Henti napas</div><div class="apv"><b data-v="ap"></b><span>sejak napas efektif terakhir</span></div>
              <div class="apbar"><i data-apbar></i><span class="th"></span></div><div class="apl"><span>0</span><b>${CFG.apnea} dtk → Pra-alarm</b></div></div></div>
        </div>
        <div class="four">
          <div class="card glass"${reasonEdge ? ` style="box-shadow:inset 0 0 0 2px ${reasonEdge},var(--shadow)"` : ''}><div class="k">${why}</div><div class="reason" data-reason></div></div>
          <div class="card glass"><div class="k">Sinyal dan pad</div><div class="sq" data-sq></div></div>
          <div class="card glass"><div class="k">Riwayat hari ini</div><div class="tl" data-tl></div></div>
          <div class="card glass"><div class="k">Identitas</div>${identityHTML(b)}
            <details class="tech glass2"><summary><span>Data teknis · hub ${esc(b.key || b.id)}</span><span>▸</span></summary><div class="sq" data-tech></div></details></div>
        </div>`;
    }
    const rr = rrNow(b), quiet = s === 'empty' || s === 'away';
    const ap = Math.floor(m.apneaSec || 0);
    patchVals(detailEl, { rr: quiet || rr == null ? '—' : String(rr), unit: quiet ? '' : `/mnt${rrArrow(b, t)}`, rrwhy: s === 'kr' || s === 'ws' ? stageWhy(b, t, s) : '', ap: quiet || s === 'tk' ? '—' : `${ap} dtk` });
    const bar = $('[data-apbar]', detailEl);
    if (bar) { bar.style.width = `${Math.min(100, (ap / CFG.apnea) * 100)}%`; bar.style.setProperty('--apc', ap >= CFG.apnea ? 'var(--hi)' : ap >= 10 ? 'var(--mdDot)' : 'var(--ok)'); }
    setHTML($('[data-reason]', detailEl), reasonHTML(b, t, s));
    setHTML($('[data-sq]', detailEl), signalHTML(b, s));
    setHTML($('[data-tl]', detailEl), timelineHTML(b));
    setHTML($('[data-tech]', detailEl), techHTML(b));
    const wide = $('[data-wide]', detailEl), w = Math.round(wide.clientWidth);
    if (m.trend.length !== detailTrendLen || w !== detailW) { detailTrendLen = m.trend.length; detailW = w; wide.innerHTML = w > 50 ? spark(b, t, w, 70, { buckets: 60 }) : ''; }
  }
  function reasonHTML(b, t, s) {
    const m = b.mon, rr = rrNow(b), c = S.checked.get(b.id), since = S.since.get('stage:' + b.id);
    switch (s) {
      case 'kr': case 'ws':
        return `<b style="color:${RRC[s]}">RR ${rr ?? '—'} /mnt${rrArrow(b, t)}</b> · ${stageWhy(b, t, s)}<small>${since != null ? `Mulai ${hms(wallAt(since))} · ` : ''}berbunyi 1× · ${c ? `dicek ${esc(c.by)} ${hm(wallAt(c.t))}` : `belum dicek sejak ${ST[s].word}`}</small>`;
      case 'pra': return `<b style="color:var(--hiText)">${Math.floor(m.apneaSec)} dtk</b> tanpa napas efektif<small>Mulai ${hms(wallAt(m.praT))} · Code Blue otomatis dalam ${praLeft(b, t)} dtk bila tidak diverifikasi</small>`;
      case 'cb': return `<b style="color:var(--hiText)">Code Blue</b> · ${durS(t - m.cbT)} berjalan<small>Mulai ${hms(wallAt(m.cbT))} · ${cbSource(m.cbSource)}</small>`;
      case 'tk': { const k = tkCause(b), s0 = S.since.get('tk:' + b.id); return `<b style="color:var(--lo)">${k.long}</b>${s0 != null ? ` sejak ${hm(wallAt(s0))}` : ''}<small>${k.step}</small>`; }
      case 'away': return `<b>Pasien turun dari bed</b><small>${stateLine(b, t, s)}</small>`;
      case 'held': return `<b>Pasien bergerak</b><small>Sinyal ditahan sampai tenang lagi. Tidak dibunyikan.</small>`;
      case 'empty': return `<b>Bed kosong</b><small>Siap pakai. Pemantauan mulai sendiri saat pasien berbaring.</small>`;
      case 'load': return `<b>Menunggu data</b><small>Hub belum mengirim status.</small>`;
      default: return `<b>RR ${rr ?? '—'} /mnt</b> · dalam batas ${CFG.rrWarnLow + 1}–${CFG.rrWarnHigh}<small>Tidak ada alarm aktif</small>`;
    }
  }
  function signalHTML(b, s) {
    const m = b.mon, q = typeof m.sqi === 'number' ? m.sqi : null;
    const ql = q == null ? '—' : q >= 0.8 ? `<b style="color:var(--ok)">Baik · ${dec(q, 2)}</b>` : q >= 0.6 ? `<b style="color:var(--md)">Cukup · ${dec(q, 2)}</b>` : `<b style="color:var(--hiText)">Lemah · ${dec(q, 2)}</b>`;
    const age = dataAge(b);
    return `<span>Kualitas sinyal</span>${s === 'tk' && m.fault ? '<b style="color:var(--lo)">Tidak ada sinyal</b>' : ql}
      <span>Kehadiran</span><b>${m.present ? 'Pasien di bed' : 'Tidak ada pasien'}</b>
      <span>Kalibrasi</span><b>${LIVE ? (b.cal === 0 ? '<span style="color:var(--lo)">Belum</span>' : 'Tersimpan di hub') : 'Tersimpan · 2 titik'}</b>
      <span>Data terakhir</span><b>${age == null ? '—' : `${age} dtk lalu`}</b>`;
  }
  function timelineHTML(b) {
    const ev = S.log.filter(e => e.bedId === b.id && LOGWORD[e.type]).slice(-5).reverse();
    if (!ev.length) return '<div><span>—</span><span>Belum ada kejadian hari ini</span></div>';
    return ev.map(e => {
      const d = e.data || {};
      let txt = `<b>${LOGWORD[e.type]}</b>`;
      if ((e.type === 'kritis' || e.type === 'waspada' || e.type === 'stabil') && d.rr != null) txt += ` · RR ${d.rr} /mnt`;
      if (e.type === 'kritis' || e.type === 'waspada') txt += ' · berbunyi 1×';
      if (e.type === 'codeblue') txt += ` · ${cbSource(d.source)}`;
      if (e.type === 'tindak_lanjut') txt += ` · ${esc(d.by || '')}${d.text && d.text !== 'Sudah dicek' ? ` · "${esc(String(d.text).slice(0, 60))}"` : d.text === 'Sudah dicek' ? ' · sudah dicek' : ''}`;
      return `<div><span>${hms(wallAt(e.t))}</span><span>${txt}</span></div>`;
    }).join('');
  }
  function identityHTML(b) {
    if (!b.name) return `<div class="idg"><span>Status</span><b>${esc(b.visit_status || 'Bed siap pakai')}</b></div>`;
    return `<div class="idg"><span>Pasien</span><b>${esc(b.name)} · ${b.age} th</b><span>Diagnosis</span><b>${esc(b.dx)}</b><span>No. RM</span><b>${esc(b.no_rm)}</b>
      <span>ICD-10</span><b>${esc(b.icd10_code)}</b><span>SEP</span><b>${esc(b.sep_number)}</b><span>Kunjungan</span><b>${esc(b.visit_status)}</b></div>`;
  }
  function techHTML(b) {
    const m = b.mon, mhz = f => dec(f / 1e6, 4) + ' MHz';
    const cal = !LIVE && b.cal ? `${mhz(b.cal.empty)} / ${mhz(b.cal.occ)}` : '—';
    return `<span>Sumber</span><b>${LIVE ? 'Hub (MQTT)' : 'Simulasi'}</b><span>Kalibrasi kosong / terisi</span><b>${cal}</b>
      <span>SQI</span><b>${typeof m.sqi === 'number' ? dec(m.sqi, 2) : '—'}</b><span>Mode demo hub</span><b>${m.demo ? 'nyala' : 'mati'}</b>`;
  }
  /* Gelombang napas 30 dtk: sinyal terfilter dari hub/engine, penanda hijau = napas efektif. */
  const at = (buf, m, k) => buf[(m.head + k) % m.N];
  let waveLoop = false;
  function startWave() { if (!waveLoop) { waveLoop = true; requestAnimationFrame(drawWave); } }
  function drawWave() {
    if (S.view !== 'detail' && S.view !== 'demo') { waveLoop = false; return; }
    requestAnimationFrame(drawWave);
    if (S.view === 'detail') { const cv = $('#wave', detailEl), b = ward.byId(S.detailBed); if (cv && b) paintSignal(cv, b); }
    else if (S.demo) { const cv = $('#dwave', demoEl); if (cv) paintSignal(cv, S.demo.ward.byId(DEMO_BED)); }
  }
  function paintSignal(cv, b) {
    const m = b.mon, N = m.N, r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const css = getComputedStyle(doc.documentElement), col = n => css.getPropertyValue(n).trim();
    ctx.strokeStyle = col('--color-border-hair'); ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) { const x = Math.round(i * w / 6) + 0.5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    let amp = 12;
    for (let k = 0; k < N; k++) { const v = at(m.bufB, m, k); if (v === v) amp = Math.max(amp, Math.abs(v)); }
    amp = Math.max(amp * 1.18, (m.h || 6) * 1.6);
    const T = 16, B = 6, ph = h - T - B, X = k => (k / (N - 1)) * w, Y = v => T + ph / 2 - (v / amp) * (ph / 2);
    ctx.fillStyle = col('--color-border-hair');                       /* sinyal ditahan: arsir tipis */
    let s0 = -1;
    for (let k = 0; k <= N; k++) {
      const held = k < N && at(m.bufH, m, k);
      if (held && s0 < 0) s0 = k;
      if ((!held || k === N) && s0 >= 0) { ctx.fillRect(X(s0), T, Math.max(1, X(Math.min(k, N - 1)) - X(s0)), ph); s0 = -1; }
    }
    ctx.beginPath(); let pen = false;
    for (let k = 0; k < N; k++) {
      const v = at(m.bufB, m, k);
      if (v !== v) { pen = false; continue; }
      if (!pen) { ctx.moveTo(X(k), Y(v)); pen = true; } else ctx.lineTo(X(k), Y(v));
    }
    ctx.strokeStyle = col('--color-text-primary'); ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    const ok = col('--color-status-normal'), q = col('--color-text-tertiary');
    for (const br of m.breaths || []) {
      const k = N - 1 - Math.round((m.lastT - br.t) * FS);
      if (k < 0 || k >= N) continue;
      ctx.fillStyle = br.eff ? ok : q;
      ctx.fillRect(X(k) - 1.5, 2, 3, 10);
    }
  }

  /* ------------------------------------------------------------------ S5 lembar tindak lanjut */
  const sheetEl = $('#sheet');
  function openSheet(opts) {
    const f = opts.fuId ? S.fu.find(x => x.id === opts.fuId) : null;
    if (opts.fuId && !f) return;
    S.sheet = { fuId: f ? f.id : null, bedId: f ? f.bedId : opts.bedId, kind: f ? f.kind : 'catatan', chips: new Set(), text: '' };
    setView('bangsal');
    renderSheet();
    const ta = $('textarea', sheetEl); if (ta) ta.focus();
  }
  function closeSheet() { S.sheet = null; renderSheet(); render(); }
  function renderSheet() {
    const sh = S.sheet, f = sh && sh.fuId ? S.fu.find(x => x.id === sh.fuId) : null;
    const open = !!sh && (!sh.fuId || !!f);
    $('#wrap').classList.toggle('sheet-open', open);
    sheetEl.hidden = !open;
    $('#ward').hidden = open || S.view !== 'bangsal';
    if (!open) { sheetEl.innerHTML = ''; return; }
    const b = ward.byId(sh.bedId), t = ward.t, s = stat(b);
    const pt = b.name ? `${b.name} · ${b.age} · ${b.dxs}` : patient(b);
    const ctx = sh.kind === 'cb'
      ? [['Kejadian', `Code Blue · ${cbSource(f.source)}`], ['Pasien', pt], ['Waktu', `Mulai ${hms(wallAt(f.start))} · tim tiba ${hms(wallAt(f.t))}`], ['Respons', durS(f.resp)]]
      : sh.kind === 'pra'
        ? [['Kejadian', 'Pra-alarm dibatalkan'], ['Pasien', pt], ['Waktu', `Mulai ${hms(wallAt(f.start))} · dibatalkan ${hms(wallAt(f.t))}`], ['Oleh', f.by === 'bedhead' ? 'Tombol di bedhead' : (f.by || '—')]]
        : [['Kejadian', 'Catatan perawat'], ['Pasien', pt], ['Keadaan', `${ST[s].word} · ${stateLine(b, t, s)}`], ['Waktu', hms(new Date())]];
    const title = sh.kind === 'cb' ? 'Code Blue' : sh.kind === 'pra' ? 'Pra-alarm' : 'Catatan';
    sheetEl.innerHTML = `<div class="fh"><div><div class="k">Tindak lanjut</div><div class="t">${b.id} · ${title}</div></div><span class="sp"></span><button type="button" class="x" data-act="sheet-close" aria-label="Tutup lembar">×</button></div>
      <div class="ctx glass2">${ctx.map(([k, v]) => `<span>${k}</span><b>${esc(v)}</b>`).join('')}</div>
      <div><div class="k" style="margin-bottom:10px">Frasa cepat</div><div class="chips2">${CHIPS.map(c => `<button type="button" class="chip" data-chip="${esc(c)}" aria-pressed="${sh.chips.has(c)}">${esc(c)}</button>`).join('')}</div></div>
      <div><label class="k" for="ta-note" style="display:block;margin-bottom:10px">Catatan</label><textarea id="ta-note" class="ta" maxlength="1000" placeholder="Apa yang dilakukan dan kondisi pasien sekarang">${esc(sh.text)}</textarea></div>
      <div class="cnt2"><span data-v="len">${sh.text.length}/1000</span></div>
      <div class="meta2"><span>Ditulis oleh <b>${esc(S.nurse)}</b></span><span>Waktu <b data-v="now">${hm(new Date())}</b> · otomatis</span></div>
      <div class="lock">${ICON.lock()}<span>Setelah disimpan, catatan tidak bisa diubah atau dihapus. Koreksi ditulis sebagai catatan baru dan muncul di riwayat bed serta log.${LIVE ? ' Catatan tersimpan di perangkat ini; penyimpanan ke server menyusul.' : ''}</span></div>
      <div class="facts"><button type="button" class="btn ink" data-act="sheet-save">Simpan tindak lanjut</button><button type="button" class="btn ghost" data-act="sheet-close">Batal</button></div>`;
  }
  function saveSheet() {
    const sh = S.sheet;
    if (!sh) return;
    const f = sh.fuId ? S.fu.find(x => x.id === sh.fuId) : null;
    const chips = [...sh.chips], text = sh.text.trim();
    if (!chips.length && !text) { toast('bad', 'Catatan masih kosong', 'Pilih frasa cepat atau tulis catatan singkat.'); return; }
    saveNote({ bedId: sh.bedId, t: ward.t, kind: sh.kind, context: sh.kind === 'cb' ? 'Code Blue' : sh.kind === 'pra' ? 'Pra-alarm dibatalkan' : 'Catatan perawat', chips, text: text || chips.join(', ') });
    if (f) S.fu = S.fu.filter(x => x.id !== f.id);
    S.sheet = null;
    toast('ok', `Tindak lanjut ${sh.bedId} tersimpan`, 'Tidak bisa diubah; koreksi ditulis sebagai catatan baru.');
    renderSheet(); render();
  }

  /* ------------------------------------------------------------------ menu Tim (sementara) */
  const timEl = $('#tim');
  function renderTim() {
    const pref = store.get('siagabed.tampilan', {});
    const bedOpts = ward.beds.map(b => `<option value="${b.id}"${(S.timBed || S.selected || '301-B') === b.id ? ' selected' : ''}>${b.id} · ${esc(patient(b))}</option>`).join('');
    timEl.innerHTML = `<div><h2>Menu tim</h2><p>Khusus tim SiagaBed. Mode demo dan Kontrol hub menyusul; untuk sekarang menu ini berisi kontrol simulasi, tampilan, dan serah terima.</p></div>
      ${LIVE ? `<div><div class="k" style="margin-bottom:8px">Mode live</div><p>Data dari hub lewat broker MQTT. Skenario simulasi tidak tersedia. Uji jalur tombol Code Blue manual:</p>
        <div class="row" style="margin-top:10px"><select id="tim-bed" aria-label="Bed">${bedOpts}</select><button type="button" class="btn ghost" data-act="tim-manual">Kirim MANUAL ke hub</button></div></div>`
      : `<div><div class="k" style="margin-bottom:8px">Skenario simulasi</div><div class="row" style="margin-bottom:10px"><select id="tim-bed" aria-label="Bed">${bedOpts}</select></div>
        <div class="grid">${SCEN.map(([k, l]) => `<button type="button" class="btn ghost" data-scen="${k}">${l}</button>`).join('')}</div></div>
        <label class="switch"><input type="checkbox" id="tim-demo"${ward.demo ? ' checked' : ''}> Waktu tahan singkat (${CFG.holdDemo} dtk), untuk latihan</label>`}
      <div><div class="k" style="margin-bottom:8px">Tampilan</div>
        <div class="row"><select id="tim-tema" aria-label="Tema"><option value="">Ikuti sistem</option><option value="terang"${pref.tema === 'terang' ? ' selected' : ''}>Terang</option><option value="gelap"${pref.tema === 'gelap' ? ' selected' : ''}>Gelap</option></select>
        <label class="switch"><input type="checkbox" id="tim-ringan"${doc.documentElement.dataset.render === 'ringan' ? ' checked' : ''}> Tampilan ringan (tanpa blur)</label></div></div>
      <div><div class="k" style="margin-bottom:8px">Mode demo</div><p>Untuk Demo Day dan pelatihan. Memakai data fiktif tersendiri dengan bingkai ungu, jadi tidak pernah tercampur dengan data pasien.</p>
        <div class="row" style="margin-top:10px"><button type="button" class="btn demo" data-act="demo-start">Buka mode demo</button></div></div>
      <div><div class="k" style="margin-bottom:8px">Shift</div><div class="row"><button type="button" class="btn ghost" data-act="tim-handover">Serah terima · tulis catatan untuk shift berikutnya</button><button type="button" class="btn ghost" data-act="tim-restart">Ganti perawat jaga</button></div></div>`;
  }
  function setView(v, bedId) {
    if (bedId) S.detailBed = bedId;
    S.view = v;
    const start = v === 'mulai' || v === 'ringkasan';
    $('#app').hidden = start || v === 'ponsel' || v === 'demo';
    startEl.hidden = !start;
    phoneEl.hidden = v !== 'ponsel';
    demoEl.hidden = v !== 'demo';
    if (v !== 'ponsel') { doc.body.classList.remove('cbmode'); phoneEl.dataset.role = ''; }
    if (v === 'demo' && !S.demo) startDemo(1);
    if (v !== 'demo' && S.demo) { S.demo = null; demoEl.innerHTML = ''; demoEl.dataset.key = ''; }
    $$('.nav button').forEach(btn => {
      const on = btn.dataset.view === v || (btn.dataset.view === 'bangsal' && v === 'detail');
      if (on) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
    });
    $('#wrap').hidden = v === 'detail';
    detailEl.hidden = v !== 'detail';
    timEl.hidden = v !== 'tim';
    if (v === 'tim') { renderTim(); S.sheet = null; renderSheet(); }
    if (v !== 'detail') { detailKey = ''; detailEl.innerHTML = ''; }
    $('#ward').hidden = v !== 'bangsal' || !!S.sheet;
    if (v === 'mulai') renderStart();
    if (v === 'ringkasan') renderSummary();
    if (v === 'detail' || v === 'demo') { render(); startWave(); }
    if (v === 'ponsel') render();
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------------ ponsel: S7 perawat (tab + dok alarm), S8 Tim Code Blue */
  const phoneEl = $('#phone');
  const INFO = '<svg width="16" height="16" viewBox="0 0 16 16" style="flex:none" aria-hidden="true"><circle cx="8" cy="8" r="7" style="fill:none;stroke:currentColor" stroke-width="1.6"/><rect x="7.2" y="7" width="1.6" height="5" rx=".8" style="fill:currentColor"/><circle cx="8" cy="4.7" r="1" style="fill:currentColor"/></svg>';
  const IC_TAB = {
    antrean: '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" style="stroke:currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    bangsal: '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2" style="fill:none;stroke:currentColor" stroke-width="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2" style="fill:none;stroke:currentColor" stroke-width="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2" style="fill:none;stroke:currentColor" stroke-width="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2" style="fill:none;stroke:currentColor" stroke-width="2"/></svg>',
    lain: '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2" style="fill:currentColor"/><circle cx="12" cy="12" r="2" style="fill:currentColor"/><circle cx="19" cy="12" r="2" style="fill:currentColor"/></svg>'
  };
  const mmss = s => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${pad2(s % 60)}`; };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function keyed(el, key, html, vals) {
    if (!el) return;
    if (el.dataset.key !== key) { el.innerHTML = html; el.dataset.key = key; }
    if (vals) patchVals(el, vals);
  }
  const phTiles = new Map();
  function renderPhone(t) {
    if (phoneEl.dataset.role !== S.role) {
      phoneEl.dataset.role = S.role;
      phoneEl.innerHTML = S.role === 'tim' ? '<div class="ph" data-ph></div>'
        : '<div class="ph" data-ph><div data-abar></div><div data-dock></div><div data-tab></div></div><nav class="tabbar glass" aria-label="Menu ponsel" data-tabbar></nav>';
      phTiles.clear();
    }
    if (S.role === 'tim') renderTeam(t); else renderNursePhone(t);
  }
  function renderNursePhone(t) {
    const items = queueItems(t), root = $('[data-ph]', phoneEl);
    S.order = items.map(x => x.id);
    const tp = terpantau(), src = srcLine(), live = !LIVE ? 'Simulasi' : ward.conn !== 'tersambung' ? 'Terputus' : 'Live';
    keyed($('[data-abar]', root), `a:${tp.n}/${tp.all}:${live}:${S.sound}:${src.cls}:${S.nurse}`,
      `<div class="abar"><div class="w">Bangsal Melati<small>Lantai 3 · ${esc(S.nurse)}</small></div><span class="sp"></span>
        <span class="mp glass2"><b>${tp.n}/${tp.all}</b>&nbsp;bed</span><span class="mp glass2 ${src.cls}"><span class="dot ${LIVE ? src.cls : 'sim'}"></span>${live}</span>
        <button type="button" class="mp glass2 ic1${S.sound ? '' : ' warn'}" data-act="ph-sound" aria-label="${S.sound ? 'Matikan suara' : 'Nyalakan suara'}">${ICON.sound(S.sound)}</button></div>`);
    renderDock($('[data-dock]', root), items[0], items.length, t);
    const tab = $('[data-tab]', root);
    if (S.phTab === 'antrean') renderPhQueue(tab, items, t);
    else if (S.phTab === 'bangsal') renderPhWard(tab, t);
    else renderPhMore(tab);
    const n = items.length;
    keyed($('[data-tabbar]', phoneEl), `tb:${S.phTab}:${n}`, [['antrean', 'Antrean'], ['bangsal', 'Bangsal'], ['lain', 'Lainnya']].map(([k, l]) =>
      `<button type="button" class="tab" data-tab="${k}"${S.phTab === k ? ' aria-current="page"' : ''}>${IC_TAB[k]}${l}${k === 'antrean' && n ? `<span class="bdg">${n}</span>` : ''}</button>`).join(''));
  }
  /* Dok alarm: item teratas antrean menempel di semua tab. */
  function renderDock(el, x, n, t) {
    if (!x) { keyed(el, 'none', ''); return; }
    const b = x.b, m = b.mon, sending = S.sending.get(b.id), chk = S.checked.get(b.id);
    const of = `${esc(patient(b))} · 1 dari ${n}`;
    let key, html, vals = {};
    if (x.k === 'pra') {
      key = `pra:${b.id}:${sending ? 1 : 0}`;
      html = `<div class="dock" data-bed="${b.id}"><div class="r1">${ICON.oct(20)}<span class="b">${b.id}</span><span class="s"><b>Pra-alarm</b> · <span data-v="ap"></span><br>${of}</span><span class="cdk">Code Blue<b data-v="cd"></b></span></div>
        <div class="mticks">${ticks()}</div>
        <div class="r2">${sending ? sendingBtn() : `<button type="button" class="btn call" data-act="confirm">${ICON.phone(18)}Panggil Code Blue</button><button type="button" class="btn hold" data-act="hold">Batalkan · tahan</button>`}</div></div>`;
      vals = { ap: `${Math.floor(m.apneaSec)} dtk`, cd: `${praLeft(b, t)} dtk` };
    } else if (x.k === 'cb') {
      key = `cb:${b.id}:${sending ? 1 : 0}`;
      html = `<div class="dock cbd2" data-bed="${b.id}"><div class="r1">${ICON.siren('#fff', 20)}<span class="b">${b.id}</span><span class="s"><b>CODE BLUE</b> · <span data-v="d"></span><br>${of}</span></div>
        <div class="r2 one">${sending ? sendingBtn('', true) : '<button type="button" class="btn onred" data-act="close">Tim sudah tiba</button>'}</div></div>`;
      vals = { d: `${mmss(t - m.cbT)} berjalan` };
    } else if (x.k === 'kr' || x.k === 'ws') {
      const kr = x.k === 'kr';
      key = `${x.k}:${b.id}:${chk ? 1 : 0}`;
      html = `<div class="dock ${kr ? 'krd' : 'calmd'}" data-bed="${b.id}"${kr ? '' : ' style="box-shadow:inset 0 0 0 2px var(--mdDot),var(--shadow)"'}><div class="r1">${kr ? ICON.tri('#fff', 20) : ICON.circ(20)}<span class="b">${b.id}</span><span class="s"><b${kr ? '' : ' style="color:var(--md)"'}>${ST[x.k].word}</b> · <span data-v="rr"></span><br>${of}</span></div>
        <div class="r2 one">${chk ? '<span class="sendnote" data-v="chk"></span>' : `<button type="button" class="btn ${kr ? 'onred' : 'ink'}" data-act="check">Sudah dicek</button>`}</div></div>`;
      vals = { rr: `RR ${rrNow(b) ?? '—'}${rrArrow(b, t)} · ${stageWhy(b, t, x.k)}`, chk: chk ? `✓ Dicek ${chk.by} ${hm(wallAt(chk.t))}` : '' };
    } else if (x.k === 'tk') {
      const c = tkCause(b);
      key = `tk:${b.id}`;
      html = `<div class="dock calmd" data-bed="${b.id}" style="box-shadow:inset 0 0 0 2px var(--lo),var(--shadow)"><div class="r1">${ICON.tk(20)}<span class="b">${b.id}</span><span class="s"><b style="color:var(--lo)">Tidak terpantau</b> · ${esc(c.short)}<br>${esc(c.step)}</span></div></div>`;
    } else {
      const f = x.f;
      key = `fu:${f.id}`;
      html = `<div class="dock calmd" data-bed="${b.id}"><div class="r1">${ICON.check(20)}<span class="b">${b.id}</span><span class="s"><b style="color:var(--tx)">Perlu tindak lanjut</b> · ${f.kind === 'cb' ? 'Code Blue ditutup' : 'Pra-alarm dibatalkan'} ${hm(wallAt(f.t))}<br>Tulis di nurse station · 1 dari ${n}</span></div></div>`;
    }
    keyed(el, key, html, vals);
    if (x.k === 'pra') $$('[data-ticks] i', el).forEach((e, j) => e.classList.toggle('off', j >= praLeft(b, t)));
  }
  function phRow(x, n, t) {
    const b = x.b, chk = S.checked.get(b.id), sending = S.sending.get(b.id);
    const pt = b.name ? `${esc(b.name)} · ${b.age} · ${esc(b.dxs)}` : esc(patient(b));
    const row = (cls, glyph, level, act, w) => `<div class="mrow ${cls}" data-bed="${b.id}" data-row="${x.id}"><div class="r1"><span class="ordb">${n}</span>${glyph}<span class="lv">${level}</span><span class="sp"></span>${act}</div><div class="r2"><span class="b">${b.id}</span><span class="w">${w}</span></div></div>`;
    switch (x.k) {
      case 'cb': return row('cb', ICON.siren('#fff', 16), 'Code Blue', sending ? sendingBtn('', true) : '<button type="button" class="btn onred" data-act="close">Tim sudah tiba</button>', `<span data-v="d"></span><small>${esc(cap(cbSource(b.mon.cbSource)))} · ${pt}</small>`);
      case 'pra': return row('pra', ICON.oct(16), 'Pra-alarm', sending ? sendingBtn() : `<button type="button" class="btn call" data-act="confirm">${ICON.phone(16)}Panggil CB</button>`, `<b data-v="ap"></b> tanpa napas<small data-v="cd"></small>`);
      case 'kr': return row('kr', ICON.tri('#fff', 16), 'Kritis', chk ? '<span class="sendnote" data-v="chk"></span>' : '<button type="button" class="btn onred" data-act="check">Sudah dicek</button>', `<b data-v="rr"></b> · <span data-v="why"></span><small>${pt}</small>`);
      case 'ws': return row('ws glass2', ICON.circ(15), 'Waspada', chk ? '<span class="sendnote" data-v="chk"></span>' : '<button type="button" class="btn ink" data-act="check">Sudah dicek</button>', `<b data-v="rr"></b> · <span data-v="why"></span><small>${pt}</small>`);
      case 'tk': { const c = tkCause(b); return row('tk glass2', ICON.tk(15), 'Tidak terpantau', '', `${esc(c.long)}<small>${esc(c.step)}</small>`); }
      default: return row('fu glass2', '', 'Tindak lanjut', '', `${x.f.kind === 'cb' ? 'Code Blue ditutup' : 'Pra-alarm dibatalkan'} ${hm(wallAt(x.f.t))}<small>Tulis di nurse station · ${pt}</small>`);
    }
  }
  function phRowVals(x, t) {
    const b = x.b, m = b.mon, chk = S.checked.get(b.id);
    if (x.k === 'cb') return { d: `${mmss(t - m.cbT)} berjalan` };
    if (x.k === 'pra') return { ap: `${Math.floor(m.apneaSec)} dtk`, cd: `Code Blue otomatis ${praLeft(b, t)} dtk` };
    if (x.k === 'kr' || x.k === 'ws') return { rr: `RR ${rrNow(b) ?? '—'} /mnt${rrArrow(b, t)}`, why: stageWhy(b, t, x.k), chk: chk ? `✓ ${hm(wallAt(chk.t))}` : '' };
    return {};
  }
  function renderPhQueue(tab, items, t) {
    const rest = items.slice(1);
    const key = 'q:' + items.map(x => x.id + (S.checked.has(x.b.id) ? 'c' : '') + (S.sending.has(x.b.id) ? 's' : '')).join(',');
    keyed(tab, key, `<div class="o1">${INFO}<span>Ponsel hanya berbunyi saat halaman ini terbuka</span></div>
      <div class="mh2"><h2>${items.length ? 'Berikutnya di antrean' : 'Perlu tindakan'}</h2><span>${items.length ? `${items.length} item · paling genting di atas` : ''}</span></div>
      ${!items.length ? `<div class="mcard glass"><div class="ln">${ICON.check(22)}<b>Tidak ada yang perlu tindakan</b></div><div class="ln2">Semua bed terpantau atau tercatat di denah.</div></div>`
        : rest.length ? rest.map((x, i) => phRow(x, i + 2, t)).join('') : '<div class="mcard glass"><div class="ln2">Tidak ada item lain. Item teratas menempel di atas.</div></div>'}`);
    for (const x of rest) { const el = $(`[data-row="${x.id}"]`, tab); if (el) patchVals(el, phRowVals(x, t)); }
  }
  function renderPhWard(tab, t) {
    if (tab.dataset.key !== 'w') {
      keyed(tab, 'w', `<div class="mh2"><h2>Semua bed</h2><span data-v="terp"></span></div><div class="mchips"><div class="lgd" data-tally></div></div>
        ${ROOMS.map(r => `<div class="mroom glass"><div class="rl"><b>KAMAR ${r}</b><span data-v="np${r}"></span></div><div class="g2">${ROSTER.filter(x => x.room === r).map(x => tileHTML(x, ' mini')).join('')}</div></div>`).join('')}
        <div data-phsel></div>`);
      phTiles.clear();
      $$('.cb', tab).forEach(el => phTiles.set(el.dataset.bed, el));
    }
    setHTML($('[data-tally]', tab), tallyHTML());
    const qi = queueIndex(), tp = terpantau(), vals = { terp: `${tp.n}/${tp.all} terpantau` };
    for (const b of ward.beds) paintTile(phTiles.get(b.id), b, t, qi, S.phSel === b.id, true);
    for (const r of ROOMS) vals['np' + r] = `${ward.beds.filter(b => b.room === r && (b.name || b.sim.present)).length} pasien`;
    patchVals(tab, vals);
    const sb = S.phSel && ward.byId(S.phSel), sel = $('[data-phsel]', tab);
    if (!sb) { keyed(sel, 'none', ''); return; }
    const s = stat(sb), chk = S.checked.has(sb.id);
    keyed(sel, `sel:${sb.id}:${s}:${chk ? 1 : 0}`, `<div class="mcard glass" data-bed="${sb.id}"><div class="ln"><b style="font-size:24px">${sb.id}</b><span class="kchip s-${s}" style="height:30px;font-size:14px;padding:0 10px">${CHIP_ICON[s]()}${ST[s].word}</span><span class="t" data-v="rr"></span></div>
      <div class="ln2">${sb.name ? `${esc(sb.name)} · ${sb.age} · ${esc(sb.dxs)}` : esc(patient(sb))}</div><div class="ln2" data-v="line"></div>
      ${(s === 'kr' || s === 'ws') && !chk ? '<button type="button" class="btn ink mb44" data-act="check">Sudah dicek</button>' : ''}</div>`,
      { rr: rrNow(sb) != null ? `RR ${rrNow(sb)} /mnt` : '', line: stateLine(sb, t, s) });
  }
  function renderPhMore(tab) {
    const pref = store.get('siagabed.tampilan', {});
    keyed(tab, `more:${S.sound}:${pref.tema || ''}:${S.nurse}`, `<div class="mh2"><h2>Lainnya</h2></div>
      <div class="mcard glass"><div class="setrow"><span><b>Suara</b><br><small class="muted">${S.sound ? 'Menyala' : 'Mati · alarm tidak berbunyi'}</small></span><button type="button" class="btn ${S.sound ? 'ghost' : 'ink'}" data-act="ph-sound">${S.sound ? 'Matikan' : 'Nyalakan'}</button></div>
        <div class="snd">${[['ws', 'Waspada'], ['kr', 'Kritis'], ['pra', 'Pra-alarm'], ['cb', 'Code Blue']].map(([k, l]) => `<button type="button" class="btn ghost" data-snd="${k}">▶ ${l}</button>`).join('')}</div></div>
      <div class="mcard glass"><div class="setrow"><b>Tema</b><select id="tim-tema" aria-label="Tema"><option value="">Ikuti sistem</option><option value="terang"${pref.tema === 'terang' ? ' selected' : ''}>Terang</option><option value="gelap"${pref.tema === 'gelap' ? ' selected' : ''}>Gelap</option></select></div></div>
      <div class="mcard glass"><div class="setrow"><span><b>Perawat</b><br><small class="muted">${esc(S.nurse)}</small></span><button type="button" class="btn ghost" data-act="tim-restart">Ganti</button></div></div>
      <div class="mcard glass o1c">${INFO}<span>Ponsel hanya berbunyi saat halaman SiagaBed terbuka dan layar menyala. Saat ponsel terkunci, pantau dari nurse station.</span></div>`);
  }
  function renderTeam(t) {
    const root = $('[data-ph]', phoneEl);
    const cbs = ward.beds.filter(b => stat(b) === 'cb').sort((a, b) => a.mon.cbT - b.mon.cbT);
    const disc = LIVE && ward.conn !== 'tersambung', full = !disc && cbs.length === 1;
    root.className = `ph${full ? ' cbfull' : ''}`;
    doc.body.classList.toggle('cbmode', full);
    const conn = !LIVE ? '<span class="mp glass2"><span class="dot sim"></span>Simulasi</span>' : disc ? `<span class="mp glass2 bad">${ICON.tk(14)}Terputus</span>` : '<span class="mp glass2"><span class="dot"></span>Tersambung</span>';
    const abar = `<div class="abar"><div class="w">Tim Code Blue<small>${esc(S.teamName)} · <button type="button" data-act="tim-restart">ganti</button></small></div><span class="sp"></span>${conn}</div>`;
    if (disc) {
      keyed(root, 'disc', `${abar}<div class="idle"><div class="ring lo">${ICON.tk(72)}</div><div class="it" style="color:var(--lo)">Tidak tersambung</div><div class="is"><b style="color:var(--tx)">Panggilan Code Blue tidak akan masuk</b><br>sampai ponsel tersambung lagi</div></div>
        <div class="mcard glass"><div class="ln">${ICON.spin('var(--lo)', 16)}<b>Mencoba menyambung lagi</b></div><div class="ln2">Periksa Wi-Fi rumah sakit. Sampai tersambung, pantau dari nurse station.</div></div>
        <div style="margin:0 12px"><button type="button" class="btn ink mb44" data-act="reload">Muat ulang</button></div>`);
      return;
    }
    if (full) {
      const b = cbs[0], m = b.mon, sending = S.sending.get(b.id);
      keyed(root, `cb:${b.id}:${sending ? 1 : 0}`, `<div class="cbin" data-bed="${b.id}">
        <div class="cbh">${ICON.siren('#fff', 26)}<span>CODE BLUE</span><span class="sp"></span><span class="tt">mulai ${hms(wallAt(m.cbT))}</span></div>
        <div class="cbw">Bangsal Melati · Lantai 3</div><div class="cbbed">${b.id}</div><div class="cbroom">Kamar ${b.room} · Bed ${b.bed}</div>
        <div class="cbel"><span class="n" data-v="el"></span><span class="l">berjalan</span></div>
        <div class="cbinfo"><span>Sumber</span><b>${esc(cap(cbSource(m.cbSource)))}</b><span>Pasien</span><b>${b.name ? `${esc(b.name)} · ${b.age}<br>${esc(b.dxs)}` : esc(patient(b))}</b></div>
        ${sending ? `<span class="cbbtn sending" role="status">${ICON.spin('#fff', 20)}Mengirim…</span>` : '<button type="button" class="cbbtn" data-act="close">Tim sudah tiba</button>'}
        <div class="cbfoot">Tidak ada Code Blue lain</div></div>`, { el: mmss(t - m.cbT) });
      return;
    }
    if (cbs.length > 1) {
      keyed(root, 'multi:' + cbs.map(b => b.id + (S.sending.has(b.id) ? 's' : '')).join(','), `${abar}<div class="mh2"><h2 style="color:var(--hiText)">${cbs.length} Code Blue aktif</h2><span>paling lama di atas</span></div>
        ${cbs.map(b => `<div class="ccard" data-bed="${b.id}"><div class="cbh">${ICON.siren('#fff', 20)}<span>CODE BLUE</span><span class="sp"></span><span class="tt" data-v="el${b.id}"></span></div>
          <div class="bb"><b>${b.id}</b><span>Kamar ${b.room} · Bed ${b.bed}</span></div><div class="ci">${esc(cap(cbSource(b.mon.cbSource)))}<br>${b.name ? `${esc(b.name)} · ${b.age} · ${esc(b.dxs)}` : esc(patient(b))}</div>
          ${S.sending.has(b.id) ? `<span class="cbbtn sending">${ICON.spin('#fff', 18)}Mengirim…</span>` : '<button type="button" class="cbbtn" data-act="close">Tim sudah tiba</button>'}</div>`).join('')}`,
        Object.fromEntries(cbs.map(b => ['el' + b.id, mmss(t - b.mon.cbT)])));
      return;
    }
    const lc = S.lastClosed && Date.now() - wallAt(S.lastClosed.t).getTime() < 10 * 60e3 ? S.lastClosed : null;
    keyed(root, `idle:${lc ? lc.bedId + lc.t : ''}:${LIVE ? ward.conn : 'sim'}`, `${abar}<div class="idle"><div class="ring ${lc ? 'ok' : 'glass2'}">${lc ? ICON.check(72) : ICON.siren('var(--tx3)', 64)}</div><div class="it">Siaga</div><div class="is">${lc ? 'Tidak ada panggilan lain' : 'Tidak ada panggilan'}</div></div>
      ${lc ? `<div class="mcard glass"><div class="ln">${ICON.ok(10)}<b>Code Blue ${lc.bedId} ditutup</b><span class="t">${hms(wallAt(lc.t))}</span></div><div class="ln2">${lc.by ? `Oleh ${esc(lc.by)}${lc.by === S.teamName ? ' (Anda)' : ''} · ` : ''}waktu respons ${durS(lc.resp)}</div></div>`
        : `<div class="mcard glass"><div class="ln"><span class="dot${LIVE ? '' : ' sim'}"></span><b>${LIVE ? 'Tersambung · Live' : 'Simulasi'}</b><span class="t" data-v="chk"></span></div><div class="ln2">Bangsal Melati · Lantai 3</div></div>`}
      <div class="mcard glass o1c">${INFO}<span>Biarkan halaman ini terbuka. Ponsel hanya berbunyi saat halaman terbuka dan layar menyala.</span></div>
      <div style="margin:0 12px"><button type="button" class="btn ghost mb44" data-snd="cb">▶ Tes bunyi Code Blue</button></div>`, { chk: `dicek ${hm(new Date())}` });
  }

  /* ------------------------------------------------------------------ S6 Mode demo (panggung alur) */
  /* Demo memakai ward simulasi sendiri, jadi datanya tidak pernah tercampur dengan data pasien. */
  const demoEl = $('#demo');
  const DEMO_BED = '301-B';
  const IC_NODE = {
    pad: ICON.coil().replace('width="28" height="28"', 'width="18" height="18"').replace(/var\(--tx\)/g, 'currentColor'),
    hub: '<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="4" width="12" height="12" rx="2.5" style="fill:none;stroke:currentColor" stroke-width="2"/><path d="M8 1v3M12 1v3M8 16v3M12 16v3M1 8h3M1 12h3M16 8h3M16 12h3" style="stroke:currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    rule: '<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 5h12M4 10h8M4 15h10" style="stroke:currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    out: ICON.sound(true),
    arw: '<svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true"><path d="M2 10h19M15 4l6 6-6 6" style="fill:none;stroke:currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ok: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7" style="fill:none;stroke:currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pause: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.6" height="12" rx="1.2" style="fill:currentColor"/><rect x="9.4" y="2" width="3.6" height="12" rx="1.2" style="fill:currentColor"/></svg>'
  };
  const NORMAL_STEP = { at: 0, title: 'Napas normal', desc: 'napas efektif teratur', run: (w, b) => w.scenario(b, 'normal', { rate: 3 }),
    narr: 'Pad induksi magnetik di bawah sprei membaca gerak napas <b>tanpa menyentuh pasien</b>. Hub di bedhead menghitung laju napas dan detik sejak napas efektif terakhir, setiap detik.' };
  const DEMO_SCEN = [
    { name: 'Perburukan', est: 75, rules: 'rr', steps: [NORMAL_STEP,
      { at: 6, title: 'Laju napas naik', desc: 'perburukan bertahap', run: (w, b) => w.scenario(b, 'perburukan', { rate: 0.7 }),
        narr: 'Laju napas naik perlahan. Belum ada bunyi: hub menunggu sampai kenaikan <b>bertahan</b>, supaya perawat tidak dibanjiri alarm sesaat.' },
      { when: b => b.mon.rrStage === 'waspada' || b.mon.rrStage === 'kritis', title: 'Waspada', desc: 'RR > 20 bertahan',
        narr: 'RR di atas 20 bertahan, jadi status naik ke <b>Waspada</b>. Nurse station berbunyi <b>sekali, pelan</b>. Di layar kerja batasnya 2 mnt; di demo dipersingkat jadi 10 dtk.' },
      { when: b => b.mon.rrStage === 'kritis', title: 'Kritis', desc: 'RR ≥ 30 bertahan',
        narr: 'RR menembus 30 dan bertahan. Status naik ke <b>Kritis</b>: tile dan item antrean jadi merah penuh, bunyi <b>sekali, tegas</b>.' },
      { after: 8, title: 'Sudah dicek', desc: 'perawat menandai', run: (w, b, D) => D.checked.set(b.id, { t: w.t }),
        narr: 'Perawat mengecek pasien lalu menekan <b>Sudah dicek</b>. Catatannya tersimpan dan item jadi lebih tenang, tanpa menyembunyikan status Kritis.' }] },
    { name: 'Henti napas', est: 55, rules: 'apnea', steps: [NORMAL_STEP,
      { at: 6, title: 'Napas berhenti', desc: 'hub mulai menghitung detik', run: (w, b) => w.scenario(b, 'apnea'),
        narr: 'Napas pasien berhenti. Hub menghitung <b>detik sejak napas efektif terakhir</b>, belum berbunyi.' },
      { when: b => b.mon.alarm === 'pra' || b.mon.alarm === 'cb', title: 'Pra-alarm', desc: '≥ 20 dtk tanpa napas efektif',
        narr: 'Sudah lebih dari <b>20 dtk tanpa napas efektif</b>. Hub menyalakan Pra-alarm: nurse station dan ponsel perawat berbunyi berulang, bedhead meminta verifikasi. Perawat punya <b>15 dtk</b> sebelum Code Blue otomatis.' },
      { when: b => b.mon.alarm === 'cb', title: 'Code Blue otomatis', desc: '15 dtk tanpa verifikasi',
        narr: 'Tidak ada verifikasi dalam 15 dtk, jadi hub memanggil <b>Code Blue otomatis</b>. Lampu nurse station dan ponsel Tim Code Blue ikut berbunyi.' },
      { after: 12, title: 'Tim tiba', desc: 'waktu respons tercatat', run: (w, b) => w.close(b),
        narr: 'Tim menekan <b>Tim sudah tiba</b> di ponselnya. Waktu respons tercatat otomatis, lalu item menjadi <b>perlu tindak lanjut</b> di nurse station.' }] },
    { name: 'Henti napas + gasping', est: 60, rules: 'apnea', steps: [NORMAL_STEP,
      { at: 6, title: 'Gasping', desc: 'napas tersengal yang jarang', run: (w, b) => w.scenario(b, 'gasp'),
        narr: 'Pasien hanya <b>tersengal sesekali</b>. Hub tidak menganggapnya napas efektif, sesuai pedoman resusitasi: gasping pada pasien tidak responsif dianggap henti napas.' },
      { when: b => b.mon.alarm === 'pra' || b.mon.alarm === 'cb', title: 'Pra-alarm', desc: 'gasping tidak me-reset hitungan',
        narr: 'Meski ada tarikan napas sesekali, hitungan tidak di-reset. Pra-alarm tetap menyala setelah <b>20 dtk tanpa napas efektif</b>.' },
      { when: b => b.mon.alarm === 'cb', title: 'Code Blue otomatis', desc: '15 dtk tanpa verifikasi',
        narr: 'Tidak ada verifikasi, jadi <b>Code Blue otomatis</b> menyala.' },
      { after: 12, title: 'Tim tiba', desc: 'waktu respons tercatat', run: (w, b) => w.close(b), narr: 'Tim tiba dan menekan <b>Tim sudah tiba</b>. Waktu respons tercatat.' }] },
    { name: 'Tombol manual', est: 25, rules: 'manual', steps: [NORMAL_STEP,
      { at: 5, title: 'Tombol ditekan', desc: 'tombol Code Blue di kamar', run: (w, b) => w.scenario(b, 'manual'),
        narr: 'Perawat di kamar menekan <b>tombol Code Blue manual</b> yang sudah ada. Panggilannya masuk ke dasbor dan log yang sama dengan alarm otomatis.' },
      { when: b => b.mon.alarm === 'cb', title: 'Code Blue', desc: 'sumber: tombol manual', narr: 'Code Blue menyala dengan sumber <b>tombol manual di kamar</b>. Ponsel Tim Code Blue berbunyi.' },
      { after: 10, title: 'Tim tiba', desc: 'waktu respons tercatat', run: (w, b) => w.close(b), narr: 'Tim menekan <b>Tim sudah tiba</b>. Waktu respons tercatat.' }] },
    { name: 'Pad terlepas', est: 30, rules: 'pad', steps: [NORMAL_STEP,
      { at: 5, title: 'Konektor dicabut', desc: 'pad lepas dari hub', run: (w, b) => w.scenario(b, 'cabut'), narr: 'Konektor pad di bedhead tercabut.' },
      { when: b => b.mon.fault, title: 'Tidak terpantau', desc: 'penyebab ditulis jelas',
        narr: 'Hub tidak lagi menerima sinyal pad. Dasbor menulis <b>Tidak terpantau · pad terlepas</b> beserta langkahnya. Tidak ada kabar berarti kabar buruk, jadi bed ini <b>tidak boleh terlihat aman</b>.' },
      { after: 8, title: 'Dipasang lagi', desc: 'konektor dipasang', run: (w, b) => w.scenario(b, 'pasang'), narr: 'Perawat memasang lagi konektornya.' },
      { when: b => !b.mon.fault && !b.mon.held && b.mon.rr != null, title: 'Terpantau lagi', desc: 'pemantauan lanjut otomatis', narr: 'Sinyal kembali dan pemantauan berjalan lagi <b>tanpa perlu diatur ulang</b>.' }] },
    { name: 'Pasien turun', est: 35, rules: 'turun', steps: [NORMAL_STEP,
      { at: 5, title: 'Pasien turun', desc: 'kehadiran dari level pad', run: (w, b) => w.scenario(b, 'turun'), narr: 'Pasien turun dari bed, misalnya ke kamar mandi.' },
      { when: b => !b.mon.present, title: 'Turun dari bed', desc: 'tidak dibunyikan',
        narr: 'Kehadiran dibaca dari level frekuensi pad, jadi statusnya <b>Turun dari bed</b>. Tidak ada alarm palsu, tetapi bed tetap terlihat di denah.' },
      { after: 8, title: 'Berbaring lagi', desc: 'pasien kembali', run: (w, b) => w.scenario(b, 'naik'), narr: 'Pasien berbaring lagi.' },
      { when: b => b.mon.present && b.mon.rr != null, title: 'Pemantauan lanjut', desc: 'otomatis', narr: 'Pemantauan napas <b>mulai lagi sendiri</b>.' }] }
  ];
  const mmdot = s => `${pad2(Math.floor(Math.max(0, s) / 60))}.${pad2(Math.floor(Math.max(0, s) % 60))}`;
  function startDemo(idx, all) {
    const dw = new E.Ward(ROSTER, 4242);
    dw.setDemo(true);
    for (const x of dw.beds) if (x.id !== DEMO_BED && x.rr > 19) { x.baseRR = 17; x.sim.rrTarget = 17; x.sim.rrRate = 3; }   /* hanya bed demo yang beraksi */
    for (let i = 0; i < 90 * FS; i++) dw.step();       /* 90 dtk riwayat supaya gelombang dan tren terisi */
    const D = { ward: dw, idx, all: !!all, step: -1, t0: dw.t, stepT: [], paused: false, checked: new Map(), since: new Map(), lastRepeat: 0, acc: 0 };
    dw.on(ev => {
      if (ev.type === 'waspada' || ev.type === 'kritis') { if (S.sound) play(ev.type === 'kritis' ? 'kr' : 'ws', true); }
      if (ev.bed && ev.type === 'kosong') D.since.set('away:' + ev.bed.id, ev.t);
      if (ev.bed && (ev.type === 'stabil' || ev.type === 'waspada' || ev.type === 'kritis')) D.since.set('stage:' + ev.bed.id, ev.t);
    });
    S.demo = D;
    demoEl.dataset.key = '';
    demoTick();
  }
  function demoTick() {
    const D = S.demo;
    if (!D || D.paused) return;
    const sc = DEMO_SCEN[D.idx], b = D.ward.byId(DEMO_BED), el = D.ward.t - D.t0, nx = sc.steps[D.step + 1];
    if (nx) {
      const prevT = D.step >= 0 ? D.stepT[D.step] : 0;
      const go = nx.at != null ? el >= nx.at : nx.when ? nx.when(b) : nx.after != null ? el - prevT >= nx.after : false;
      if (go) { D.step++; D.stepT[D.step] = el; if (nx.run) nx.run(D.ward, b, D); }
    } else if (D.all && D.idx < DEMO_SCEN.length - 1 && el - D.stepT[D.step] >= 5) {
      startDemo(D.idx + 1, true);
      return;
    }
    const s = stat(b);
    if (S.sound && (s === 'pra' || s === 'cb')) {
      const now = performance.now(), per = s === 'cb' ? 1600 : 2200;
      if (now - D.lastRepeat >= per) { D.lastRepeat = now; play(s, true); }
    }
  }
  function demoRules(sc, b) {
    const m = b.mon, ap = Math.floor(m.apneaSec || 0), s = stat(b);
    const R = (state, text) => `<div class="rul ${state}">${state === 'hit' ? IC_NODE.ok : state === 'wait' ? ICON.spin('var(--tx2)', 14) : ICON.ok(8)}<span>${text}</span></div>`;
    switch (sc.rules) {
      case 'apnea': return [
        R(m.alarm === 'pra' || m.alarm === 'cb' ? 'hit' : ap > 2 ? 'wait' : 'done', `≥ 20 dtk tanpa napas efektif → <b>Pra-alarm</b>${m.alarm === 'none' && ap > 2 ? ` · <b>${Math.max(0, CFG.apnea - ap)} dtk lagi</b>` : ''}`),
        R(m.alarm === 'cb' ? 'hit' : m.alarm === 'pra' ? 'wait' : 'done', `15 dtk tanpa verifikasi → <b>Code Blue otomatis</b>${m.alarm === 'pra' ? ` · <b>${praLeft(b, S.demo.ward.t)} dtk lagi</b>` : ''}`)];
      case 'rr': return [
        R(m.rrStage === 'waspada' || m.rrStage === 'kritis' ? 'hit' : (rrNow(b) || 0) > CFG.rrWarnHigh ? 'wait' : 'done', `RR > 20 bertahan (demo 10 dtk) → <b>Waspada</b>`),
        R(m.rrStage === 'kritis' ? 'hit' : (rrNow(b) || 0) >= CFG.rrCritHigh ? 'wait' : 'done', `RR ≥ 30 bertahan → <b>Kritis</b>`)];
      case 'manual': return [R(m.alarm === 'cb' ? 'hit' : 'done', 'Tombol manual ditekan → <b>Code Blue</b>')];
      case 'pad': return [R(m.fault ? 'hit' : 'done', 'Sinyal pad hilang → <b>Tidak terpantau</b>, sebab dan langkah ditulis')];
      default: return [R(!m.present ? 'hit' : 'done', 'Pasien tidak di bed → <b>Turun dari bed</b>, tanpa bunyi')].concat(s === 'held' ? [R('wait', 'Gerak besar → sinyal ditahan, tanpa bunyi')] : []);
    }
  }
  function demoOuts(s) {
    const o = [['Nurse station', s === 'pra' || s === 'cb' ? 'bunyi berulang' : s === 'kr' ? 'bunyi 1× tegas' : s === 'ws' ? 'bunyi 1× pelan' : s === 'tk' ? 'tampil, tanpa bunyi' : 'diam', ['pra', 'cb', 'kr', 'ws', 'tk'].includes(s)],
      ['Ponsel perawat', s === 'pra' || s === 'cb' ? 'berbunyi' : s === 'kr' || s === 'ws' ? 'berbunyi 1×' : 'diam', ['pra', 'cb', 'kr', 'ws'].includes(s)],
      ['Bedhead', s === 'pra' ? 'minta verifikasi' : 'diam', s === 'pra'],
      ['Relay lampu NS', s === 'cb' ? 'menyala' : 'saat Code Blue', s === 'cb'],
      ['Ponsel Tim CB', s === 'cb' ? 'berbunyi' : 'saat Code Blue', s === 'cb']];
    return '<div class="outs">' + o.map(([a, b2, on]) => `<div class="out ${on ? 'on' : 'off'}"><i></i><b>${a}</b><span>${b2}</span></div>`).join('') + '</div>';
  }
  const demoTiles = new Map();
  function renderDemo() {
    const D = S.demo;
    if (!D) return;
    const sc = DEMO_SCEN[D.idx], dw = D.ward, b = dw.byId(DEMO_BED), s = stat(b), t = dw.t, el = t - D.t0, m = b.mon;
    const cnt = dw.beds.filter(x => !['tk', 'load'].includes(stat(x))).length;
    if (demoEl.dataset.key !== 'shell') {
      demoEl.dataset.key = 'shell';
      demoEl.innerHTML = `<header class="top glass"><div class="logo"><span class="mk glass2">${ICON.coil().replace('width="28" height="28"', 'width="24" height="24"')}</span><span class="t">SiagaBed</span></div>
          <div class="ward"><b>Bangsal Melati</b> · Lantai 3</div><div class="sp"></div>
          <span class="pill glass2"><b>Tim SiagaBed</b> · demo</span><button type="button" class="pill glass2" data-act="ph-sound" data-dsound></button>
          <span class="pill pdemo"><b>DEMO</b> · Simulasi</span><span class="pill glass2"><b data-v="terp"></b>&nbsp;terpantau</span><span class="clock" data-v="clock"></span></header>
        <div data-dstrip></div>
        <section class="stage glass"><div class="head"><span class="dtag">DEMO · data fiktif</span><h2>Dari sensor sampai alarm</h2><span class="k" style="margin-left:6px">menyala sesuai langkah</span><span class="sp"></span><span class="claim">Bukan alat diagnosis · belum diuji pada manusia</span></div>
          <div class="pipe">
            <div class="node on glass2"><div class="nt">${IC_NODE.pad}Pad<small>di bawah sprei</small></div><div class="pv">Sinyal napas dari kumparan · ${DEMO_BED}</div><canvas id="dwave" aria-label="Sinyal napas pad ${DEMO_BED}" role="img"></canvas></div>
            <div class="arw">${IC_NODE.arw}</div>
            <div class="node on glass2"><div class="nt">${IC_NODE.hub}Hub<small>ESP32 · bedhead</small></div><div class="hv"><span class="big" data-v="hb"></span><span data-v="hl"></span></div>
              <div class="hk"><span>RR<b data-v="hrr"></b></span><span>SQI<b data-v="hsqi"></b></span><span>Pasien<b data-v="hpr"></b></span></div></div>
            <div class="arw">${IC_NODE.arw}</div>
            <div class="node glass2" data-nrule><div class="nt">${IC_NODE.rule}Aturan<small>diputuskan hub</small></div><div class="rules2" data-rules></div></div>
            <div class="arw">${IC_NODE.arw}</div>
            <div class="node on glass2"><div class="nt">${IC_NODE.out}Keluaran</div><div data-outs></div></div>
          </div></section>
        <div class="dwrap"><section class="story glass" data-story></section>
          <section class="panel glass prod" style="gap:12px"><div class="rhd"><h2>Layar perawat</h2><div class="cnt">sama persis dengan mode kerja · <b data-v="terp2"></b>terpantau</div></div>
            <div data-dq></div><div class="lgd" data-dtally></div>
            ${ROOMS.map(r => `<div class="room"><div class="rl"><b>Kamar ${r}</b><span data-v="dnp${r}"></span></div><div class="strip">${ROSTER.filter(x => x.room === r).map(x => tileHTML(x, ' mini')).join('')}</div></div>`).join('')}</section></div>
        <div class="demoframe" aria-hidden="true"></div><div class="demotab">DEMO · DATA FIKTIF</div>`;
      demoTiles.clear();
      $$('.prod .cb', demoEl).forEach(x => demoTiles.set(x.dataset.bed, x));
    }
    const ap = Math.floor(m.apneaSec || 0), rr = rrNow(b), apneic = sc.rules === 'apnea' && ap >= 3;
    patchVals(demoEl, {
      terp: `${cnt}/${dw.beds.length}`, terp2: `${cnt}/${dw.beds.length}`, clock: hm(new Date()),
      hb: s === 'tk' ? '—' : !m.present ? 'kosong' : apneic ? `${ap} dtk` : `${rr ?? '—'} /mnt`, hl: s === 'tk' ? 'tidak ada sinyal' : !m.present ? 'tidak ada pasien' : apneic ? 'tanpa napas efektif' : 'laju napas',
      hrr: rr == null ? '— /mnt' : `${rr} /mnt`, hsqi: typeof m.sqi === 'number' ? dec(m.sqi, 2) : '—', hpr: m.present ? 'ada' : 'tidak'
    });
    setHTML($('[data-dsound]', demoEl), `${ICON.sound(S.sound)}<b>${S.sound ? 'Suara aktif' : 'Suara mati'}</b>`);
    const rules = demoRules(sc, b);
    setHTML($('[data-rules]', demoEl), rules.join(''));
    $('[data-nrule]', demoEl).className = `node glass2 ${rules.some(r => r.includes('rul hit')) ? 'hit' : 'on'}`;
    setHTML($('[data-outs]', demoEl), demoOuts(s));
    /* cerita: skenario, langkah, narasi, kendali */
    const cur = sc.steps[Math.max(0, D.step)];
    keyed($('[data-story]', demoEl), `${D.idx}:${D.step}:${D.paused}:${D.all}`, `<div style="display:flex;align-items:center;gap:10px"><span class="k">Skenario</span><span class="sp"></span>
        <span class="seg"><button type="button" aria-pressed="true">Simulasi</button><button type="button" aria-pressed="false" disabled title="Butuh mode live dengan hub palsu">Hub palsu</button></span></div>
      <div class="sclist">${DEMO_SCEN.map((x, i) => `<button type="button" data-act="demo-scen" data-i="${i}" aria-pressed="${i === D.idx}">${i + 1} · ${x.name}</button>`).join('')}
        <button type="button" class="all" data-act="demo-all">▶ Jalankan semua · ± ${Math.round(DEMO_SCEN.reduce((a, x) => a + x.est + 5, 0) / 60)} mnt</button></div>
      <div class="steps">${sc.steps.map((x, i) => { const st = i < D.step ? 'done' : i === D.step ? 'cur' : 'next';
        return `<div class="stp ${st}"><span class="m">${st === 'done' ? IC_NODE.ok : i + 1}</span><span class="tt"><b>${x.title}</b><small>${x.desc}</small></span><span class="tm">${D.stepT[i] != null ? mmdot(D.stepT[i]) : ''}</span></div>`; }).join('')}</div>
      <div class="narr"><div class="k2">Langkah ${Math.max(1, D.step + 1)} dari ${sc.steps.length}${D.all ? ` · skenario ${D.idx + 1} dari ${DEMO_SCEN.length}` : ''}</div><h3>${cur.title}</h3><p>${cur.narr}</p></div>
      <div class="ctrl"><button type="button" class="btn ink" data-act="demo-pause">${D.paused ? '▶ Lanjut' : `${IC_NODE.pause}Jeda`}</button><button type="button" class="btn ghost" data-act="demo-restart">Ulangi</button>
        <button type="button" class="btn ghost" data-act="demo-exit">Akhiri demo</button><span class="el"><b data-v="el"></b> / ${mmdot(sc.est)}</span></div>`, { el: mmdot(el) });
    /* layar perawat: item teratas ward demo */
    const order = ['cb', 'pra', 'kr', 'ws', 'tk'];
    const top = dw.beds.filter(x => order.includes(stat(x))).sort((x, y) => order.indexOf(stat(x)) - order.indexOf(stat(y)))[0];
    const dq = $('[data-dq]', demoEl);
    if (!top) keyed(dq, 'calm', `<div class="calmline glass">${ICON.ok(10)}<span><b>Tidak ada yang perlu tindakan</b> · ${cnt} bed terpantau, 1 bed kosong</span></div>`);
    else {
      const ts = stat(top), chk = D.checked.has(top.id), pt = `<b>${esc(top.name)}</b> · ${top.age}<br>${esc(top.dxs)}`;
      const row = (cls, lv, why, acts) => `<div class="ri ${cls}" data-bed="${top.id}"><span class="lv"><span class="ordb">1</span>${lv}</span><span class="bid">${top.id}</span><span class="pt">${pt}</span><span class="why">${why}</span><span class="acts">${acts}</span></div>`;
      const html = ts === 'pra' ? row('prar glass2', `${ICON.oct(18)}Pra-alarm`, `<span><b data-v="dap"></b> tanpa napas<small data-v="dcd"></small></span>`, `<button type="button" class="btn call" data-dact="confirm">${ICON.phone(16)}Panggil Code Blue</button><button type="button" class="btn hold" data-dact="cancel">Batalkan</button>`)
        : ts === 'cb' ? row('cbr', `${ICON.siren('#fff', 18)}Code Blue`, '<b data-v="dcbd"></b><small>ponsel Tim Code Blue berbunyi</small>', '<button type="button" class="btn onred" data-dact="close">Tim sudah tiba</button>')
        : ts === 'kr' ? row('kr', `${ICON.tri('#fff', 20)}Kritis`, '<b data-v="drr"></b><small>RR ≥ 30 bertahan</small>', chk ? '<span class="sendnote">✓ Dicek</span>' : '<button type="button" class="btn onred" data-dact="check">Sudah dicek</button>')
        : ts === 'ws' ? row('ws glass2', `${ICON.circ(18)}Waspada`, '<b data-v="drr"></b><small>RR > 20 bertahan</small>', chk ? '<span class="sendnote">✓ Dicek</span>' : '<button type="button" class="btn ink" data-dact="check">Sudah dicek</button>')
        : row('tk glass2', `${ICON.tk(18)}Tidak terpantau`, `${esc(tkCause(top).long)}<small>${esc(tkCause(top).step)}</small>`, '');
      keyed(dq, `${top.id}:${ts}:${chk ? 1 : 0}`, html, { dap: `${Math.floor(top.mon.apneaSec)} dtk`, dcd: `CB ${praLeft(top, t)} dtk`, dcbd: `${durS(t - top.mon.cbT)} berjalan`, drr: `RR ${rrNow(top) ?? '—'} /mnt` });
    }
    setHTML($('[data-dtally]', demoEl), tallyHTML(dw));
    const qi = new Map(top ? [[top.id, 1]] : []), vals = {};
    for (const x of dw.beds) paintTile(demoTiles.get(x.id), x, t, qi, false, true, D);
    for (const r of ROOMS) vals['dnp' + r] = `${dw.beds.filter(x => x.room === r && (x.name || x.sim.present)).length} pasien`;
    patchVals(demoEl, vals);
    /* alarm nyata (mode live) tetap terlihat selama demo */
    const real = LIVE ? ward.beds.filter(x => ['cb', 'pra'].includes(stat(x))) : [];
    keyed($('[data-dstrip]', demoEl), real.map(x => x.id + stat(x)).join(','), real.length
      ? `<div class="gstrip${stat(real[0]) === 'cb' ? ' cbs' : ''}" role="alert">${stat(real[0]) === 'cb' ? ICON.siren('#fff', 22) : ICON.oct(22)}<span><b>Alarm nyata · ${real[0].id} · ${esc(patient(real[0]))}</b> ${ST[stat(real[0])].word}</span><span class="sp"></span><button type="button" class="btn ${stat(real[0]) === 'cb' ? 'onred' : 'ink'}" data-act="demo-exit">Akhiri demo, ke antrean</button></div>` : '');
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
    const tabBtn = e.target.closest('button.tab[data-tab]');
    if (tabBtn) { S.phTab = tabBtn.dataset.tab; render(); window.scrollTo(0, 0); return; }
    const roleBtn = e.target.closest('button[data-role]');
    if (roleBtn) { S.role = roleBtn.dataset.role; S.addingNurse = false; renderStart(); return; }
    const phTile = e.target.closest('#phone .cb[data-bed]');
    if (phTile) { S.phSel = S.phSel === phTile.dataset.bed ? null : phTile.dataset.bed; render(); return; }
    const dact = e.target.closest('[data-dact]');
    if (dact && S.demo) {
      const D = S.demo, db = D.ward.byId(dact.closest('[data-bed]').dataset.bed), a = dact.dataset.dact;
      if (a === 'confirm') D.ward.confirm(db); else if (a === 'cancel') D.ward.cancel(db); else if (a === 'close') D.ward.close(db); else if (a === 'check') D.checked.set(db.id, { t: D.ward.t });
      render(); return;
    }
    const tile = e.target.closest('#rooms .cb[data-bed]');
    if (tile) { S.selected = S.selected === tile.dataset.bed ? null : tile.dataset.bed; if (S.sheet) { S.sheet = null; renderSheet(); } if (S.view !== 'bangsal') setView('bangsal'); render(); return; }
    const nav = e.target.closest('.nav button[data-view]');
    if (nav && !nav.disabled) { setView(nav.dataset.view === S.view && S.view === 'tim' ? 'bangsal' : nav.dataset.view); render(); return; }
    if (e.target.closest('#p-sound')) { if (S.sound) S.sound = false; else { soundOn(); play('ws'); } render(); return; }
    const chip = e.target.closest('[data-chip]');
    if (chip && S.sheet) { const c = chip.dataset.chip; if (S.sheet.chips.has(c)) S.sheet.chips.delete(c); else S.sheet.chips.add(c); chip.setAttribute('aria-pressed', String(S.sheet.chips.has(c))); return; }
    const sh = e.target.closest('[data-shift]');
    if (sh) { S.shift = sh.dataset.shift; $$('[data-shift]', startEl).forEach(x => x.setAttribute('aria-pressed', String(x === sh))); renderStartSide(); return; }
    const nu = e.target.closest('[data-nurse]');
    if (nu) {
      if (S.role === 'tim') S.teamName = nu.dataset.nurse; else S.nurse = nu.dataset.nurse;
      $$('[data-nurse]', startEl).forEach(x => x.setAttribute('aria-pressed', String(x === nu)));
      $('[data-act="mulai"]', startEl).textContent = `${S.role === 'tim' ? 'Mulai siaga' : 'Mulai jaga'} sebagai ${me()}`;
      return;
    }
    const snd = e.target.closest('[data-snd]');
    if (snd) { soundOn(); S.sound = S.view !== 'mulai' ? S.sound : false; play(snd.dataset.snd, true); return; }
    const scen = e.target.closest('[data-scen]');
    if (scen && !LIVE) { const b = ward.byId($('#tim-bed').value); S.timBed = b.id; if (scen.dataset.scen === 'manual') send(b, 'manual'); else ward.scenario(b, scen.dataset.scen); toast('ok', `${b.id} · ${scen.textContent}`, 'Skenario simulasi dijalankan.'); render(); return; }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const b = bedOf(act);
    switch (act.dataset.act) {
      case 'confirm': if (b) send(b, 'confirm'); break;
      case 'close': if (b) send(b, 'close'); break;
      case 'check': if (b) check(b); break;
      case 'detail': if (b) { S.sheet = null; renderSheet(); setView('detail', b.id); } break;
      case 'select': if (b) { S.selected = b.id; setView('bangsal'); S.sheet = null; renderSheet(); } break;
      case 'unselect': S.selected = null; break;
      case 'retry': if (b) { const f = S.failed.get(b.id); if (f) send(b, f.kind); } break;
      case 'write': openSheet({ fuId: act.closest('[data-fu]').dataset.fu }); break;
      case 'note': if (b) openSheet({ bedId: b.id }); break;
      case 'sheet-close': closeSheet(); return;
      case 'sheet-save': saveSheet(); return;
      case 'to-bangsal': setView('bangsal'); break;
      case 'to-summary': S.summaryMode = 'masuk'; setView('ringkasan'); return;
      case 'mulai': startShift(); return;
      case 'nurse-add': S.addingNurse = true; renderStart(); return;
      case 'handover-save': {
        const text = ($('#ta-handover') || {}).value || '';
        if (!text.trim()) { toast('bad', 'Catatan serah terima masih kosong', 'Tulis hal yang perlu diketahui shift berikutnya.'); return; }
        store.set(HANDOVER_KEY, { text: text.trim(), by: S.nurse, wall: Date.now(), shift: S.shift });
        addLog({ t: ward.t, type: 'serah_terima', bed: null, data: { by: S.nurse } });
        toast('ok', 'Catatan serah terima tersimpan', `Tampil di Ringkasan shift saat shift ${SHIFTS[shiftNext(S.shift)].name.toLowerCase()} mulai.`);
        setView('bangsal'); break;
      }
      case 'tim-handover': S.summaryMode = 'keluar'; setView('ringkasan'); return;
      case 'tim-restart': S.addingNurse = false; setView('mulai'); return;
      case 'tim-manual': { const tb = ward.byId($('#tim-bed').value); if (tb) send(tb, 'manual'); break; }
      case 'ph-sound': if (S.sound) S.sound = false; else { soundOn(); play('ws', true); } break;
      case 'reload': location.reload(); return;
      case 'demo-start': setView('demo'); return;
      case 'demo-scen': startDemo(+act.dataset.i, false); break;
      case 'demo-all': startDemo(0, true); break;
      case 'demo-pause': if (S.demo) S.demo.paused = !S.demo.paused; break;
      case 'demo-restart': if (S.demo) startDemo(S.demo.idx, S.demo.all); break;
      case 'demo-exit': setView(S.role === 'ns' ? 'bangsal' : 'ponsel'); break;
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
      const r = doc.documentElement, rg = $('#tim-ringan');
      const pref = { tema: ($('#tim-tema') || {}).value || undefined, ringan: rg ? (rg.checked || undefined) : (r.dataset.render === 'ringan' || undefined) };
      store.set('siagabed.tampilan', pref);
      if (pref.tema === 'gelap') r.dataset.theme = 'dark'; else if (pref.tema === 'terang') r.dataset.theme = 'light'; else delete r.dataset.theme;
      if (pref.ringan) r.dataset.render = 'ringan'; else delete r.dataset.render;
    }
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
    if (e.key === 'Enter' && e.target.id === 'nurse-new') {
      const n = e.target.value.trim();
      if (n) {
        const name = /^(ns|dr)\.?\s/i.test(n) ? n : `${S.role === 'tim' ? '' : 'Ns. '}${n}`;
        if (!S.extraNurses.includes(name)) S.extraNurses.push(name);
        store.set('siagabed.perawat.lain', S.extraNurses);
        if (S.role === 'tim') S.teamName = name; else S.nurse = name;
      }
      S.addingNurse = false; renderStart(); return;
    }
    if (e.key === 'Escape') {
      if (S.sheet) closeSheet();
      else if (S.view === 'detail') { setView('bangsal'); render(); }
      else if (S.selected) { S.selected = null; render(); }
    }
  });
  doc.addEventListener('keyup', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act="hold"]')) endHold(); });
  /* Antrean tidak bergeser selama disentuh atau difokus. */
  const left = $('.left');
  left.addEventListener('pointerenter', () => { S.frozen = true; });
  left.addEventListener('pointerleave', () => { S.frozen = left.contains(doc.activeElement); });
  left.addEventListener('focusin', () => { S.frozen = true; });
  left.addEventListener('focusout', e => { if (!left.contains(e.relatedTarget)) S.frozen = left.matches(':hover'); });
  DENSE.addEventListener('change', () => { bandKey = ''; render(); });

  /* ------------------------------------------------------------------ jalan */
  function render() {
    const t = ward.t;
    if (S.view === 'mulai') { renderStartSide(); const c = $('[data-v="clock"]', startEl); if (c) c.textContent = hm(new Date()); return; }
    if (S.view === 'ringkasan') { renderSummarySide(); return; }
    if (S.view === 'ponsel') { renderPhone(t); return; }
    if (S.view === 'demo') { renderDemo(); return; }
    renderTop();
    renderGStrip(t);
    if (S.view === 'detail') renderDetail(t);
    else { renderQueue(t); renderWard(t); renderFoot(t); }
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
  setView(S.view);
  render();

  let lastReal = performance.now(), acc = 0;
  setInterval(() => {
    const now = performance.now(), dt = Math.min(5, (now - lastReal) / 1000);
    acc += dt; lastReal = now;
    let n = 0;
    while (acc >= E.DT && n < 150) { ward.step(); acc -= E.DT; n++; }
    if (n >= 150) acc = 0;
    const D = S.demo;
    if (D && !D.paused) {
      D.acc += dt;
      let k = 0;
      while (D.acc >= E.DT && k < 150) { D.ward.step(); D.acc -= E.DT; k++; }
      if (k >= 150) D.acc = 0;
      demoTick();
    }
    soundTick();
  }, 40);
  setInterval(render, 250);
  window.SiagaApp = { ward, state: S, render, stat, setView, tAtWall, demoTick, startDemo };   /* untuk uji dan konsol pengembang */
})();
