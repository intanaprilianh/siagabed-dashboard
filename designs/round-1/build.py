"""Isi placeholder gelombang napas di template ronde 1 lalu tulis HTML final.

Placeholder: {{wave:RR:APNEA:W:H:AMP:SEED}}
  RR     napas per menit
  APNEA  detik terakhir tanpa napas efektif (0 = tidak ada)
  W, H   ukuran viewBox
  AMP    amplitudo 0..1
  SEED   angka bebas agar tiap bed beda
Jendela waktu = 30 dtk, terbaru di kanan.
"""
import math, random, re, sys, pathlib

HERE = pathlib.Path(__file__).parent

def wave(rr, apnea, w, h, amp, seed):
    rnd = random.Random(seed)
    window = 30.0
    n = int(w // 2)
    mid = h / 2
    pts = []
    # variasi amplitudo per napas
    per = 60.0 / rr if rr > 0 else 999
    amps = [amp * (0.85 + 0.3 * rnd.random()) for _ in range(200)]
    phase0 = rnd.random() * per
    for i in range(n + 1):
        t = window * i / n
        x = w * i / n
        if apnea and t > window - apnea:
            v = (rnd.random() - 0.5) * 0.06
        else:
            k = (t + phase0) / per
            idx = int(k)
            f = k - idx
            # inspirasi lebih cepat dari ekspirasi
            if f < 0.4:
                s = math.sin(math.pi * f / 0.4 / 2)
            else:
                s = math.cos(math.pi * (f - 0.4) / 0.6 / 2)
            v = (s * 2 - 1) * amps[idx % 200] + (rnd.random() - 0.5) * 0.04
        y = mid - v * (h / 2 - 2)
        pts.append(f"{x:.1f},{y:.1f}")
    return "M" + " L".join(pts)

def render(src):
    def rep(m):
        rr, ap, w, h, amp, seed = m.group(1).split(":")
        return wave(float(rr), float(ap), float(w), float(h), float(amp), int(seed))
    return re.sub(r"\{\{wave:([^}]+)\}\}", rep, src)

for tpl in sorted(HERE.glob("*.tpl.html")):
    out = HERE / tpl.name.replace(".tpl.html", ".html")
    out.write_text(render(tpl.read_text(encoding="utf-8")), encoding="utf-8")
    print("wrote", out.name)
