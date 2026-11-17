// วาดรูป UI สไตล์การ์ตูนน่ารัก (kawaii) ตามคำสั่งในไฟล์ 01/02 ของผู้ใช้
// ทุกฟังก์ชันคืนค่า SVG string; ไอคอนใช้ viewBox 256×256

const O = '#5a3324';
const SW = 6.5;
// รูปที่ผู้ใช้ให้มา (ตัดพื้นแล้ว) — render.cjs ใส่ไว้เป็น data URI
const UA = (typeof window !== 'undefined' && window.USER_ART) || {};
const uimg = (key, x, y, w, h) => `<image href="${UA[key]}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const C = {
  cream: '#fdf0d8', cream2: '#fce4cc', wood: '#c98b5e', woodD: '#9a6440', woodL: '#e8b98c',
  peach: '#fca890', peachL: '#fdc4ae', coral: '#f08478', orange: '#fca860',
  gold: '#ffd96a', goldD: '#f2b847', goldL: '#fff0b8',
  mint: '#8ee0be', mintD: '#5cc79c', straw: '#f88a96', strawL: '#fcb4a8',
  sky: '#8fc0e8', skyL: '#b4dcf2', lav: '#c9b8f5', skin: '#fcd8c0', blush: '#f9a8a8',
  grey: '#d9dde3', greyD: '#a4abb8', white: '#ffffff', ice: '#b4e4f0', hair: '#c0906c',
};
// ไล่สีแบบรูปผู้ใช้: สว่างด้านบนซ้าย มีเงาโค้งด้านล่างขวา
function hex6(c) {
  c = c.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
}
function mix(a, b, t) {
  const x = hex6(a);
  const y = hex6(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const GR = new Map();
function F(c) {
  if (!GR.has(c)) GR.set(c, 'g' + GR.size);
  return `url(#${GR.get(c)})`;
}
function gradDefs() {
  let d = '';
  for (const [c, id] of GR) {
    d += `<radialGradient id="${id}" cx="0.34" cy="0.28" r="0.9"><stop offset="0" stop-color="${mix(c, '#ffffff', 0.35)}"/><stop offset="0.45" stop-color="${c}"/><stop offset="0.74" stop-color="${c}"/><stop offset="0.75" stop-color="${mix(c, '#7a3a20', 0.12)}"/><stop offset="1" stop-color="${mix(c, '#7a3a20', 0.16)}"/></radialGradient>`;
  }
  GR.clear();
  return d;
}
const st = (w = SW) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const shine = (cx, cy, rx, ry, rot = 0, op = 0.6) =>
  op <= 0 ? '' :
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${Math.min(0.85, op + 0.1)}" transform="rotate(${rot} ${cx} ${cy})"/>
   <circle cx="${cx + rx * 1.25}" cy="${cy + ry * 1.5}" r="${Math.max(2.5, Math.min(rx, ry) * 0.42)}" fill="#fff" opacity="${Math.min(0.85, op + 0.1)}"/>`;
const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="100%" height="100%"><defs>${defs}${gradDefs()}</defs>${body}</svg>`;
function starPts(cx, cy, R, r, n = 5, rot = -90) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const rr = i % 2 ? r : R;
    p.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return p.join(' ');
}
const sparkle = (x, y, r, fill = '#fff', w = 5) =>
  `<path d="M${x},${y - r} Q${x},${y} ${x + r},${y} Q${x},${y} ${x},${y + r} Q${x},${y} ${x - r},${y} Q${x},${y} ${x},${y - r} Z" fill="${F(fill)}" ${st(w)}/>`;
const heart = (cx, cy, s, fill, stroke = true) =>
  `<path transform="translate(${cx} ${cy}) scale(${s})" d="M0,26 C-38,0 -32,-30 -12,-28 C-4,-27 0,-20 0,-16 C0,-20 4,-27 12,-28 C32,-30 38,0 0,26 Z" fill="${F(fill)}" ${stroke ? st(SW / s) : ''}/>`;

// ---------- ชิ้นส่วนที่ใช้ซ้ำ ----------
function chibi(cx, cy, s, shirt, helmet) {
  return `<g transform="translate(${cx} ${cy}) scale(${s}) translate(-128 -128)">
    <path d="M48,250 Q48,178 128,178 Q208,178 208,250 Z" fill="${F(shirt)}" ${st()}/>
    <circle cx="128" cy="120" r="72" fill="${F(C.skin)}" ${st()}/>
    <path d="M54,114 Q56,40 128,38 Q200,40 202,114 Z" fill="${F(helmet)}" ${st()}/>
    <rect x="44" y="104" width="168" height="24" rx="12" fill="${F(shirt)}" ${st()}/>
    <circle cx="102" cy="148" r="10" fill="${O}"/><circle cx="154" cy="148" r="10" fill="${O}"/>
    <circle cx="105" cy="144" r="3.5" fill="#fff"/><circle cx="157" cy="144" r="3.5" fill="#fff"/>
    <ellipse cx="84" cy="166" rx="14" ry="9" fill="${F(C.blush)}" opacity="0.85"/>
    <ellipse cx="172" cy="166" rx="14" ry="9" fill="${F(C.blush)}" opacity="0.85"/>
    <path d="M117,168 Q128,178 139,168" fill="none" ${st(6)}/>
    ${shine(92, 66, 18, 9, -30, 0.55)}
  </g>`;
}
function coinShape(cx, cy, s, rot = -12) {
  return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s}) translate(-128 -128)">
    <ellipse cx="128" cy="138" rx="92" ry="98" fill="${F(C.goldD)}" ${st()}/>
    <ellipse cx="128" cy="124" rx="92" ry="98" fill="${F(C.gold)}" ${st()}/>
    <ellipse cx="128" cy="124" rx="64" ry="70" fill="none" stroke="${C.goldD}" stroke-width="9"/>
    <polygon points="${starPts(128, 126, 36, 16)}" fill="${F(C.goldL)}" stroke="${C.goldD}" stroke-width="7" stroke-linejoin="round"/>
    ${shine(90, 74, 22, 11, -40, 0.7)}
  </g>`;
}
function tent(cx, cy, s) {
  return `<g transform="translate(${cx} ${cy}) scale(${s}) translate(-128 -128)">
    <line x1="128" y1="44" x2="128" y2="10" ${st(8)}/>
    <path d="M128,12 L176,24 L128,38 Z" fill="${F(C.straw)}" ${st(7)}/>
    <path d="M28,220 L116,56 Q128,36 140,56 L228,220 Z" fill="${F(C.orange)}" ${st()}/>
    <path d="M128,52 L86,220 L170,220 Z" fill="${F(C.cream)}" ${st(7)}/>
    <path d="M128,118 Q104,170 100,220 L156,220 Q152,170 128,118 Z" fill="${F(C.woodD)}" ${st(7)}/>
    ${shine(84, 150, 10, 30, 28, 0.45)}
  </g>`;
}
function target(cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${F(C.straw)}" ${st()}/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="${F(C.cream)}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.46}" fill="${F(C.straw)}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.2}" fill="${F(C.cream)}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${st()}/>
    ${shine(cx - r * 0.45, cy - r * 0.55, r * 0.2, r * 0.1, -35, 0.6)}`;
}
function arrow(x1, y1, x2, y2, feather) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const deg = (a * 180) / Math.PI;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${O}" stroke-width="18" stroke-linecap="round"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.woodL}" stroke-width="8" stroke-linecap="round"/>
    <g transform="translate(${x2} ${y2}) rotate(${deg})">
      <path d="M-34,0 L4,-20 L14,-20 L-10,0 Z" fill="${F(feather)}" ${st(6)}/>
      <path d="M-34,0 L4,20 L14,20 L-10,0 Z" fill="${F(feather)}" ${st(6)}/>
    </g>`;
}
function sword(rot, cx = 128, cy = 136) {
  return `<g transform="rotate(${rot} ${cx} ${cy})">
    <path d="M114,176 L114,52 L128,26 L142,52 L142,176 Z" fill="${F('#eef2f8')}" ${st()}/>
    <line x1="128" y1="44" x2="128" y2="170" stroke="#c7cfdc" stroke-width="6" stroke-linecap="round"/>
    <rect x="84" y="170" width="88" height="22" rx="11" fill="${F(C.gold)}" ${st()}/>
    <rect x="117" y="190" width="22" height="40" rx="8" fill="${F(C.wood)}" ${st()}/>
    <circle cx="128" cy="236" r="12" fill="${F(C.gold)}" ${st()}/>
  </g>`;
}
function crate(x, y, w) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="10" fill="${F('#e6b47a')}" ${st()}/>
    <rect x="${x + 12}" y="${y + 12}" width="${w - 24}" height="${w - 24}" rx="6" fill="none" stroke="${C.woodD}" stroke-width="6"/>
    <line x1="${x + 14}" y1="${y + 14}" x2="${x + w - 14}" y2="${y + w - 14}" stroke="${C.woodD}" stroke-width="6" stroke-linecap="round"/>
    <polygon points="${starPts(x + w * 0.7, y + w * 0.3, 11, 5)}" fill="${F(C.straw)}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
}
function helmetDome(cx, cy, w, fill) {
  const h = w * 0.55;
  return `<path d="M${cx - w / 2},${cy} Q${cx - w / 2},${cy - h} ${cx},${cy - h} Q${cx + w / 2},${cy - h} ${cx + w / 2},${cy} Z" fill="${F(fill)}" ${st(7)}/>
    <rect x="${cx - w / 2 - 8}" y="${cy - 8}" width="${w + 16}" height="16" rx="8" fill="${F(C.sky)}" ${st(7)}/>
    ${shine(cx - w * 0.2, cy - h * 0.6, w * 0.1, h * 0.12, -30, 0.55)}`;
}
const cloud = (x, y, s, fill = '#fff', w = 5) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-40,10 Q-46,-12 -24,-14 Q-18,-34 4,-28 Q16,-42 32,-26 Q52,-24 46,-2 Q56,14 36,16 L-30,16 Q-48,16 -40,10 Z" fill="${F(fill)}" ${st(w / s)}/></g>`;

