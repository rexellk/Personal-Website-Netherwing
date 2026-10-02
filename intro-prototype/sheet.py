import sys, glob
from PIL import Image, ImageDraw
tag = sys.argv[1]; fs = sorted(glob.glob(f'frames-{tag}/t*.png'))
ims = [Image.open(f).resize((640, 310)) for f in fs]
W = Image.new('RGB', (1280, 310 * ((len(ims) + 1) // 2)))
for i, (f, im) in enumerate(zip(fs, ims)):
    ImageDraw.Draw(im).text((8, 8), f.split('/')[-1][1:-4] + 's', fill=(255, 255, 0))
    W.paste(im, ((i % 2) * 640, (i // 2) * 310))
W.save(f'sheet-{tag}.png')
