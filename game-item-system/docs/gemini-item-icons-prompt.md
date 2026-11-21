# Prompt สำหรับ Gemini: สร้าง Icon Item ทั้งหมด

วิธีใช้: คัดลอกทุกอย่างในกรอบด้านล่างไปวางใน Gemini (โหมดสร้างภาพ) ทีเดียว
Gemini จะสร้างทีละภาพตามลำดับ พิมพ์ `next` เพื่อไปภาพถัดไป
ถ้าภาพไหนไม่ถูกใจ พิมพ์ `redo` พร้อมบอกสิ่งที่อยากแก้

---

```
You are the art director and icon artist for my original 2D fantasy mobile game.
Generate the item icons below ONE IMAGE AT A TIME, in the exact order listed.
After each image, reply with only the item code (e.g. "W-03 Platinum Sword") and wait.
- When I type "next", generate the next item.
- When I type "redo" plus notes, regenerate the same item with my notes applied.
Every image must look like part of ONE consistent set: same art style, same camera angle,
same lighting, same object scale inside the canvas. Use the first approved image as the
style reference for all later images.

=== GLOBAL STYLE (apply to every image) ===
- 2D fantasy game item icon, stylized hand-painted art, high detail
- single object, centered, 3/4 view, bold clean silhouette, object fills ~80% of the canvas
- soft rim lighting from the top-left
- plain pure white background (I will remove it later)
- square 1:1, 1024x1024
- NO text, NO letters, NO numbers, NO frame, NO border, NO character, NO hands, NO watermark

=== RARITY CLASS RULES (applies to sections A) ===
- Silver: polished silver steel, simple design, minimal ornaments, cool grey tones, no glow
- Gold: gold trim, engraved patterns, small amber gems, warm golden glow
- Platinum: white platinum, intricate filigree, sapphire/blue-purple crystals, soft blue-purple aura
- Legendary: obsidian black + radiant gold, glowing red-orange runes, floating ember particles,
  powerful fiery aura, the most ornate of all
Higher classes must clearly look more valuable than lower classes of the same item.

=== A. EQUIPMENT (24 images) — each slot in Silver, Gold, Platinum, Legendary ===
Slot design themes (keep the same base shape across all 4 classes of a slot):
- H  Helmet: a helmet with a round targeting lens over one eye (theme: range + attack speed)
- C  Suit: a light, agile battle coat/tunic with a short cape (theme: speed + precision)
- B  Boots: a pair of boots with wing ornaments on the ankles (theme: precision + range)
- A  Armor: a heavy chestplate with shoulder guards and a core gem in the center (theme: power + speed)
- G  Gloves: a pair of gauntlets with claw tips; claws get longer and sharper with rarity (theme: critical hits)
- W  Weapon: a sword; it grows from a plain sword to a greatsword with a glowing cracked blade at Legendary (theme: damage)

Order:
H-01 Silver Helmet, H-02 Gold Helmet, H-03 Platinum Helmet, H-04 Legendary Helmet,
C-01 Silver Suit, C-02 Gold Suit, C-03 Platinum Suit, C-04 Legendary Suit,
B-01 Silver Boots, B-02 Gold Boots, B-03 Platinum Boots, B-04 Legendary Boots,
A-01 Silver Armor, A-02 Gold Armor, A-03 Platinum Armor, A-04 Legendary Armor,
G-01 Silver Gloves, G-02 Gold Gloves, G-03 Platinum Gloves, G-04 Legendary Gloves,
W-01 Silver Sword, W-02 Gold Sword, W-03 Platinum Sword, W-04 Legendary Sword

=== B. MATERIALS (4 images) ===
M-01 Pickaxe: sturdy iron pickaxe, leather-wrapped wooden handle, small sparks on the tip
M-02 Bomb: round black iron bomb, lit fuse with glowing orange sparks, small skull emblem
M-03 Enhancement Stone: raw dark grey ore chunk with bright glowing cyan crystal veins, sparkles
M-04 Diamond: brilliant faceted blue-white diamond gem, sharp sparkles, light rays

=== C. RUNES (20 images) — 5 stats x 4 tiers ===
Base: a small round magical rune stone with a glowing symbol engraved on its face.
Keep the same stone shape for all runes; only the symbol and tier material change.
Symbols:
- CR  Crit Rate: crosshair target
- CD  Crit Damage: shattered star burst
- DM  Damage: crossed swords
- AS  Attack Rate: lightning bolt
- RG  Attack Range: arrow with expanding rings
Tiers:
- B:  plain grey stone, faint green glow
- A:  smooth blue stone, bright blue glow
- S:  polished purple crystal stone, strong purple glow, small sparkles
- SR: golden crystal stone with rainbow shimmer, intense radiant glow, floating light particles
Order: R-CR-B, R-CR-A, R-CR-S, R-CR-SR, R-CD-B, R-CD-A, R-CD-S, R-CD-SR,
R-DM-B, R-DM-A, R-DM-S, R-DM-SR, R-AS-B, R-AS-A, R-AS-S, R-AS-SR,
R-RG-B, R-RG-A, R-RG-S, R-RG-SR

=== D. RARITY SLOT FRAMES (4 images) — UI frames, NOT items ===
For this section only, ignore "NO frame" and "3/4 view":
flat 2D UI, front view, square item slot frame with rounded corners, EMPTY center,
dark inner background, no text.
F-01 Silver: simple brushed silver border, dark grey inner background
F-02 Gold: ornate gold border with small corner gems, dark warm brown inner background
F-03 Platinum: elegant platinum border with sapphire corner crystals, dark blue-purple gradient inside
F-04 Legendary: ornate black and gold border, glowing red-orange runes, flame corners, dark crimson gradient inside

Total: 52 images. Start now with H-01 Silver Helmet.
```

---

## หมายเหตุ
- ถ้าอาวุธในเกมไม่ใช่ดาบ ให้แก้บรรทัด `W  Weapon` และชื่อใน Order ก่อนส่ง
- ถ้าภาพเริ่มเพี้ยนสไตล์ ให้แนบภาพ H-01 ที่ชอบกลับไปแล้วพิมพ์ `redo, match the style of this image exactly`
- ระดับตีบวก (+1~+6) แสดงเป็นตัวเลขบน UI ใน Unity ไม่ต้องสร้างภาพแยก
- ตั้งชื่อไฟล์ตามรหัส เช่น `H-01.png`, `R-CR-SR.png` จะได้ผูกกับโค้ดง่าย
