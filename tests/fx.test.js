import { describe, it, expect } from "vitest";
import { confetti, prefersReducedMotion } from "../shared/fx.js";

describe("görsel efekt", () => {
  it("azaltılmış harekette konfeti üretmez", () => {
    window.matchMedia = (q) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} });
    expect(prefersReducedMotion()).toBe(true);
    confetti();
    expect(document.querySelector(".fx-bit")).toBeNull();
  });

  it("hareket serbestken konfeti parçası ekler", () => {
    window.matchMedia = () => ({ matches: false, media: "", addEventListener() {}, removeEventListener() {} });
    confetti();
    expect(document.querySelectorAll(".fx-bit").length).toBeGreaterThan(5);
    document.querySelectorAll(".fx-bit, .fx-layer").forEach((el) => el.remove());
  });
});
