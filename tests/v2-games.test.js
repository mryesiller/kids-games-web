import { describe, it, expect } from "vitest";
import { configFor, nextHole, rollKind, starsForWhack } from "../games/whack/game.js";
import { choiceCount, makeQuestion as colorQ } from "../games/colors/game.js";
import { maxForLevel, makeQuestion as evenQ } from "../games/even-odd/game.js";
import { targetForLevel, makeQuestion as tenQ } from "../games/make-ten/game.js";
import { countForLevel, makeQuestion as vanishQ } from "../games/vanish/game.js";
import { ramp } from "../shared/difficulty.js";

const rng = (seed) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

describe("köstebek", () => {
  it("hedef artar, süre kısalır, erken seviyede tuzak yoktur", () => {
    expect(configFor(1).goal).toBeLessThan(configFor(20).goal);
    expect(configFor(1).upMs).toBeGreaterThan(configFor(20).upMs);
    expect(configFor(1).bombChance).toBe(0);
    expect(configFor(20).bombChance).toBeGreaterThan(0);
    expect(configFor(1).holes).toBeLessThanOrEqual(configFor(20).holes);
    let prevGoal = 0;
    let prevUp = Infinity;
    for (let level = 1; level <= 20; level++) {
      const c = configFor(level);
      expect(c.goal).toBeGreaterThanOrEqual(prevGoal);
      expect(c.upMs).toBeLessThanOrEqual(prevUp);
      prevGoal = c.goal;
      prevUp = c.upMs;
    }
  });

  it("boş delik seçer ve tuzak oranına uyar", () => {
    expect(nextHole(6, [true, true, true, true, true, true], () => 0.1)).toBe(-1);
    const hole = nextHole(6, [true, false, true, true, true, true], () => 0);
    expect(hole).toBe(1);
    expect(rollKind(1, () => 0.99)).toBe("mole");
    expect(rollKind(20, () => 0)).toBe("bomb");
  });

  it("yıldız yalnız hedef tutunca verilir", () => {
    const goal = configFor(1).goal;
    expect(starsForWhack(goal - 1, goal, 0)).toBe(0);
    expect(starsForWhack(goal, goal, 0)).toBe(3);
    expect(starsForWhack(goal, goal, 3)).toBe(2);
    expect(starsForWhack(goal, goal, 6)).toBe(1);
  });
});

describe("renk bul", () => {
  it("seçenek sayısı artar ve doğru renk tam 1 kez", () => {
    expect(choiceCount(1)).toBeLessThan(choiceCount(20));
    for (let level = 1; level <= 20; level += 3) {
      for (let s = 0; s < 20; s++) {
        const q = colorQ(level, rng(s + level * 10));
        expect(q.options).toHaveLength(choiceCount(level));
        expect(q.options.filter((o) => o.id === q.target.id)).toHaveLength(1);
      }
    }
  });
});

describe("çift tek", () => {
  it("sayı aralığı büyür ve çiftlik doğrudur", () => {
    expect(maxForLevel(1)).toBeLessThan(maxForLevel(20));
    expect(maxForLevel(1)).toBeLessThanOrEqual(8);
    for (let s = 0; s < 40; s++) {
      const q = evenQ(12, rng(s));
      expect(q.n).toBeGreaterThanOrEqual(1);
      expect(q.n).toBeLessThanOrEqual(maxForLevel(12));
      expect(q.even).toBe(q.n % 2 === 0);
    }
  });
});

describe("on'u tamamla", () => {
  it("hedef 5 → 10 → 20 ve cevap hedefi tamamlar", () => {
    expect(targetForLevel(1)).toBe(5);
    expect(targetForLevel(10)).toBe(10);
    expect(targetForLevel(20)).toBe(20);
    for (const level of [1, 8, 16]) {
      for (let s = 0; s < 30; s++) {
        const q = tenQ(level, rng(s + level));
        expect(q.a + q.answer).toBe(q.target);
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
      }
    }
  });
});

describe("kaybolan", () => {
  it("kayıp emoji gösterilenlerdedir ve seçeneklerdedir", () => {
    expect(countForLevel(1)).toBeLessThan(countForLevel(20));
    expect(countForLevel(20)).toBeLessThanOrEqual(6);
    for (let level = 1; level <= 20; level += 4) {
      for (let s = 0; s < 15; s++) {
        const q = vanishQ(level, rng(s + level * 3));
        expect(q.shown).toHaveLength(countForLevel(level));
        expect(q.shown).toContain(q.missing);
        expect(q.options.filter((o) => o === q.missing)).toHaveLength(1);
        expect(q.revealMs).toBe(ramp(level, 2200, 900, 20));
      }
    }
  });
});
