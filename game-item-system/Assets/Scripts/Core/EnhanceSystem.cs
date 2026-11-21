namespace ItemSystem.Core
{
    public enum EnhanceError { None, ItemNotFound, MaxLevel, NotEnoughStones }

    public class EnhanceResult
    {
        public EnhanceError Error;
        public bool Success;
        public int FromLevel;
        public int ToLevel;
        /// <summary>โอกาสที่ใช้ในการตีครั้งนี้ (รวม Pity แล้ว)</summary>
        public float Chance;
    }

    public class EnhancePreview
    {
        public int TargetLevel;
        public float BaseChance;
        public float PityBonus;
        public float TotalChance;
        /// <summary>ระดับที่จะเหลือถ้าตีพลาด</summary>
        public int LevelOnFail;
        public int StoneCost;
    }

    public static class EnhanceSystem
    {
        /// <summary>ข้อมูลสำหรับแสดงบนหน้าจอก่อนกดตี เช่น "โอกาสสำเร็จ: 25% (พื้นฐาน 10% + Pity 15%)"</summary>
        public static EnhancePreview Preview(Equipment item)
        {
            if (item == null || item.EnhanceLevel >= GameConfig.MaxEnhance) return null;
            int idx = item.EnhanceLevel; // index 0 = ตี +1
            float baseChance = GameConfig.EnhanceSuccess[idx];
            float pity = item.PityFails[idx] * GameConfig.EnhancePityPerFail[idx];
            float total = baseChance + pity;
            if (total > 1f) total = 1f;

            return new EnhancePreview
            {
                TargetLevel = item.EnhanceLevel + 1,
                BaseChance = baseChance,
                PityBonus = total - baseChance,
                TotalChance = total,
                LevelOnFail = GameConfig.EnhanceDowngradeOnFail[idx] ? item.EnhanceLevel - 1 : item.EnhanceLevel,
                StoneCost = GameConfig.EnhanceStoneCost,
            };
        }

        public static EnhanceResult TryEnhance(PlayerData player, string itemId, IRandom rng)
        {
            var item = player.FindItem(itemId);
            if (item == null) return new EnhanceResult { Error = EnhanceError.ItemNotFound };
            if (item.EnhanceLevel >= GameConfig.MaxEnhance) return new EnhanceResult { Error = EnhanceError.MaxLevel };
            if (player.Stones < GameConfig.EnhanceStoneCost) return new EnhanceResult { Error = EnhanceError.NotEnoughStones };

            var preview = Preview(item);
            int idx = item.EnhanceLevel;
            player.Stones -= GameConfig.EnhanceStoneCost;

            var result = new EnhanceResult { FromLevel = item.EnhanceLevel, Chance = preview.TotalChance };
            if (rng.Chance(preview.TotalChance))
            {
                result.Success = true;
                item.PityFails[idx] = 0;      // รีเซ็ต Pity ของขั้นนี้
                item.EnhanceLevel++;
            }
            else
            {
                item.PityFails[idx]++;        // Pity ไม่หายแม้ตกระดับ
                item.EnhanceLevel = preview.LevelOnFail;
            }
            result.ToLevel = item.EnhanceLevel;
            return result;
        }
    }
}
