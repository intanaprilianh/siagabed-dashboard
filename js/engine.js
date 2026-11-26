/* SiagaBed engine (dipindah apa adanya dari Prototype Alpha index.html).
 * Model sinyal pad MI, pengolahan sinyal, dan mesin aturan alarm. Tanpa DOM.
 * Dipakai mode simulasi (Ward) dan oleh live.js (konstanta FS, DT, CFG). */
/* SiagaBed engine: model sinyal pad MI + pengolahan sinyal + mesin aturan. Tanpa DOM. */
(function (root) {
  'use strict';
  const FS = 25, DT = 1 / FS;
  const CFG = {
    apnea: 20, verify: 15, effGap: 10,
    holdWarn: 120, holdCrit: 60, holdNorm: 30, holdDemo: 10,
    sqiHold: 0.5, sqiRelease: 0.6,
    rrWarnLow: 10, rrWarnHigh: 20, rrCritLow: 8, rrCritHigh: 30,
    lpFc: 1.0, hpFc: 0.05, quant: 5
  };

  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    let u = 0;
    while (u === 0) u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function median(arr) {
    if (!arr.length) return NaN;
    const s = arr.slice().sort((a, b) => a - b), m = s.length >> 1;
    return s.length % 2 ? s[m] : 0.5 * (s[m - 1] + s[m]);
  }

  /* Biquad RBJ, direct form II transposed */
  class Biquad {
    constructor(type, fc, q) {
      const w0 = 2 * Math.PI * fc / FS, cw = Math.cos(w0), al = Math.sin(w0) / (2 * q), a0 = 1 + al;
      const lp = type === 'lp';
      const b0 = lp ? (1 - cw) / 2 : (1 + cw) / 2, b1 = lp ? 1 - cw : -(1 + cw);
      this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b0 / a0;
      this.a1 = -2 * cw / a0; this.a2 = (1 - al) / a0;
      this.s1 = 0; this.s2 = 0;
    }
    step(x) {
      const y = this.b0 * x + this.s1;
      this.s1 = this.b1 * x - this.a1 * y + this.s2;
      this.s2 = this.b2 * x - this.a2 * y;
      return y;
    }
    reset(u) { /* keadaan tunak untuk masukan konstan u */
      const y = u * (this.b0 + this.b1 + this.b2) / (1 + this.a1 + this.a2);
      this.s2 = this.b2 * u - this.a2 * y;
      this.s1 = this.b1 * u - this.a1 * y + this.s2;
      return y;
    }
  }

  class Hampel {
    constructor(k, nsig) { this.k = k; this.n = 2 * k + 1; this.nsig = nsig; this.buf = []; }
    step(x) {
      const b = this.buf;
      b.push(x);
      if (b.length > this.n) b.shift();
      if (b.length < this.n) return x;
      const c = b[this.k], med = median(b);
      const mad = 1.4826 * median(b.map(v => Math.abs(v - med)));
      return Math.abs(c - med) > this.nsig * Math.max(mad, 4) ? med : c;
    }
    reset() { this.buf = []; }
  }

  const INSP = 0.4;
  function shape(p) {
    return p < INSP ? 0.5 - 0.5 * Math.cos(Math.PI * p / INSP)
                    : 0.5 + 0.5 * Math.cos(Math.PI * (p - INSP) / (1 - INSP));
  }
  function gaspShape(dt) {
    if (dt < 0) return 0;
    if (dt < 0.5) return 0.5 - 0.5 * Math.cos(Math.PI * dt / 0.5);
    if (dt < 1.6) return 0.5 + 0.5 * Math.cos(Math.PI * (dt - 0.5) / 1.1);
    return -1;
  }

  /* Model sinyal: frekuensi resonansi pad (Hz) yang dibaca hub */
  class PatientSim {
    constructor(o, rng) {
      this.rng = rng;
      this.fEmpty = o.fEmpty; this.delta = o.delta; this.amp = o.amp; this.noise = o.noise || 5;
      this.present = o.present !== false; this.connected = true; this.spont = o.spontaneous !== false;
      this.rr = o.rr; this.rrTarget = o.rr; this.rrRate = 0.2;
      this.mode = 'normal'; this.held = false; this.pauseUntil = 0; this.pausePending = 0;
      this.phase = rng(); this.cycRR = o.rr; this.cycAmp = 1;
      this.gaspNext = 0; this.gaspT0 = -1; this.gaspAmp = 1;
      this.motionT0 = 0; this.motionUntil = 0; this.motionAmp = 0; this.m1 = 0; this.m2 = 0; this.motionEnd = false;
      this.posOffset = 0; this.drift = 0; this.driftRate = 0; this.leaveAt = 0;
      this.nextSpike = 5 + rng() * 40;
      this.nextMotion = 150 + rng() * 360;
      this.nextPause = 100 + rng() * 260;
      this.lastPeakT = -1; this.lastGaspPeakT = -1; this.prevPhase = this.phase;
    }
    ampFor(rr) { return clamp(Math.sqrt(14 / Math.max(rr, 1)), 0.6, 1.45); }
    newCycle(k) {
      this.cycRR = this.rr * (1 + 0.035 * gauss(this.rng));
      this.cycAmp = k * (1 + 0.07 * gauss(this.rng));
    }
    startMotion(t, dur, amp) { this.motionT0 = t; this.motionUntil = t + dur; this.motionAmp = amp; this.motionEnd = true; }
    step(t) {
      const r = this.rng;
      if (this.rr !== this.rrTarget) {
        const d = this.rrTarget - this.rr, s = this.rrRate * DT;
        this.rr = Math.abs(d) <= s ? this.rrTarget : this.rr + Math.sign(d) * s;
      }
      if (this.spont && this.present && this.connected) {
        if (t >= this.nextMotion) { this.startMotion(t, 3 + r() * 5, 350 + r() * 300); this.nextMotion = t + 200 + r() * 420; }
        if (t >= this.nextPause) { if (this.mode === 'normal' && !this.held) this.pausePending = 6 + r() * 5; this.nextPause = t + 130 + r() * 300; }
      }
      if (this.leaveAt && t >= this.leaveAt) { this.present = false; this.leaveAt = 0; }

      let br = 0;
      if (this.present) {
        if (this.held) {
          if (this.mode === 'normal' && t >= this.pauseUntil) { this.held = false; this.phase = 0; this.newCycle(1.15); }
        } else {
          this.prevPhase = this.phase;
          this.phase += DT * this.cycRR / 60;
          if (this.prevPhase < INSP && this.phase >= INSP) this.lastPeakT = t;
          if (this.phase >= 1) {
            this.phase -= 1;
            if (this.mode !== 'normal') {
              this.held = true; this.phase = 0;
              if (this.mode === 'gasp') this.gaspNext = t + 10.5 + r() * 6;
            } else if (this.pausePending) {
              this.held = true; this.phase = 0; this.pauseUntil = t + this.pausePending; this.pausePending = 0;
            } else this.newCycle(1);
          }
        }
        if (!this.held) br = this.cycAmp * this.ampFor(this.rr) * shape(this.phase);
        if (this.mode === 'gasp' && this.held && t >= this.gaspNext) {
          this.gaspT0 = t; this.gaspAmp = 0.9 + r() * 0.4; this.gaspNext = t + 10.5 + r() * 7.5;
          this.lastGaspPeakT = t + 0.5;
        }
        if (this.gaspT0 >= 0) {
          const g = gaspShape(t - this.gaspT0);
          if (g < 0) this.gaspT0 = -1; else br += this.gaspAmp * g;
        }
      }

      let m = 0;
      if (t < this.motionUntil) {
        const env = Math.min(1, (t - this.motionT0) / 0.4, (this.motionUntil - t) / 0.4);
        this.m1 = 0.82 * this.m1 + 0.18 * gauss(r);
        this.m2 = 0.93 * this.m2 + 0.21 * gauss(r);
        m = env * this.motionAmp * (1.6 * this.m1 + this.m2);
      } else if (this.motionEnd) {
        this.motionEnd = false; this.m1 = 0; this.m2 = 0;
        if (this.present) this.posOffset = clamp(this.posOffset + gauss(r) * 0.035 * this.delta, -0.12 * this.delta, 0.12 * this.delta);
      }
      /* drift termal osilator: halus, laju berubah pelan (puluhan–ratusan Hz per menit) */
      this.driftRate += (-this.driftRate / 60) * DT + 0.25 * Math.sqrt(DT) * gauss(r);
      this.drift += (this.driftRate - this.drift / 900) * DT;

      let f = this.fEmpty + this.drift + m + this.noise * gauss(r);
      if (this.present) f -= this.delta + this.posOffset + this.amp * br;
      if (t >= this.nextSpike) { f += (r() < 0.5 ? -1 : 1) * (150 + r() * 250); this.nextSpike = t + 15 + r() * 45; }
      f = Math.round(f / CFG.quant) * CFG.quant;
      return this.connected ? f : 0;
    }
  }

  /* Hub: pengolahan sinyal + mesin aturan untuk satu bed */
  class BedMonitor {
    constructor(cal, o) {
      o = o || {};
      this.calEmpty = cal.empty; this.calOcc = cal.occ; this.delta = cal.empty - cal.occ;
      this.hampel = new Hampel(3, 3);
      this.lp1 = new Biquad('lp', CFG.lpFc, 0.5411961);
      this.lp2 = new Biquad('lp', CFG.lpFc, 1.3065630);
      this.hp = new Biquad('hp', CFG.hpFc, Math.SQRT1_2);
      this.present = o.present !== false;
      this.dc = this.present ? this.delta : 0;
      this.needInit = true; this.fault = false; this.faultCnt = 0; this.okCnt = 0;
      this.prevY = null; this.dRing = new Float64Array(FS); this.dIdx = 0; this.dSum = 0;
      this.quietRef = o.noiseRef || 7.5; this.sqi = 1; this.motionIdx = 1;
      this.held = false; this.heldSince = 0; this.heldOk = 0; this.heldLong = false;
      this.absCnt = 0; this.preCnt = 0;
      this.resetDetector(0, 0);
      this.refAmp = 0; this.ampHist = []; this.breaths = []; this.intervals = [];
      this.lastDet = null; this.effStreak = 0; this.h = 6; this.pending = null; this.resetT = 0;
      this.lastEffT = 0; this.apneaSec = 0;
      this.rr = null; this.rrStage = 'stabil';
      this.critT = 0; this.warnT = 0; this.ncwT = 0; this.normT = 0; this.secAcc = 0; this.trendAcc = 0;
      this.alarm = 'none'; this.praT = 0; this.cbT = 0; this.cbSource = ''; this.praSince = 0;
      this.demo = true; this.events = [];
      this.N = FS * 30; this.head = 0;
      this.bufX = new Float32Array(this.N).fill(NaN);
      this.bufB = new Float32Array(this.N).fill(NaN);
      this.bufH = new Uint8Array(this.N);
      this.lastT = 0; this.lastF = 0; this.lastX = NaN;
      this.trend = [];
    }
    emit(t, type, data) { this.events.push({ t, type, data: data || {} }); }
    resetDetector(v, t) { this.dmode = 'max'; this.ext = v; this.extT = t; this.trV = v; this.trT = t; }
    resetChain(y, t) {
      this.lp1.reset(y); this.lp2.reset(y); this.hp.reset(y);
      this.resetDetector(0, t);
      this.intervals = []; this.lastDet = null; this.effStreak = 0; this.pending = null; this.resetT = t;
    }
    push(x, b, held, t) {
      this.bufX[this.head] = x; this.bufB[this.head] = b; this.bufH[this.head] = held;
      this.head = (this.head + 1) % this.N; this.lastT = t;
    }
    status() {
      if (this.alarm === 'cb') return 'codeblue';
      if (this.alarm === 'pra') return 'pra';
      if (this.fault || this.heldLong) return 'teknis';
      if (!this.present) return 'kosong';
      if (this.held) return 'ditahan';
      return this.rrStage;
    }
    step(f, t) {
      const valid = f > 1e6;
      if (!valid) {
        this.okCnt = 0;
        if (!this.fault && ++this.faultCnt >= 15) { this.fault = true; this.rr = null; this.emit(t, 'teknis'); }
      } else {
        this.faultCnt = 0;
        if (this.fault && ++this.okCnt >= 25) { this.fault = false; this.needInit = true; this.emit(t, 'teknis_pulih'); }
      }
      if (this.fault || !valid) {
        this.lastF = valid ? f : 0; this.lastX = NaN;
        this.push(NaN, NaN, 1, t);
        this.rules(t, false);
        return;
      }
      const x = this.calEmpty - f;
      const y = this.hampel.step(x);
      if (this.needInit) {
        this.needInit = false; this.hampel.reset(); this.prevY = y;
        this.dc = y; this.resetChain(y, t); this.lastEffT = t;
      }
      /* SQI dari energi beda-pertama (gangguan), bukan dari ada-tidaknya napas */
      const d = this.prevY === null ? 0 : y - this.prevY;
      this.prevY = y;
      const old = this.dRing[this.dIdx];
      this.dRing[this.dIdx] = d * d; this.dSum += d * d - old; this.dIdx = (this.dIdx + 1) % FS;
      if (this.dSum < 0) this.dSum = 0;
      const rmsD = Math.sqrt(this.dSum / FS), idx = rmsD / this.quietRef;
      if (idx < 1.6 && !this.held) this.quietRef += (rmsD - this.quietRef) * (DT / 30);
      const sqiRaw = clamp(1.25 - 0.25 * idx, 0, 1);
      this.sqi = sqiRaw < this.sqi ? sqiRaw : this.sqi + (sqiRaw - this.sqi) * DT;
      this.motionIdx = idx;
      if (!this.held) {
        if (this.sqi < CFG.sqiHold) { this.held = true; this.heldSince = t; this.heldOk = 0; this.heldLong = false; }
      } else {
        if (this.sqi >= CFG.sqiRelease) { this.heldOk += DT; if (this.heldOk >= 2) this.endHold(y, t); }
        else this.heldOk = 0;
        if (this.held && !this.heldLong && t - this.heldSince > 60) { this.heldLong = true; this.emit(t, 'tahan_lama'); }
      }
      /* Kehadiran: level DC terhadap kalibrasi dua titik */
      this.dc += (y - this.dc) * (DT / 2);
      const score = this.dc / this.delta;
      if (!this.held) {
        if (this.present) {
          this.absCnt = score < 0.35 ? this.absCnt + DT : 0;
          if (this.absCnt >= 3) {
            this.present = false; this.absCnt = 0; this.rr = null;
            this.rrStage = 'stabil'; this.critT = this.warnT = this.ncwT = this.normT = 0;
            this.emit(t, 'kosong');
          }
        } else {
          this.preCnt = score > 0.6 ? this.preCnt + DT : 0;
          if (this.preCnt >= 3) {
            this.present = true; this.preCnt = 0; this.resetChain(y, t); this.lastEffT = t;
            this.emit(t, 'kembali');
          }
        }
      }
      const b = this.hp.step(this.lp2.step(this.lp1.step(y)));
      const monitoring = this.present && !this.held;
      if (monitoring) this.detect(b, t);
      this.lastF = f; this.lastX = x;
      this.push(x, b, this.held ? 1 : 0, t);
      this.rules(t, monitoring);
    }
    endHold(y, t) {
      const dur = t - this.heldSince;
      this.held = false; this.heldLong = false;
      this.resetChain(y, t);
      if (this.alarm === 'none') this.lastEffT = t;
      if (dur >= 10) this.emit(t, 'tahan_selesai', { dur });
    }
    detect(b, t) {
      const sigLp = this.quietRef / Math.SQRT2 * 0.29;
      const h = Math.max(0.35 * this.refAmp, 6 * sigLp, 6);
      this.h = h;
      if (this.dmode === 'max') {
        if (b > this.ext) { this.ext = b; this.extT = t; }
        else if (b < this.ext - h) {
          const pv = this.ext, pt = this.extT, rise = pv - this.trV, riseDur = pt - this.trT, fallDur = t - pt;
          this.dmode = 'min'; this.ext = b; this.extT = t;
          if (rise >= h && riseDur >= 0.3 && riseDur <= 20 && fallDur <= 4) this.onBreath(pt, pv, rise, t);
        }
      } else {
        if (b < this.ext) { this.ext = b; this.extT = t; }
        else if (b > this.ext + h) { this.trV = this.ext; this.trT = this.extT; this.dmode = 'max'; this.ext = b; this.extT = t; }
      }
    }
    onBreath(pt, pv, amp, t) {
      const prev = this.lastDet;
      const ampOK = !this.refAmp || amp >= 0.5 * this.refAmp;
      let eff = false;
      if (ampOK) {
        if (prev && prev.ampOK && pt - prev.t <= CFG.effGap) eff = true;       /* napas teratur */
        else if (!prev && pt - this.resetT <= CFG.effGap) eff = true;          /* napas pertama setelah reset */
      }
      /* napas tunggal setelah jeda: tunggu konfirmasi napas berikutnya maks. 12 dtk.
         Batas waktunya tetap dari napas tunggal pertama, jadi gasping berulang tidak menunda alarm. */
      if (eff) this.pending = null;
      else if (ampOK && !this.pending) this.pending = { t: pt, until: pt + CFG.effGap + 2 };
      this.lastDet = { t: pt, amp, ampOK, eff };
      this.breaths.push({ t: pt, v: pv, amp, eff });
      if (this.breaths.length > 60) this.breaths.shift();
      if (eff || !this.refAmp) {
        this.ampHist.push(amp);
        if (this.ampHist.length > 9) this.ampHist.shift();
        this.refAmp = median(this.ampHist);
      }
      if (eff) {
        if (pt > this.lastEffT) this.lastEffT = pt;
        this.effStreak = prev && prev.eff ? this.effStreak + 1 : 1;
      } else this.effStreak = 0;
      if (prev && pt - prev.t <= 15) {
        this.intervals.push(pt - prev.t);
        if (this.intervals.length > 6) this.intervals.shift();
      }
    }
    rules(t, monitoring) {
      if (!monitoring && this.alarm === 'none') this.lastEffT = t;
      this.apneaSec = Math.max(0, t - this.lastEffT);
      if (this.pending && t > this.pending.until) this.pending = null;
      if (this.alarm === 'none' && monitoring && this.apneaSec >= CFG.apnea && !this.pending) {
        this.alarm = 'pra'; this.praT = t; this.praSince = this.lastEffT;
        this.emit(t, 'pra', { since: this.lastEffT });
      }
      if (this.alarm === 'pra') {
        if (monitoring && this.effStreak >= 2 && this.lastEffT > this.praT) {
          this.alarm = 'none'; this.emit(t, 'pra_selesai');
        } else if (t - this.praT >= CFG.verify) {
          this.alarm = 'cb'; this.cbT = t; this.cbSource = 'otomatis';
          this.emit(t, 'codeblue', { source: 'otomatis', since: this.praSince });
        }
      }
      this.secAcc += DT;
      if (this.secAcc >= 1 - 1e-9) { this.secAcc -= 1; this.perSecond(t, monitoring); }
    }
    perSecond(t, monitoring) {
      const last = this.lastDet;
      if (monitoring && this.intervals.length >= 3 && last && t - last.t <= Math.max(12, 2.2 * median(this.intervals))) {
        this.rr = 60 / median(this.intervals.slice(-5));
      } else if (!monitoring || !last || t - last.t > 12) {
        this.rr = null;
      }
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
  }

  class Ward {
    constructor(roster, seed) {
      seed = seed || 1;
      this.t = 0; this.demo = true; this.listeners = [];
      this.beds = roster.map((r, i) => {
        const rng = makeRng(seed * 31 + i * 7919 + 17);
        const fEmpty = 4.18e6 + Math.round(rng() * 50000);
        const delta = 2400 + Math.round(rng() * 800);
        const present = r.present !== false;
        const sim = new PatientSim({ fEmpty, delta, amp: r.amp, rr: r.rr, noise: r.noise, present, spontaneous: r.spontaneous }, rng);
        const cal = { empty: fEmpty + Math.round((rng() - 0.5) * 60), occ: fEmpty - delta + Math.round((rng() - 0.5) * 60) };
        const mon = new BedMonitor(cal, { present, noiseRef: 7.5 });
        return Object.assign({}, r, { baseRR: r.rr, sim, mon, cal });
      });
    }
    byId(id) { return this.beds.find(b => b.id === id); }
    on(fn) { this.listeners.push(fn); }
    emit(bed, ev) { for (const fn of this.listeners) fn(Object.assign({}, ev, { bed })); }
    flush(b) { const q = b.mon.events; while (q.length) this.emit(b, q.shift()); }
    step() {
      this.t += DT;
      for (const b of this.beds) { b.mon.step(b.sim.step(this.t), this.t); if (b.mon.events.length) this.flush(b); }
    }
    setDemo(v) { this.demo = v; for (const b of this.beds) b.mon.demo = v; }
    scenario(b, name, o) {
      o = o || {};
      const s = b.sim, t = this.t;
      const breathe = () => { s.mode = 'normal'; s.pauseUntil = 0; s.pausePending = 0; };
      switch (name) {
        case 'normal': breathe(); s.rrTarget = b.baseRR; s.rrRate = o.rate || 1.5; break;
        case 'perburukan': breathe(); s.rrTarget = 32; s.rrRate = o.rate || 0.2; break;
        case 'lambat': breathe(); s.rrTarget = 7; s.rrRate = o.rate || 0.15; break;
        case 'apnea': s.mode = 'apnea'; break;
        case 'gasp': s.mode = 'gasp'; break;
        case 'gerak': s.startMotion(t, o.dur || 20, 600); break;
        case 'turun': s.startMotion(t, 4, 550); s.leaveAt = t + 3.6; break;
        case 'naik':
          s.present = true; s.leaveAt = 0; breathe(); s.held = false; s.phase = 0;
          s.rr = s.rrTarget = b.baseRR; s.newCycle(1); s.posOffset = gauss(s.rng) * 0.03 * s.delta;
          s.startMotion(t, 3, 500); break;
        case 'cabut': s.connected = false; break;
        case 'pasang': s.connected = true; break;
        case 'manual': b.mon.manualCB(t); break;
      }
      if (name !== 'manual') this.emit(b, { t, type: 'skenario', data: { name } });
      this.flush(b);
    }
    cancel(b) { b.mon.cancelPra(this.t); this.flush(b); }
    confirm(b) { b.mon.confirmCB(this.t); this.flush(b); }
    close(b) {
      b.mon.closeCB(this.t); this.flush(b);
      if (b.sim.present && b.sim.mode !== 'normal') this.scenario(b, 'normal');
    }
  }

  root.SiagaEngine = { FS, DT, CFG, makeRng, gauss, median, clamp, Biquad, Hampel, PatientSim, BedMonitor, Ward };
})(typeof window !== 'undefined' ? window : globalThis);
