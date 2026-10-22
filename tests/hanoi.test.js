import { describe, it, expect } from "vitest";
import {
  initialTowers,
  isValidMove,
  applyMove,
  isSolved,
  optimalMoves,
  nextHintMove,
} from "../games/hanoi/rules.js";
import { starsFromWrong } from "../shared/drag-helpers.js";

describe("hanoi kuralları (PRD O9)", () => {
  it.each([3, 4, 5])("%i disk: kural ihlali mümkün değildir, 2^n−1 hamlede biter", (n) => {
    let towers = initialTowers(n);
    let count = 0;
    // standart çözümle oyna (her adım applyMove üzerinden — geçersiz hamle null döner)
    const solve = (k, from, to, via) => {
      if (k === 0) return;
      solve(k - 1, from, via, to);
      const next = applyMove(towers, from, to);
      expect(next).not.toBeNull(); // çözüm hamleleri her zaman geçerli
      towers = next;
      count += 1;
      solve(k - 1, via, to, from);
    };
    solve(n, 0, 2, 1);
    expect(count).toBe(optimalMoves(n));
    expect(isSolved(towers, n)).toBe(true);
  });

  it("geçersiz hamleler reddedilir: büyük üstüne büyük, boş kaynak, aynı çubuk", () => {
    const t = initialTowers(3);
    expect(isValidMove(t, 0, 0)).toBe(false); // aynı çubuk
    expect(isValidMove(t, 1, 0)).toBe(false); // boş kaynak
    expect(isValidMove(t, 0, 2)).toBe(true);
    const t2 = applyMove(t, 0, 1); // disk 1 → çubuk 1
    expect(isValidMove(t2, 0, 1)).toBe(false); // disk 2, üstünde disk 1 var → büyük küçüğün üstüne
    expect(applyMove(t2, 0, 1)).toBeNull();
  });

  it("ipucu: her state'ten verilen hamleler çözüme ulaştırır", () => {
    for (const n of [3, 4, 5]) {
      let towers = initialTowers(n);
      for (let guard = 0; guard < 2 ** n; guard++) {
        if (isSolved(towers, n)) break;
        const hint = nextHintMove(towers, n);
        expect(hint).not.toBeNull();
        expect(isValidMove(towers, hint[0], hint[1])).toBe(true); // ipucu hamlesi her zaman geçerli
        towers = applyMove(towers, hint[0], hint[1]);
      }
      expect(isSolved(towers, n)).toBe(true);
    }
  });
});

describe("sürükleme yıldız formülü (PRD §4)", () => {
  it("yanlış bırakma 0 → 3★, ≤3 → 2★, else 1★", () => {
    expect(starsFromWrong(0)).toBe(3);
    expect(starsFromWrong(3)).toBe(2);
    expect(starsFromWrong(4)).toBe(1);
  });
});