function plusBadge(cx, cy, r) {
  const a = r * 0.22;
  const b = r * 0.62;
  const d = `M${cx - a},${cy - b} H${cx + a} V${cy - a} H${cx + b} V${cy + a} H${cx + a} V${cy + b} H${cx - a} V${cy + a} H${cx - b} V${cy - a} H${cx - a} Z`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${F(C.mint)}" ${st()}/><path d="${d}" fill="${F(C.cream)}" ${st(5)}/>`;
}
function laurel(cx, cy, R) {
  let out = '';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      // ไล่จากล่างขึ้นบนตามขอบวงกลม
      const deg = 90 + side * (28 + i * 20);
      const r = (deg * Math.PI) / 180;
      const x = cx + Math.cos(r) * R;
      const y = cy + Math.sin(r) * R;
      out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="15" ry="8" transform="rotate(${(deg + 90 + side * 35).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${F(C.mint)}" ${st(4.5)}/>`;
    }
  }
  return out;
}

// ---------- ฮีโร่ (ภาพครึ่งตัว) ----------
function heroBust(body, inner) {
  return `
    <path d="M44,252 Q46,178 128,176 Q210,178 212,252 Z" fill="${F(body)}" ${st()}/>
    <circle cx="128" cy="118" r="70" fill="${F(C.skin)}" ${st()}/>
    <circle cx="102" cy="132" r="9" fill="${O}"/><circle cx="154" cy="132" r="9" fill="${O}"/>
    <circle cx="105" cy="128" r="3.5" fill="#fff"/><circle cx="157" cy="128" r="3.5" fill="#fff"/>
    <ellipse cx="84" cy="152" rx="13" ry="8" fill="${C.blush}" opacity="0.85"/>
    <ellipse cx="172" cy="152" rx="13" ry="8" fill="${C.blush}" opacity="0.85"/>
    <path d="M116,156 Q128,166 140,156" fill="none" ${st(5)}/>
    ${inner}`;
}
const HERO_ART = {
  hero_0: () => svg(256, 256, heroBust('#f3f4f6', `
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${70 + i * 19},70 L${62 + i * 19},${22 + (i % 2) * 14} L${88 + i * 19},64 Z" fill="${F('#7c3aed')}" ${st(5)}/>`).join('')}
    <path d="M58,96 Q60,48 128,46 Q196,48 198,96 Q170,74 128,76 Q86,74 58,96 Z" fill="${F('#8b5cf6')}" ${st()}/>
    <rect x="66" y="106" width="124" height="20" rx="10" fill="${F('#4b5563')}" ${st(5)}/>
    <circle cx="100" cy="116" r="20" fill="${F('#a7f3a0')}" ${st(6)}/><circle cx="156" cy="116" r="20" fill="${F('#a7f3a0')}" ${st(6)}/>
    <path d="M128,182 L112,252 L144,252 Z" fill="${F('#8b5cf6')}" ${st(5)}/>
    <circle cx="206" cy="200" r="26" fill="${F('#7cf26b')}" ${st()}/><rect x="198" y="160" width="16" height="22" rx="4" fill="${F('#e5e7eb')}" ${st(5)}/>
    ${shine(196, 190, 7, 4, -30, 0.7)}`)),
  hero_1: () => svg(256, 256, heroBust('#d94b3a', `
    <path d="M50,140 Q42,40 128,34 Q214,40 206,140 Q190,96 128,92 Q66,96 50,140 Z" fill="${F('#7f1d1d')}" ${st()}/>
    <rect x="76" y="100" width="104" height="12" rx="6" fill="${F('#ffb02e')}" ${st(4)}/>
    <circle cx="44" cy="214" r="34" fill="${F('#ef4444')}" ${st()}/><circle cx="212" cy="214" r="34" fill="${F('#ef4444')}" ${st()}/>
    <path d="M200,170 Q214,150 206,128 Q226,148 224,176 Z M44,170 Q30,150 38,128 Q18,148 20,176 Z" fill="${F('#ffb02e')}" ${st(4)}/>
    ${shine(32, 200, 9, 5, -30, 0.7)}${shine(200, 200, 9, 5, -30, 0.7)}`)),
  hero_2: () => svg(256, 256, heroBust('#3f7d4a', `
    <path d="M60,206 L196,206 M60,226 L196,226" stroke="#1f3d26" stroke-width="9"/>
    <path d="M58,92 Q60,46 128,44 Q196,46 198,92 Z" fill="${F('#b91c1c')}" ${st()}/>
    <rect x="52" y="86" width="152" height="18" rx="9" fill="${F('#991b1b')}" ${st(5)}/>
    <path d="M86,150 Q128,214 170,150 Q156,176 128,178 Q100,176 86,150 Z" fill="${F('#8b5a2b')}" ${st(5)}/>
    <line x1="214" y1="250" x2="214" y2="70" stroke="${O}" stroke-width="20" stroke-linecap="round"/>
    <line x1="214" y1="250" x2="214" y2="70" stroke="${C.woodL}" stroke-width="10" stroke-linecap="round"/>
    <path d="M214,70 Q256,74 252,120 Q236,112 214,118 Z" fill="${F('#c0c6d0')}" ${st()}/>`)),
  hero_3: () => svg(256, 256, heroBust('#4b8fd9', `
    <path d="M14,82 Q128,6 242,82 Q128,96 14,82 Z" fill="${F('#e8c27a')}" ${st()}/>
    <path d="M60,82 Q128,40 196,82" fill="none" stroke="#b98a46" stroke-width="6"/>
    <rect x="58" y="214" width="140" height="14" rx="6" fill="${F('#f5f5f4')}" ${st(4)}/>
    <line x1="222" y1="252" x2="222" y2="110" stroke="${O}" stroke-width="16" stroke-linecap="round"/>
    <line x1="222" y1="252" x2="222" y2="110" stroke="${C.woodL}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="222" cy="100" r="16" fill="none" stroke="${O}" stroke-width="12"/><circle cx="222" cy="100" r="16" fill="none" stroke="#93c5fd" stroke-width="6"/>
    <path d="M18,180 Q40,170 30,150 M28,214 Q52,204 42,184" fill="none" stroke="#bfe3ff" stroke-width="7" stroke-linecap="round"/>`)),
  hero_4: () => svg(256, 256, heroBust('#334155', `
    <path d="M58,104 Q58,46 128,44 Q198,46 198,104 Z" fill="${F('#f8fafc')}" ${st()}/>
    <path d="M100,78 L128,62 L156,78 L128,92 Z" fill="${F('#2563eb')}" ${st(4)}/>
    <path d="M70,104 Q128,96 200,108 L208,124 Q130,112 64,120 Z" fill="${F('#2563eb')}" ${st(5)}/>
    <circle cx="54" cy="128" r="16" fill="${F('#38f2ff')}" ${st()}/><circle cx="202" cy="128" r="16" fill="${F('#38f2ff')}" ${st()}/>
    <path d="M54,144 Q60,168 92,164" fill="none" ${st(5)}/>
    <g transform="translate(196 30)"><rect x="-34" y="-8" width="68" height="16" rx="6" fill="${F('#475569')}" ${st(5)}/>
    <line x1="-46" y1="-14" x2="-18" y2="-14" ${st(5)}/><line x1="18" y1="-14" x2="46" y2="-14" ${st(5)}/></g>`)),
  hero_5: () => svg(256, 256, heroBust('#b7791f', `
    <path d="M44,74 Q128,30 212,74 L196,96 Q128,74 60,96 Z" fill="${F('#2b2b2b')}" ${st()}/>
    <path d="M78,72 Q128,4 178,72 Z" fill="${F('#2b2b2b')}" ${st()}/>
    <circle cx="128" cy="56" r="10" fill="${F('#facc15')}" ${st(4)}/>
    <rect x="60" y="176" width="136" height="18" rx="8" fill="${F('#b91c1c')}" ${st(5)}/>
    <g transform="translate(36 214) rotate(-30)"><rect x="-10" y="-34" width="20" height="56" rx="5" fill="${F('#374151')}" ${st(5)}/><rect x="-10" y="14" width="22" height="26" rx="6" fill="${F('#8b5a2b')}" ${st(5)}/></g>
    <g transform="translate(220 214) rotate(30)"><rect x="-10" y="-34" width="20" height="56" rx="5" fill="${F('#374151')}" ${st(5)}/><rect x="-12" y="14" width="22" height="26" rx="6" fill="${F('#8b5a2b')}" ${st(5)}/></g>`)),
  trophy: () => svg(256, 256, `
    <path d="M70,52 Q22,52 26,96 Q32,136 84,140" fill="none" ${st(14)}/><path d="M70,52 Q22,52 26,96 Q32,136 84,140" fill="none" stroke="${C.goldD}" stroke-width="7"/>
    <path d="M186,52 Q234,52 230,96 Q224,136 172,140" fill="none" ${st(14)}/><path d="M186,52 Q234,52 230,96 Q224,136 172,140" fill="none" stroke="${C.goldD}" stroke-width="7"/>
    <path d="M62,32 L194,32 Q196,140 128,158 Q60,140 62,32 Z" fill="${F(C.gold)}" ${st()}/>
    <rect x="110" y="156" width="36" height="40" fill="${F(C.goldD)}" ${st()}/>
    <rect x="70" y="192" width="116" height="38" rx="10" fill="${F(C.woodL)}" ${st()}/>
    <polygon points="${starPts(128, 86, 26, 11)}" fill="${C.goldL}" stroke="${C.goldD}" stroke-width="5" stroke-linejoin="round"/>
    ${shine(88, 64, 10, 22, 10, 0.6)}`),
  team: () => svg(256, 256, `
    <path d="M128,20 L216,52 Q212,170 128,236 Q44,170 40,52 Z" fill="${F(C.sky)}" ${st()}/>
    <path d="M128,44 L196,68 Q192,160 128,212 Q64,160 60,68 Z" fill="none" stroke="${C.gold}" stroke-width="9"/>
    <polygon points="${starPts(128, 126, 50, 22)}" fill="${F(C.gold)}" ${st(7)}/>
    ${shine(84, 76, 10, 22, 20, 0.55)}`),
};

// ---------- ไอคอน ----------
const ICONS = {
  coin: () => svg(256, 256, coinShape(128, 124, 1)),
  star: () => svg(256, 256, `
    <polygon points="${starPts(124, 138, 108, 50)}" fill="${F(C.gold)}" ${st(11)}/>
    <polygon points="${starPts(124, 138, 62, 28)}" fill="${F(C.goldL)}" opacity="0.8"/>
    ${shine(88, 102, 16, 8, -30, 0.75)}
    ${sparkle(214, 48, 22)}`),
  stamina: () => svg(256, 256, `
    <polygon points="156,16 56,142 120,142 94,240 204,104 140,104 176,16" fill="${F(C.gold)}" ${st(12)}/>
    <polygon points="150,34 84,124 108,124 136,62" fill="${F(C.goldL)}" opacity="0.85"/>`),
  settings: () => {
    let teeth = '';
    for (let i = 0; i < 8; i++) teeth += `<rect x="104" y="18" width="48" height="56" rx="14" fill="${F(C.skyL)}" ${st()} transform="rotate(${i * 45} 128 128)"/>`;
    return svg(256, 256, `${teeth}<circle cx="128" cy="128" r="80" fill="${F(C.skyL)}" ${st()}/>
      <circle cx="128" cy="128" r="32" fill="${F(C.cream)}" ${st()}/>${shine(90, 84, 20, 10, -40, 0.6)}`);
  },
  pause: () => svg(256, 256, `
    <circle cx="128" cy="132" r="106" fill="${F('#f78c9c')}" ${st()}/>
    <circle cx="128" cy="122" r="106" fill="${F('#ffa8b5')}" ${st()}/>
    <rect x="84" y="72" width="32" height="104" rx="16" fill="${F(C.cream)}" ${st()}/>
    <rect x="140" y="72" width="32" height="104" rx="16" fill="${F(C.cream)}" ${st()}/>
    ${shine(70, 64, 22, 11, -40, 0.6)}`),
  troop: () => svg(256, 256, chibi(128, 128, 1, C.sky, '#8ec5ff')),
  timeline: () => svg(256, 256, `
    <rect x="40" y="60" width="176" height="146" rx="16" fill="${F('#fde9c4')}" ${st()}/>
    <rect x="20" y="48" width="38" height="170" rx="19" fill="${F('#f6d39a')}" ${st()}/>
    <rect x="198" y="48" width="38" height="170" rx="19" fill="${F('#f6d39a')}" ${st()}/>
    <path d="M70,178 Q96,118 128,148 T186,94" fill="none" stroke="${C.wood}" stroke-width="8" stroke-dasharray="2 16" stroke-linecap="round"/>
    <path d="M186,110 Q170,92 178,78 Q186,66 194,78 Q202,92 186,110 Z" fill="${F(C.straw)}" ${st(7)}/>
    <circle cx="186" cy="84" r="6" fill="#fff"/>
    <path d="M118,206 L118,236 L128,228 L138,236 L138,206 Z" fill="${F(C.straw)}" ${st(7)}/>
    ${shine(66, 82, 16, 7, -20, 0.55)}`),
  camp: () => svg(256, 256, `<ellipse cx="128" cy="226" rx="104" ry="12" fill="${O}" opacity="0.12"/>${tent(128, 128, 1)}`),
  lock: () => svg(256, 256, `
    <path d="M78,124 V86 Q78,34 128,34 Q178,34 178,86 V124" fill="none" stroke="${O}" stroke-width="34" stroke-linecap="round"/>
    <path d="M78,124 V86 Q78,34 128,34 Q178,34 178,86 V124" fill="none" stroke="${C.grey}" stroke-width="18" stroke-linecap="round"/>
    <rect x="42" y="110" width="172" height="128" rx="32" fill="${F(C.gold)}" ${st()}/>
    ${heart(128, 172, 1.1, O, false)}
    ${shine(74, 134, 18, 9, -30, 0.65)}`),
  check: () => svg(256, 256, `
    <circle cx="128" cy="134" r="104" fill="${F(C.mintD)}" ${st()}/>
    <circle cx="128" cy="124" r="104" fill="${F(C.mint)}" ${st()}/>
    <path d="M76,128 L112,162 L182,90" fill="none" stroke="${O}" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M76,128 L112,162 L182,90" fill="none" stroke="${C.cream}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
    ${shine(76, 70, 22, 11, -40, 0.6)}`),
  crown: () => svg(256, 256, `
    <path d="M46,186 L36,82 L94,128 L128,58 L162,128 L220,82 L210,186 Z" fill="${F(C.gold)}" ${st()}/>
    <circle cx="36" cy="76" r="15" fill="${F(C.gold)}" ${st()}/><circle cx="128" cy="50" r="17" fill="${F(C.gold)}" ${st()}/><circle cx="220" cy="76" r="15" fill="${F(C.gold)}" ${st()}/>
    <rect x="40" y="170" width="176" height="48" rx="16" fill="${F(C.goldD)}" ${st()}/>
    <circle cx="84" cy="194" r="13" fill="${F(C.straw)}" ${st(6)}/><circle cx="128" cy="194" r="16" fill="${F(C.straw)}" ${st(6)}/><circle cx="172" cy="194" r="13" fill="${F(C.straw)}" ${st(6)}/>
    <circle cx="124" cy="189" r="5" fill="#fff"/><circle cx="81" cy="190" r="4" fill="#fff"/><circle cx="169" cy="190" r="4" fill="#fff"/>
    ${shine(82, 118, 12, 26, 20, 0.55)}`),
  crystal: () => svg(256, 256, `
    <polygon points="64,224 36,146 64,96 94,146 98,224" fill="${F(C.skyL)}" ${st()}/>
    <polygon points="190,224 160,154 194,100 224,152 218,224" fill="${F(C.ice)}" ${st()}/>
    <polygon points="98,230 90,112 128,26 166,112 158,230" fill="${F('#7dd8f0')}" ${st()}/>
    <polygon points="128,34 96,112 102,224 128,224" fill="#fff" opacity="0.35"/>
    <polygon points="64,102 44,146 66,220 64,146" fill="#fff" opacity="0.35"/>
    ${sparkle(212, 58, 20)}${sparkle(48, 64, 13)}`),
  hand: () => svg(256, 256, `
    <path d="M86,204 Q68,160 80,134 Q92,114 112,128 L112,62 Q112,36 136,36 Q160,36 160,62 L160,120 Q180,108 192,126 Q210,122 214,146 Q220,184 196,206 Z" fill="#fff" ${st()}/>
    <path d="M160,130 L160,150 M192,128 Q190,142 192,154" fill="none" ${st(6)}/>
    <rect x="82" y="196" width="118" height="44" rx="16" fill="${F('#e3e9f3')}" ${st()}/>
    <line x1="104" y1="208" x2="104" y2="228" ${st(5)}/><line x1="141" y1="208" x2="141" y2="228" ${st(5)}/><line x1="178" y1="208" x2="178" y2="228" ${st(5)}/>
    <path d="M98,36 Q88,26 88,12 M174,36 Q184,26 184,12 M136,14 L136,2" fill="none" stroke="${C.goldD}" stroke-width="8" stroke-linecap="round"/>
    ${shine(130, 70, 8, 18, 0, 0.0)}`),
  gift: () => svg(256, 256, `
    <rect x="40" y="114" width="176" height="118" rx="16" fill="${F(C.strawL)}" ${st()}/>
    <rect x="112" y="114" width="32" height="118" fill="${F(C.gold)}" ${st()}/>
    <ellipse cx="96" cy="62" rx="38" ry="24" transform="rotate(-24 96 62)" fill="${F(C.gold)}" ${st()}/>
    <ellipse cx="160" cy="62" rx="38" ry="24" transform="rotate(24 160 62)" fill="${F(C.gold)}" ${st()}/>
    <rect x="26" y="84" width="204" height="46" rx="14" fill="${F(C.straw)}" ${st()}/>
    <rect x="110" y="84" width="36" height="46" fill="${F(C.gold)}" ${st()}/>
    <circle cx="128" cy="76" r="16" fill="${F(C.goldD)}" ${st()}/>
    ${shine(62, 98, 16, 6, -10, 0.6)}${shine(70, 150, 10, 20, 0, 0.45)}`),
  sound: () => svg(256, 256, `
    <path d="M36,100 H80 L136,54 V202 L80,156 H36 Z" fill="${F(C.skyL)}" ${st()}/>
    <path d="M166,96 Q188,128 166,160" fill="none" ${st(12)}/>
    <path d="M194,70 Q232,128 194,186" fill="none" ${st(12)}/>
    ${shine(70, 116, 10, 18, 0, 0.6)}`),
  music: () => svg(256, 256, `
    <polygon points="104,62 204,40 204,78 104,100" fill="${O}"/>
    <line x1="106" y1="64" x2="106" y2="186" ${st(12)}/>
    <line x1="202" y1="44" x2="202" y2="164" ${st(12)}/>
    <ellipse cx="78" cy="190" rx="34" ry="25" transform="rotate(-20 78 190)" fill="${F(C.strawL)}" ${st()}/>
    <ellipse cx="174" cy="168" rx="34" ry="25" transform="rotate(-20 174 168)" fill="${F(C.gold)}" ${st()}/>
    ${shine(66, 180, 10, 6, -20, 0.7)}${shine(162, 158, 10, 6, -20, 0.7)}`),
  vibration: () => svg(256, 256, `
    <rect x="80" y="26" width="96" height="204" rx="24" fill="${F(C.sky)}" ${st()}/>
    <rect x="96" y="54" width="64" height="134" rx="10" fill="${F(C.cream)}" ${st(6)}/>
    <circle cx="128" cy="208" r="8" fill="${F(C.cream)}"/>
    <path d="M56,74 Q40,92 56,110 Q72,128 56,146 Q40,164 56,182" fill="none" ${st(9)}/>
    <path d="M200,74 Q216,92 200,110 Q184,128 200,146 Q216,164 200,182" fill="none" ${st(9)}/>
    ${shine(110, 74, 6, 12, 0, 0.7)}`),
  stat_rate: () => svg(256, 256, `
    <path d="M128,238 C64,238 40,190 54,146 C66,112 98,98 92,48 C134,72 154,106 148,134 C164,120 170,102 166,84 C204,116 216,160 204,194 C192,224 164,238 128,238 Z" fill="${F('#ff9e5e')}" ${st()}/>
    <path d="M128,226 C96,226 82,200 90,176 C96,158 116,150 116,124 C138,140 148,160 142,178 C154,172 160,160 160,150 C178,170 180,196 170,210 C162,222 148,226 128,226 Z" fill="${F(C.gold)}"/>
    <circle cx="112" cy="190" r="8" fill="${O}"/><circle cx="148" cy="190" r="8" fill="${O}"/>
    <path d="M120,206 Q130,214 140,206" fill="none" ${st(5)}/>
    <ellipse cx="102" cy="204" rx="9" ry="6" fill="${F(C.blush)}"/><ellipse cx="158" cy="204" rx="9" ry="6" fill="${F(C.blush)}"/>
    ${sparkle(208, 54, 18)}`),
  stat_range: () => svg(256, 256, `${target(116, 142, 98)}${arrow(116, 142, 220, 38, C.sky)}`),
  stat_power: () => svg(256, 256, `
    <polygon points="${starPts(128, 130, 116, 80, 12)}" fill="${F('#ffb08f')}" ${st(11)}/>
    <polygon points="${starPts(128, 130, 76, 54, 12, -75)}" fill="${F(C.gold)}"/>
    <circle cx="128" cy="130" r="32" fill="${F(C.goldL)}"/>
    <circle cx="214" cy="40" r="14" fill="${F('#ffb08f')}" ${st(6)}/><circle cx="36" cy="214" r="11" fill="${F('#ffb08f')}" ${st(6)}/>
    ${shine(84, 76, 16, 8, -40, 0.55)}`),

  // ----- อัปเกรดประจำยุค -----
  up_troop: () => svg(256, 256, UA.troop ? `
    ${uimg('troop', 2, 30, 132, 132)}${uimg('troop', 122, 30, 132, 132)}${uimg('troop', 52, 76, 158, 158)}
    ${plusBadge(210, 206, 34)}` : `
    ${chibi(70, 110, 0.48, C.sky, '#8ec5ff')}${chibi(186, 110, 0.48, C.mint, '#a7f0d0')}
    ${chibi(128, 146, 0.58, C.straw, C.strawL)}
    ${plusBadge(206, 206, 36)}`),
  up_capacity: () => svg(256, 256, `
    ${UA.camp ? uimg('camp', 0, 40, 176, 176) : tent(98, 124, 0.78)}
    ${helmetDome(198, 234, 70, '#8ec5ff')}${helmetDome(198, 192, 62, C.mint)}${helmetDome(198, 154, 54, '#8ec5ff')}`),
  up_power: () => svg(256, 256, `
    <circle cx="128" cy="134" r="112" fill="${F(C.gold)}" opacity="0.35"/>
    ${sword(-40)}${sword(40)}
    ${sparkle(40, 50, 18)}${sparkle(220, 60, 14)}${sparkle(214, 210, 12)}`),
  up_economy: () => svg(256, 256, `
    <path d="M62,232 Q34,198 50,150 Q64,112 104,100 L94,72 Q128,58 162,72 L152,100 Q192,112 206,150 Q222,198 194,232 Z" fill="${F('#ebcf9f')}" ${st()}/>
    <path d="M96,98 Q128,112 160,98" fill="none" stroke="${C.woodD}" stroke-width="10" stroke-linecap="round"/>
    ${coinShape(128, 176, 0.36, 0)}
    ${coinShape(196, 62, 0.42, 18)}
    <path d="M150,58 L166,62 M160,30 L170,42 M190,18 L192,32" fill="none" stroke="${C.goldD}" stroke-width="7" stroke-linecap="round"/>
    ${shine(76, 170, 10, 26, 10, 0.4)}`),

  // ----- ค่ายฝึก -----
  camp_funds: () => svg(256, 256, `
    <path d="M36,128 L48,70 Q128,40 208,70 L220,128 Z" fill="${F(C.woodD)}" ${st()}/>
    ${coinShape(84, 116, 0.32, -20)}${coinShape(170, 112, 0.32, 15)}${coinShape(126, 98, 0.36, 0)}${coinShape(104, 128, 0.3, 10)}${coinShape(150, 132, 0.3, -10)}
    <rect x="30" y="124" width="196" height="104" rx="14" fill="${F(C.wood)}" ${st()}/>
    <rect x="58" y="124" width="22" height="104" fill="${F(C.goldD)}" ${st(6)}/>
    <rect x="176" y="124" width="22" height="104" fill="${F(C.goldD)}" ${st(6)}/>
    <rect x="110" y="142" width="36" height="40" rx="8" fill="${F(C.gold)}" ${st(6)}/>
    <circle cx="128" cy="160" r="6" fill="${O}"/>
    ${shine(48, 150, 6, 22, 0, 0.35)}`),
  camp_aim: () => svg(256, 256, `${target(122, 146, 102)}
    ${arrow(122, 146, 226, 52, C.sky)}${arrow(122, 146, 200, 26, C.mint)}${arrow(122, 146, 238, 96, C.straw)}`),
  camp_veteran: () => svg(256, 256, `
    <path d="M78,16 L122,16 L148,104 L110,112 Z" fill="${F(C.sky)}" ${st()}/>
    <path d="M178,16 L134,16 L108,104 L146,112 Z" fill="${F(C.straw)}" ${st()}/>
    <circle cx="128" cy="164" r="72" fill="${F(C.goldD)}" ${st()}/>
    <circle cx="128" cy="158" r="72" fill="${F(C.gold)}" ${st()}/>
    <polygon points="${starPts(128, 160, 44, 20)}" fill="${F(C.goldL)}" stroke="${C.goldD}" stroke-width="7" stroke-linejoin="round"/>
    ${shine(94, 120, 18, 9, -40, 0.65)}`),
  camp_logistics: () => svg(256, 256, `${crate(30, 132, 96)}${crate(130, 132, 96)}${crate(80, 40, 96)}`),

  // ----- ไอคอนยุค -----
  era_0: () => svg(256, 256, `
    <line x1="74" y1="214" x2="150" y2="96" stroke="${O}" stroke-width="40" stroke-linecap="round"/>
    <line x1="74" y1="214" x2="150" y2="96" stroke="${C.wood}" stroke-width="24" stroke-linecap="round"/>
    <ellipse cx="160" cy="76" rx="44" ry="56" transform="rotate(34 160 76)" fill="${F('#e6b47a')}" ${st()}/>
    <circle cx="146" cy="60" r="7" fill="${F(C.woodD)}"/><circle cx="176" cy="88" r="6" fill="${F(C.woodD)}"/>
    <ellipse cx="178" cy="202" rx="58" ry="40" fill="${F(C.grey)}" ${st()}/>
    <ellipse cx="196" cy="214" rx="12" ry="8" fill="${F(C.greyD)}" opacity="0.6"/>
    ${shine(150, 182, 16, 8, -20, 0.7)}${shine(140, 50, 10, 16, 34, 0.5)}`),
  era_1: () => svg(256, 256, `
      ${laurel(128, 146, 98)}
      <rect x="60" y="208" width="136" height="28" rx="9" fill="${F(C.cream2)}" ${st()}/>
      <rect x="86" y="76" width="84" height="136" fill="${F('#fffaf0')}" ${st()}/>
      <line x1="106" y1="88" x2="106" y2="200" stroke="${C.greyD}" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
      <line x1="128" y1="88" x2="128" y2="200" stroke="${C.greyD}" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
      <line x1="150" y1="88" x2="150" y2="200" stroke="${C.greyD}" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
      <rect x="62" y="46" width="132" height="32" rx="10" fill="${F(C.cream2)}" ${st()}/>
      <circle cx="74" cy="62" r="12" fill="${F(C.cream2)}" ${st(5)}/><circle cx="182" cy="62" r="12" fill="${F(C.cream2)}" ${st(5)}/>
      ${shine(104, 110, 6, 20, 0, 0.5)}`),
  era_2: () => svg(256, 256, `
    ${sword(-40, 128, 128)}
    <path d="M128,236 Q46,200 44,98 L44,56 Q90,56 128,30 Q166,56 212,56 L212,98 Q210,200 128,236 Z" fill="${F(C.sky)}" ${st()}/>
    <path d="M128,214 Q66,186 64,104 L64,72 Q98,72 128,52 Q158,72 192,72 L192,104 Q190,186 128,214 Z" fill="none" stroke="${C.gold}" stroke-width="10"/>
    ${heart(128, 128, 1.5, C.strawL)}
    ${shine(80, 90, 12, 24, 20, 0.5)}`),
  era_3: () => svg(256, 256, `
    <circle cx="214" cy="74" r="22" fill="#fff" ${st(6)}/><circle cx="190" cy="52" r="26" fill="#fff" ${st(6)}/><circle cx="222" cy="40" r="18" fill="#fff" ${st(6)}/>
    <g transform="rotate(-22 128 128)">
      <rect x="46" y="98" width="156" height="60" rx="30" fill="${F('#5b5f6b')}" ${st()}/>
      <rect x="182" y="90" width="28" height="76" rx="12" fill="${F('#474a54')}" ${st()}/>
      ${shine(96, 112, 34, 7, 0, 0.35)}
    </g>
    <circle cx="104" cy="182" r="48" fill="${F(C.wood)}" ${st()}/>
    <line x1="104" y1="140" x2="104" y2="224" stroke="${C.woodD}" stroke-width="7"/><line x1="62" y1="182" x2="146" y2="182" stroke="${C.woodD}" stroke-width="7"/>
    <circle cx="104" cy="182" r="16" fill="${F(C.goldD)}" ${st(6)}/>`),
  era_4: () => svg(256, 256, `
    <path d="M40,174 Q38,62 128,58 Q218,62 216,174 Z" fill="${F(C.mint)}" ${st()}/>
    <rect x="24" y="162" width="208" height="32" rx="16" fill="${F(C.mintD)}" ${st()}/>
    <rect x="58" y="112" width="140" height="22" rx="10" fill="${F(C.woodD)}" ${st(6)}/>
    <circle cx="96" cy="122" r="26" fill="${F(C.skyL)}" ${st()}/><circle cx="160" cy="122" r="26" fill="${F(C.skyL)}" ${st()}/>
    <circle cx="88" cy="114" r="7" fill="#fff"/><circle cx="152" cy="114" r="7" fill="#fff"/>
    ${shine(84, 82, 22, 10, -25, 0.55)}`),
  era_5: () => svg(256, 256, `
    <circle cx="128" cy="124" r="118" fill="${F('#7ff3ff')}" opacity="0.28"/>
    <path d="M106,196 Q128,252 150,196 Z" fill="${F(C.gold)}" ${st(7)}/>
    <path d="M116,196 Q128,226 140,196 Z" fill="${F('#fff3a6')}"/>
    <path d="M80,150 L42,206 L88,194 Z" fill="${F(C.strawL)}" ${st()}/>
    <path d="M176,150 L214,206 L168,194 Z" fill="${F(C.strawL)}" ${st()}/>
    <path d="M128,18 Q188,66 178,176 L78,176 Q68,66 128,18 Z" fill="${F(C.cream)}" ${st()}/>
    <rect x="96" y="172" width="64" height="24" rx="9" fill="${F(C.greyD)}" ${st()}/>
    <circle cx="128" cy="96" r="26" fill="${F('#7ff3ff')}" ${st()}/>
    ${shine(118, 86, 9, 6, -30, 0.8)}${shine(100, 70, 8, 24, 10, 0.5)}
    ${sparkle(40, 50, 14, '#7ff3ff')}${sparkle(216, 64, 12, '#ffd1f0')}`),
};

// ---------- ภาพปกยุค (640×240 เต็มกรอบ) ----------
function card(era) {
  const W = 640;
  const H = 240;
  const grad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const s = 5;
  const tree = (x, y, sc, leaf = '#7fd38a') => `<g transform="translate(${x} ${y}) scale(${sc})">
    <rect x="-7" y="-10" width="14" height="40" rx="5" fill="${F(C.wood)}" ${st(s / sc)}/>
    <circle cx="0" cy="-28" r="28" fill="${F(leaf)}" ${st(s / sc)}/>${shine(-10, -40, 8, 5, -30, 0.5)}</g>`;
  const pine = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc})">
    <rect x="-6" y="0" width="12" height="20" fill="${F(C.wood)}" ${st(s / sc)}/>
    <path d="M0,-70 L30,-20 L16,-20 L36,6 L-36,6 L-16,-20 L-30,-20 Z" fill="${F('#4fbf7a')}" ${st(s / sc)}/></g>`;
  const palm = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc})">
    <path d="M0,40 Q-6,0 6,-46" fill="none" stroke="${O}" stroke-width="${16}" stroke-linecap="round"/>
    <path d="M0,40 Q-6,0 6,-46" fill="none" stroke="${C.wood}" stroke-width="${8}" stroke-linecap="round"/>
    ${[-150, -110, -60, -20, 20].map((a) => `<ellipse cx="${6 + Math.cos((a * Math.PI) / 180) * 26}" cy="${-46 + Math.sin((a * Math.PI) / 180) * 18}" rx="28" ry="10" transform="rotate(${a + 180} ${6 + Math.cos((a * Math.PI) / 180) * 26} ${-46 + Math.sin((a * Math.PI) / 180) * 18})" fill="${F('#7fd38a')}" ${st(4)}/>`).join('')}</g>`;
  let defs = '';
  let body = '';
  switch (era) {
    case 0:
      defs = grad('sk', '#ffcfa8', '#ffb3c6');
      body = `<rect width="${W}" height="${H}" fill="url(#sk)"/>
        <circle cx="520" cy="72" r="36" fill="${F('#fff1a8')}" ${st(s)}/>
        ${cloud(150, 50, 0.9)}${cloud(330, 36, 0.7)}
        <path d="M0,170 Q120,110 240,160 Q360,120 480,170 Q560,140 640,160 L640,240 L0,240 Z" fill="${F('#b8d98f')}" ${st(s)}/>
        <path d="M400,200 Q420,96 520,92 Q620,96 640,170 L640,240 L400,240 Z" fill="${F('#c4ae94')}" ${st(s)}/>
        <path d="M470,206 Q480,150 520,150 Q560,150 568,206 Z" fill="${F('#5a3d2b')}" ${st(s)}/>
        ${palm(110, 150, 1)}${palm(230, 162, 0.85)}
        <path d="M0,206 Q320,188 640,206 L640,240 L0,240 Z" fill="${F('#e6c79c')}" ${st(s)}/>
        <ellipse cx="320" cy="206" rx="40" ry="22" fill="${F(C.grey)}" ${st(s)}/><ellipse cx="370" cy="214" rx="24" ry="14" fill="${F(C.grey)}" ${st(s)}/>
        <ellipse cx="60" cy="214" rx="30" ry="16" fill="${F(C.grey)}" ${st(s)}/>`;
      break;
    case 1:
      defs = grad('sk', '#bfe3ff', '#ffe7b8');
      body = `<rect width="${W}" height="${H}" fill="url(#sk)"/>
        <circle cx="110" cy="64" r="34" fill="${F('#fff1a8')}" ${st(s)}/>
        ${cloud(420, 46, 0.8)}
        <polygon points="300,190 380,70 460,190" fill="${F('#f2c879')}" ${st(s)}/><polygon points="380,70 460,190 400,190" fill="${F('#e0ae5c')}"/>
        <polygon points="300,190 380,70 460,190" fill="none" ${st(s)}/>
        <polygon points="440,190 500,104 560,190" fill="${F('#f2c879')}" ${st(s)}/><polygon points="500,104 560,190 516,190" fill="${F('#e0ae5c')}"/>
        <polygon points="440,190 500,104 560,190" fill="none" ${st(s)}/>
        <path d="M0,190 Q160,150 320,186 Q480,160 640,190 L640,240 L0,240 Z" fill="${F('#f5d38a')}" ${st(s)}/>
        ${[150, 200, 250].map((x) => `<rect x="${x - 10}" y="120" width="20" height="72" fill="${F('#fffdf8')}" ${st(s)}/><rect x="${x - 16}" y="112" width="32" height="12" rx="4" fill="${F(C.cream2)}" ${st(s)}/>`).join('')}
        <rect x="128" y="186" width="144" height="14" rx="5" fill="${F(C.cream2)}" ${st(s)}/>
        <ellipse cx="580" cy="214" rx="44" ry="12" fill="${F('#8fd3ff')}" ${st(s)}/>${palm(600, 180, 0.8)}${palm(60, 186, 0.9)}`;
      break;
    case 2:
      defs = grad('sk', '#a8d8ff', '#e6f4ff');
      body = `<rect width="${W}" height="${H}" fill="url(#sk)"/>
        ${cloud(110, 54, 1)}${cloud(300, 36, 0.7)}${cloud(560, 60, 0.8)}
        <path d="M0,180 Q140,110 300,170 Q460,100 640,160 L640,240 L0,240 Z" fill="${F('#8fd694')}" ${st(s)}/>
        <g>
          <rect x="380" y="92" width="150" height="70" fill="${F('#ece8e2')}" ${st(s)}/>
          ${[380, 410, 440, 470, 500].map((x) => `<rect x="${x}" y="82" width="16" height="14" fill="${F('#ece8e2')}" ${st(s)}/>`).join('')}
          <rect x="350" y="66" width="44" height="96" fill="${F('#ece8e2')}" ${st(s)}/><polygon points="344,68 372,22 400,68" fill="${F(C.strawL)}" ${st(s)}/>
          <rect x="516" y="66" width="44" height="96" fill="${F('#ece8e2')}" ${st(s)}/><polygon points="510,68 538,22 566,68" fill="${F(C.strawL)}" ${st(s)}/>
          <line x1="372" y1="22" x2="372" y2="4" ${st(4)}/><path d="M372,4 L392,10 L372,16 Z" fill="${F(C.gold)}" ${st(3)}/>
          <line x1="538" y1="22" x2="538" y2="4" ${st(4)}/><path d="M538,4 L558,10 L538,16 Z" fill="${F(C.gold)}" ${st(3)}/>
          <path d="M440,162 L440,130 Q455,112 470,130 L470,162 Z" fill="${F(C.woodD)}" ${st(s)}/>
          <rect x="362" y="92" width="18" height="22" rx="9" fill="${F(C.sky)}" ${st(4)}/><rect x="528" y="92" width="18" height="22" rx="9" fill="${F(C.sky)}" ${st(4)}/>
        </g>
        <path d="M0,206 Q320,186 640,206 L640,240 L0,240 Z" fill="${F('#6cc47a')}" ${st(s)}/>
        ${pine(70, 190, 1)}${pine(140, 196, 0.8)}${pine(250, 190, 0.9)}${pine(610, 200, 0.8)}`;
      break;
    case 3:
      defs = grad('sk', '#ffbf9b', '#ffe3c2');
      body = `<rect width="${W}" height="${H}" fill="url(#sk)"/>
        <circle cx="500" cy="96" r="48" fill="${F('#fff1a8')}" ${st(s)}/>
        ${cloud(200, 46, 0.8)}
        <path d="M0,176 Q320,150 640,176 L640,240 L0,240 Z" fill="${F('#a8d98f')}" ${st(s)}/>
        ${[
          [60, 112, 80],
          [150, 100, 90],
          [250, 116, 74],
          [340, 104, 86],
        ]
          .map(
            ([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${176 - y}" fill="${F(C.cream)}" ${st(s)}/>
          <polygon points="${x - 8},${y} ${x + w / 2},${y - 40} ${x + w + 8},${y}" fill="${F('#ff8a7a')}" ${st(s)}/>
          <rect x="${x + 14}" y="${y + 16}" width="18" height="18" rx="4" fill="${F(C.skyL)}" ${st(4)}/>
          <rect x="${x + w - 32}" y="${y + 16}" width="18" height="18" rx="4" fill="${F(C.skyL)}" ${st(4)}/>
          <rect x="${x + w / 2 - 10}" y="${176 - 34}" width="20" height="34" rx="6" fill="${F(C.woodD)}" ${st(4)}/>`,
          )
          .join('')}
        <path d="M0,206 Q320,192 640,206 L640,240 L0,240 Z" fill="${F('#e6c79c')}" ${st(s)}/>
        <g transform="translate(540 196) rotate(-15)"><rect x="-40" y="-14" width="80" height="28" rx="14" fill="${F('#5b5f6b')}" ${st(s)}/></g>
        <circle cx="532" cy="212" r="18" fill="${F(C.wood)}" ${st(s)}/>
        ${tree(460, 188, 0.8)}${tree(30, 190, 0.7)}`;
      break;
    case 4:
      defs = grad('sk', '#bde0ff', '#f2f8ff');
      body = `<rect width="${W}" height="${H}" fill="url(#sk)"/>
        ${cloud(120, 40, 0.8)}${cloud(470, 34, 0.7)}
        ${[
          [30, 90, 70, C.lav],
          [110, 60, 64, '#9cc9ff'],
          [186, 104, 56, '#a7f0d0'],
          [256, 46, 72, '#ffc7a8'],
          [340, 84, 60, C.lav],
          [412, 56, 70, '#9cc9ff'],
          [494, 96, 60, '#a7f0d0'],
          [566, 70, 60, '#ffc7a8'],
        ]
          .map(([x, y, w, c]) => {
            let win = '';
            for (let yy = y + 14; yy < 160; yy += 22) for (let xx = x + 10; xx < x + w - 14; xx += 18) win += `<rect x="${xx}" y="${yy}" width="10" height="12" rx="3" fill="${F(C.cream)}"/>`;
            return `<rect x="${x}" y="${y}" width="${w}" height="${180 - y}" rx="6" fill="${c}" ${st(s)}/>${win}`;
          })
          .join('')}
        <rect x="0" y="176" width="${W}" height="64" fill="${F('#9aa1ad')}" ${st(s)}/>
        ${[40, 140, 240, 340, 440, 540].map((x) => `<rect x="${x}" y="206" width="50" height="8" rx="4" fill="#fff"/>`).join('')}
        ${[90, 300, 520].map((x) => `<line x1="${x}" y1="176" x2="${x}" y2="122" ${st(5)}/><rect x="${x - 4}" y="116" width="26" height="10" rx="5" fill="${F(C.gold)}" ${st(4)}/>`).join('')}
        ${tree(200, 172, 0.55, '#7fd38a')}${tree(420, 172, 0.55, '#7fd38a')}`;
      break;
    case 5:
    default:
      defs = grad('sk', '#2e1f5e', '#7a4fb0');
      body = `<rect width="${W}" height="${H}" fill="url(#sk)"/>
        ${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 97) % 640}" cy="${(i * 53) % 120 + 8}" r="${i % 3 ? 2 : 3}" fill="#fff" opacity="0.8"/>`).join('')}
        <circle cx="560" cy="56" r="30" fill="${F('#fff4c2')}"/><circle cx="574" cy="48" r="28" fill="${F('#4a3488')}"/>
        ${[
          [40, 80, 60, '#ff7ad9'],
          [120, 50, 70, '#6ff7ff'],
          [210, 96, 56, '#ff7ad9'],
          [286, 36, 66, '#6ff7ff'],
          [370, 88, 60, '#ff7ad9'],
          [450, 60, 70, '#6ff7ff'],
          [540, 100, 60, '#ff7ad9'],
        ]
          .map(([x, y, w, c]) => {
            let win = '';
            for (let yy = y + 16; yy < 170; yy += 24) win += `<rect x="${x + 10}" y="${yy}" width="${w - 20}" height="6" rx="3" fill="${c}" opacity="0.8"/>`;
            return `<rect x="${x}" y="${y}" width="${w}" height="${190 - y}" rx="10" fill="${F('#3b2a7a')}" stroke="${c}" stroke-width="5"/>${win}`;
          })
          .join('')}
        <ellipse cx="330" cy="40" rx="50" ry="12" fill="none" stroke="#ffd1f0" stroke-width="6"/>
        <rect x="0" y="188" width="${W}" height="52" fill="${F('#251a4d')}" stroke="#6ff7ff" stroke-width="5"/>`;
      break;
  }
  return svg(W, H, body, defs);
}

// ---------- ภาพใหญ่ ----------
const FONT = `font-family="Fredoka, sans-serif" font-weight="700"`;
function ribbonBanner(main, dark, label, extra = '', glow = false) {
  return svg(800, 300, `
    ${glow ? `<ellipse cx="400" cy="160" rx="380" ry="130" fill="${F('#fff3a6')}" opacity="0.45"/>` : ''}
    <path d="M120,138 L24,150 L66,192 L24,234 L130,226 Z" fill="${F(dark)}" ${st(11)}/>
    <path d="M680,138 L776,150 L734,192 L776,234 L670,226 Z" fill="${F(dark)}" ${st(11)}/>
    <path d="M96,120 Q400,74 704,120 L692,232 Q400,190 108,232 Z" fill="${F(main)}" ${st(11)}/>
    <path d="M118,134 Q400,92 682,134" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.45"/>
    <path id="tp" d="M130,206 Q400,160 670,206" fill="none"/>
    <text font-size="92" ${FONT} text-anchor="middle" fill="${F(C.cream)}" stroke="${O}" stroke-width="16" stroke-linejoin="round" paint-order="stroke fill"><textPath href="#tp" startOffset="50%">${label}</textPath></text>
    ${extra}`);
}
const BIG = {
  logo: () => {
    const crowd = UA.troop
      ? [0, 1, 2, 3, 4, 5, 6].map((i) => uimg('troop', 206 + i * 86, 388 + (i % 2) * 10, 100, 100)).join('')
      : [C.sky, C.mint, C.gold, C.straw, C.lav, C.sky, C.mint].map((c, i) => chibi(256 + i * 85, 432 + (i % 2) * 12, 0.36, c, '#ffffff')).join('');
    return svg(1024, 512, `
      <g transform="rotate(-4 512 220)">
        <text x="512" y="222" font-size="196" ${FONT} text-anchor="middle" fill="${O}" stroke="${O}" stroke-width="30" stroke-linejoin="round" transform="translate(0 14)">CROWD</text>
        <text x="512" y="222" font-size="196" ${FONT} text-anchor="middle" fill="url(#gc)" stroke="${O}" stroke-width="26" stroke-linejoin="round" paint-order="stroke fill">CROWD</text>
        <text x="512" y="380" font-size="176" ${FONT} text-anchor="middle" fill="${O}" stroke="${O}" stroke-width="30" stroke-linejoin="round" transform="translate(0 14)">AGES</text>
        <text x="512" y="380" font-size="176" ${FONT} text-anchor="middle" fill="url(#ga)" stroke="${O}" stroke-width="26" stroke-linejoin="round" paint-order="stroke fill">AGES</text>
      </g>
      ${crowd}
      ${sparkle(150, 90, 26)}${sparkle(890, 70, 22)}${sparkle(880, 320, 18, C.gold)}`,
      `<linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${C.cream2}"/></linearGradient>
       <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.goldL}"/><stop offset="1" stop-color="#ffd23f"/></linearGradient>`);
  },
  banner_win: () =>
    ribbonBanner(C.gold, C.goldD, 'VICTORY!', `
      <path d="M400,112 Q352,96 350,52 L350,30 Q376,30 400,14 Q424,30 450,30 L450,52 Q448,96 400,112 Z" fill="${F(C.sky)}" ${st(9)}/>
      <polygon points="${starPts(400, 58, 26, 11)}" fill="${F(C.gold)}" ${st(5)}/>
      ${sparkle(250, 70, 18)}${sparkle(560, 64, 22)}${sparkle(700, 96, 12)}`),
  banner_lose: () =>
    ribbonBanner('#ff8f8f', '#e05666', 'DEFEAT', `
      <g transform="translate(640 118) rotate(28)">
        <rect x="-50" y="-18" width="100" height="36" rx="18" fill="${F('#ffe2c8')}" ${st(7)}/>
        <rect x="-18" y="-18" width="36" height="36" fill="${F('#f5c9a6')}" stroke="${O}" stroke-width="5"/>
        <circle cx="-34" cy="-4" r="3" fill="${F(C.wood)}"/><circle cx="-34" cy="6" r="3" fill="${F(C.wood)}"/><circle cx="34" cy="-4" r="3" fill="${F(C.wood)}"/><circle cx="34" cy="6" r="3" fill="${F(C.wood)}"/>
      </g>`),
  banner_newera: () =>
    ribbonBanner(C.gold, C.goldD, 'NEW ERA!', `
      ${sparkle(170, 70, 24)}${sparkle(300, 50, 16, C.goldL)}${sparkle(470, 44, 20)}${sparkle(630, 70, 26, C.goldL)}${sparkle(400, 30, 14)}`, true),
  btn_play: () => svg(600, 140, `
    <rect x="8" y="14" width="584" height="118" rx="56" fill="${C.coral}" ${st(9)}/>
    <rect x="8" y="8" width="584" height="104" rx="52" fill="url(#bp)" ${st(9)}/>
    <rect x="44" y="20" width="512" height="32" rx="16" fill="#fff" opacity="0.45"/>`,
    `<linearGradient id="bp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.peachL}"/><stop offset="1" stop-color="${C.peach}"/></linearGradient>`),
  btn_ghost: () => svg(600, 140, `
    <rect x="8" y="14" width="584" height="118" rx="56" fill="#e8c99a" ${st(9)}/>
    <rect x="8" y="8" width="584" height="104" rx="52" fill="${C.cream2}" ${st(9)}/>
    <rect x="44" y="20" width="512" height="28" rx="14" fill="#fff" opacity="0.55"/>`),
  panel: () => svg(760, 1000, `
    <rect x="10" y="10" width="740" height="980" rx="64" fill="${C.wood}" ${st(10)}/>
    <path d="M40,120 Q60,300 34,520 M726,200 Q700,420 724,700 M200,22 Q380,40 560,22 M220,978 Q400,962 580,978" fill="none" stroke="${C.woodD}" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
    <rect x="44" y="44" width="672" height="912" rx="40" fill="${C.cream}" ${st(7)}/>
    <rect x="60" y="60" width="640" height="880" rx="30" fill="none" stroke="#ffffff" stroke-width="10" opacity="0.7"/>
    ${[
      [28, 28],
      [732, 28],
      [28, 972],
      [732, 972],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${C.goldD}" ${st(4)}/>`)
      .join('')}`),
};

// ---------- รายการไฟล์ที่จะส่งออก ----------
// [key, svg, ขนาดใน CSS px (×2 ตอนบันทึก), รูปแบบไฟล์]
window.ART_JOBS = [
  ...Object.entries(HERO_ART).map(([k, f]) => [k, f(), k.startsWith('hero_') ? [256, 256] : [128, 128], 'png']),
  ...Object.entries(ICONS).filter(([k]) => !UA[k]).map(([k, f]) => [k, f(), k.startsWith('up_') || k.startsWith('camp_') ? [160, 160] : [128, 128], 'png']),
  ...[0, 1, 2, 3, 4, 5].map((i) => [`era_card_${i}`, card(i), [640, 240], 'jpg']),
  ['logo', BIG.logo(), [512, 256], 'png'],
  ['banner_win', BIG.banner_win(), [400, 150], 'png'],
  ['banner_lose', BIG.banner_lose(), [400, 150], 'png'],
  ['banner_newera', BIG.banner_newera(), [400, 150], 'png'],
  ['btn_play', BIG.btn_play(), [300, 70], 'png'],
  ['btn_ghost', BIG.btn_ghost(), [300, 70], 'png'],
  ['panel', BIG.panel(), [380, 500], 'png'],
];
