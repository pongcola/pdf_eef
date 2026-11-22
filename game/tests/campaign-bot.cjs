// บอทปรับสมดุล: เล่นยุคที่กำหนดจนผ่าน ซื้ออัปเกรดระหว่างรอบ แล้วบอกว่าใช้กี่รอบ
// วิธีใช้: npm run build && npx vite preview --port 4173 --strictPort (อีกหน้าต่าง)
//         node tests/campaign-bot.cjs <ยุค เช่น 1,3,6,8> [รอบสูงสุด=6] [เร่งเวลา=4]
// ต้องมี Playwright + Chromium (เป้าหมายปัจจุบัน: ยุค 1/3/6/8 ใช้ประมาณ 1/3/3/4 รอบ)
const { chromium, devices } = require('playwright');
// node campaign.cjs <eras csv> [maxRuns] [steps]
(async () => {
  const eras = (process.argv[2] || '1').split(',').map(Number);
  const maxRuns = Number(process.argv[3] || 6);
  const steps = Number(process.argv[4] || 4);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ ...devices['Pixel 7'], deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto('http://localhost:4173/');
  await page.waitForTimeout(2000);
  await page.evaluate((s) => { window.__steps = s; }, steps);
  for (const era of eras) {
    await page.evaluate((era) => {
      const g = window.__game;
      g.save.level = era;
      g.save.coins = 100 + (era - 1) * 100;
      g.save.upgrades = { troop: 0, capacity: 0, power: 0, economy: 0 };
      const ord = era - 1;
      g.save.meta = { funds: ord, aim: ord * 2, veteran: Math.min(5, Math.floor(ord / 2)), logistics: Math.min(9, ord) };
      g.save.failStreak = 0;
      g.ui.hideResult();
      g.buildLevel();
      g.toMenu();
    }, era);
    const log = [];
    for (let run = 1; run <= maxRuns; run++) {
      const ups = await page.evaluate(() => {
        const g = window.__game;
        const order = ['power', 'troop', 'power', 'capacity', 'troop', 'economy'];
        let k = 0, fails = 0;
        while (fails < order.length) {
          const id = order[k++ % order.length];
          const before = g.save.coins;
          g.buyUpgrade(id);
          if (g.save.coins === before) fails++; else fails = 0;
        }
        g.save.stamina.value = 10;
        g.ui.hideResult();
        g.buildLevel();
        g.toMenu();
        return JSON.stringify(g.save.upgrades);
      });
      await page.waitForTimeout(300);
      await page.click('[data-act="play"]');
      await page.evaluate(() => {
        const g = window.__game;
        clearInterval(window.__bot);
        window.__bot = setInterval(() => {
          const z = g.squad.z;
          let best = 0, bestScore = -1e9;
          for (const lx of [-3.2, 0, 3.2]) {
            let sc = -Math.abs(lx - g.squad.x) * 0.5;
            for (const t of g.targets) {
              if (!t.alive || t.z > z - 0.5 || t.z < z - 26) continue;
              if (Math.abs(t.x - lx) > t.halfW + 0.9) continue;
              const dz = z - t.z;
              if (t.kind === 'block') sc += 3; // ยิงหินเติมหลอด (ชนก็ไม่ตาย)
              else if (t.kind === 'capsule') sc += 15;
              else if (t.kind === 'stat') sc += t.blocked ? 10 : t.value > -20 ? 30 : -10;
              else if (t.kind === 'crystal') sc -= t.hp / 50 / (1 + dz * 0.05);
            }
            for (const p of g.pads) if (!p.collected && p.walkers.length && p.collectZ < z && p.collectZ > z - 22 && Math.abs(p.collectX - lx) < p.collectHalfW) sc += 40;
            for (const c of g.cash) if (c.alive !== false && c.z < z && c.z > z - 14 && Math.abs(c.x - lx) < 1.5) sc += 6;
            if (sc > bestScore) { bestScore = sc; best = lx; }
          }
          const lim = g.squad.maxX();
          g.squad.targetX = Math.max(-lim, Math.min(lim, best));
        }, 100);
      });
      let info = '';
      for (let i = 0; i < 1200; i++) {
        const st = await page.evaluate(() => window.__game.state);
        if (st === 'bonus' && !info) info = await page.evaluate(() => { const g = window.__game; const TD=[1,1.6,2.4,3.5,5,7,9.5,12.5,16,20]; const dmg = g.squad.troops.reduce((a,t)=>a+TD[t.tier-1],0)*g.baseDmg*g.powMul*g.rateMul; const rows=[]; for (const c of g.crystals) if (c.x===0) rows.push(Math.round(c.maxHp)); return 'n='+g.squad.count+' tiers='+g.squad.troops.map(t=>t.tier).join('')+' dps='+dmg.toFixed(1)+' base='+g.baseDmg.toFixed(2)+' rate='+g.rateMul.toFixed(2)+' hero='+g.save.heroes.equipped+' towers='+rows.join(','); });
        if (st === 'result') break;
        await page.waitForTimeout(250);
      }
      const r = await page.evaluate(() => {
        const g = window.__game;
        const d = { ...g.deaths }; for (const k in g.deaths) g.deaths[k] = 0;
        const crys = g.crystals.filter(c => !c.alive).length;
        return { lvl: g.save.level, stage: g.stage + 1, coins: g.save.coins, broke: crys, deaths: d, t: Math.round(g.t) };
      });
      const win = r.lvl > era;
      log.push(info + '\n  ' + `run${run} ups=${ups} stage=${r.stage} towers=${r.broke} coins=${r.coins} deaths=${JSON.stringify(r.deaths)} ${win ? 'WIN' : ''}`);
      if (win) break;
    }
    console.log(`ERA ${era}\n  ` + log.join('\n  '));
  }
  console.log(errors.slice(0, 10).join('\n'));
  await browser.close();
})();
