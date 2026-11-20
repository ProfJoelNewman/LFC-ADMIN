#!/usr/bin/env python3
"""
Generate crisp PWA, Maskable, iOS Apple Touch, and Header icons for LFC ADMIN
from the official v2.0 Life Fellowship Church 3D Shield Emblem.
"""

from pathlib import Path
from PIL import Image, ImageDraw

SOURCE_BADGE = Path(
    "/home/jnewman/teamwork_projects/life_fellowship_website/src/assets/images/lfc-3d-shield-badge.png"
)
OUT_DIR = Path(__file__).resolve().parent.parent / "icons"


def make_standard_icon(src: Image.Image, size: int, pad_ratio: float = 0.06, opaque_bg: bool = True) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 255) if opaque_bg else (0, 0, 0, 0))
    if opaque_bg:
        draw = ImageDraw.Draw(canvas)
        margin = max(2, int(round(size * 0.025)))
        ring_w = max(1, int(round(size * 0.012)))
        draw.ellipse(
            [margin, margin, size - 1 - margin, size - 1 - margin],
            fill=(22, 22, 22, 255),
            outline=(254, 195, 16, 90),
            width=ring_w,
        )
    inner = int(round(size * (1.0 - 2.0 * pad_ratio)))
    resized = src.resize((inner, inner), Image.Resampling.LANCZOS)
    offset = (size - inner) // 2
    canvas.alpha_composite(resized, (offset, offset))
    return canvas.convert("RGB") if opaque_bg else canvas


def make_maskable_icon(src: Image.Image, size: int) -> Image.Image:
    """
    Android/PWA Maskable icon: pure #000000 pitch-black bleed with badge centered inside
    the W3C 80% safe zone circle (using 74% diameter for crisp visual breathing room).
    """
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    draw = ImageDraw.Draw(canvas)
    ring_r = int(round(size * 0.40))
    cx = size // 2
    draw.ellipse(
        [cx - ring_r, cx - ring_r, cx + ring_r, cx + ring_r],
        fill=(22, 22, 22, 255),
        outline=(254, 195, 16, 115),
        width=max(2, int(round(size * 0.01))),
    )
    inner = int(round(size * 0.72))
    resized = src.resize((inner, inner), Image.Resampling.LANCZOS)
    offset = (size - inner) // 2
    canvas.alpha_composite(resized, (offset, offset))
    return canvas.convert("RGB")


def main() -> None:
    if not SOURCE_BADGE.is_file():
        raise FileNotFoundError(f"Source shield badge not found: {SOURCE_BADGE}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with Image.open(SOURCE_BADGE) as raw:
        src = raw.convert("RGBA")
        # Crop transparent outer whitespace if present so shield fills icon cleanly
        bbox = src.getbbox()
        if bbox:
            src = src.crop(bbox)
            # Make square again
            side = max(src.width, src.height)
            sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
            sq.alpha_composite(src, ((side - src.width) // 2, (side - src.height) // 2))
            src = sq

        outputs = {
            "icon-192.png": make_standard_icon(src, 192, pad_ratio=0.07, opaque_bg=True),
            "icon-512.png": make_standard_icon(src, 512, pad_ratio=0.07, opaque_bg=True),
            "icon-maskable-192.png": make_maskable_icon(src, 192),
            "icon-maskable-512.png": make_maskable_icon(src, 512),
            "apple-touch-icon.png": make_standard_icon(src, 180, pad_ratio=0.08, opaque_bg=True),
            "favicon-64.png": make_standard_icon(src, 64, pad_ratio=0.04, opaque_bg=False),
            "shield-badge.png": make_standard_icon(src, 256, pad_ratio=0.02, opaque_bg=False),
        }

        for filename, img in outputs.items():
            dest = OUT_DIR / filename
            img.save(dest, format="PNG", optimize=True)
            print(f"Generated {dest.name}: {img.size[0]}x{img.size[1]} ({dest.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
