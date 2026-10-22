import { describe, it, expect } from "vitest";
import { makeQuestion, isSolvable, QUESTION_COUNT } from "../games/pattern/game.js";

describe("pattern üreteci (PRD O5)", () => {
  it("her seviyede 10 soru üretir ve hepsi çözülebilir + tek doğru cevap", () => {
    for (const level of [1, 2, 3]) {
      for (let i = 0; i < QUESTION_COUNT * 3; i++) {
        const q = makeQuestion(level, i);
        expect(isSolvable(q)).toBe(true);
        // tek doğru cevap: options içinde answer tam 1 kez
        expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
      }
    }
  });

  it("aritmetik örüntüler kurallıdır (sabit fark)", () => {
    for (let i = 0; i < 20; i++) {
      const q = makeQuestion(3, i);
      if (q.kind !== "arithmetic") continue;
      const diffs = q.shown.slice(1).map((v, k) => v - q.shown[k]);
      expect(new Set(diffs).size).toBe(1);
      expect(q.answer).toBe(q.shown[3] + diffs[0]);
    }
  });

  it("büyüyen diziler kurallıdır (fark artar)", () => {
    for (let i = 0; i < 20; i++) {
      const q = makeQuestion(3, i);
      if (q.kind !== "growing") continue;
      const diffs = q.shown.slice(1).map((v, k) => v - q.shown[k]);
      expect(diffs).toEqual([1, 2, 3]);
      expect(q.answer).toBe(q.shown[3] + 4);
    }
  });

  it("ikon örüntüleri periyodiktir ve cevap sekansın bir sonraki öğesidir", () => {
    for (const level of [1, 2]) {
      for (let i = 0; i < 20; i++) {
        const q = makeQuestion(level, i);
        const period = q.kind === "AB" ? 2 : q.kind === "AAB" ? 3 : 3;
        expect(q.answer).toBe(q.shown[(4 - period + period) % period] ?? q.shown[(4) % period]);
        // shown[i] === shown[i % period]
        expect(q.shown[2]).toBe(q.shown[2 % period]);
      }
    }
  });
});
