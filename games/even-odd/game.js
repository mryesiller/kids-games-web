// Çift mi Tek mi: küçük sayılarda nokta çiftleri görünür, sonra yalnız sayı kalır.
import { ramp, starsFromCorrect } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";

export const TARGET = 8;
export const MAX_LEVEL = 20;

export function maxForLevel(level) {
  return ramp(level, 5, 30, MAX_LEVEL);
}

export function makeQuestion(level, rng = Math.random) {
  const max = maxForLevel(level);
  const n = 1 + Math.floor(rng() * max);
  return { n, even: n % 2 === 0, showDots: level <= 6 };
}

export default {
  id: "even-odd",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    let current = 0;
    let correct = 0;
    let locked = false;

    const progress = document.createElement("div");
    progress.className = "hint";
    const num = document.createElement("div");
    num.style.cssText = "font-size:clamp(3rem,14vw,5rem);font-weight:900;line-height:1";
    const dots = document.createElement("div");
    dots.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:min(92vw,360px)";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:12px;width:min(92vw,420px)";

    const evenBtn = document.createElement("button");
    evenBtn.type = "button";
    evenBtn.textContent = "Çift";
    evenBtn.style.cssText = "flex:1;font-size:1.5rem;min-height:84px";
    const oddBtn = document.createElement("button");
    oddBtn.type = "button";
    oddBtn.textContent = "Tek";
    oddBtn.style.cssText = "flex:1;font-size:1.5rem;min-height:84px";
    row.append(evenBtn, oddBtn);

    function answer(isEven) {
      if (locked) return;
      const q = currentQ;
      if (isEven === q.even) {
        locked = true;
        correct += 1;
        sfx.correct();
        current += 1;
        if (current === TARGET) onWin({ stars: starsFromCorrect(correct, TARGET) });
        else show();
      } else {
        sfx.wrong();
        (isEven ? evenBtn : oddBtn).classList.remove("shake");
        void (isEven ? evenBtn : oddBtn).offsetWidth;
        (isEven ? evenBtn : oddBtn).classList.add("shake");
      }
    }
    evenBtn.addEventListener("pointerdown", () => answer(true));
    oddBtn.addEventListener("pointerdown", () => answer(false));

    let currentQ = makeQuestion(level);
    function show() {
      locked = false;
      currentQ = makeQuestion(level);
      progress.textContent = `${current + 1} / ${TARGET}`;
      num.textContent = String(currentQ.n);
      dots.replaceChildren();
      if (currentQ.showDots) {
        for (let i = 0; i < currentQ.n; i++) {
          const d = document.createElement("span");
          d.textContent = "●";
          d.style.cssText = `font-size:1.4rem;color:${i % 2 === 0 ? "var(--accent)" : "#e67e22"}`;
          dots.append(d);
        }
      }
    }

    container.append(progress, num, dots, row);
    show();
    return {
      pause() {},
      resume() {},
      destroy() {
        container.replaceChildren();
      },
    };
  },
};
