"""Ronde 1b: arah B dengan tiga kandidat font x mode gelap/terang.

Sumber: ../round-1/b-denah.html (hasil build ronde 1). Output: b-<font>-<mode>.html
"""
import pathlib

HERE = pathlib.Path(__file__).parent
SRC = (HERE.parent / "round-1" / "b-denah.html").read_text(encoding="utf-8")

FONTS = {
    "plex": ("IBM Plex Sans", "IBM+Plex+Sans:wght@400;500;600;700"),
    "public": ("Public Sans", "Public+Sans:wght@400;500;600;700;800"),
    "geist": ("Geist", "Geist:wght@400;500;600;700;800"),
}

DARK = """--bg:#14120F;--s1:#1C1915;--s2:#25211C;--line:#342E27;--line2:#4A4238;
  --tx:#F2EBDF;--tx2:#C2B8A8;--tx3:#958A7A;
  --hi:#FF5A36;--hiInk:#1C0B05;--hiDeep:#2A140D;--hiLine:#6B2A18;
  --md:#ECB24C;--mdDeep:#2A2110;
  --lo:#93B7DB;--loDeep:#18202A;
  --ok:#9FD3A8;--hatch:#211E19;--ordInk:#1C0B05;"""

LIGHT = """--bg:#F4F0E8;--s1:#FBF9F4;--s2:#ECE6DB;--line:#DDD4C5;--line2:#B9AE9C;
  --tx:#1B1814;--tx2:#4C443B;--tx3:#6B6256;
  --hi:#C23518;--hiInk:#FFFFFF;--hiDeep:#FBE9E3;--hiLine:#E3AE9F;
  --md:#875800;--mdDeep:#F7EBD2;
  --lo:#2B5B8C;--loDeep:#E3EBF3;
  --ok:#2E7A4A;--hatch:#EFEAE0;--ordInk:#FFFFFF;"""

OLD_VARS = """--bg:#14120F;--s1:#1C1915;--s2:#25211C;--line:#342E27;--line2:#4A4238;
  --tx:#F2EBDF;--tx2:#C2B8A8;--tx3:#958A7A;
  --hi:#FF5A36;--hiInk:#1C0B05;--hiDeep:#2A140D;--hiLine:#6B2A18;
  --md:#ECB24C;--mdDeep:#2A2110;
  --lo:#93B7DB;--loDeep:#18202A;"""

# warna yang tertulis langsung -> token
SWAPS = [
    ('fill="#FF5A36"', 'style="fill:var(--hi)"'),
    ('stroke="#FF5A36"', 'style="stroke:var(--hi)"'),
    ('fill="#2A140D"', 'style="fill:var(--hiDeep)"'),
    ('fill="#ECB24C"', 'style="fill:var(--md)"'),
    ('stroke="#ECB24C"', 'style="stroke:var(--md)"'),
    ('stroke="#93B7DB"', 'style="stroke:var(--lo)"'),
    ('color:#9FD3A8', 'color:var(--ok)'),
    ('color:#958A7A', 'color:var(--tx3)'),
    ('color:#4A4238', 'color:var(--line2)'),
    ('#211E19', 'var(--hatch)'),
]


def fix_double_style(html):
    # svg yang dapat dua atribut style (fill + stroke) digabung
    import re
    return re.sub(r'style="([^"]*)" style="([^"]*)"', r'style="\1;\2"', html)


for key, (family, gf) in FONTS.items():
    for mode, vars_ in (("dark", DARK), ("light", LIGHT)):
        h = SRC
        assert OLD_VARS in h
        h = h.replace(OLD_VARS, vars_)
        for a, b in SWAPS:
            h = h.replace(a, b)
        h = fix_double_style(h)
        h = h.replace("'Atkinson Hyperlegible Next'", f"'{family}'")
        h = h.replace(
            "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;600;700;800&display=swap",
            f"https://fonts.googleapis.com/css2?family={gf}&display=swap",
        )
        h = h.replace(".row.pra .ord{color:var(--hiInk);", ".row.pra .ord{color:var(--ordInk);")
        h = h.replace(".ok{color:#9FD3A8}", ".ok{color:var(--ok)}")
        h = h.replace(".bed .n{font-size:26px;", ".bed .n{white-space:nowrap;font-size:24px;")
        h = h.replace(".bed .h{display:flex;justify-content:space-between;align-items:center}", ".bed .h{display:flex;justify-content:space-between;align-items:center;gap:6px}")
        h = h.replace("<title>B · Denah</title>", f"<title>B · {family} · {'Gelap' if mode=='dark' else 'Terang'}</title>")
        assert "Atkinson" not in h, key
        out = HERE / f"b-{key}-{mode}.html"
        out.write_text(h, encoding="utf-8")
        print("wrote", out.name)
