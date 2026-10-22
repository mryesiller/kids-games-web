// game.js — O1 Hafıza Kartları (PRD): DOM + CSS Grid, 3 seviye, hamle→yıldız.
// Görseller: Higgsfield ile üretilmiş sprite sheet'ten dilimlenmiş WebP ikonlar (assets/).
import { t } from "../../shared/i18n.js";
import { shuffled, starsFromMoves } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";
import { ICON_URL, ICON_COUNT } from "../../shared/icons.js";

/** Seviye → çift sayısı: bölüm geçtikçe kare sayısı artar (6 → 8 → 12 → 16 → 20 kart). */
const PAIRS_BY_LEVEL = { 1: 3, 2: 4, 3: 6, 4: 8, 5: 10 };
const OPTIMAL_MOVES = { 1: 3, 2: 4, 3: 6, 4: 8, 5: 10 }; // optimal = çift sayısı (alt sınır)
const PREVIEW_MS = 1000; // başlamadan önce tüm kartlar 1 sn açık gösterilir
const COLUMNS_BY_PAIRS = { 3: 3, 4: 4, 6: 4, 8: 4, 10: 5 };

export const MAX_LEVEL = 5;

export function deal(pairs, rng = Math.random) {
  const ids = Array.from({ length: pairs }, (_, i) => (i % ICON_COUNT) + 1);
  return shuffled(
    ids.flatMap((id) => [id, id]),
    rng,
  );
}

export default {
  id: "memory",
  maxLevel: MAX_LEVEL,
  /** @returns {{destroy: () => void}} */
  start(container, { level, onWin }) {
    const pairs = PAIRS_BY_LEVEL[level] ?? PAIRS_BY_LEVEL[1];
    const deck = deal(pairs);
    let first = null; // açık ilk kart
    let lock = true; // önizleme bitene kadar kilitli
    let matched = 0;
    let moves = 0;
    const timers = [];

    const grid = document.createElement("div");
    grid.className = "grid";
    grid.style.gridTemplateColumns = `repeat(${COLUMNS_BY_PAIRS[pairs] ?? 4}, 1fr)`;

    const movesEl = document.createElement("div");
    movesEl.className = "hint";
    movesEl.textContent = `${t("game.moves")}: 0`;

    const cards = deck.map((icon) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.style.cssText =
        "aspect-ratio:1;padding:6px;display:flex;align-items:center;justify-content:center;overflow:hidden";
      card.dataset.icon = icon;
      card.setAttribute("aria-label", "kart");
      const img = document.createElement("img");
      img.src = ICON_URL(icon);
      img.alt = "";
      img.draggable = false;
      img.style.cssText = "width:100%;height:100%;object-fit:contain;display:none";
      card.append(img);
      grid.append(card);
      return card;
    });

    function flipUp(card) {
      card.firstChild.style.display = "block";
      card.setAttribute("aria-label", `ikon ${card.dataset.icon}`);
    }
    function flipDown(card) {
      card.firstChild.style.display = "none";
      card.setAttribute("aria-label", "kart");
    }

    function onCard(card) {
      if (lock || card.firstChild.style.display !== "none" || card.disabled) return;
      sfx.tap();
      flipUp(card);
      if (!first) {
        first = card;
        return;
      }
      moves += 1;
      movesEl.textContent = `${t("game.moves")}: ${moves}`;
      if (first.dataset.icon === card.dataset.icon) {
        first.disabled = true;
        card.disabled = true;
        first = null;
        matched += 1;
        sfx.correct();
        if (matched === pairs) {
          timers.push(setTimeout(() => onWin({ stars: starsFromMoves(moves, OPTIMAL_MOVES[pairs]) }), 400));
        }
      } else {
        lock = true;
        const a = first;
        first = null;
        a.classList.add("shake");
        card.classList.add("shake");
        sfx.wrong();
        timers.push(
          setTimeout(() => {
            flipDown(a);
            flipDown(card);
            a.classList.remove("shake");
            card.classList.remove("shake");
            lock = false;
          }, 1000),
        );
      }
    }

    const listeners = new Map();
    for (const card of cards) {
      const fn = () => onCard(card);
      listeners.set(card, fn);
      card.addEventListener("pointerdown", fn);
    }
    container.append(movesEl, grid);

    // Önizleme: tüm kartlar 1 sn açık gösterilir, sonra kapanır ve oyun başlar
    cards.forEach(flipUp);
    timers.push(
      setTimeout(() => {
        cards.forEach(flipDown);
        lock = false;
      }, PREVIEW_MS),
    );

    return {
      pause() {
        /* memory'de zamanlayıcı tabanlı akış yok; yanlış eşleşme kilit süresi kısa, dokunulmaz */
      },
      resume() {},
      destroy() {
        timers.forEach(clearTimeout);
        for (const [card, fn] of listeners) card.removeEventListener("pointerdown", fn);
        container.replaceChildren();
      },
    };
  },
};
