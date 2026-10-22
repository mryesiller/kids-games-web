// game.js — O14 Hangisi Büyük: iki sayıdan büyüğü seç. 20 seviye: aralık 10 → 100.
import { starsFromCorrect } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";

export const TARGET = 10;
export const MAX_LEVEL = 20;

export function maxForLevel(level) {
  return Math.min(100, 9 + level * 5); // seviye 1 → 14, 19+ → 100
}

/** Soru üret: {a, b, answer} — a ≠ b. */
export function makeQuestion(level, rng = Math.random) {
  const max = maxForLevel(level);
  const a = 1 + Math.floor(rng() * max);
  let off = 1 + Math.floor(rng() * (max - 1)); // 1..max-1 kayma → b ≠ a garantili
  const b = ((a - 1 + off) % max) + 1;
  return { a, b, answer: Math.max(a, b) };
}

export default {
  id: "bigger",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    let current = 0;
    let correct = 0;
    let locked = false;
    const timers = [];

    const progress = document.createElement("div");
    progress.className = "hint";
    progress.textContent = "Hangisi daha büyük?";
    progress.style.fontWeight = "800";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:24px;justify-content:center;width:100%";

    function showQuestion() {
      locked = false;
      const q = makeQuestion(level);
      progress.textContent = `Hangisi daha büyük? · ${current + 1} / ${TARGET}`;
      row.replaceChildren();
      for (const num of [q.a, q.b]) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = num;
        b.style.cssText =
          "width:min(38vw,180px);height:min(38vw,180px);font-size:clamp(2.6rem,10vw,4.5rem);font-weight:900;display:flex;align-items:center;justify-content:center";
        b.addEventListener("pointerdown", () => {
          if (locked) return;
          if (num === q.answer) {
            locked = true;
            correct += 1;
            sfx.correct();
            b.style.background = "var(--success)";
            b.style.color = "#fff";
            current += 1;
            if (current === TARGET) onWin({ stars: starsFromCorrect(correct) });
            else timers.push(setTimeout(showQuestion, 700));
          } else {
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
    showQuestion();

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
