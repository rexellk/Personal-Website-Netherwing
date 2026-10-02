# grid.py <tag> [cols] [w]: dense contact sheet of frames-<tag>/t*.png, labelled with the timeline second
import sys, glob
from PIL import Image, ImageDraw
tag = sys.argv[1]; cols = int(sys.argv[2]) if len(sys.argv) > 2 else 4; w = int(sys.argv[3]) if len(sys.argv) > 3 else 320
fs = sorted(glob.glob(f'frames-{tag}/t*.png'), key=lambda f: float(f.split('/t')[-1][:-4]))
im0 = Image.open(fs[0]); h = round(w * im0.size[1] / im0.size[0])
S = Image.new('RGB', (w * cols, h * ((len(fs) + cols - 1) // cols)))
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((w, h)); ImageDraw.Draw(im).text((5, 5), f.split('/t')[-1][:-4] + 's', fill=(255, 255, 0))
    S.paste(im, ((i % cols) * w, (i // cols) * h))
S.save(f'grid-{tag}.png'); print(S.size)
