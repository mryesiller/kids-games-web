// game.js — O13 Gölge Eşleştir: nesneyi gölgesiyle eşleştir. 20 seviye: 3 → 5 seçenek.
import { ICON_URL, ICON_COUNT } from "../../shared/icons.js";
import { starsFromCorrect } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";

export const TARGET = 10;
export const MAX_LEVEL = 20;

export function optionsForLevel(level) {
  return Math.min(5, 3 + Math.floor((level - 1) / 7));
}

/** Soru üret: {iconId, options: [iconId...]} — cevap tam 1 kez. */
export function makeQuestion(level, rng = Math.random) {
  const optCount = optionsForLevel(level);
  const answer = 1 + Math.floor(rng() * ICON_COUNT);
  const options = new Set([answer]);
  let i = 1;
  while (options.size < optCount) {
    options.add(1 + ((answer + i) % ICON_COUNT));
    i += 1;
  }
  const arr = [...options];
  for (let k = arr.length - 1; k > 0; k--) {
    const j = Math.floor(rng() * (k + 1));
    [arr[k], arr[j]] = [arr[j], arr[k]];
  }
  return { iconId: answer, answer, options: arr };
}

export default {
  id: "shadow",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    let current = 0;
    let correct = 0;
    let locked = false;
    const timers = [];

    const progress = document.createElement("div");
    progress.className = "hint";
    const target = document.createElement("div");
    target.style.cssText =
      "width:min(45vw,180px);aspect-ratio:1;background:var(--surface);border-radius:24px;box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;padding:14px";
    const opts = document.createElement("div");
    opts.style.cssText = "display:flex;gap:14px;flex-wrap:wrap;justify-content:center";

    function showQuestion() {
      locked = false;
      const q = makeQuestion(level);
      progress.textContent = `${current + 1} / ${TARGET}`;
      target.replaceChildren();
      const timg = document.createElement("img");
      timg.src = ICON_URL(q.iconId);
      timg.alt = "";
      timg.draggable = false;
      timg.style.cssText = "width:100%;height:100%;object-fit:contain";
      target.append(timg);

      opts.replaceChildren();
      for (const iconId of q.options) {
        const b = document.createElement("button");
        b.type = "button";
        b.style.cssText =
          "width:min(24vw,96px);aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:8px";
        const img = document.createElement("img");
        img.src = ICON_URL(iconId);
        img.alt = "";
        img.draggable = false;
        img.style.cssText = "width:100%;height:100%;object-fit:contain;filter:brightness(0) opacity(0.75)"; // siluet/gölge
        b.append(img);
        b.addEventListener("pointerdown", () => {
          if (locked) return;
          if (iconId === q.answer) {
            locked = true;
            correct += 1;
            sfx.correct();
            // gölge renklenir (çözüldü görseli)
            img.style.filter = "none";
            current += 1;
            if (current === TARGET) onWin({ stars: starsFromCorrect(correct) });
            else timers.push(setTimeout(showQuestion, 900));
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

    container.append(progress, target, opts);
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
