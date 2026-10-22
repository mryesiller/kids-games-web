import { describe, it, expect } from "vitest";
import { nextSequence, checkInput, starsFromRounds, LEVELS, NOTES, TARGET_ROUND } from "../games/simon/game.js";

describe("simon mantığı (PRD O10)", () => {
  it("dizi her turda tam 1 uzar ve ped aralığında kalır", () => {
    let seq = [];
    for (const [level, cfg] of Object.entries(LEVELS)) {
      seq = [];
      for (let i = 0; i < 12; i++) {
        const next = nextSequence(seq, cfg.pads, () => 0.99); // hep son ped
        expect(next).toHaveLength(seq.length + 1);
        expect(next.at(-1)).toBeLessThan(cfg.pads);
        seq = next;
      }
    }
  });

  it("girdi sırayla doğrulanır", () => {
    const seq = [0, 2, 1];
    expect(checkInput(seq, 0, 0)).toBe(true);
    expect(checkInput(seq, 1, 2)).toBe(true);
    expect(checkInput(seq, 2, 0)).toBe(false); // 1 beklenir
  });

  it("ped sayısı seviyeye göre: 4/4/6, nota her ped için tanımlı", () => {
    expect(LEVELS[1].pads).toBe(4);
    expect(LEVELS[2].pads).toBe(4);
    expect(LEVELS[3].pads).toBe(6);
    expect(NOTES).toHaveLength(6);
  });

  it("yıldız: tur tabanlı eşikler (≥8 → 3★, ≥5 → 2★)", () => {
    expect(starsFromRounds(10)).toBe(3);
    expect(starsFromRounds(8)).toBe(3);
    expect(starsFromRounds(6)).toBe(2);
    expect(starsFromRounds(3)).toBe(1);
    expect(TARGET_ROUND).toBe(10);
  });
});
