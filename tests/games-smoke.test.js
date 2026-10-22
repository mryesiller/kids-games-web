// games-smoke.test.js — her DOM oyununu jsdom'da başlatıp butonlara tıklar;
// listener içinde fırlayan herhangi bir hata (örn. eksik import) testi kırmızı yapar.
// Canvas oyunları (number-hunter, maze) jsdom'da ctx alamadığı için kapsam dışı — Playwright/browser smoke onları kapsar.
import { describe, it, expect } from "vitest";

const GAMES = ["memory", "odd-one-out", "pattern", "letter-fish", "hanoi"];

describe("oyun boot smoke (jsdom)", () => {
  for (const id of GAMES) {
    it(`${id}: başlar, tıklamalar hatasız işlenir`, async () => {
      const errors = [];
      const onError = (e) => errors.push(e.message ?? String(e.error));
      window.addEventListener("error", onError);

      const mod = await import(`../games/${id}/game.js`);
      expect(mod.default.id).toBe(id);

      const container = document.createElement("div");
      document.body.append(container);
      let won = false;
      const instance = mod.default.start(container, {
        level: 1,
        onWin: () => {
          won = true;
        },
      });

      // 25 rastgele buton tıklaması
      for (let i = 0; i < 25 && !won; i++) {
        const buttons = [...container.querySelectorAll("button")].filter((b) => !b.disabled);
        if (buttons.length === 0) break;
        buttons[i % buttons.length].click();
      }

      expect(errors, errors.join(" | ")).toHaveLength(0);
      expect(container.children.length).toBeGreaterThan(0);

      instance.destroy();
      expect(container.children.length).toBe(0);
      window.removeEventListener("error", onError);
    });
  }
});
