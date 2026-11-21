namespace ItemSystem.Core
{
    public static class RuneSystem
    {
        public static Rune Create(IRandom rng)
        {
            return new Rune
            {
                Id = Ids.New(),
                Stat = rng.PickEnum<StatType>(),
                Tier = (RuneTier)rng.Weighted(GameConfig.RuneTierRate),
            };
        }

        /// <summary>ใส่รูนลงอุปกรณ์ ถ้ามีรูนเดิม รูนเดิมกลับเข้ากระเป๋า</summary>
        public static bool Insert(PlayerData player, string itemId, string runeId)
        {
            var item = player.FindItem(itemId);
            var rune = player.FindRune(runeId);
            if (item == null || rune == null) return false;

            // ถ้ารูนนี้ใส่อยู่ในชิ้นอื่น ถอดออกมาก่อน
            if (!rune.InBag)
            {
                var other = player.FindItem(rune.EquippedItemId);
                if (other != null) other.RuneId = "";
            }

            Remove(player, itemId);
            item.RuneId = rune.Id;
            rune.EquippedItemId = item.Id;
            return true;
        }

        /// <summary>ถอดรูนออก รูนคืนเข้ากระเป๋า</summary>
        public static Rune Remove(PlayerData player, string itemId)
        {
            var item = player.FindItem(itemId);
            if (item == null || !item.HasRune) return null;
            var rune = player.FindRune(item.RuneId);
            item.RuneId = "";
            if (rune != null) rune.EquippedItemId = "";
            return rune;
        }
    }
}
