using System;
using System.Collections.Generic;

namespace ItemSystem.Core
{
    public enum StatType { CritRate = 0, CritDmg = 1, Dmg = 2, AtkRate = 3, AtkRange = 4 }

    public enum ItemClass { Silver = 0, Gold = 1, Platinum = 2, Legendary = 3 }

    public enum SlotType { Helmet = 0, Suit = 1, Boots = 2, Armor = 3, Gloves = 4, Weapon = 5 }

    public enum RuneTier { B = 0, A = 1, S = 2, SR = 3 }

    [Serializable]
    public class Rune
    {
        public string Id;
        public StatType Stat;
        public RuneTier Tier;
        /// <summary>Id ของอุปกรณ์ที่ใส่รูนนี้อยู่ ว่าง = อยู่ในกระเป๋า</summary>
        public string EquippedItemId = "";

        public float Value => GameConfig.RuneValue[(int)Stat][(int)Tier];
        public bool InBag => string.IsNullOrEmpty(EquippedItemId);
    }

    [Serializable]
    public class Equipment
    {
        public string Id;
        public SlotType Slot;
        public ItemClass Class;
        public int EnhanceLevel;
        /// <summary>จำนวนครั้งที่ตีพลาดสะสม แยกตามระดับเป้าหมาย (index 0 = ตี +1 ... index 5 = ตี +6)</summary>
        public int[] PityFails = new int[GameConfig.MaxEnhance];
        /// <summary>Id ของรูนที่ใส่อยู่ ว่าง = ไม่มีรูน</summary>
        public string RuneId = "";

        public bool HasRune => !string.IsNullOrEmpty(RuneId);
        public StatType[] Stats => GameConfig.SlotStats[(int)Slot];

        public float GetStat(StatType stat)
        {
            if (Array.IndexOf(Stats, stat) < 0) return 0f;
            return GameConfig.ItemStatByClass[(int)stat][(int)Class] * GameConfig.EnhanceMultiplier[EnhanceLevel];
        }
    }

    [Serializable]
    public class PlayerData
    {
        public int Diamonds;
        public int Pickaxes;
        public int Bombs;
        public int Stones;
        /// <summary>จำนวนครั้งที่สุ่มอุปกรณ์ตั้งแต่ได้ Legendary ครั้งล่าสุด</summary>
        public int GachaPityCount;
        public int StagesCleared;

        public List<Equipment> Items = new List<Equipment>();
        public List<Rune> Runes = new List<Rune>();
        /// <summary>Id ของอุปกรณ์ที่สวมใส่ ตาม index ของ SlotType (ว่าง = ไม่ได้ใส่)</summary>
        public string[] EquippedIds = { "", "", "", "", "", "" };

        public Equipment FindItem(string id) => Items.Find(i => i.Id == id);
        public Rune FindRune(string id) => Runes.Find(r => r.Id == id);

        public Equipment GetEquipped(SlotType slot)
        {
            var id = EquippedIds[(int)slot];
            return string.IsNullOrEmpty(id) ? null : FindItem(id);
        }

        public bool IsEquipped(string itemId) => Array.IndexOf(EquippedIds, itemId) >= 0;
    }

    public static class Ids
    {
        public static string New() => Guid.NewGuid().ToString("N");
    }
}
