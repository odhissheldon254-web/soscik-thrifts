# Builds the SOSICK logo SVGs in the style of the original badge:
# chunky yellow block letters with cut-in slits, on a black bar, yellow stripe under it.
import sys
OUT = sys.argv[1]
Y, K, W = "#FFE600", "#0B0B0A", "#FFFFFF"
H, R, GAP, SLIT = 140, 16, 16, 13

def rr(x, y, w, h, r, fill, cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<rect{c} x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r}" fill="{fill}"/>'

def letter(ch, x):
    """Return (svg, width) for one block letter at x. Cuts are drawn in the bar colour."""
    p = []
    if ch == "S":
        w = 112
        p += [rr(x, 0, w, H, R, Y),
              rr(x + w * .30, H * .31, w * .70 + 1, SLIT, 2, K),      # top slit from the right
              rr(x + w * .30, H * .31, SLIT, 22, 2, K),               # little tick down
              rr(x - 1, H * .58, w * .70 + 1, SLIT, 2, K),           # bottom slit from the left
              rr(x + w * .70 - SLIT, H * .58 - 9, SLIT, 22, 2, K)]    # little tick up
    elif ch == "O":
        w = 112
        p += [rr(x, 0, w, H, R, Y), rr(x + w * .33, H * .30, w * .34, H * .40, 6, K)]
    elif ch == "I":
        w = 38
        p += [rr(x, 0, w, 32, 8, Y, "dot"), rr(x, 44, w, H - 44, 10, Y)]
    elif ch == "C":
        w = 106
        p += [rr(x, 0, w, H, R, Y), rr(x + w * .36, H * .33, w * .64 + 1, H * .34, 5, K)]
    elif ch == "K":
        w = 114
        p += [rr(x, 0, 38, H, 10, Y),
              f'<path d="M{x+48},{R} q0,-{R} {R},-{R} H{x+w-R} q{R},0 {R},{R} V{H*.20:.1f} L{x+76},{H/2:.1f} L{x+w},{H*.80:.1f} V{H-R} q0,{R} -{R},{R} H{x+48+R} q-{R},0 -{R},-{R} Z" fill="{Y}"/>']
    return "".join(p), w

def wordmark(word, animate):
    pad_x, pad_y = 30, 26
    x = pad_x
    parts = []
    for i, ch in enumerate(word):
        svg, w = letter(ch, x)
        parts.append(f'<g class="ltr" style="animation-delay:{0.08*i:.2f}s">{svg}</g>')
        x += w + GAP
    bar_w = x - GAP + pad_x
    bar_h = H + 2 * pad_y
    stripe = 24
    total_h = bar_h + stripe
    css = ""
    if animate:
        css = f"""<style>
  .ltr {{ transform-box: fill-box; transform-origin: 50% 100%; animation: pop .55s cubic-bezier(.2,1.7,.4,1) both; }}
  .dot {{ transform-box: fill-box; transform-origin: 50% 100%; animation: hop 4s ease-in-out 1.2s infinite; }}
  .shine {{ animation: sweep 3.6s ease-in-out 1s infinite; }}
  @keyframes pop {{ from {{ transform: translateY(18px) scale(.6); opacity: 0; }} }}
  @keyframes hop {{ 0%, 70%, 100% {{ transform: translateY(0); }} 78% {{ transform: translateY(-22px) rotate(-8deg); }} 86% {{ transform: translateY(0); }} 91% {{ transform: translateY(-7px); }} }}
  @keyframes sweep {{ 0% {{ transform: translateX(-{bar_w*0.3:.0f}px); }} 55%, 100% {{ transform: translateX({bar_w*1.1:.0f}px); }} }}
  @media (prefers-reduced-motion: reduce) {{ .ltr, .dot, .shine {{ animation: none; }} }}
</style>"""
    shine = ""
    if animate:
        shine = (f'<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="{W}" stop-opacity="0"/>'
                 f'<stop offset=".5" stop-color="{W}" stop-opacity=".85"/><stop offset="1" stop-color="{W}" stop-opacity="0"/></linearGradient>'
                 f'<clipPath id="c"><rect x="0" y="{bar_h}" width="{bar_w}" height="{stripe}"/></clipPath></defs>'
                 f'<g clip-path="url(#c)"><rect class="shine" x="0" y="{bar_h}" width="{bar_w*0.22:.0f}" height="{stripe}" fill="url(#g)"/></g>')
    body = (f'<rect width="{bar_w:.0f}" height="{bar_h}" fill="{K}"/>'
            f'<rect y="{bar_h}" width="{bar_w:.0f}" height="{stripe}" fill="{Y}"/>{shine}'
            f'<g transform="translate(0,{pad_y})">{"".join(parts)}</g>')
    return body, bar_w, total_h, css

def write(name, content):
    open(f"{OUT}/{name}", "w").write(content)

# 1. Animated wordmark (header, admin)
body, w, h, css = wordmark("SOSICK", True)
write("logo-wordmark.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h}" role="img" aria-label="Sosick">{css}{body}</svg>\n')
# 2. Static wordmark (social sharing, print)
body_s, w2, h2, _ = wordmark("SOSICK", False)
write("logo-wordmark-static.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w2:.0f} {h2}" role="img" aria-label="Sosick">{body_s}</svg>\n')
# 3. Full badge like the original: wordmark on a white circle on black
S = 1000
scale = 820 / w2
bx, by = (S - w2 * scale) / 2, (S - h2 * scale) / 2
write("logo-badge.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" role="img" aria-label="Sosick">'
      f'<rect width="{S}" height="{S}" fill="{K}"/><circle cx="{S/2}" cy="{S/2}" r="{S*0.455}" fill="{W}"/>'
      f'<g transform="translate({bx:.1f},{by:.1f}) scale({scale:.4f})">{body_s}</g></svg>\n')
# 4. Square icon / favicon: one block S on black with the stripe
sv, sw = letter("S", 0)
write("logo-icon.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="Sosick">'
      f'<defs><clipPath id="r"><rect width="200" height="200" rx="40"/></clipPath></defs><g clip-path="url(#r)">'
      f'<rect width="200" height="200" fill="{K}"/><rect y="168" width="200" height="32" fill="{Y}"/></g>'
      f'<g transform="translate({(200-sw)/2:.1f},18)">{sv}</g></svg>\n')
print("ok", round(w), h)
