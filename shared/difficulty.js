// difficulty.js — seviye/yaş yardımcıları (PRD G-7)
// Yaş sorulmaz; önerilen seviye oyun başına sabit varsayılandır (storage'daki
// en yüksek açılan seviye önceliklidir — bkz. storage.getLevel).

/**
 * @param {number} count seviye sayısı (>= 3, PRD G-7)
 * @param {number} [defaultLevel=1] oyuna önerilen başlangıç seviyesi (1 tabanlı)
 * @returns {{ count: number, defaultLevel: number, clamp: (n: number) => number }}
 */
export function makeLevels(count, defaultLevel = 1) {
  const c = Math.max(3, Math.trunc(count));
  const clamp = (n) => Math.max(1, Math.min(c, Math.trunc(n)));
  return { count: c, defaultLevel: clamp(defaultLevel), clamp };
}

/** PRD G-6 eşikleri: doğru sayısı tabanlı yıldız (10 soruluk oyunlar). */
export function starsFromCorrect(correct, total = 10) {
  if (correct >= total) return 3;
  if (correct >= total - 2) return 2;
  if (correct >= total - 4) return 1;
  return 0; // kazanma yok, tekrar deneme (cezasız)
}

/** Hamle tabanlı yıldız: optimal × 1.5 → 3★, × 2 → 2★, aksi 1★. */
export function starsFromMoves(moves, optimal) {
  if (moves <= Math.ceil(optimal * 1.5)) return 3;
  if (moves <= optimal * 2) return 2;
  return 1;
}

/** 1..maxLevel aralığına sıkıştır. Bozuk giriş 1 döner. */
export function clampLevel(level, maxLevel = 20) {
  const n = Math.trunc(Number(level));
  const cap = Math.max(1, Math.trunc(maxLevel) || 1);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(cap, n));
}

/**
 * Seviye 1'de `min`, son seviyede `max`. Ara değerler tam sayı ve monotondur
 * (max < min ise azalır). Uçlar birebir tutar.
 */
export function ramp(level, min, max, maxLevel = 20) {
  const steps = Math.max(1, Math.trunc(maxLevel) - 1);
  const l = clampLevel(level, maxLevel);
  const span = max - min;
  return min + Math.floor((span * (l - 1)) / steps);
}

/** Yıldız yoksa seviye açılmaz (0 yıldız = tekrar). */
export function shouldAdvance(stars) {
  return Math.trunc(Number(stars)) >= 1;
}

/** Fisher-Yates; orijinal diziyi değiştirmez. */
export function shuffled(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
