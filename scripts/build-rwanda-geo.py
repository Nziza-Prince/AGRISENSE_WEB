"""Builds src/data/geo/<District>.json (sectors > cells > villages as SVG paths) from geoBoundaries RWA ADM2-ADM5.

geoBoundaries (CC BY 4.0, https://www.geoboundaries.org) ships each level as a flat list with no parent link, so every
unit is attached to the parent it overlaps most. Paths use the same projection as src/roles/admin/rwandaMap.ts.

Usage: python build-rwanda-geo.py <dir with ADM2..ADM5.geojson> <out dir> <rwandaLocations.json>
Needs shapely.
"""
import difflib, json, re, sys, unicodedata
from collections import defaultdict
from shapely.geometry import shape
from shapely.strtree import STRtree

src, out, locs_path = sys.argv[1:4]
MIN_LON, MAX_LAT, SCALE, PAD = 28.8618378957024, -1.04716670707786, 320, 6

def proj(x, y):
    return (x - MIN_LON) * SCALE + PAD, (MAX_LAT - y) * SCALE + PAD

def num(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return s if s != "-0" else "0"

def path(geom):
    polys = [geom] if geom.geom_type == "Polygon" else list(geom.geoms)
    parts = []
    for p in polys:
        for ring in [p.exterior, *p.interiors]:
            pts = [proj(x, y) for x, y in ring.coords[:-1]]
            if len(pts) >= 3:
                parts.append("M" + " ".join(f"{num(x)} {num(y)}" for x, y in pts) + "Z")
    return "".join(parts)

def load(level):
    fs = json.load(open(f"{src}/{level}.geojson"))["features"]
    return [(f["properties"]["shapeName"].strip(), shape(f["geometry"]).buffer(0)) for f in fs]

def attach(children, parents):
    tree = STRtree([g for _, g in parents])
    res = []
    for name, g in children:
        best, area = None, -1.0
        for i in tree.query(g):
            a = parents[i][1].intersection(g).area
            if a > area:
                best, area = i, a
        res.append(best)
    return res

levels = {l: load(l) for l in ("ADM2", "ADM3", "ADM4", "ADM5")}
par = {"ADM3": attach(levels["ADM3"], levels["ADM2"]), "ADM4": attach(levels["ADM4"], levels["ADM3"]), "ADM5": attach(levels["ADM5"], levels["ADM4"])}

def unit(name, g):
    c = g.representative_point()
    cx, cy = proj(c.x, c.y)
    return {"name": name, "d": path(g.simplify(0.00002)), "cx": round(cx, 2), "cy": round(cy, 2)}

villages = defaultdict(list)
for (name, g), p in zip(levels["ADM5"], par["ADM5"]):
    villages[p].append(unit(name, g))
cells = defaultdict(list)
for i, ((name, g), p) in enumerate(zip(levels["ADM4"], par["ADM4"])):
    u = unit(name, g); u["villages"] = villages.get(i, []); cells[p].append(u)
sectors = defaultdict(list)
for i, ((name, g), p) in enumerate(zip(levels["ADM3"], par["ADM3"])):
    u = unit(name, g); u["cells"] = cells.get(i, []); sectors[p].append(u)

norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", s).lower())
locs = json.load(open(locs_path))
ref = {norm(d): v for prov in locs.values() for d, v in prov.items()}

def canon(items, names, stat):
    """Rename units to the spelling in the locations list (the one farms are saved with); near-misses like Shyrongi/Shyorongi are matched by similarity."""
    by = {norm(n): n for n in names}
    for u in items:
        n = norm(u["name"])
        if n in by:
            u["name"] = by[n]; stat[0] += 1
            continue
        close = difflib.get_close_matches(n, list(by), 1, 0.85)
        if close:
            u["name"] = by[close[0]]; stat[0] += 1
        else:
            stat[1] += 1

st = {k: [0, 0] for k in ("sector", "cell", "village")}
for i, (dname, _) in enumerate(levels["ADM2"]):
    rd = ref.get(norm(dname), {})
    canon(sectors[i], rd.keys(), st["sector"])
    for s in sectors[i]:
        rs = rd.get(s["name"], {})
        canon(s["cells"], rs.keys(), st["cell"])
        for c in s["cells"]:
            canon(c["villages"], rs.get(c["name"], []), st["village"])
    json.dump({"sectors": sectors[i]}, open(f"{out}/{dname}.json", "w"), separators=(",", ":"))
for k, (a, b) in st.items():
    print(k, "matched", a, "not in locations list", b)
