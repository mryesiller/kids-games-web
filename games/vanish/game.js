// Kaybolan: bir süre görünen emojilerden hangisi gitti?
import { ramp, starsFromCorrect } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";

export const TARGET = 8;
export const MAX_LEVEL = 20;
const EMOJIS = ["🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🐸", "🐵", "🐥", "🦄", "🐢", "🐠"];

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function countForLevel(level) {
  return ramp(level, 2, 6, MAX_LEVEL);
}

export function makeQuestion(level, rng = Math.random) {
  const n = countForLevel(level);
  const pool = shuffle(EMOJIS, rng);
  const shown = pool.slice(0, n);
  const missing = shown[Math.floor(rng() * shown.length)];
  const optionCount = Math.min(4, Math.max(3, n));
  const options = [missing];
  for (const e of pool) {
    if (options.length >= optionCount) break;
    if (!options.includes(e)) options.push(e);
  }
  return {
    shown,
    missing,
    options: shuffle(options, rng),
    revealMs: ramp(level, 2200, 900, MAX_LEVEL),
  };
}

export default {
  id: "vanish",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    let current = 0;
    let correct = 0;
    let locked = true;
    let paused = false;
    let pending = null;
    let timer = 0;

    const progress = document.createElement("div");
    progress.className = "hint";
    const stage = document.createElement("div");
    stage.style.cssText = "display:flex;flex-wrap:wrap;gap:12px;justify-content:center;min-height:88px;font-size:3rem";
    const opts = document.createElement("div");
    opts.style.cssText = "display:flex;flex-wrap:wrap;gap:12px;justify-content:center";

    function ask(q) {
      pending = null;
      locked = false;
      stage.textContent = "Hangisi kayboldu?";
      stage.style.fontSize = "1.3rem";
      stage.style.fontWeight = "800";
      opts.replaceChildren();
      for (const opt of q.options) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = opt;
        b.style.cssText = "font-size:2.2rem;min-width:76px;min-height:76px";
        b.addEventListener("pointerdown", () => {
          if (locked) return;
          if (opt === q.missing) {
            locked = true;
            correct += 1;
            sfx.correct();
            current += 1;
            if (current === TARGET) onWin({ stars: starsFromCorrect(correct, TARGET) });
            else show();
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

    function show() {
      clearTimeout(timer);
      locked = true;
      const q = makeQuestion(level);
      pending = q;
      progress.textContent = `${current + 1} / ${TARGET}`;
      stage.style.fontSize = "3rem";
      stage.style.fontWeight = "400";
      stage.textContent = "";
      opts.replaceChildren();
      for (const e of q.shown) {
        const s = document.createElement("span");
        s.textContent = e;
        stage.append(s);
      }
      timer = setTimeout(() => {
        if (paused) return;
        ask(q);
      }, q.revealMs);
    }

    container.append(progress, stage, opts);
    show();
    return {
      pause() {
        paused = true;
        clearTimeout(timer);
      },
      resume() {
        if (!paused) return;
        paused = false;
        if (pending) ask(pending);
      },
      destroy() {
        clearTimeout(timer);
        container.replaceChildren();
      },
    };
  },
};
