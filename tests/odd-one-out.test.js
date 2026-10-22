import { describe, it, expect } from "vitest";
import { makeRounds, ROUNDS } from "../games/odd-one-out/game.js";
import { makeRound } from "../games/odd-one-out/game.js";

describe("odd-one-out üreteci (PRD O2)", () => {
  it.each([1, 2, 3])("seviye %i: her turda tam 1 farklı öğe vardır", (level) => {
    for (let seed = 0; seed < 50; seed++) {
      const round = makeRound(level, () => seed / 50);
      expect(round.items.filter((i) => i.isOdd)).toHaveLength(1);
      expect(round.items).toHaveLength(4);
      expect(round.oddIndex).toBeGreaterThanOrEqual(0);
      expect(round.oddIndex).toBeLessThan(4);
      expect(round.items[round.oddIndex].isOdd).toBe(true);
    }
  });

  it("10 tur üretir", () => {
    expect(makeRounds(1)).toHaveLength(ROUNDS);
  });

  it("seviye 3: odd öğe dönüş farklıdır, aynı kaynak", () => {
    const r = makeRound(3, () => 0.5);
    const odd = r.items[r.oddIndex];
    expect(odd.css).toContain("rotate");
    expect(r.items.find((i, idx) => idx !== r.oddIndex).src).toBe(odd.src);
  });

  it("seviye 2: odd öğe parlaklık filtreli, aynı kaynak", () => {
    const r = makeRound(2, () => 0.5);
    const odd = r.items[r.oddIndex];
    expect(odd.css).toContain("brightness");
    expect(r.items.find((i, idx) => idx !== r.oddIndex).src).toBe(odd.src);
  });

  it("seviye 1: odd öğe farklı ikon kaynağıdır", () => {
    const r = makeRound(1, () => 0.5);
    const odd = r.items[r.oddIndex];
    const same = r.items.find((i, idx) => idx !== r.oddIndex);
    expect(odd.src).not.toBe(same.src);
  });
});
