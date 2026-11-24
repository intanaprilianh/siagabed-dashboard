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
    sound: false, view: Q.has('langsung') ? 'bangsal' : 'mulai', summaryMode: 'masuk', selected: null, detailBed: null,
    checked: new Map(),       /* bed -> { t, by, stage } : "Sudah dicek" untuk Kritis/Waspada */
    since: new Map(),         /* 'stage:bed' | 'tk:bed' | 'away:bed' -> t */
    fu: [],                   /* item "perlu tindak lanjut" */
    sending: new Map(),       /* bed -> { kind } : perintah sedang dikirim ke hub */
    failed: new Map(),        /* bed -> { kind, pesan } */
    actor: new Map(),         /* bed -> nama perawat yang terakhir mengirim aksi dari dasbor */
    notes: store.get(NOTES_KEY, []),
    log: [], sheet: null, hold: null, order: [], frozen: false, seq: 0, alarmsSeen: new Set(), addingNurse: false
  };

  const ward = LIVE ? new window.SiagaLive.LiveWard(ROSTER, Object.assign({ pre: PRE, user: S.nurse }, LIVE))
                    : new E.Ward(ROSTER, 20261018);
  if (LIVE) ward.notice = () => {};                  /* hasil perintah ditangani per item di send() */
  let bootWall = LIVE ? ward.base : Date.now();
  let booting = true;
  const wallAt = t => new Date(bootWall + (t - PRE) * 1000);
  const tAtWall = ms => PRE + (ms - bootWall) / 1000;

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
  function play(kind, force) {
    if (!kind || !actx || !SOUND[kind] || (!S.sound && !force)) return;
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
    addLog({ t: n.t, type: 'tindak_lanjut', bed: ward.byId(n.bedId), data: { text: n.text, chips: n.chips, by: S.nurse } });
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
  const queueIndex = () => { const q = new Map(); S.order.forEach((id, i) => { const bed = id.includes(':') ? id.split(':')[1] : null; if (bed && !q.has(bed)) q.set(bed, i + 1); }); return q; };
  /* Isi satu tile (dipakai denah dan panel samping ringkasan shift). */
  function paintTile(el, b, t, qIndex, selected, mini) {
    const s = stat(b);
    const cls = `cb glass2 s-${s === 'held' ? 'away' : s}${mini ? ' mini' : ''}${selected ? ' sel' : ''}`;
    if (el.className !== cls) el.className = cls;
    if (el.dataset.s !== s) { el.dataset.s = s; $('.gl', el).innerHTML = ST[s].icon(); }
    const st = $('.st', el), sub = $('.sub', el), ob = $('.ob', el), word = ST[s].word;
    if (st.textContent !== word) st.textContent = word;
    const sv = tileSub(b, s, t);
    if (sub.textContent !== sv) sub.textContent = sv;
    sub.classList.toggle('cd', s === 'pra');
    const q = qIndex.get(b.id);
    ob.hidden = !q; if (q && ob.textContent !== String(q)) ob.textContent = String(q);
    el.setAttribute('aria-pressed', String(!!selected));
    el.setAttribute('aria-label', `${b.id}, ${word}, ${sv}`);
  }
  function tallyHTML() {
    const cnt = {};
    for (const b of ward.beds) { const s = stat(b); cnt[s] = (cnt[s] || 0) + 1; }
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
    const now = new Date(), names = allNurses();
    const nameBtns = names.map(n => `<button type="button" data-nurse="${esc(n)}" aria-pressed="${n === S.nurse}" class="glass2"><span class="av">${esc(n.replace(/^Ns\.\s*/, '').charAt(0))}</span>${esc(n)}</button>`).join('')
      + (S.addingNurse ? `<input id="nurse-new" type="text" placeholder="Ns. Nama" aria-label="Nama perawat lain" maxlength="40">`
        : '<button type="button" class="more glass2" data-act="nurse-add">+ Nama lain</button>');
    startEl.innerHTML = `<div class="s1">
      <div class="card glass">
        <div style="display:flex;align-items:center;gap:14px"><span class="mk glass2">${ICON.coil()}</span>
          <div><div class="k">SiagaBed · ${tanggal(now)} · <span data-v="clock">${hm(now)}</span></div><h1>Mulai jaga</h1></div></div>
        <div class="fl"><div class="k">Bangsal</div><div class="selbox glass2">Bangsal Melati · Lantai 3<span class="muted" style="font-weight:500;font-size:15px">${LIVE ? `${esc(LIVE.ward)} · live` : 'simulasi'}</span></div></div>
        <div class="fl"><div class="k" id="k-shift">Shift</div><div class="seg2" role="group" aria-labelledby="k-shift">${SHIFT_ORDER.map(k => `<button type="button" data-shift="${k}" aria-pressed="${k === S.shift}">${SHIFTS[k].name}<small>${shiftHours(k)}</small></button>`).join('')}</div></div>
        <div class="fl"><div class="k" id="k-nurse">Perawat jaga</div><div class="names" role="group" aria-labelledby="k-nurse">${nameBtns}</div></div>
        <div class="fl"><div class="k">Cek suara</div><div class="snd">${[['ws', 'Waspada'], ['kr', 'Kritis'], ['pra', 'Pra-alarm'], ['cb', 'Code Blue']].map(([k, l]) => `<button type="button" class="btn ghost" data-snd="${k}">▶ ${l}</button>`).join('')}</div>
          <div class="note">Tombol Mulai jaga sekaligus menyalakan suara di layar ini. Pastikan speaker nurse station tidak dibisukan.</div></div>
        <button type="button" class="btn ink go" data-act="mulai">Mulai jaga sebagai ${esc(S.nurse)}</button>
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
    store.set('siagabed.perawat', S.nurse);
    ward.user = S.nurse;
    S.sessionStart = Date.now();
    const rec = { nurse: S.nurse, shift: S.shift, wall: S.sessionStart };
    S.prevSession = store.get(`siagabed.sesi.${WARD_KEY}`, null);
    store.set(`siagabed.sesi.${WARD_KEY}`, rec);
    addLog({ t: ward.t, type: 'mulai_jaga', bed: null, data: { by: S.nurse, shift: S.shift } });
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
    if (S.view !== 'detail') { waveLoop = false; return; }
    requestAnimationFrame(drawWave);
    const cv = $('#wave', detailEl), b = ward.byId(S.detailBed);
    if (!cv || !b) return;
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
      <div><div class="k" style="margin-bottom:8px">Shift</div><div class="row"><button type="button" class="btn ghost" data-act="tim-handover">Serah terima · tulis catatan untuk shift berikutnya</button><button type="button" class="btn ghost" data-act="tim-restart">Ganti perawat jaga</button></div></div>`;
  }
  function setView(v, bedId) {
    if (bedId) S.detailBed = bedId;
    S.view = v;
    const start = v === 'mulai' || v === 'ringkasan';
    $('#app').hidden = start;
    startEl.hidden = !start;
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
    if (v === 'detail') { render(); startWave(); }
    window.scrollTo(0, 0);
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
    if (nu) { S.nurse = nu.dataset.nurse; $$('[data-nurse]', startEl).forEach(x => x.setAttribute('aria-pressed', String(x === nu))); $('[data-act="mulai"]', startEl).textContent = `Mulai jaga sebagai ${S.nurse}`; return; }
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
      if (n) { const name = /^ns\.?\s/i.test(n) ? n : `Ns. ${n}`; if (!S.extraNurses.includes(name)) S.extraNurses.push(name); store.set('siagabed.perawat.lain', S.extraNurses); S.nurse = name; }
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
    const now = performance.now();
    acc += Math.min(5, (now - lastReal) / 1000); lastReal = now;
    let n = 0;
    while (acc >= E.DT && n < 150) { ward.step(); acc -= E.DT; n++; }
    if (n >= 150) acc = 0;
    soundTick();
  }, 40);
  setInterval(render, 250);
  window.SiagaApp = { ward, state: S, render, stat, setView, tAtWall };   /* untuk uji dan konsol pengembang */
})();
