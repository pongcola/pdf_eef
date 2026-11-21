# Prompt สำหรับ Gemini: สร้าง Icon Item ทั้งหมด

วิธีใช้: คัดลอกทุกอย่างในกรอบด้านล่างไปวางใน Gemini (โหมดสร้างภาพ) ทีเดียว
Gemini จะสร้างทีละภาพตามลำดับ พิมพ์ `next` เพื่อไปภาพถัดไป
ถ้าภาพไหนไม่ถูกใจ พิมพ์ `redo` พร้อมบอกสิ่งที่อยากแก้

---

```
You are the art director and icon artist for my original cute (kawaii) 3D-runner mobile game "Crowd Ages".
Generate the item icons below ONE IMAGE AT A TIME, in the exact order listed.
After each image, reply with only the item code (e.g. "W-03 Platinum Sword") and wait.
- When I type "next", generate the next item.
- When I type "redo" plus notes, regenerate the same item with my notes applied.
Every image must look like part of ONE consistent set: same art style, same camera angle,
same lighting, same object scale inside the canvas. Use the first approved image as the
style reference for all later images.

=== GLOBAL STYLE (apply to every image) ===
- cute kawaii mobile game item icon, chunky rounded shapes, soft cel shading, thick dark outline, glossy highlights
- single object, centered, 3/4 view, bold clean silhouette, object fills ~80% of the canvas
- soft lighting from the top-left
- solid flat pure green background #00FF00 (chroma key, I will remove it later); do not use green on the object itself
- square 1:1, 1024x1024
- NO text, NO letters, NO numbers, NO frame, NO border, NO character, NO hands, NO watermark

=== RARITY CLASS RULES (applies to sections A) ===
- Silver: polished silver steel, simple design, minimal ornaments, cool grey tones, no glow
- Gold: gold trim, engraved patterns, small amber gems, warm golden glow
- Platinum: white platinum, intricate filigree, sapphire/blue-purple crystals, soft blue-purple aura
- Legendary: obsidian black + radiant gold, glowing red-orange runes, floating ember particles,
  powerful fiery aura, the most ornate of all
Higher classes must clearly look more valuable than lower classes of the same item.

=== A. EQUIPMENT (20 images) — 5 armor slots in Silver, Gold, Platinum, Legendary ===
Slot design themes (keep the same base shape across all 4 classes of a slot):
- H  Helmet: a helmet with a round targeting lens over one eye (theme: range + attack speed)
- C  Suit: a light, agile battle coat/tunic with a short cape (theme: speed + precision)
- B  Boots: a pair of boots with wing ornaments on the ankles (theme: precision + range)
- A  Armor: a heavy chestplate with shoulder guards and a core gem in the center (theme: power + speed)
- G  Gloves: a pair of gauntlets with claw tips; claws get longer and sharper with rarity (theme: critical hits)

Order:
H-01 Silver Helmet, H-02 Gold Helmet, H-03 Platinum Helmet, H-04 Legendary Helmet,
C-01 Silver Suit, C-02 Gold Suit, C-03 Platinum Suit, C-04 Legendary Suit,
B-01 Silver Boots, B-02 Gold Boots, B-03 Platinum Boots, B-04 Legendary Boots,
A-01 Silver Armor, A-02 Gold Armor, A-03 Platinum Armor, A-04 Legendary Armor,
G-01 Silver Gloves, G-02 Gold Gloves, G-03 Platinum Gloves, G-04 Legendary Gloves

=== A2. WEAPONS (24 images) — the weapon changes with the game's era, each in 4 classes ===
Keep the same base weapon shape across the 4 classes of an era; higher class = more ornate per the rarity rules.
- W0 Stone Age: a chunky knobby wooden club wrapped with rope
- W1 Ancient Age: a short spear with a leaf-shaped tip and a small tassel
- W2 Knight Age: a short knight sword with a crossguard
- W3 Gunpowder Age: a short flintlock musket
- W4 Modern Age: a short chunky cartoon rifle with a small scope
- W5 Future Age: a toy-like rounded laser blaster with a glowing muzzle
Order: W0-01 Silver Club, W0-02 Gold Club, W0-03 Platinum Club, W0-04 Legendary Club,
W1-01 .. W1-04 Spear, W2-01 .. W2-04 Sword, W3-01 .. W3-04 Musket,
W4-01 .. W4-04 Rifle, W5-01 .. W5-04 Laser Blaster

=== B. MATERIALS (4 images) ===
M-01 Pickaxe: sturdy iron pickaxe, leather-wrapped wooden handle, small sparks on the tip
M-02 Bomb: round black iron bomb, lit fuse with glowing orange sparks, small skull emblem
M-03 Enhancement Stone: raw dark grey ore chunk with bright glowing cyan crystal veins, sparkles
M-04 Token: a shiny round mint-green coin with a cute star embossed in the middle, thick rim, glossy highlight (this is the gacha currency)

=== C. RUNES (20 images) — 5 stats x 4 tiers ===
Base: a small round cute magical rune stone with a glowing symbol engraved on its face.
Keep the same stone shape for all runes; only the symbol and tier material change.
Symbols:
- CR  Crit Rate: crosshair target
- CD  Crit Damage: shattered star burst
- DM  Damage: crossed swords
- AS  Attack Rate: lightning bolt
- RG  Attack Range: arrow with expanding rings
Tiers:
- B:  plain grey stone, faint white glow
- A:  smooth blue stone, bright blue glow
- S:  polished purple crystal stone, strong purple glow, small sparkles
- SR: golden crystal stone with rainbow shimmer, intense radiant glow, floating light particles
Order: R-CR-B, R-CR-A, R-CR-S, R-CR-SR, R-CD-B, R-CD-A, R-CD-S, R-CD-SR,
R-DM-B, R-DM-A, R-DM-S, R-DM-SR, R-AS-B, R-AS-A, R-AS-S, R-AS-SR,
R-RG-B, R-RG-A, R-RG-S, R-RG-SR

=== D. RARITY SLOT FRAMES (4 images) — UI frames, NOT items ===
For this section only, ignore "NO frame" and "3/4 view":
cute kawaii flat 2D UI, front view, square item slot frame with rounded corners, EMPTY center,
dark inner background, no text.
F-01 Silver: simple brushed silver border, dark grey inner background
F-02 Gold: ornate gold border with small corner gems, dark warm brown inner background
F-03 Platinum: elegant platinum border with sapphire corner crystals, dark blue-purple gradient inside
F-04 Legendary: ornate black and gold border, glowing red-orange runes, flame corners, dark crimson gradient inside

Total: 72 images. Start now with H-01 Silver Helmet.
```

