"""ตัดพื้นเขียว (#00FF00) ออกจากรูปที่ได้จาก Gemini → PNG พื้นโปร่งใส

ใช้: python3 scripts/art/key_green.py
อ่าน scripts/art/source/<key>.jpg|png → เขียน scripts/art/user/<key>.png (256×256)
คำนวณความโปร่งใสจากระยะห่างสีกับพื้นหลัง และกู้สีขอบคืน (ไม่มีขอบเขียวติด)
สีเขียวอ่อน/มิ้นต์ในรูปไม่หาย เพราะห่างจากสีพื้นมากพอ
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'source')
OUT = os.path.join(HERE, 'user')
LO, HI = 55.0, 150.0  # ระยะสีที่เริ่มทึบ / ทึบเต็มที่
SIZE = 256


def bg_color(im):
    w, h = im.size
    pts = [(4, 4), (w - 5, 4), (4, h - 5), (w - 5, h - 5), (w // 2, 4), (4, h // 2)]
    cs = sorted(im.getpixel(p)[:3] for p in pts)
    return cs[len(cs) // 2]


def key(path):
    im = Image.open(path).convert('RGB')
    bg = bg_color(im)
    w, h = im.size
    src = im.load()
    out = Image.new('RGBA', (w, h))
    dst = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = src[x, y]
            d = ((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2) ** 0.5
            a = min(1.0, max(0.0, (d - LO) / (HI - LO)))
            if a <= 0:
                dst[x, y] = (0, 0, 0, 0)
                continue
            if a < 1:
                # กู้สีจริงของขอบ: c = (สีที่เห็น - (1-a)*พื้น) / a
                r = round((r - (1 - a) * bg[0]) / a)
                g = round((g - (1 - a) * bg[1]) / a)
                b = round((b - (1 - a) * bg[2]) / a)
            # กันเขียวล้นที่ขอบ
            g = min(g, max(r, b) + 40) if a < 1 else g
            dst[x, y] = (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)), round(a * 255))
    bbox = out.getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox()
    out = out.crop(bbox)
    side = int(max(out.size) * 1.06)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(out, ((side - out.size[0]) // 2, (side - out.size[1]) // 2))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in sorted(os.listdir(SRC)):
        k, ext = os.path.splitext(f)
        if ext.lower() not in ('.jpg', '.jpeg', '.png', '.webp'):
            continue
        key(os.path.join(SRC, f)).save(os.path.join(OUT, f'{k}.png'), optimize=True)
        print('keyed', k)


if __name__ == '__main__':
    main()
