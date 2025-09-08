# pip install pillow
from PIL import Image, ImageDraw
import numpy as np
from pathlib import Path

def make_slider_animation(
    before_path, after_path,
    out_path="slider.gif",
    width=None, height=None,
    frames=60,  # total frames for a full forward+back cycle
    hold_frames=10,  # hold at ends
    bar_width=4,  # pixels
    loop=True,  # loop forever
    bounce=True,  # go forward then back
    fps=30,  # playback rate (ms per frame computed from this)
):
    # Load
    before = Image.open(before_path).convert("RGBA")
    after  = Image.open(after_path).convert("RGBA")

    # Optional resize (keep aspect)
    if width or height:
        if not width:
            width = int(before.width * (height / before.height))
        if not height:
            height = int(before.height * (width / before.width))
        before = before.resize((width, height), Image.LANCZOS)
        after  = after.resize((width, height), Image.LANCZOS)
    else:
        # force same size
        w = min(before.width, after.width)
        h = min(before.height, after.height)
        before = before.resize((w, h), Image.LANCZOS)
        after  = after.resize((w, h), Image.LANCZOS)

    W, H = before.size

    # Build sweep timeline
    forward = list(np.linspace(0, W, frames//2, endpoint=True))
    if bounce:
        backward = list(np.linspace(W, 0, frames//2, endpoint=True))
        sweep = forward + [forward[-1]]*hold_frames + backward + [backward[-1]]*hold_frames
    else:
        sweep = forward + [forward[-1]]*hold_frames

    out_frames = []
    for x in sweep:
        x = int(x)

        # Compose: left side shows AFTER, right side shows BEFORE
        frame = Image.new("RGBA", (W, H))
        if x > 0:
            frame.paste(after.crop((0, 0, x, H)), (0, 0))
        if x < W:
            frame.paste(before.crop((x, 0, W, H)), (x, 0))

        # draw slider bar
        draw = ImageDraw.Draw(frame)
        draw.rectangle([x - bar_width//2, 0, x + bar_width//2, H], fill=(255, 255, 255, 255))

        out_frames.append(frame.convert("P", dither=Image.FLOYDSTEINBERG, palette=Image.ADAPTIVE))

    duration_ms = int(1000 / fps)
    ext = Path(out_path).suffix.lower()
    save_args = dict(save_all=True, append_images=out_frames[1:], duration=duration_ms, loop=0 if loop else 1, disposal=2)

    if ext == ".webp":
        out_frames[0].save(out_path, format="WEBP", **save_args)
    else:
        out_frames[0].save(out_path, format="GIF", **save_args)

if __name__ == "__main__":
    # Example:
    make_slider_animation(
        "before.png",
        "after.png",
        out_path="slider.gif",   # or "slider.webp"
        frames=60,
        hold_frames=10,
        bar_width=6,
        fps=30,
        loop=True,
        bounce=True
    )