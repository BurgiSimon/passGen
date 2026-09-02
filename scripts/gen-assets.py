#!/usr/bin/env python3
"""Regenerate the static social/icon PNGs in public/.

Run once, commit the output; nothing at build or run time depends on this.

    python3 scripts/gen-assets.py

Draws the same tabler lock as public/lock.svg and uses the project's own
Tanker/Satoshi TTFs, so the share card matches the glass skin.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
FONTS = ROOT / "src" / "fonts"

BG = (10, 10, 10)  # --bg, dark
ACCENT = (39, 255, 100)  # --accent
DIM = (150, 150, 150)

TANKER = FONTS / "tanker" / "fonts" / "Tanker-Regular.ttf"
SATOSHI_BOLD = FONTS / "satoshi" / "fonts" / "Satoshi-Bold.ttf"
SATOSHI = FONTS / "satoshi" / "fonts" / "Satoshi-Medium.ttf"


def draw_lock(draw, x, y, size, colour):
    """The lock from public/lock.svg, scaled from its 24x24 viewBox."""
    u = size / 24.0
    w = max(1, round(2 * u))  # the svg's stroke-width: 2

    # body: rounded rect, svg path M5 13 h14 v8 (r=2)
    draw.rounded_rectangle(
        [x + 5 * u, y + 11 * u, x + 19 * u, y + 21 * u],
        radius=2 * u,
        outline=colour,
        width=w,
    )
    # shackle: M8 11 v-4 a4 4 0 1 1 8 0 v4 — the arc plus its two legs
    draw.arc([x + 8 * u, y + 3 * u, x + 16 * u, y + 11 * u], 180, 360, fill=colour, width=w)
    draw.line([x + 8 * u, y + 7 * u, x + 8 * u, y + 11 * u], fill=colour, width=w)
    draw.line([x + 16 * u, y + 7 * u, x + 16 * u, y + 11 * u], fill=colour, width=w)
    # keyhole
    draw.ellipse([x + 11 * u, y + 15 * u, x + 13 * u, y + 17 * u], outline=colour, width=w)


def icon(size, pad_ratio=0.18):
    img = Image.new("RGBA", (size, size), BG + (255,))
    d = ImageDraw.Draw(img)
    pad = size * pad_ratio
    draw_lock(d, pad, pad, size - 2 * pad, ACCENT)
    return img


def og():
    """1200x630 — the size both Open Graph and Twitter summary_large_image want."""
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # dot grid, echoing the glass skin's animated background
    for gy in range(30, H, 36):
        for gx in range(30, W, 36):
            d.ellipse([gx - 1.5, gy - 1.5, gx + 1.5, gy + 1.5], fill=(30, 30, 30))

    draw_lock(d, 96, 150, 150, ACCENT)

    title = ImageFont.truetype(str(TANKER), 116)
    sub = ImageFont.truetype(str(SATOSHI_BOLD), 40)
    foot = ImageFont.truetype(str(SATOSHI), 28)

    d.text((96, 320), "PassGen", font=title, fill=(232, 232, 232))
    d.text((96, 452), "Strong passwords & passphrases,", font=sub, fill=DIM)
    d.text((96, 500), "generated in your browser.", font=sub, fill=DIM)
    d.text((96, 566), "crypto.getRandomValues  ·  nothing is ever sent anywhere", font=foot,
           fill=ACCENT)
    return img


if __name__ == "__main__":
    icon(512).save(PUBLIC / "icon-512.png")
    icon(192).save(PUBLIC / "icon-192.png")
    # iOS composites onto a black square and ignores alpha, so keep it opaque.
    icon(180).convert("RGB").save(PUBLIC / "apple-touch-icon.png")
    og().save(PUBLIC / "og.png")
    print("wrote icon-512.png icon-192.png apple-touch-icon.png og.png")
