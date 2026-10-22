import { describe, it, expect } from "vitest";
import { makeQuestion as countQ, countForLevel, MAX_LEVEL as countMax } from "../games/counting/game.js";
import { makeRound as orderRound, sizeForLevel } from "../games/ordering/game.js";
import { makeQuestion as shadowQ, optionsForLevel } from "../games/shadow/game.js";
import { makeQuestion as biggerQ, maxForLevel } from "../games/bigger/game.js";
import { makeQuestion as missQ } from "../games/missing-number/game.js";
import { REWARDS, unlockedRewards, nextReward } from "../shared/rewards.js";

const rng = (seed) => () => ((seed * 9301 + 49297) % 233280) / 233280;

describe("counting (Say Bak)", () => {
  it("nesne sayısı seviyeyle artar (3 → 12) ve options'ta cevap tam 1 kez", () => {
    expect(countForLevel(1)).toBe(3);
    expect(countForLevel(20)).toBe(12);
    for (let s = 0; s < 50; s++) {
      const q = countQ(5, rng(s));
      expect(q.icons).toHaveLength(q.count);
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
    }
  });
  it("20 seviye", () => expect(countMax).toBe(20));
});

describe("ordering (Sıraya Diz)", () => {
  it("boyut 3 → 6 artar ve karışık dizide tüm sayılar korunur", () => {
    expect(sizeForLevel(1)).toBe(3);
    expect(sizeForLevel(20)).toBe(6);
    for (let s = 0; s < 30; s++) {
      const { numbers, sorted } = orderRound(10, rng(s));
      expect([...numbers].sort((a, b) => a - b)).toEqual(sorted);
    }
  });
});

describe("shadow (Gölge Eşleştir)", () => {
  it("seçenek sayısı 3 → 5 ve cevap tam 1 kez", () => {
    expect(optionsForLevel(1)).toBe(3);
    expect(optionsForLevel(20)).toBe(5);
    for (let s = 0; s < 50; s++) {
      const q = shadowQ(10, rng(s));
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});

describe("bigger (Hangisi Büyük)", () => {
  it("aralık seviyeyle büyür ve cevap daima ikisinden büyük", () => {
    expect(maxForLevel(1)).toBeLessThan(maxForLevel(20));
    for (let s = 0; s < 50; s++) {
      const q = biggerQ(10, rng(s));
      expect(q.a).not.toBe(q.b);
      expect(q.answer).toBe(Math.max(q.a, q.b));
    }
  });
});

describe("missing-number (Eksik Sayı)", () => {
  it("gösterilen dizide tam 1 eksik vardır ve options cevabı içerir", () => {
    for (let s = 0; s < 50; s++) {
      const q = missQ(10, rng(s));
      expect(q.shown.filter((v) => v === null)).toHaveLength(1);
      expect(q.options).toContain(q.answer);
      const known = q.shown.filter((v) => v !== null);
      expect(Math.max(...known) - Math.min(...known)).toBeLessThanOrEqual(q.shown.length - 1);
    }
  });
});

describe("ödül sistemi", () => {
  it("eşikler artan sıralı ve unlocked doğru süzülür", () => {
    const costs = REWARDS.map((r) => r.cost);
    expect([...costs].sort((a, b) => a - b)).toEqual(costs);
    expect(unlockedRewards(0)).toHaveLength(0);
    expect(unlockedRewards(5).map((r) => r.id)).toEqual(["rookie", "fox"]);
    expect(nextReward(6)?.id).toBe("balloon");
    expect(nextReward(999)).toBeNull();
  });
});
