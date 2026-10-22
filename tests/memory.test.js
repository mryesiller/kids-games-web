import { describe, it, expect } from "vitest";
import { deal } from "../games/memory/game.js";
import { starsFromMoves, starsFromCorrect, makeLevels, shuffled } from "../shared/difficulty.js";

describe("memory deal", () => {
  it.each([3, 6, 10])("%i çift → tam %i*2 kart, her ikon tam 2 kez", (pairs) => {
    const deck = deal(pairs);
    expect(deck).toHaveLength(pairs * 2);
    const counts = {};
    for (const c of deck) counts[c] = (counts[c] ?? 0) + 1;
    expect(Object.values(counts).every((n) => n === 2)).toBe(true);
  });

  it("her çağrıda farklı dağılım (rastgelelik kanıtı)", () => {
    const a = deal(6);
    const b = deal(6);
    expect(a.join()).not.toBe(b.join()); // 12! permütasyonda çakışma olasılığı ihmal edilebilir
  });
});

describe("yıldız eşikleri (PRD §4)", () => {
  it("hamle tabanlı: optimal×1.5 → 3★, ×2 → 2★, aksi 1★", () => {
    expect(starsFromMoves(4, 3)).toBe(3);
    expect(starsFromMoves(6, 3)).toBe(2);
    expect(starsFromMoves(7, 3)).toBe(1);
  });
  it("doğru sayısı tabanlı: 10 → 3★, 8-9 → 2★, 6-7 → 1★", () => {
    expect(starsFromCorrect(10)).toBe(3);
    expect(starsFromCorrect(9)).toBe(2);
    expect(starsFromCorrect(8)).toBe(2);
    expect(starsFromCorrect(7)).toBe(1);
    expect(starsFromCorrect(5)).toBe(0);
  });
});

describe("difficulty", () => {
  it("makeLevels en az 3 seviye ve clamp uygular", () => {
    const lv = makeLevels(3, 5);
    expect(lv.count).toBe(3);
    expect(lv.defaultLevel).toBe(3); // clamp
    expect(lv.clamp(99)).toBe(3);
    expect(lv.clamp(0)).toBe(1);
  });
  it("shuffled orijinali değiştirmez ve elemanları korur", () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffled(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual(src);
  });
});
