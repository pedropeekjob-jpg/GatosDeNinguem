import numpy as np, potrace
def trace(mask, T, nd=1):
    """mask: 2D bool (True = ink). T: (x,y)->(x,y) in output units. Returns an SVG path d."""
    bm = potrace.Bitmap(~mask.astype(bool))
    path = bm.trace(turdsize=8, alphamax=1.0, opticurve=True, opttolerance=0.3)
    f = lambda p: "%s %s" % tuple(fmt(v, nd) for v in T(p[0] if not hasattr(p,'x') else p.x, p[1] if not hasattr(p,'y') else p.y))
    out = []
    for c in path.curves:
        out.append("M" + f(c.start_point))
        for s in c.segments:
            if s.is_corner: out.append("L" + f(s.c) + "L" + f(s.end_point))
            else: out.append("C" + f(s.c1) + " " + f(s.c2) + " " + f(s.end_point))
        out.append("Z")
    return "".join(out)
def fmt(v, nd):
    s = ("%." + str(nd) + "f") % v
    s = s.rstrip("0").rstrip(".") if "." in s else s
    return "0" if s in ("-0", "") else s
