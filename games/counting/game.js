// game.js — O11 Say Bak: ekranda N nesne, doğru sayıyı seç. 20 seviye: 3 → 12 nesne.
import { ICON_URL, ICON_COUNT } from "../../shared/icons.js";
import { starsFromCorrect } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";

export const TARGET = 10;
export const MAX_LEVEL = 20;

export function countForLevel(level) {
  return Math.min(12, 2 + level); // seviye 1 → 3 nesne, 10+ → 12
}

/** Soru üret: {icons: [iconId...], count, options} — options'ta cevap tam 1 kez. */
export function makeQuestion(level, rng = Math.random) {
  const count = countForLevel(level);
  const icons = [];
  for (let i = 0; i < count; i++) {
    icons.push(1 + Math.floor(rng() * ICON_COUNT));
  }
  const options = new Set([count]);
  let d = 1;
  while (options.size < 4) {
    options.add(Math.max(1, count + (d % 2 === 0 ? d / 2 : -((d - 1) / 2))));
    d += 1;
  }
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return { icons, count, answer: count, options: arr };
}

export default {
  id: "counting",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    let current = 0;
    let correct = 0;
    let locked = false;
    const timers = [];

    const progress = document.createElement("div");
    progress.className = "hint";
    const field = document.createElement("div");
    field.style.cssText =
      "display:flex;flex-wrap:wrap;gap:14px;justify-content:center;max-width:min(92vw,560px);padding:12px";
    const opts = document.createElement("div");
    opts.style.cssText = "display:flex;gap:14px;flex-wrap:wrap;justify-content:center";

    function showQuestion() {
      locked = false;
      const q = makeQuestion(level);
      progress.textContent = `${current + 1} / ${TARGET}`;
      field.replaceChildren();
      for (const id of q.icons) {
        const img = document.createElement("img");
        img.src = ICON_URL(id);
        img.alt = "";
        img.draggable = false;
        img.style.cssText = "width:64px;height:64px;object-fit:contain";
        field.append(img);
      }
      opts.replaceChildren();
      for (const opt of q.options) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = opt;
        b.style.fontSize = "1.8rem";
        b.style.minWidth = "72px";
        b.addEventListener("pointerdown", () => {
          if (locked) return;
          if (opt === q.answer) {
            locked = true;
            correct += 1;
            sfx.correct();
            current += 1;
            if (current === TARGET) onWin({ stars: starsFromCorrect(correct) });
            else showQuestion();
          } else {
            sfx.wrong();
            b.classList.remove("shake");
            void b.offsetWidth;
            b.classList.add("shake");
          }
        });
        opts.append(b);
      }
    }

    container.append(progress, field, opts);
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
