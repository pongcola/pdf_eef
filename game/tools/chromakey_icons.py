import sys, os
from PIL import Image
import numpy as np
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for f in sorted(os.listdir(src)):
    if not f.endswith('.png'): continue
    name = f.split('_',1)[1]
    im = Image.open(os.path.join(src,f)).convert('RGB')
    if 'era_card' in name:
        im = im.resize((792,336), Image.LANCZOS)
        im.save(os.path.join(out, name.replace('.png','.jpg')), quality=86)
        continue
    d = np.asarray(im, dtype=np.float32)
    r,g,b = d[...,0],d[...,1],d[...,2]
    ex = g - np.maximum(r,b)
    t = 60.0
    alpha = 1.0 - np.clip((ex - t*0.4)/(t*0.6), 0, 1)
    # despill
    gd = np.minimum(g, np.maximum(r,b))
    d[...,1] = np.where(ex > 10, gd, g)
    rgba = np.dstack([d, alpha*255]).clip(0,255).astype(np.uint8)
    o = Image.fromarray(rgba, 'RGBA')
    # remove tiny alpha noise
    a = np.asarray(o)[...,3]
    bbox = Image.fromarray((a>24).astype(np.uint8)*255).getbbox()
    if bbox:
        w = bbox[2]-bbox[0]; h = bbox[3]-bbox[1]; s = max(w,h); pad = int(s*0.04)
        cx=(bbox[0]+bbox[2])//2; cy=(bbox[1]+bbox[3])//2; half=s//2+pad
        o = o.crop((cx-half, cy-half, cx+half, cy+half))
    o = o.resize((192,192), Image.LANCZOS)
    o.save(os.path.join(out,name), optimize=True)
    print(name, bbox)
