"""Draws the launcher icons (adaptive layers + legacy PNGs) for every density."""
import os
import sys
from PIL import Image, ImageDraw

RES = sys.argv[1]
DENS = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
SS = 4  # supersampling factor


def gradient(size):
    a, b = (79, 70, 229), (124, 58, 237)
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            px[x, y] = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
    return img


def foreground(size, mono=False):
    """Staircase with a flag, drawn in a 108-unit box."""
    s = size * SS / 108.0
    img = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = 2.2 * s
    cols = [((26, 62, 41.6, 78), 175), ((40.4, 50, 56.6, 78), 215), ((55.4, 38, 71, 78), 255)]
    for (x0, y0, x1, y1), alpha in cols:
        d.rounded_rectangle([x0 * s, y0 * s, x1 * s, y1 * s], radius=r,
                            fill=(255, 255, 255, 255 if mono else alpha))
    d.rounded_rectangle([71.6 * s, 26 * s, 74.6 * s, 78 * s], radius=1.2 * s, fill=(255, 255, 255, 255))
    d.polygon([(74.2 * s, 26 * s), (87 * s, 31.6 * s), (74.2 * s, 37.2 * s)], fill=(255, 255, 255, 255))
    return img.resize((size, size), Image.LANCZOS)


def legacy(size, round_):
    big = size * SS
    bg = gradient(big).convert("RGBA")
    mask = Image.new("L", (big, big), 0)
    md = ImageDraw.Draw(mask)
    pad = int(big * 0.04)
    if round_:
        md.ellipse([pad, pad, big - pad, big - pad], fill=255)
    else:
        md.rounded_rectangle([pad, pad, big - pad, big - pad], radius=int(big * 0.22), fill=255)
    out = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    out.paste(bg, (0, 0), mask)
    fg = foreground(int(size * 1.2)).resize((int(big * 1.2), int(big * 1.2)), Image.LANCZOS)
    off = (big - fg.size[0]) // 2
    out.alpha_composite(fg, (off, off)) if off >= 0 else out.alpha_composite(fg.crop((-off, -off, -off + big, -off + big)))
    return out.resize((size, size), Image.LANCZOS)


for name, k in DENS.items():
    folder = os.path.join(RES, f"mipmap-{name}")
    os.makedirs(folder, exist_ok=True)
    layer = int(108 * k)
    gradient(layer).save(os.path.join(folder, "ic_launcher_background.png"))
    foreground(layer).save(os.path.join(folder, "ic_launcher_foreground.png"))
    foreground(layer, mono=True).save(os.path.join(folder, "ic_launcher_mono.png"))
    icon = int(48 * k)
    legacy(icon, False).save(os.path.join(folder, "ic_launcher.png"))
    legacy(icon, True).save(os.path.join(folder, "ic_launcher_round.png"))

# preview + web assets
os.makedirs(sys.argv[2], exist_ok=True)
legacy(192, False).save(os.path.join(sys.argv[2], "icon.png"))
print("icons ok")
