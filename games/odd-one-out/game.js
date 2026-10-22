// game.js — O2 Farklı Olanı Bul (PRD): Higgsfield ikonları, 10 tur.
// Seviyeler: büyük fark (farklı hayvan) → orta (renk tonu, brightness filtresi) → küçük (dönüş).
// Her turda tam 1 farklı öğe (invariant testi tests/odd-one-out.test.js).
import { starsFromCorrect } from "../../shared/difficulty.js";
import { ICON_URL, ICON_COUNT } from "../../shared/icons.js";

export const ROUNDS = 10;
export const MAX_LEVEL = 20;

/**
 * Bir tur üret: {items: [{src, css, isOdd}], oddIndex}
 * level 1: farklı HAYVAN; level 2: aynı hayvan koyu ton; level 3: 90° döndürülmüş.
 */
export function makeRound(level, rng = Math.random) {
  const base = 1 + Math.floor(rng() * ICON_COUNT);
  // sabit rng'de bile sonlu: çakışma varsa bir sonraki ikona kaydır
  const oddIcon = (base % ICON_COUNT) + 1;
  const oddIndex = Math.floor(rng() * 4);
  const items = [];
  for (let i = 0; i < 4; i++) {
    if (i === oddIndex) {
      if (level === 1) items.push({ src: ICON_URL(oddIcon), css: "", isOdd: true });
      else if (level === 2) items.push({ src: ICON_URL(base), css: "filter:brightness(0.55) saturate(0.7)", isOdd: true });
      else items.push({ src: ICON_URL(base), css: "transform:rotate(90deg)", isOdd: true });
    } else {
      items.push({ src: ICON_URL(base), css: "", isOdd: false });
    }
  }
  return { items, oddIndex };
}

/** 10 turun tamamı. */
export function makeRounds(level, rng = Math.random) {
  return Array.from({ length: ROUNDS }, () => makeRound(level, rng));
}

export default {
  id: "odd-one-out",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    // 20 seviye: 1-7 büyük fark (şekil), 8-14 ton, 15-20 dönüş
    const diff = level <= 7 ? 1 : level <= 14 ? 2 : 3;
    const rounds = makeRounds(diff);
    let current = 0;
    let correct = 0;

    const progress = document.createElement("div");
    progress.className = "hint";
    const grid = document.createElement("div");
    grid.className = "grid";
    grid.style.cssText = "grid-template-columns:repeat(2,1fr);max-width:420px";

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
            correct += 1;
            current += 1;
            if (current === ROUNDS) onWin({ stars: starsFromCorrect(correct) });
            else showRound();
          } else {
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
