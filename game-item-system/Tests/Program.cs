using System;
using System.Linq;
using ItemSystem.Core;

/// รันด้วย: dotnet run --project Tests
/// ตรวจกติกาทุกระบบ แล้วจำลองความสมดุล
public static class Program
{
    static int _fail;
    static void Check(bool ok, string name)
    {
        Console.WriteLine((ok ? "  PASS " : "  FAIL ") + name);
        if (!ok) _fail++;
    }

    /// สุ่มแบบกำหนดผลล่วงหน้า สำหรับทดสอบ
    class FixedRandom : IRandom
    {
        public double Value; public int Int;
        public double NextDouble() => Value;
        public int RangeInclusive(int min, int max) => Math.Clamp(Int, min, max);
    }

    public static int Main()
    {
        Console.WriteLine("== ทดสอบกติกา ==");
        TestStats(); TestEnhance(); TestRune(); TestMining(); TestGacha();
        Console.WriteLine("\n== จำลองความสมดุล ==");
        Simulate();
        Console.WriteLine(_fail == 0 ? "\nผ่านทั้งหมด" : $"\nไม่ผ่าน {_fail} ข้อ");
        return _fail == 0 ? 0 : 1;
    }

    static Equipment Give(PlayerData p, SlotType s, ItemClass c, int lv = 0)
    {
        var e = new Equipment { Id = Ids.New(), Slot = s, Class = c, EnhanceLevel = lv };
        p.Items.Add(e); return e;
    }

    static void TestStats()
    {
        var p = new PlayerData();
        var w = Give(p, SlotType.Weapon, ItemClass.Legendary, 6);
        EquipmentSystem.Equip(p, w.Id);
        var s = StatCalculator.Calculate(p);
        Check(Math.Abs(s.Get(StatType.Dmg) - 24.8f) < 0.01f, "อาวุธ Legendary +6 ได้ Dmg 24.8%");
        Check(Math.Abs(s.Get(StatType.CritRate) - (5f + 9.3f)) < 0.01f, "Crit Rate = 5 + 9.3");
        Check(s.Get(StatType.AtkRange) == 0, "อาวุธไม่มี Attack Range");

        // ชุดเต็ม Legendary +6 + รูน Crit SR 6 ชิ้น ต้องติดเพดาน 100%
        var p2 = new PlayerData();
        foreach (SlotType slot in Enum.GetValues(typeof(SlotType)))
        {
            var e = Give(p2, slot, ItemClass.Legendary, 6);
            EquipmentSystem.Equip(p2, e.Id);
            var r = new Rune { Id = Ids.New(), Stat = StatType.CritRate, Tier = RuneTier.SR };
            p2.Runes.Add(r); RuneSystem.Insert(p2, e.Id, r.Id);
        }
        var s2 = StatCalculator.Calculate(p2);
        Check(s2.Get(StatType.CritRate) == 100f, "Crit Rate ติดเพดาน 100%");
        Check(Math.Abs(s2.Get(StatType.CritDmg) - (150f + 38.75f)) < 0.01f, "Crit Dmg ชุดเต็ม = 150 + 38.75");

        var gloves = Give(p, SlotType.Gloves, ItemClass.Gold);
        var delta = StatCalculator.PreviewEquipDelta(p, gloves);
        Check(Math.Abs(delta[(int)StatType.CritDmg] - 12f) < 0.01f && p.GetEquipped(SlotType.Gloves) == null,
              "Preview ถุงมือ Gold แสดง +12% Crit Dmg และไม่ใส่จริง");
    }

