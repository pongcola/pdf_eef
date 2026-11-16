"""สร้างไอคอนแอปและภาพ splash (ออกแบบเอง วาดด้วยโค้ด): python3 scripts/make-icons.py"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'android', 'app', 'src', 'main', 'res')
S = 1024  # วาดใหญ่แล้วย่อ ให้ขอบเนียน

BG_TOP = (255, 196, 64)
BG_BOTTOM = (255, 96, 120)
NAVY = (27, 35, 64)


def gradient(size, top, bottom):
    im = Image.new('RGB', (size, size))
    d = ImageDraw.Draw(im)
    for y in range(size):
        t = y / (size - 1)
        c = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        d.line([(0, y), (size, y)], fill=c)
    return im


def figure(d, cx, cy, h, body, crown=False):
    """ตัวละครทรงเรียบง่าย: หัวกลม + ลำตัว + ขา"""
    head = h * 0.2
    bw = h * 0.36
    d.ellipse([cx - head, cy - h * 0.5 - head, cx + head, cy - h * 0.5 + head], fill=(240, 192, 152), outline=NAVY, width=int(h * 0.035))
    d.rounded_rectangle([cx - bw / 2, cy - h * 0.28, cx + bw / 2, cy + h * 0.16], radius=h * 0.06, fill=body, outline=NAVY, width=int(h * 0.035))
    lw = h * 0.12
    for sx in (-1, 1):
        x = cx + sx * h * 0.09
        d.rounded_rectangle([x - lw / 2, cy + h * 0.12, x + lw / 2, cy + h * 0.42], radius=lw * 0.3, fill=(60, 60, 80), outline=NAVY, width=int(h * 0.03))
    if crown:
        w = head * 1.5
        top = cy - h * 0.5 - head * 0.75
        pts = [(cx - w, top), (cx - w, top - head * 0.9), (cx - w * 0.5, top - head * 0.45), (cx, top - head * 1.15),
               (cx + w * 0.5, top - head * 0.45), (cx + w, top - head * 0.9), (cx + w, top)]
        d.polygon(pts, fill=(255, 207, 51), outline=NAVY, width=int(h * 0.03))


def crowd_layer(size, scale=1.0):
    """เลเยอร์โปร่งใส: ฝูงคนสีฟ้า มีหัวหน้าสวมมงกุฎ"""
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = size / 2
    h = size * 0.3 * scale
    # เงา
    sh = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([c - h * 1.15, c + h * 0.45, c + h * 1.15, c + h * 0.75], fill=(0, 0, 0, 90))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size * 0.01)))
    back = [(-0.75, -0.08), (0.75, -0.08), (-0.38, -0.2), (0.38, -0.2)]
    for dx, dy in back:
        figure(d, c + dx * h, c + dy * h, h * 0.78, (90, 160, 255))
    for dx in (-0.55, 0.55):
        figure(d, c + dx * h, c + 0.12 * h, h * 0.86, (47, 123, 255))
    figure(d, c, c + 0.18 * h, h, (30, 100, 240), crown=True)
    return im


def save(im, rel, size):
    path = os.path.join(ROOT, rel)
    im.resize(size, Image.LANCZOS).save(path)


def main():
    bg = gradient(S, BG_TOP, BG_BOTTOM).convert('RGBA')
    # ไอคอนแบบเก่า (สี่เหลี่ยมมุมมน) และแบบกลม
    square = bg.copy()
    square.alpha_composite(crowd_layer(S, 1.15))
    mask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S, S], radius=S * 0.2, fill=255)
    legacy = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    legacy.paste(square, (0, 0), mask)
    rmask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(rmask).ellipse([0, 0, S, S], fill=255)
    round_ = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    round_.paste(square, (0, 0), rmask)
    # adaptive icon: ฉากหน้าต้องอยู่ในพื้นที่ปลอดภัย 66/108
    fg = crowd_layer(S, 0.78)

    dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
    for name, k in dens.items():
        save(legacy, f'mipmap-{name}/ic_launcher.png', (int(48 * k), int(48 * k)))
        save(round_, f'mipmap-{name}/ic_launcher_round.png', (int(48 * k), int(48 * k)))
        save(fg, f'mipmap-{name}/ic_launcher_foreground.png', (int(108 * k), int(108 * k)))

    # adaptive icon background เป็นภาพไล่สี
    os.makedirs(os.path.join(ROOT, 'drawable'), exist_ok=True)
    save(gradient(S, BG_TOP, BG_BOTTOM), 'drawable/ic_launcher_bg.png', (432, 432))

    # splash: พื้นกรมท่า + ไอคอนตรงกลาง
    for folder in os.listdir(ROOT):
        p = os.path.join(ROOT, folder, 'splash.png')
        if not os.path.exists(p):
            continue
        w, h = Image.open(p).size
        sp = Image.new('RGBA', (w, h), NAVY + (255,))
        icon = int(min(w, h) * 0.42)
        ic = legacy.resize((icon, icon), Image.LANCZOS)
        sp.alpha_composite(ic, ((w - icon) // 2, (h - icon) // 2))
        sp.convert('RGB').save(p)

    # ไอคอนสำหรับเว็บ/README
    web = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
    os.makedirs(web, exist_ok=True)
    legacy.resize((512, 512), Image.LANCZOS).save(os.path.join(web, 'icon-512.png'))
    legacy.resize((192, 192), Image.LANCZOS).save(os.path.join(web, 'icon-192.png'))
    print('icons written')


if __name__ == '__main__':
    sys.exit(main())
