// On'u Tamamla: verilen sayıyı hedefe tamamlayanı seç. Hedef 5 → 10 → 20.
import { starsFromCorrect } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";

export const TARGET_COUNT = 8;
export const MAX_LEVEL = 20;

export function targetForLevel(level) {
  if (level <= 6) return 5;
  if (level <= 14) return 10;
  return 20;
}

export function makeQuestion(level, rng = Math.random) {
  const target = targetForLevel(level);
  const a = 1 + Math.floor(rng() * (target - 1));
  const answer = target - a;
  const options = new Set([answer]);
  let d = 1;
  while (options.size < 4 && d < 50) {
    const cand = answer + (d % 2 === 0 ? d / 2 : -Math.ceil(d / 2));
    if (cand >= 0 && cand <= target && cand !== a) options.add(cand);
    d += 1;
  }
  let extra = 0;
  while (options.size < 4) {
    const cand = (answer + extra + 1) % (target + 1);
    if (cand !== a) options.add(cand);
    extra += 1;
  }
  const arr = [...options].slice(0, 4);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return { target, a, answer, options: arr };
}

export default {
  id: "make-ten",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    let current = 0;
    let correct = 0;
    let locked = false;
    let timer = 0;

    const progress = document.createElement("div");
    progress.className = "hint";
    const prompt = document.createElement("div");
    prompt.style.cssText = "font-size:clamp(1.8rem,8vw,2.8rem);font-weight:900;text-align:center";
    const opts = document.createElement("div");
    opts.style.cssText = "display:grid;grid-template-columns:repeat(2,minmax(96px,1fr));gap:12px;width:min(92vw,360px)";

    function show() {
      locked = false;
      const q = makeQuestion(level);
      progress.textContent = `${current + 1} / ${TARGET_COUNT}`;
      prompt.textContent = `${q.a} + ? = ${q.target}`;
      opts.replaceChildren();
      for (const opt of q.options) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = String(opt);
        b.style.cssText = "font-size:1.8rem;min-height:76px";
        b.addEventListener("pointerdown", () => {
          if (locked) return;
          if (opt === q.answer) {
            locked = true;
            correct += 1;
            sfx.correct();
            b.style.background = "var(--success)";
            b.style.color = "#fff";
            current += 1;
            if (current === TARGET_COUNT) onWin({ stars: starsFromCorrect(correct, TARGET_COUNT) });
            else timer = setTimeout(show, 500);
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

    container.append(progress, prompt, opts);
    show();
    return {
      pause() {},
      resume() {},
      destroy() {
        clearTimeout(timer);
        container.replaceChildren();
      },
    };
  },
};
