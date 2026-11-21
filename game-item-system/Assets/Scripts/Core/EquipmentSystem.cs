namespace ItemSystem.Core
{
    public static class EquipmentSystem
    {
        /// <summary>สวมใส่อุปกรณ์ ถ้าช่องนั้นมีชิ้นเดิมอยู่ ชิ้นเดิมจะกลับเข้ากระเป๋า</summary>
        public static bool Equip(PlayerData player, string itemId)
        {
            var item = player.FindItem(itemId);
            if (item == null) return false;
            player.EquippedIds[(int)item.Slot] = item.Id;
            return true;
        }

        public static void Unequip(PlayerData player, SlotType slot)
        {
            player.EquippedIds[(int)slot] = "";
        }
    }
}
