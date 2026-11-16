// Renk Bul: hedef rengin aynısını seç. Yüksek seviyede yakın tonlar karışır.
import { ramp, starsFromCorrect } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";

export const TARGET = 8;
export const MAX_LEVEL = 20;

const BASE = [
  { id: "red", name: "Kırmızı", css: "#e74c3c" },
  { id: "blue", name: "Mavi", css: "#3498db" },
  { id: "yellow", name: "Sarı", css: "#f1c40f" },
  { id: "green", name: "Yeşil", css: "#2ecc71" },
  { id: "orange", name: "Turuncu", css: "#e67e22" },
  { id: "purple", name: "Mor", css: "#9b59b6" },
];

const CLOSE = {
  red: { id: "pink", name: "Pembe", css: "#f48fb1" },
  blue: { id: "navy", name: "Lacivert", css: "#1a5276" },
  yellow: { id: "gold", name: "Altın", css: "#b7950b" },
  green: { id: "lime", name: "Açık yeşil", css: "#82e0aa" },
  orange: { id: "brown", name: "Kahve", css: "#a04000" },
  purple: { id: "violet", name: "Eflatun", css: "#7d3c98" },
};

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function choiceCount(level) {
  return ramp(level, 3, 6, MAX_LEVEL);
}

export function makeQuestion(level, rng = Math.random) {
  const n = choiceCount(level);
  const target = BASE[Math.floor(rng() * BASE.length)];
  const picked = [target];
  if (level >= 12) picked.push(CLOSE[target.id]);
  for (const c of shuffle(BASE.filter((c) => c.id !== target.id), rng)) {
    if (picked.length >= n) break;
    picked.push(c);
  }
  return { target, options: shuffle(picked.slice(0, n), rng) };
}

export default {
  id: "colors",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    let current = 0;
    let correct = 0;
    let locked = false;

    const progress = document.createElement("div");
    progress.className = "hint";
    const swatch = document.createElement("div");
    swatch.style.cssText = "width:min(28vw,120px);aspect-ratio:1;border-radius:50%;border:4px solid #fff;box-shadow:var(--shadow)";
    const name = document.createElement("div");
    name.style.cssText = "font-size:1.4rem;font-weight:900";
    const opts = document.createElement("div");
    opts.style.cssText = "display:flex;flex-wrap:wrap;gap:12px;justify-content:center;width:min(92vw,480px)";

    function show() {
      locked = false;
      const q = makeQuestion(level);
      progress.textContent = `${current + 1} / ${TARGET}`;
      swatch.style.background = q.target.css;
      name.textContent = q.target.name;
      opts.replaceChildren();
      for (const opt of q.options) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", opt.name);
        b.style.cssText = `width:min(28vw,96px);aspect-ratio:1;border-radius:50%;background:${opt.css};padding:0`;
        b.addEventListener("pointerdown", () => {
          if (locked) return;
          if (opt.id === q.target.id) {
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

    container.append(progress, swatch, name, opts);
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
