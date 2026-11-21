namespace ItemSystem.Core
{
    public class StatBreakdown
    {
        public float[] FromBase = new float[5];
        public float[] FromItems = new float[5];
        public float[] FromRunes = new float[5];
        /// <summary>ค่ารวมหลังตัดเพดาน</summary>
        public float[] Total = new float[5];

        public float Get(StatType stat) => Total[(int)stat];
    }

    public static class StatCalculator
    {
        public static StatBreakdown Calculate(PlayerData player)
        {
            var result = new StatBreakdown();
            result.FromBase[(int)StatType.CritRate] = GameConfig.BaseCritRate;
            result.FromBase[(int)StatType.CritDmg] = GameConfig.BaseCritDmg;

            for (int s = 0; s < 6; s++)
            {
                var item = player.GetEquipped((SlotType)s);
                if (item == null) continue;

                foreach (var stat in item.Stats)
                    result.FromItems[(int)stat] += item.GetStat(stat);

                if (item.HasRune)
                {
                    var rune = player.FindRune(item.RuneId);
                    if (rune != null) result.FromRunes[(int)rune.Stat] += rune.Value;
                }
            }

            for (int i = 0; i < 5; i++)
            {
                float total = result.FromBase[i] + result.FromItems[i] + result.FromRunes[i];
                float cap = GameConfig.StatCap[i];
                result.Total[i] = cap >= 0 && total > cap ? cap : total;
            }
            return result;
        }

        /// <summary>ดาเมจเฉลี่ยต่อวินาที (รวมโอกาสติดคริ)</summary>
        public static float ExpectedDps(StatBreakdown stats)
        {
            float critRate = stats.Get(StatType.CritRate) / 100f;
            float critMult = stats.Get(StatType.CritDmg) / 100f;
            float hit = GameConfig.BaseAtk * (1f + stats.Get(StatType.Dmg) / 100f);
            float avgHit = hit * (1f - critRate) + hit * critMult * critRate;
            float attacksPerSecond = GameConfig.BaseAttacksPerSecond * (1f + stats.Get(StatType.AtkRate) / 100f);
            return avgHit * attacksPerSecond;
        }

        /// <summary>
        /// ค่า stat ที่จะเปลี่ยนถ้าใส่อุปกรณ์ชิ้นนี้แทนชิ้นเดิม (ใช้แสดงสีเขียว/แดงบน UI)
        /// </summary>
        public static float[] PreviewEquipDelta(PlayerData player, Equipment candidate)
        {
            var before = Calculate(player).Total;
            var saved = (string[])player.EquippedIds.Clone();
            player.EquippedIds[(int)candidate.Slot] = candidate.Id;
            var after = Calculate(player).Total;
            player.EquippedIds = saved;

            var delta = new float[5];
            for (int i = 0; i < 5; i++) delta[i] = after[i] - before[i];
            return delta;
        }
    }
}
