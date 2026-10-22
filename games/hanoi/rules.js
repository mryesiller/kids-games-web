// rules.js — Hanoi kural mantığı: saf fonksiyonlar (tests/hanoi.test.js).

/** Başlangıç: tüm diskler çubuk 0'da, en büyük altta. */
export function initialTowers(disks) {
  return [Array.from({ length: disks }, (_, i) => disks - i), [], []];
}

/** Hamle geçerli mi? (hedef boş veya taşınan disk en üsttekinden küçük) */
export function isValidMove(towers, from, to) {
  const src = towers[from];
  const dst = towers[to];
  if (!src || !dst || from === to || src.length === 0) return false;
  return dst.length === 0 || src.at(-1) < dst.at(-1);
}

/** Hamleyi uygula; geçersizse null (çağıran reddeder). */
export function applyMove(towers, from, to) {
  if (!isValidMove(towers, from, to)) return null;
  const next = towers.map((t) => [...t]);
  next[to].push(next[from].pop());
  return next;
}

/** Çözüldü mü? (tüm diskler çubuk 2'de) */
export function isSolved(towers, disks) {
  return towers[2].length === disks;
}

/** En az hamle: 2^n - 1 */
export function optimalMoves(disks) {
  return 2 ** disks - 1;
}

/** İpucu: mevcut state'ten çözüme giden sıradaki doğru hamle.
 * Klasik özyineleme: n. diski hedefe koymak için önce n-1..1'i 'other'a toplamak gerekir. */
export function nextHintMove(towers, disks) {
  const posOf = (d) => towers.findIndex((t) => t.includes(d));
  function hint(n, target) {
    if (n === 0) return null;
    const p = posOf(n);
    if (p === target) return hint(n - 1, target);
    const other = 3 - p - target;
    return hint(n - 1, other) ?? [p, target];
  }
  return hint(disks, 2);
}