---

## หมายเหตุ
- อาวุธเปลี่ยนตามยุคของเกม (6 ยุค × 4 class = 24 ภาพ) เกมเลือกไอคอนตามยุคที่เล่นอยู่
- สกุลเงินสุ่มคือ **Token (เหรียญสีเขียว)** — ตอนนี้ใช้รูปเหรียญเดิมที่เปลี่ยนเป็นสีเขียวไปก่อน
- ถ้าภาพเริ่มเพี้ยนสไตล์ ให้แนบภาพ H-01 ที่ชอบกลับไปแล้วพิมพ์ `redo, match the style of this image exactly`
- ระดับตีบวก (+1~+6) แสดงเป็นตัวเลขบน UI ไม่ต้องสร้างภาพแยก
- พื้นหลังเป็นสีเขียว #00FF00 เพื่อใช้ `scripts/art/key_green.py` ตัดพื้นออก เหมือนไอคอนชุด kawaii ที่มีอยู่
- ตัดพื้นด้วย `tools/chromakey_icons.py` (ย่อ 192×192 ให้แล้ว) แล้ววางใน `src/ui/art/` โดยเปลี่ยนชื่อไฟล์ตามตารางนี้ (ชื่อต้องตรงกับที่เกมอ่าน):

| รหัสภาพ | ชื่อไฟล์ในเกม |
|---|---|
| H-01..04 | `gear_helmet_0.png` .. `gear_helmet_3.png` (0 Silver, 1 Gold, 2 Platinum, 3 Legendary) |
| C-01..04 | `gear_suit_0..3.png` |
| B-01..04 | `gear_boots_0..3.png` |
| A-01..04 | `gear_armor_0..3.png` |
| G-01..04 | `gear_gloves_0..3.png` |
| W*N*-01..04 | `gear_weapon_N_0..3.png` (N = ยุค 0–5) |
| M-01 / M-02 / M-03 / M-04 | `pickaxe.png` / `bomb.png` / `enh_stone.png` / `token.png` |
| R-CR / R-CD / R-DM / R-AS / R-RG -B/A/S/SR | `rune_critRate_0..3.png` / `rune_critDmg_0..3` / `rune_dmg_0..3` / `rune_rate_0..3` / `rune_range_0..3` (0 B, 1 A, 2 S, 3 SR) |
| F-01..04 | `gear_frame_0..3.png` (ยังไม่ได้ใช้ในเกม — ตอนนี้กรอบเป็นสีตาม class) |

ถ้ายังไม่มีไฟล์ไหน เกมใช้อีโมจิแทนอัตโนมัติ
