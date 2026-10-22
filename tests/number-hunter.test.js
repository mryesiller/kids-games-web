import { describe, it, expect } from "vitest";
import { makeQuestion, opsForLevel, TARGET_CORRECT } from "../games/number-hunter/questions.js";

describe("number-hunter soru üreteci (PRD O4)", () => {
  it("doğru cevap her zaman seçeneklerdedir ve tam 1 kez", () => {
    for (const level of [1, 2, 3]) {
      for (let seed = 0; seed < 200; seed++) {
        const rng = () => ((seed * 9301 + 49297) % 233280) / 233280;
        const q = makeQuestion(level, rng);
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
        expect(q.options).toHaveLength(4);
      }
    }
  });

  it("seviye 1 yalnız toplama (0-10), sonuç aralıkta", () => {
    expect(opsForLevel(1)).toEqual(["add"]);
    for (let seed = 0; seed < 100; seed++) {
      const rng = () => ((seed * 7919 + seed) % 1000) / 1000;
      const q = makeQuestion(1, rng);
      const [a, sym, b] = q.text.split(" ");
      expect(sym).toBe("+");
      expect(q.answer).toBe(+a + +b);
      expect(q.answer).toBeLessThanOrEqual(10);
    }
  });

  it("seviye 2 çıkarmada sonuç asla negatif değildir", () => {
    for (let seed = 0; seed < 200; seed++) {
      const rng = () => ((seed * 6271 + 13) % 997) / 997;
      const q = makeQuestion(2, rng);
      expect(q.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("seviye 3 çarpma: 1-5 aralığı", () => {
    for (let seed = 0; seed < 100; seed++) {
      const rng = () => ((seed * 4211 + 7) % 991) / 991;
      const q = makeQuestion(3, rng);
      const [a, sym, b] = q.text.split(" ");
      if (sym === "×") {
        expect(+a).toBeLessThanOrEqual(5);
        expect(+b).toBeLessThanOrEqual(5);
        expect(q.answer).toBe(+a * +b);
      }
    }
  });

  it("5 doğru = kazanma hedefi", () => {
    expect(TARGET_CORRECT).toBe(5);
  });
});
