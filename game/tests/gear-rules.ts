// ทดสอบกติการะบบอุปกรณ์ + จำลองความสมดุล: npx tsx tests/gear-rules.ts
import * as G from '../src/gear.ts';
let fails = 0;
const eq = (name: string, a: unknown, b: unknown) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) { fails++; console.log('FAIL', name, a, b); } };
const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]; };
let mt = 1; const rnd = () => { mt = (mt * 16807) % 2147483647; return mt / 2147483647; };

// stats
eq('weapon legendary +6', G.itemStats({ slot: 5, cls: 3, plus: 6 }), { critRate: 6 * 1.55, critDmg: 0, dmg: 16 * 1.55, rate: 0, range: 0 });
// enhance: success/fail/pity/drop
let g = G.defaultGear(); g.stones = 300;
g.items.push({ id: 'x', slot: 0, cls: 0, plus: 4, pity: [0,0,0,0,0,0,0], rune: '' });
eq('info +5', G.enhanceInfo(g.items[0]), { target: 5, base: 0.2, pity: 0, chance: 0.2, failTo: 3, cost: 3 });
eq('fail +5 -> +3', G.enhance(g, 'x', seq(0.99)), { ok: false, from: 4, to: 3 });
eq('pity kept', g.items[0].pity[5], 1);
G.enhance(g, 'x', seq(0.0)); // +3 -> +4 success
eq('pity still after drop', G.enhanceInfo(g.items[0])!.chance.toFixed(2), '0.30');
// guarantee +5 after 8 fails
g.items[0].pity[5] = 8; eq('guarantee +5', G.enhanceInfo(g.items[0])!.chance, 1);
eq('success resets pity', [G.enhance(g, 'x', seq(0.999)).ok, g.items[0].pity[5]], [true, 0]);
g.items[0].pity[6] = 18; eq('guarantee +6', G.enhanceInfo(g.items[0])!.chance, 1);
eq('+6 fail goes to +4', (() => { g.items[0].pity[6] = 0; return G.enhance(g, 'x', seq(0.99)).to; })(), 4);
eq('lower fail keeps level', (() => { g.items[0].plus = 1; return G.enhance(g, 'x', seq(0.99)).to; })(), 1);
eq('stones cost', g.stones, 300 - 3 * 5);
g.stones = 2; eq('no stones', G.enhance(g, 'x', seq(0)).ok, false);
// runes
g = G.defaultGear(); g.items.push({ id: 'a', slot: 5, cls: 0, plus: 0, pity: Array(7).fill(0), rune: '' }, { id: 'b', slot: 5, cls: 1, plus: 0, pity: Array(7).fill(0), rune: '' });
g.runes.push({ id: 'r1', stat: 'dmg', tier: 3, on: '' }, { id: 'r2', stat: 'rate', tier: 0, on: '' });
G.equip(g, 'a'); G.setRune(g, 'a', 'r1');
eq('rune applied', G.totalStats(g).dmg, 5 + 16);
G.setRune(g, 'a', 'r2'); eq('old rune back to bag', g.runes.find((r) => r.id === 'r1')!.on, '');
G.setRune(g, 'b', 'r2'); eq('move rune', [g.items[0].rune, g.items[1].rune], ['', 'r2']);
eq('cannot salvage equipped', G.salvage(g, 'a'), -1);
eq('salvage gold', [G.salvage(g, 'b'), g.tokens, g.runes.find((r) => r.id === 'r2')!.on], [15, 15, '']);
// caps
g = G.defaultGear(); for (let s = 0; s < 6; s++) { g.items.push({ id: 'L' + s, slot: s, cls: 3, plus: 6, pity: Array(7).fill(0), rune: 'R' + s }); g.runes.push({ id: 'R' + s, stat: 'critRate', tier: 3, on: 'L' + s }); g.equipped[s] = 'L' + s; }
eq('crit cap', G.totalStats(g).critRate, 100);
// gacha
g = G.defaultGear(); g.tokens = 900; const ten = G.pull(g, 10, seq(0.01, 0.5));
eq('10-pull guarantee gold', ten.some((x) => x.cls >= 1), true); eq('cost 900', g.tokens, 0);
g.tokens = 100 * 80; g.gachaPity = 0; let lastLeg = -1; for (let i = 0; i < 80; i++) { const [it] = G.pull(g, 1, seq(0.01)); if (it.cls === 3) lastLeg = i; }
eq('legendary at 80th', lastLeg, 79);
g.tokens = 50; eq('not enough tokens', G.pull(g, 1, rnd).length, 0);
// normalize old save
eq('normalize undefined', G.normalizeGear(undefined).equipped.length, 6);
console.log('rule tests fails =', fails);

// ---- balance sim (average run reaches all 4 stages ~ 50%, else 1-3 stages) ----
function sim(runsPerTrial: (gg: G.GearState) => boolean, trials = 300) {
  let tot = 0;
  for (let t = 0; t < trials; t++) { const gg = G.defaultGear(); let runs = 0; while (!runsPerTrial(gg) && runs < 5000) { runs++; const stages = rnd() < 0.5 ? 4 : 1 + Math.floor(rnd() * 3); for (let s = 0; s < stages; s++) G.addDrops(gg, G.rollStageDrops(s, rnd)); } tot += runs; }
  return tot / trials;
}
// +6 one item: mine all, enhance one item
console.log('runs for +0→+6 one item:', sim((gg) => { if (!gg.items.length) gg.items.push({ id: 'z', slot: 0, cls: 0, plus: 0, pity: Array(7).fill(0), rune: '' }); G.mine(gg, gg.pickaxes, rnd); while (gg.stones >= 3 && gg.items[0].plus < 6) G.enhance(gg, 'z', rnd); return gg.items[0].plus >= 6; }).toFixed(1));
console.log('runs for first Legendary (pull x1):', sim((gg) => { while (gg.tokens >= 100) { const [it] = G.pull(gg, 1, rnd); if (it.cls === 3) return true; } return false; }).toFixed(1));
console.log('runs per rune:', sim((gg) => { G.blast(gg, gg.bombs, rnd); return gg.runes.length >= 1; }).toFixed(1));
console.log('runs per SR rune:', sim((gg) => { G.blast(gg, gg.bombs, rnd); return gg.runes.some((r) => r.tier === 3); }, 100).toFixed(1));
console.log('runs per first item (100 tokens):', sim((gg) => gg.tokens >= 100).toFixed(1));
