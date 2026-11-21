using System;
using System.Collections.Generic;
using ItemSystem.Core;
using UnityEngine;

namespace ItemSystem.UnityBridge
{
    /// <summary>
    /// จุดเชื่อมระหว่าง UI กับระบบหลัก วางไว้บน GameObject ใน Scene แรก
    /// UI เรียกเมธอดที่นี่ แล้วฟัง OnPlayerChanged เพื่อวาดหน้าจอใหม่
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public PlayerData Player { get; private set; }
        public event Action OnPlayerChanged;

        private readonly IRandom _rng = new SystemRandom();

        private void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Player = SaveManager.Load();
        }

        private void OnApplicationPause(bool paused) { if (paused) SaveManager.Save(Player); }
        private void OnApplicationQuit() => SaveManager.Save(Player);

        private void Changed()
        {
            SaveManager.Save(Player);
            OnPlayerChanged?.Invoke();
        }

        // ---------- Status ----------
        public StatBreakdown GetStats() => StatCalculator.Calculate(Player);
        public float[] PreviewEquip(Equipment item) => StatCalculator.PreviewEquipDelta(Player, item);

        // ---------- แต่งตัว ----------
        public void Equip(string itemId) { if (EquipmentSystem.Equip(Player, itemId)) Changed(); }
        public void Unequip(SlotType slot) { EquipmentSystem.Unequip(Player, slot); Changed(); }

        // ---------- ด่าน ----------
        public StageReward ClearStage(bool isBoss)
        {
            var reward = StageRewardSystem.OnStageClear(Player, isBoss, _rng);
            Changed();
            return reward;
        }

        // ---------- เหมือง ----------
        public int UsePickaxe() { var r = MiningSystem.UsePickaxe(Player, _rng); Changed(); return r; }
        public Rune UseBomb() { var r = MiningSystem.UseBomb(Player, _rng); Changed(); return r; }

        // ---------- ตีบวก ----------
        public EnhancePreview PreviewEnhance(string itemId) => EnhanceSystem.Preview(Player.FindItem(itemId));
        public EnhanceResult Enhance(string itemId)
        {
            var r = EnhanceSystem.TryEnhance(Player, itemId, _rng);
            if (r.Error == EnhanceError.None) Changed();
            return r;
        }

        // ---------- รูน ----------
        public void InsertRune(string itemId, string runeId) { if (RuneSystem.Insert(Player, itemId, runeId)) Changed(); }
        public void RemoveRune(string itemId) { if (RuneSystem.Remove(Player, itemId) != null) Changed(); }

        // ---------- สุ่มอุปกรณ์ ----------
        public Equipment Gacha1() { var r = GachaSystem.Pull1(Player, _rng); if (r != null) Changed(); return r; }
        public List<Equipment> Gacha10() { var r = GachaSystem.Pull10(Player, _rng); if (r != null) Changed(); return r; }
        public int Dismantle(string itemId) { var r = GachaSystem.Dismantle(Player, itemId); if (r > 0) Changed(); return r; }
    }
}
