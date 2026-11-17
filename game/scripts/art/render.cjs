// วาดรูป UI ทั้งหมดจาก art.js แล้วบันทึกลง src/ui/art/
// ใช้: node scripts/art/render.cjs   (ต้องมี @fontsource/fredoka และ playwright)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = path.resolve(__dirname, '../../src/ui/art');
  // รูปที่ผู้ใช้ให้มา (ตัดพื้นแล้วด้วย key_green.py)
  const userDir = path.join(__dirname, 'user');
  const userArt = {};
  for (const f of fs.existsSync(userDir) ? fs.readdirSync(userDir) : []) {
    if (f.endsWith('.png')) userArt[f.slice(0, -4)] = 'data:image/png;base64,' + fs.readFileSync(path.join(userDir, f)).toString('base64');
  }
  const font = fs.readFileSync(require.resolve('@fontsource/fredoka/files/fredoka-latin-700-normal.woff2')).toString('base64');
  const html = `<!doctype html><html><head><style>
    @font-face { font-family: Fredoka; font-weight: 700; src: url(data:font/woff2;base64,${font}) format('woff2'); }
    html, body { margin: 0; background: transparent; }
    #box { position: absolute; left: 0; top: 0; }
  </style></head><body><div id="box"></div><script>window.USER_ART = ${JSON.stringify(userArt)};</script><script>${fs.readFileSync(path.join(__dirname, 'art.js'), 'utf8')}</script></body></html>`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1100, height: 700 } });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.load('700 40px Fredoka'));
  const jobs = await page.evaluate(() => window.ART_JOBS.map(([k, , size, fmt]) => [k, size, fmt]));
  for (let i = 0; i < jobs.length; i++) {
    const [key, [w, h], fmt] = jobs[i];
    await page.evaluate(({ i, w, h }) => {
      const box = document.getElementById('box');
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
      box.innerHTML = window.ART_JOBS[i][1];
    }, { i, w, h });
    const el = await page.$('#box');
    // ภาพปกยุคเป็นภาพเต็มกรอบ → jpg (ไฟล์เล็ก), ที่เหลือ png พื้นโปร่งใส
    if (fmt === 'png') await el.screenshot({ path: path.join(out, `${key}.png`), omitBackground: true });
    else await el.screenshot({ path: path.join(out, `${key}.jpg`), type: 'jpeg', quality: 88 });
  }
  for (const k of Object.keys(userArt)) fs.copyFileSync(path.join(userDir, `${k}.png`), path.join(out, `${k}.png`));
  console.log(`rendered ${jobs.length} images + copied ${Object.keys(userArt).length} user images to ${out}`);
  await browser.close();
})();
