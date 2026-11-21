namespace ItemSystem.Core
{
    public class StageReward
    {
        public bool Pickaxe;
        public bool Bomb;
        public int Diamonds;
    }

    public static class StageRewardSystem
    {
        /// <summary>เรียกเมื่อผ่านด่าน</summary>
        public static StageReward OnStageClear(PlayerData player, bool isBoss, IRandom rng)
        {
            var reward = new StageReward
            {
                Pickaxe = rng.Chance(GameConfig.StagePickaxeDrop),
                Bomb = rng.Chance(GameConfig.StageBombDrop),
                Diamonds = isBoss
                    ? GameConfig.BossDiamond
                    : rng.RangeInclusive(GameConfig.StageDiamondMin, GameConfig.StageDiamondMax),
            };
            if (reward.Pickaxe) player.Pickaxes++;
            if (reward.Bomb) player.Bombs++;
            player.Diamonds += reward.Diamonds;
            player.StagesCleared++;
            return reward;
        }
    }

    public static class MiningSystem
    {
        /// <summary>ใช้ Pickaxe 1 อัน คืนจำนวนหินที่ได้ (0 = ไม่ได้), -1 = ไม่มี Pickaxe</summary>
        public static int UsePickaxe(PlayerData player, IRandom rng)
        {
            if (player.Pickaxes <= 0) return -1;
            player.Pickaxes--;
            if (!rng.Chance(GameConfig.PickaxeStoneChance)) return 0;
            int stones = rng.RangeInclusive(GameConfig.PickaxeStoneMin, GameConfig.PickaxeStoneMax);
            player.Stones += stones;
            return stones;
        }

        /// <summary>ใช้ Bomb 1 ลูก คืนรูนที่ได้ หรือ null ถ้าไม่ได้/ไม่มี Bomb</summary>
        public static Rune UseBomb(PlayerData player, IRandom rng)
        {
            if (player.Bombs <= 0) return null;
            player.Bombs--;
            if (!rng.Chance(GameConfig.BombRuneChance)) return null;
            var rune = RuneSystem.Create(rng);
            player.Runes.Add(rune);
            return rune;
        }
    }
}
