namespace ItemSystem.Core
{
    /// <summary>
    /// ตัวเลขทั้งหมดของระบบ ปรับความสมดุลที่ไฟล์นี้ที่เดียว
    /// ค่า stat ทั้งหมดเป็น % (เช่น 6f = 6%)
    /// </summary>
    public static class GameConfig
    {
        // ---------- ตัวละคร ----------
        public const float BaseCritRate = 5f;
        public const float BaseCritDmg = 150f;
        public const float BaseAtk = 100f;
        public const float BaseAttacksPerSecond = 1f;

        /// <summary>เพดาน stat รวม (index ตาม StatType) ค่าติดลบ = ไม่มีเพดาน</summary>
        public static readonly float[] StatCap = { 100f, -1f, -1f, -1f, 100f };

        // ---------- อุปกรณ์ ----------
        /// <summary>stat ของแต่ละช่อง (index ตาม SlotType)</summary>
        public static readonly StatType[][] SlotStats =
        {
            new[] { StatType.AtkRange, StatType.AtkRate },  // หมวก
            new[] { StatType.AtkRate, StatType.CritRate },  // ชุด
            new[] { StatType.CritRate, StatType.AtkRange }, // รองเท้า
            new[] { StatType.Dmg, StatType.AtkRate },       // เกราะ
            new[] { StatType.CritRate, StatType.CritDmg },  // ถุงมือ
            new[] { StatType.Dmg, StatType.CritRate },      // อาวุธ
        };

        /// <summary>ค่า stat ต่อชิ้นที่ +0 [StatType][ItemClass] = Silver, Gold, Platinum, Legendary</summary>
        public static readonly float[][] ItemStatByClass =
        {
            new[] { 2f, 3f, 4.5f, 6f },   // Crit Rate
            new[] { 8f, 12f, 18f, 25f },  // Crit Dmg
            new[] { 5f, 8f, 12f, 16f },   // Dmg
            new[] { 3f, 4.5f, 6.5f, 9f }, // Attack Rate
            new[] { 4f, 6f, 9f, 12f },    // Attack Range
        };

        // ---------- ตีบวก ----------
        public const int MaxEnhance = 6;
        public const int EnhanceStoneCost = 3;

        /// <summary>โอกาสสำเร็จพื้นฐาน index 0 = ตี +1 ... index 5 = ตี +6</summary>
        public static readonly float[] EnhanceSuccess = { 0.80f, 0.70f, 0.50f, 0.40f, 0.20f, 0.10f };

        /// <summary>ตีพลาดแล้วลดระดับ 1 ขั้นหรือไม่ (ตี +5 และ +6)</summary>
        public static readonly bool[] EnhanceDowngradeOnFail = { false, false, false, false, true, true };

        /// <summary>Pity: โอกาสที่เพิ่มต่อครั้งที่พลาด (ตี +5 = +10%, ตี +6 = +5%)</summary>
        public static readonly float[] EnhancePityPerFail = { 0f, 0f, 0f, 0f, 0.10f, 0.05f };

        /// <summary>ตัวคูณ stat ตามระดับ index 0 = +0 ... index 6 = +6</summary>
        public static readonly float[] EnhanceMultiplier = { 1.00f, 1.05f, 1.10f, 1.18f, 1.28f, 1.40f, 1.55f };

        // ---------- รูน ----------
        /// <summary>โอกาสได้ tier B, A, S, SR</summary>
        public static readonly float[] RuneTierRate = { 0.60f, 0.28f, 0.10f, 0.02f };

        /// <summary>ค่ารูน [StatType][RuneTier] = B, A, S, SR</summary>
        public static readonly float[][] RuneValue =
        {
            new[] { 2f, 4f, 7f, 12f },  // Crit Rate
            new[] { 5f, 10f, 18f, 30f },// Crit Dmg
            new[] { 3f, 6f, 10f, 16f }, // Dmg
            new[] { 3f, 5f, 9f, 15f },  // Attack Rate
            new[] { 5f, 8f, 12f, 20f }, // Attack Range
        };

        // ---------- ด่าน ----------
        public const float StagePickaxeDrop = 0.30f;
        public const float StageBombDrop = 0.10f;
        public const int StageDiamondMin = 5;
        public const int StageDiamondMax = 15;
        public const int BossDiamond = 50;

        // ---------- เหมือง ----------
        public const float PickaxeStoneChance = 0.50f;
        public const int PickaxeStoneMin = 1;
        public const int PickaxeStoneMax = 3;
        public const float BombRuneChance = 0.30f;

        // ---------- สุ่มอุปกรณ์ ----------
        public const int GachaCost1 = 100;
        public const int GachaCost10 = 900;
        /// <summary>โอกาสได้ Silver, Gold, Platinum, Legendary</summary>
        public static readonly float[] GachaClassRate = { 0.60f, 0.30f, 0.085f, 0.015f };
        /// <summary>สุ่มครบกี่ครั้งแล้วการันตี Legendary</summary>
        public const int GachaLegendaryPity = 80;
        /// <summary>แยกชิ้นอุปกรณ์ได้เพชรเท่าไร ตาม class</summary>
        public static readonly int[] DismantleDiamonds = { 5, 15, 50, 200 };
    }
}
