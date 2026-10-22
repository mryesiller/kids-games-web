// drag-helpers.js — sürükleme oyunlarının ortak yıldız formülü (PRD §4: yanlış bırakma 0 → 3★, ≤3 → 2★, else 1★)
export function starsFromWrong(wrongDrops) {
  if (wrongDrops === 0) return 3;
  if (wrongDrops <= 3) return 2;
  return 1;
}
