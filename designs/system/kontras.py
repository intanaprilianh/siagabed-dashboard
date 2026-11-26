"""Cek kontras WCAG token SiagaBed (terang dan gelap).

Teks dicek di atas kaca (surface-glass) dan tint status, dengan latar kanvas dari enam area:
polos, atas, puncak glow biru, puncak glow toska, puncak glow peach/merah, dan tumpang tindih
glow biru dengan glow peach/merah.
Lapisan ber-alpha dikomposit biasa; blur dan saturasi latar diabaikan.

    python designs/system/kontras.py
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
CSS = (pathlib.Path(__file__).parent / "tokens.css").read_text(encoding="utf-8")


def block(selector):
    m = re.search(re.escape(selector) + r"\s*\{(.*?)\n\}", CSS, re.S)
    return dict(re.findall(r"--color-([\w-]+):\s*([^;]+);", m.group(1)))


LIGHT = block(":root")
DARK = {**LIGHT, **block(':root[data-theme="dark"]')}


def rgba(v):
    v = v.strip()
    if v.startswith("#"):
        return tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)), 1.0
    n = [float(x) for x in re.findall(r"[\d.]+", v)]
    return tuple(n[:3]), (n[3] if len(n) > 3 else 1.0)


def over(top, bg):
    (c, a) = top
    return tuple(c[i] * a + bg[i] * (1 - a) for i in range(3))


def lum(c):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(v) for v in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def areas(t):
    base, top = rgba(t["canvas-base"])[0], rgba(t["canvas-top"])[0]
    ga, gb, gc = rgba(t["canvas-glow-a"]), rgba(t["canvas-glow-b"]), rgba(t["canvas-glow-c"])
    return {"polos": base, "atas": top, "glow biru": over(ga, top), "glow toska": over(gb, top),
            "glow peach/merah": over(gc, base), "dua glow": over(gc, over(ga, top))}


PAIRS = [  # (nama, token teks, token tint atau None, di atas kaca?)
    ("text-primary", "text-primary", None, True),
    ("text-secondary", "text-secondary", None, True),
    ("text-tertiary", "text-tertiary", None, True),
    ("text-tertiary langsung di kanvas", "text-tertiary", None, False),
    ("teks merah di tint Pra-alarm", "alarm-high-text", "alarm-high-soft", True),
    ("teks Waspada di tint", "alarm-medium-text", "alarm-medium-soft", True),
    ("teks Tidak terpantau di tint", "status-unmonitored", "status-unmonitored-soft", True),
    ("teks Normal di kaca", "status-normal", None, True),
    ("teks DEMO di tint", "demo-text", "demo-soft", True),
]
SOLID = [  # (nama, token teks, token isi)
    ("putih di isi Kritis", "alarm-on-alarm", "alarm-high"),
    ("putih di isi Code Blue", "alarm-on-alarm", "alarm-codeblue"),
    ("teks tombol ink", "action-on-ink", "action-ink"),
    ("putih di label DEMO", "alarm-on-alarm", "demo-base"),
]

gagal = 0
for mode, t in (("terang", LIGHT), ("gelap", DARK)):
    ar = areas(t)
    print(f"\n{mode}  (AA teks normal = 4,5)")
    print(f"  {'':34}" + "".join(f"{n:>18}" for n in ar))
    for name, fg, tint, glass in PAIRS:
        vals = []
        for bg in ar.values():
            b = over(rgba(t["surface-glass"]), bg) if glass else bg
            if tint:
                b = over(rgba(t[tint]), b)
            vals.append(ratio(rgba(t[fg])[0], b))
        flag = "" if min(vals) >= 4.5 else "  ← gagal"
        gagal += bool(flag)
        print(f"  {name:34}" + "".join(f"{v:>18.2f}" for v in vals) + flag)
    for name, fg, fill in SOLID:
        v = ratio(rgba(t[fg])[0], rgba(t[fill])[0])
        flag = "" if v >= 4.5 else "  ← gagal"
        gagal += bool(flag)
        print(f"  {name:34}{v:>18.2f}{flag}")
print(f"\n{gagal} pasangan di bawah AA")
