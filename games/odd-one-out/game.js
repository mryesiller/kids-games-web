// game.js — O2 Farklı Olanı Bul (PRD): Higgsfield ikonları, 10 tur.
// Seviyeler: büyük fark (farklı hayvan) → orta (renk tonu, brightness filtresi) → küçük (dönüş).
// Her turda tam 1 farklı öğe (invariant testi tests/odd-one-out.test.js).
import { starsFromCorrect, clampLevel } from "../../shared/difficulty.js";
import { ICON_URL, ICON_COUNT } from "../../shared/icons.js";
import { sfx } from "../../shared/audio.js";

export const ROUNDS = 10;
export const MAX_LEVEL = 20;

/**
 * Bir tur üret: {items: [{src, css, isOdd}], oddIndex}
 * level 1: farklı HAYVAN; level 2: aynı hayvan koyu ton; level 3: 90° döndürülmüş.
 */
function buildRound(mode, count, deg, rng) {
  const base = 1 + Math.floor(rng() * ICON_COUNT);
  const oddIcon = (base % ICON_COUNT) + 1;
  const oddIndex = Math.floor(rng() * count);
  const items = [];
  for (let i = 0; i < count; i++) {
    if (i === oddIndex) {
      if (mode === "icon") items.push({ src: ICON_URL(oddIcon), css: "", isOdd: true });
      else if (mode === "tone") items.push({ src: ICON_URL(base), css: "filter:brightness(0.55) saturate(0.7)", isOdd: true });
      else items.push({ src: ICON_URL(base), css: `transform:rotate(${deg}deg)`, isOdd: true });
    } else {
      items.push({ src: ICON_URL(base), css: "", isOdd: false });
    }
  }
  return { items, oddIndex };
}

/** Eski 1/2/3 modları (testler bu üçlüyü kilitler). */
export function makeRound(level, rng = Math.random) {
  if (level === 2) return buildRound("tone", 4, 90, rng);
  if (level === 3) return buildRound("rotate", 4, 90, rng);
  return buildRound("icon", 4, 90, rng);
}

/** Oyun seviyesi: fark türü ve öğe sayısı birlikte artar, geri dönmez. */
export function specForLevel(level) {
  const l = clampLevel(level, 20);
  if (l <= 4) return { mode: "icon", count: 4, deg: 90 };
  if (l <= 8) return { mode: "icon", count: 6, deg: 90 };
  if (l <= 12) return { mode: "tone", count: 4, deg: 90 };
  if (l <= 16) return { mode: "tone", count: 6, deg: 90 };
  if (l <= 18) return { mode: "rotate", count: 4, deg: 90 };
  return { mode: "rotate", count: 6, deg: 40 };
}

export function makeLevelRound(level, rng = Math.random) {
  const spec = specForLevel(level);
  return buildRound(spec.mode, spec.count, spec.deg, rng);
}

/** 10 turun tamamı. */
export function makeRounds(level, rng = Math.random) {
  return Array.from({ length: ROUNDS }, () => makeRound(level, rng));
}

export default {
  id: "odd-one-out",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    const rounds = Array.from({ length: ROUNDS }, () => makeLevelRound(level));
    const cols = rounds[0].items.length > 4 ? 3 : 2;
    let current = 0;
    let correct = 0;

    const progress = document.createElement("div");
    progress.className = "hint";
    const grid = document.createElement("div");
    grid.className = "grid";
    grid.style.cssText = `grid-template-columns:repeat(${cols},1fr);max-width:min(92vw,520px)`;

    function showRound() {
      const round = rounds[current];
      progress.textContent = `${current + 1} / ${ROUNDS}`;
      grid.replaceChildren();
      round.items.forEach((item) => {
        const b = document.createElement("button");
        b.type = "button";
        b.style.cssText = "aspect-ratio:1;padding:12px;display:flex;align-items:center;justify-content:center";
        const img = document.createElement("img");
        img.src = item.src;
        img.alt = "";
        img.draggable = false;
        img.style.cssText = `width:100%;height:100%;object-fit:contain;${item.css}`;
        b.append(img);
        b.addEventListener("pointerdown", () => {
          if (item.isOdd) {
            sfx.correct();
            correct += 1;
            current += 1;
            if (current === ROUNDS) onWin({ stars: starsFromCorrect(correct) });
            else showRound();
          } else {
            sfx.wrong();
            b.classList.remove("shake");
            void b.offsetWidth; // animasyonu yeniden tetikle
            b.classList.add("shake");
          }
        });
        grid.append(b);
      });
    }

    container.append(progress, grid);
    showRound();

    return {
      pause() {},
      resume() {},
      destroy() {
        container.replaceChildren();
      },
    };
  },
};