    static void TestEnhance()
    {
        var p = new PlayerData { Stones = 100 };
        var e = Give(p, SlotType.Helmet, ItemClass.Silver, 2);
        var fail = new FixedRandom { Value = 0.999 };
        var ok = new FixedRandom { Value = 0.0 };

        var r = EnhanceSystem.TryEnhance(p, e.Id, fail);
        Check(!r.Success && e.EnhanceLevel == 2 && p.Stones == 97, "ตี +3 พลาด: ระดับคงเดิม เสียหิน 3");

        e.EnhanceLevel = 4;
        r = EnhanceSystem.TryEnhance(p, e.Id, fail);
        Check(e.EnhanceLevel == 3 && e.PityFails[4] == 1, "ตี +5 พลาด: ลดเป็น +3 และ Pity +1");
        e.EnhanceLevel = 4;
        Check(Math.Abs(EnhanceSystem.Preview(e).TotalChance - 0.30f) < 0.001f, "ตี +5 หลังพลาด 1 ครั้ง = 30%");

        e.EnhanceLevel = 5; e.PityFails[5] = 3;
        var pv = EnhanceSystem.Preview(e);
        Check(Math.Abs(pv.TotalChance - 0.25f) < 0.001f && pv.LevelOnFail == 4, "ตี +6 Pity 3 ครั้ง = 25% พลาดเหลือ +4");

        e.PityFails[5] = 18;
        Check(EnhanceSystem.Preview(e).TotalChance == 1f, "ตี +6 พลาด 18 ครั้ง ครั้งถัดไปการันตี 100%");

        e.EnhanceLevel = 4; e.PityFails[4] = 2; e.PityFails[5] = 3;
        EnhanceSystem.TryEnhance(p, e.Id, ok);
        Check(e.EnhanceLevel == 5 && e.PityFails[4] == 0 && e.PityFails[5] == 3,
              "ตี +5 สำเร็จ: รีเซ็ต Pity +5 แต่ Pity +6 ยังอยู่");

        e.EnhanceLevel = 6;
        Check(EnhanceSystem.TryEnhance(p, e.Id, ok).Error == EnhanceError.MaxLevel, "+6 ตีต่อไม่ได้");
        p.Stones = 2; e.EnhanceLevel = 0;
        Check(EnhanceSystem.TryEnhance(p, e.Id, ok).Error == EnhanceError.NotEnoughStones, "หินไม่พอ ตีไม่ได้");
    }

    static void TestRune()
    {
        var p = new PlayerData();
        var a = Give(p, SlotType.Boots, ItemClass.Gold);
        var b = Give(p, SlotType.Suit, ItemClass.Gold);
        var r1 = new Rune { Id = Ids.New(), Stat = StatType.Dmg, Tier = RuneTier.A };
        var r2 = new Rune { Id = Ids.New(), Stat = StatType.CritDmg, Tier = RuneTier.S };
        p.Runes.Add(r1); p.Runes.Add(r2);

        RuneSystem.Insert(p, a.Id, r1.Id);
        RuneSystem.Insert(p, a.Id, r2.Id);
        Check(a.RuneId == r2.Id && r1.InBag, "ใส่รูนทับ: รูนเก่าคืนกระเป๋า");

        RuneSystem.Insert(p, b.Id, r2.Id);
        Check(!a.HasRune && b.RuneId == r2.Id, "ย้ายรูนไปชิ้นอื่น: ชิ้นเดิมว่าง");

        RuneSystem.Remove(p, b.Id);
        Check(!b.HasRune && r2.InBag && p.Runes.Count == 2, "ถอดรูน: คืนกระเป๋า ไม่หาย");
    }

    static void TestMining()
    {
        var p = new PlayerData();
        Check(MiningSystem.UsePickaxe(p, new SystemRandom(1)) == -1, "ไม่มี Pickaxe ขุดไม่ได้");
        p.Pickaxes = 1;
        int got = MiningSystem.UsePickaxe(p, new FixedRandom { Value = 0.1, Int = 3 });
        Check(got == 3 && p.Stones == 3 && p.Pickaxes == 0, "ขุดได้หิน 3 ก้อน Pickaxe หมด");
        p.Bombs = 1;
        Check(MiningSystem.UseBomb(p, new FixedRandom { Value = 0.5 }) == null && p.Bombs == 0, "ระเบิดพลาด (>30%) ไม่ได้รูน");
    }

