import { describe, it, expect } from "vitest";
import { bootGame } from "../shared/game-shell.js";

describe("oyun kabuğu", () => {
  it("başlamadan önce ana sayfa görünür ve oyun Başla'ya kadar kurulmaz", () => {
    let started = false;
    bootGame(
      {
        id: "demo-nav",
        maxLevel: 4,
        start() {
          started = true;
          return { destroy() {} };
        },
      },
      { hint: "Hazır ol", hintIcon: "🎮" },
    );

    expect(started).toBe(false);
    expect(document.querySelector("[data-action='back']")).toBeTruthy();
    expect(document.querySelector("[data-action='home']")).toBeTruthy();
    expect(document.body.textContent).toContain("Seviye 1");

    document.querySelector(".start-overlay button.primary").click();
    expect(started).toBe(true);
    expect(document.querySelector("[data-action='back']")).toBeTruthy();
  });
});
