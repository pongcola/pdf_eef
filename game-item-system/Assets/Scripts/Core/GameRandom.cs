using System;

namespace ItemSystem.Core
{
    public interface IRandom
    {
        /// <summary>คืนค่า 0 (รวม) ถึง 1 (ไม่รวม)</summary>
        double NextDouble();
        /// <summary>คืนค่า min ถึง max (รวมทั้งสองฝั่ง)</summary>
        int RangeInclusive(int min, int max);
    }

    public class SystemRandom : IRandom
    {
        private readonly Random _rng;
        public SystemRandom() { _rng = new Random(); }
        public SystemRandom(int seed) { _rng = new Random(seed); }
        public double NextDouble() => _rng.NextDouble();
        public int RangeInclusive(int min, int max) => _rng.Next(min, max + 1);
    }

    public static class RandomExtensions
    {
        public static bool Chance(this IRandom rng, float probability) => rng.NextDouble() < probability;

        /// <summary>สุ่ม index ตามน้ำหนัก เช่น {0.6, 0.3, 0.1}</summary>
        public static int Weighted(this IRandom rng, float[] weights, int startIndex = 0)
        {
            float total = 0f;
            for (int i = startIndex; i < weights.Length; i++) total += weights[i];
            double roll = rng.NextDouble() * total;
            for (int i = startIndex; i < weights.Length; i++)
            {
                roll -= weights[i];
                if (roll < 0) return i;
            }
            return weights.Length - 1;
        }

        public static T PickEnum<T>(this IRandom rng) where T : Enum
        {
            var values = (T[])Enum.GetValues(typeof(T));
            return values[rng.RangeInclusive(0, values.Length - 1)];
        }
    }
}
