// game.js — O1 Hafıza Kartları (PRD): DOM + CSS Grid, 3 seviye, hamle→yıldız.
// Görseller: Higgsfield ile üretilmiş sprite sheet'ten dilimlenmiş WebP ikonlar (assets/).
import { t } from "../../shared/i18n.js";
import { shuffled, starsFromMoves } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";
import { ICON_URL, ICON_COUNT } from "../../shared/icons.js";
import { showStartOverlay } from "../../shared/ui.js";

/** Seviye → çift sayısı: 20 seviye, kademeli artar (6 → 20 kart). */
const PAIRS_BY_LEVEL = (level) => Math.min(10, 2 + Math.floor((level - 1) / 2) + (level > 1 ? 1 : 0));
const OPTIMAL_MOVES = PAIRS_BY_LEVEL;
const PREVIEW_MS = 3000; // Başla'ya basınca tüm kartlar 3 sn açık gösterilir (ezber süresi)
const COLUMNS_BY_PAIRS = { 2: 2, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 5, 10: 5 };

export const MAX_LEVEL = 20;

export function deal(pairs, rng = Math.random) {
  // havuzdan rastgele `pairs` farklı ikon seç (çeşitlilik: 22 ikon)
  const pool = shuffled(Array.from({ length: ICON_COUNT }, (_, i) => i + 1), rng);
  const chosen = pool.slice(0, pairs);
  return shuffled(
    chosen.flatMap((id) => [id, id]),
    rng,
  );
}

export default {
  id: "memory",
  maxLevel: MAX_LEVEL,
  /** @returns {{destroy: () => void}} */
  start(container, { level, onWin }) {
    const pairs = PAIRS_BY_LEVEL(level);
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
          timers.push(setTimeout(() => onWin({ stars: starsFromMoves(moves, OPTIMAL_MOVES(pairs)) }), 400));
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

    // Başla overlay'i: talimat + silik arka fon; Başla → 3 sn önizleme → oyun
    showStartOverlay({
      instruction: "Kartlara dikkatlice bak ve ezberle!",
      icon: "🃏",
      onStart: () => {
        cards.forEach(flipUp);
        timers.push(
          setTimeout(() => {
            cards.forEach(flipDown);
            lock = false;
          }, PREVIEW_MS),
        );
      },
    });

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
