// game.js — O12 Sıraya Diz: sayıları küçükten büyüğe sırayla seç. 20 seviye: 3 → 6 sayı.
import { starsFromWrong } from "../../shared/drag-helpers.js";
import { sfx } from "../../shared/audio.js";

export const ROUNDS = 5;
export const MAX_LEVEL = 20;

export function sizeForLevel(level) {
  return Math.min(6, 3 + Math.floor((level - 1) / 6));
}

/** Tur üret: {numbers: karışık dizi, sorted: doğru sıralama} */
export function makeRound(level, rng = Math.random) {
  const size = sizeForLevel(level);
  const start = Math.floor(rng() * 20);
  const step = 1 + Math.floor(rng() * 3);
  const sorted = Array.from({ length: size }, (_, i) => start + i * step);
  const numbers = [...sorted];
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return { numbers, sorted };
}

export default {
  id: "ordering",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    let round = 0;
    let wrongTaps = 0;
    let nextIdx = 0; // sıradaki (en küçükten) beklenen
    let locked = false;
    const timers = [];

    const progress = document.createElement("div");
    progress.className = "hint";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:12px;flex-wrap:wrap;justify-content:center;width:100%";

    function showRound() {
      nextIdx = 0;
      locked = false;
      const { numbers, sorted: currentSorted } = makeRound(level);
      progress.textContent = `Tur ${round + 1} / ${ROUNDS} · Küçükten büyüğe seç!`;
      row.replaceChildren();
      for (const num of numbers) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = num;
        b.style.fontSize = "1.8rem";
        b.style.minWidth = "76px";
        b.addEventListener("pointerdown", () => {
          if (locked) return;
          if (num === currentSorted[nextIdx]) {
            b.style.background = "var(--success)";
            b.style.color = "#fff";
            b.disabled = true;
            nextIdx += 1;
            sfx.tap();
            if (nextIdx === numbers.length) {
              locked = true;
              sfx.correct();
              round += 1;
              if (round === ROUNDS) onWin({ stars: starsFromWrong(wrongTaps > 3 ? 4 : wrongTaps) });
              else timers.push(setTimeout(showRound, 900));
            }
          } else {
            wrongTaps += 1;
            sfx.wrong();
            b.classList.remove("shake");
            void b.offsetWidth;
            b.classList.add("shake");
          }
        });
        row.append(b);
      }
    }

    container.append(progress, row);
    showRound();

    return {
      pause() {},
      resume() {},
      destroy() {
        timers.forEach(clearTimeout);
        container.replaceChildren();
      },
    };
  },
};
