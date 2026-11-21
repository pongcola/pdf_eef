# ระบบ Item / แต่งตัว / ขุดแร่ / ตีบวก / สุ่มอุปกรณ์ (Unity, เล่นคนเดียว)

## วิธีใช้ใน Unity
1. คัดลอกโฟลเดอร์ `Assets/Scripts` ไปไว้ใน `Assets/` ของโปรเจกต์ Unity
2. สร้าง GameObject ใน Scene แรก แล้วใส่ Component `GameManager`
3. UI เรียกเมธอดผ่าน `GameManager.Instance` เช่น `Enhance(itemId)`, `UsePickaxe()`, `Gacha10()`
   แล้วฟัง event `OnPlayerChanged` เพื่อวาดหน้าจอใหม่ (เกมเซฟอัตโนมัติทุกครั้งที่ข้อมูลเปลี่ยน)

## โครงสร้าง
| ไฟล์ | หน้าที่ |
|---|---|
| `Core/GameConfig.cs` | ตัวเลขทั้งหมด (rate, ค่า status, ราคา) ปรับสมดุลที่นี่ที่เดียว |
| `Core/Types.cs` | ข้อมูลผู้เล่น อุปกรณ์ รูน |
| `Core/StatCalculator.cs` | คำนวณ status รวม + เพดาน + DPS + เทียบค่าก่อนใส่ |
| `Core/EquipmentSystem.cs` | สวมใส่ / ถอด 6 ช่อง |
| `Core/EnhanceSystem.cs` | ตีบวก +1~+6, ลดระดับที่ +5/+6, Pity |
| `Core/RuneSystem.cs` | ใส่ / ถอด / ใส่ทับรูน (คืนกระเป๋าเสมอ) |
| `Core/MiningSystem.cs` | ของดรอปจากด่าน, ขุดหิน (Pickaxe), ระเบิดหารูน (Bomb) |
| `Core/GachaSystem.cs` | สุ่มอุปกรณ์ด้วยเพชร 1/10 ครั้ง, Pity Legendary, แยกชิ้น |
| `Unity/GameManager.cs` | จุดเชื่อม UI กับระบบ |
| `Unity/SaveManager.cs` | เซฟ/โหลด JSON ในเครื่อง |

โค้ดใน `Core/` เป็น C# ล้วน ไม่ใช้ UnityEngine จึงทดสอบนอก Unity ได้

## ทดสอบ / จำลองความสมดุล
ต้องมี .NET 8 SDK
```bash
dotnet run --project Tests
```
