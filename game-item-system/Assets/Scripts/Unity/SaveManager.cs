using System.IO;
using ItemSystem.Core;
using UnityEngine;

namespace ItemSystem.UnityBridge
{
    /// <summary>เซฟ/โหลดข้อมูลผู้เล่นเป็น JSON ในเครื่อง</summary>
    public static class SaveManager
    {
        private static string SavePath => Path.Combine(Application.persistentDataPath, "player.json");

        public static void Save(PlayerData data)
        {
            var json = JsonUtility.ToJson(data);
            var tmp = SavePath + ".tmp";
            File.WriteAllText(tmp, json);           // เขียนไฟล์ชั่วคราวก่อน กันเซฟเสียถ้าเกมปิดกลางคัน
            if (File.Exists(SavePath)) File.Delete(SavePath);
            File.Move(tmp, SavePath);
        }

        public static PlayerData Load()
        {
            if (!File.Exists(SavePath)) return new PlayerData();
            var data = JsonUtility.FromJson<PlayerData>(File.ReadAllText(SavePath)) ?? new PlayerData();
            Repair(data);
            return data;
        }

        /// <summary>เติมค่าที่หายไปจากเซฟเวอร์ชันเก่า</summary>
        private static void Repair(PlayerData data)
        {
            if (data.EquippedIds == null || data.EquippedIds.Length != 6)
                data.EquippedIds = new[] { "", "", "", "", "", "" };
            foreach (var item in data.Items)
                if (item.PityFails == null || item.PityFails.Length != GameConfig.MaxEnhance)
                    item.PityFails = new int[GameConfig.MaxEnhance];
        }
    }
}
