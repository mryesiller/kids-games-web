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

/** Fisher-Yates; orijinal diziyi değiştirmez. */
export function shuffled(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