    static void TestGacha()
    {
        var p = new PlayerData { Diamonds = 5000 * GameConfig.GachaCost1 };
        var rng = new SystemRandom(42);
        int maxGap = 0, gap = 0;
        for (int i = 0; i < 5000; i++)
        {
            var e = GachaSystem.Pull1(p, rng); gap++;
            if (e.Class == ItemClass.Legendary) { maxGap = Math.Max(maxGap, gap); gap = 0; }
        }
        Check(maxGap <= GameConfig.GachaLegendaryPity, $"Legendary ห่างกันไม่เกิน 80 ครั้ง (สูงสุดที่เจอ {maxGap})");

        var p2 = new PlayerData { Diamonds = 900 };
        var allSilverRng = new FixedRandom { Value = 0.0 }; // ถ้าไม่มีการันตี จะได้ Silver ทั้ง 10 ชิ้น
        var ten = GachaSystem.Pull10(p2, allSilverRng);
        Check(ten.Count == 10 && ten.Count(x => x.Class >= ItemClass.Gold) == 1 && p2.Diamonds == 0,
              "สุ่ม 10 ครั้ง การันตี Gold+ 1 ชิ้น ใช้ 900 เพชร");

        var item = ten[0];
        EquipmentSystem.Equip(p2, item.Id);
        Check(GachaSystem.Dismantle(p2, item.Id) == 0, "แยกชิ้นที่ใส่อยู่ไม่ได้");
        EquipmentSystem.Unequip(p2, item.Slot);
        Check(GachaSystem.Dismantle(p2, item.Id) == 5 && p2.Diamonds == 5, "แยก Silver ได้ 5 เพชร");
    }

    static void Simulate()
    {
        var rng = new SystemRandom(7);
        const int N = 5000;

        // 1) ตีบวก +0 -> +6: ใช้หินกี่ก้อน
        double stones = 0;
        for (int i = 0; i < N; i++)
        {
            var p = new PlayerData { Stones = int.MaxValue / 2 };
            var e = Give(p, SlotType.Weapon, ItemClass.Silver);
            int start = p.Stones;
            while (e.EnhanceLevel < 6) EnhanceSystem.TryEnhance(p, e.Id, rng);
            stones += start - p.Stones;
        }
        stones /= N;

        // 2) ผ่านด่าน -> ขุด: ได้หินเฉลี่ยต่อด่าน และเพชรต่อด่าน
        var farm = new PlayerData();
        const int stages = 200000;
        for (int i = 0; i < stages; i++) StageRewardSystem.OnStageClear(farm, (i + 1) % 10 == 0, rng);
        while (farm.Pickaxes > 0) MiningSystem.UsePickaxe(farm, rng);
        while (farm.Bombs > 0) MiningSystem.UseBomb(farm, rng);
        double stonePerStage = (double)farm.Stones / stages;
        double diamondPerStage = (double)farm.Diamonds / stages;
        double runePerStage = (double)farm.Runes.Count / stages;
        double srPerStage = (double)farm.Runes.Count(r => r.Tier == RuneTier.SR) / stages;

        // 3) Legendary ต่อการสุ่ม
        var g = new PlayerData { Diamonds = int.MaxValue / 2 };
        int pulls = 100000, legend = 0;
        for (int i = 0; i < pulls; i++) if (GachaSystem.Pull1(g, rng).Class == ItemClass.Legendary) legend++;
        double pullsPerLegend = (double)pulls / legend;

        Console.WriteLine($"  หินเฉลี่ยตีถึง +6         : {stones:F1} ก้อน");
        Console.WriteLine($"  หินต่อด่าน                 : {stonePerStage:F3} -> ตี +6 หนึ่งชิ้น ≈ {stones / stonePerStage:F0} ด่าน");
        Console.WriteLine($"  เพชรต่อด่าน (บอสทุก 10 ด่าน): {diamondPerStage:F1}");
        Console.WriteLine($"  สุ่มต่อ Legendary 1 ชิ้น   : {pullsPerLegend:F1} ครั้ง ≈ {pullsPerLegend * 100 / diamondPerStage:F0} ด่าน");
        Console.WriteLine($"  รูน 1 ชิ้น                 : ≈ {1 / runePerStage:F0} ด่าน");
        Console.WriteLine($"  รูน SR 1 ชิ้น              : ≈ {1 / srPerStage:F0} ด่าน");

        var start0 = new PlayerData();
        var full = new PlayerData();
        foreach (SlotType slot in Enum.GetValues(typeof(SlotType)))
            EquipmentSystem.Equip(full, Give(full, slot, ItemClass.Legendary, 6).Id);
        Console.WriteLine($"  DPS ไม่ใส่อะไร / Legendary +6 ครบชุด: {StatCalculator.ExpectedDps(StatCalculator.Calculate(start0)):F0} / {StatCalculator.ExpectedDps(StatCalculator.Calculate(full)):F0}");
    }
}
