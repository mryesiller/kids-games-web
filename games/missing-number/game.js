// game.js — O15 Eksik Sayı: 1..N dizisinde eksik olanı bul. 20 seviye: dizi 4 → 10 öğe.
import { starsFromCorrect } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";

export const TARGET = 10;
export const MAX_LEVEL = 20;

export function sizeForLevel(level) {
  return Math.min(10, 3 + Math.floor(level / 4) + 1); // seviye 1 → 4, 20 → 10? (3+5+1=9→min10)
}

/** Soru üret: {shown: [num|null...], answer, options} */
export function makeQuestion(level, rng = Math.random) {
  const size = Math.min(9, 4 + Math.floor((level - 1) / 4)); // 4 → 9 öğe
  const start = 1 + Math.floor(rng() * 20);
  const seq = Array.from({ length: size }, (_, i) => start + i);
  const missingIdx = Math.floor(rng() * size);
  const answer = seq[missingIdx];
  const shown = seq.map((n, i) => (i === missingIdx ? null : n));

  const options = new Set([answer]);
  let d = 1;
  while (options.size < 4) {
    options.add(Math.max(1, answer + (d % 2 === 0 ? d / 2 : -((d - 1) / 2))));
    d += 1;
  }
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return { shown, answer, options: arr };
}

export default {
  id: "missing-number",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    let current = 0;
    let correct = 0;
    let locked = false;
    const timers = [];

    const progress = document.createElement("div");
    progress.className = "hint";
    const seq = document.createElement("div");
    seq.style.cssText =
      "display:flex;gap:10px;justify-content:center;align-items:center;font-size:clamp(1.8rem,7vw,3rem);font-weight:900;flex-wrap:wrap";
    const opts = document.createElement("div");
    opts.style.cssText = "display:flex;gap:14px;flex-wrap:wrap;justify-content:center";

    function showQuestion() {
      locked = false;
      const q = makeQuestion(level);
      progress.textContent = `${current + 1} / ${TARGET}`;
      seq.replaceChildren();
      const holeRef = { el: null };
      for (const v of q.shown) {
        const s = document.createElement("span");
        if (v === null) {
          s.textContent = "?";
          s.style.cssText =
            "color:var(--accent);border:4px dashed var(--accent);border-radius:12px;padding:2px 14px;min-width:1.6em;text-align:center";
          holeRef.el = s;
        } else {
          s.textContent = v;
        }
        seq.append(s);
      }
      opts.replaceChildren();
      for (const opt of q.options) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = opt;
        b.style.cssText = "font-size:1.6rem;min-width:72px";
        b.addEventListener("pointerdown", () => {
          if (locked) return;
          if (opt === q.answer) {
            locked = true;
            correct += 1;
            sfx.correct();
            holeRef.el.textContent = opt;
            holeRef.el.style.cssText =
              "color:#fff;background:var(--success);border:4px solid var(--success);border-radius:12px;padding:2px 14px;min-width:1.6em;text-align:center";
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

    container.append(progress, seq, opts);
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
