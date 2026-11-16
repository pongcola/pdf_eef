// จำลองการเล่นเพื่อตรวจสมดุลความยาก: node scripts/simulate.ts
import { generateLevel, applyGate } from '../src/game/level.ts';
import { BOSS_STOMP_INTERVAL, BOSS_STOMP_KILL } from '../src/config.ts';
import { UPGRADES, playerPower, startCrowd, upgradeCost, winReward, loseReward } from '../src/economy.ts';

type Up = { start: number; power: number; income: number };

function playLevel(level: number, up: Up, skill: number, failStreak: number) {
  const L = generateLevel(level, { startCrowd: startCrowd(up.start), power: playerPower(up.power), failStreak });
  let n = startCrowd(up.start);
  const p = playerPower(up.power);
  for (const s of L.sections) {
    if (s.type === 'gates') {
      const a = applyGate(s.left, n);
      const b = applyGate(s.right, n);
      n = Math.random() < skill ? Math.max(a, b) : Math.min(a, b);
    } else if (s.type === 'obstacle') {
      n = Math.floor(n * (1 - (0.08 + (1 - skill) * 0.5)));
    } else {
      n -= Math.ceil((s.count * L.enemyPower) / p);
    }
    if (n <= 0) return { win: false, n: 0, L, progress: s.d / L.bossD };
  }
  let hp = L.bossHp;
  let t = 0;
  let stomp = 0;
  while (hp > 0 && n > 0) {
    const dt = 0.05;
    t += dt;
    hp -= n * p * dt;
    stomp += dt;
    if (stomp >= BOSS_STOMP_INTERVAL) {
      stomp = 0;
      n -= Math.max(1, Math.ceil(n * BOSS_STOMP_KILL * (1 + t / 8)));
    }
  }
  return { win: hp <= 0, n: Math.max(0, n), L, progress: 1, t };
}

for (const skill of [0.95, 0.8]) {
  const up: Up = { start: 0, power: 0, income: 0 };
  let coins = 0;
  let level = 1;
  let fail = 0;
  let attempts = 0;
  const log: string[] = [];
  while (level <= 40 && attempts < 400) {
    attempts++;
    const r = playLevel(level, up, skill, fail);
    if (r.win) {
      coins += winReward(level, r.n, r.L.eraBoss, up.income);
      if (level % 5 === 0 || level <= 3 || fail > 0) log.push(`L${level} win  n=${Math.round(r.n)} hp=${r.L.bossHp} exp=${Math.round(r.L.expectedAtBoss)} t=${r.t?.toFixed(1)} up=${up.start}/${up.power}/${up.income} fails=${fail}`);
      level++;
      fail = 0;
    } else {
      coins += loseReward(level, r.progress, up.income);
      fail++;
    }
    // ซื้ออัปเกรดที่ถูกที่สุดเรื่อยๆ
    for (;;) {
      const opts = UPGRADES.map((u) => ({ u, c: upgradeCost(u, up[u.id]) })).sort((a, b) => a.c - b.c);
      if (coins < opts[0].c) break;
      coins -= opts[0].c;
      up[opts[0].u.id]++;
    }
  }
  console.log(`--- skill ${skill}: reached level ${level} in ${attempts} attempts`);
  console.log(log.join('\n'));
}
