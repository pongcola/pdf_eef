using System.Collections.Generic;

namespace ItemSystem.Core
{
    public static class GachaSystem
    {
        /// <summary>สุ่ม 1 ครั้ง คืน null ถ้าเพชรไม่พอ</summary>
        public static Equipment Pull1(PlayerData player, IRandom rng)
        {
            if (player.Diamonds < GameConfig.GachaCost1) return null;
            player.Diamonds -= GameConfig.GachaCost1;
            return PullOne(player, rng, false);
        }

        /// <summary>สุ่ม 10 ครั้ง การันตี Gold ขึ้นไปอย่างน้อย 1 ชิ้น คืน null ถ้าเพชรไม่พอ</summary>
        public static List<Equipment> Pull10(PlayerData player, IRandom rng)
        {
            if (player.Diamonds < GameConfig.GachaCost10) return null;
            player.Diamonds -= GameConfig.GachaCost10;

            var results = new List<Equipment>();
            bool gotGoldPlus = false;
            for (int i = 0; i < 10; i++)
            {
                bool forceGoldPlus = i == 9 && !gotGoldPlus;
                var item = PullOne(player, rng, forceGoldPlus);
                if (item.Class >= ItemClass.Gold) gotGoldPlus = true;
                results.Add(item);
            }
            return results;
        }

        /// <summary>แยกชิ้นอุปกรณ์เป็นเพชร (ห้ามแยกชิ้นที่ใส่อยู่) รูนที่ใส่ไว้คืนเข้ากระเป๋า</summary>
        public static int Dismantle(PlayerData player, string itemId)
        {
            var item = player.FindItem(itemId);
            if (item == null || player.IsEquipped(itemId)) return 0;
            RuneSystem.Remove(player, itemId);
            player.Items.Remove(item);
            int diamonds = GameConfig.DismantleDiamonds[(int)item.Class];
            player.Diamonds += diamonds;
            return diamonds;
        }

        private static Equipment PullOne(PlayerData player, IRandom rng, bool forceGoldPlus)
        {
            ItemClass cls;
            if (player.GachaPityCount + 1 >= GameConfig.GachaLegendaryPity)
                cls = ItemClass.Legendary;
            else
                cls = (ItemClass)rng.Weighted(GameConfig.GachaClassRate, forceGoldPlus ? (int)ItemClass.Gold : 0);

            player.GachaPityCount = cls == ItemClass.Legendary ? 0 : player.GachaPityCount + 1;

            var item = new Equipment
            {
                Id = Ids.New(),
                Slot = rng.PickEnum<SlotType>(),
                Class = cls,
            };
            player.Items.Add(item);
            return item;
        }
    }
}
