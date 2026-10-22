// game.js — O3 Yap-Boz (PRD): tek resmi background-position ile parçalara böl.
// Seviyeler: 2x2 / 3x3 / 4x4. Sürükle-bırak + dokun-seç alternatifi.
// Doğru yuva → snap; yanlış → shake ve geri (cezasız). Yıldız: yanlış bırakma sayısına göre.
import { enableDrag, createTapSelect } from "../../shared/drag.js";
import { starsFromWrong } from "../../shared/drag-helpers.js";
import { PICTURES } from "./pictures.js";
import { sfx } from "../../shared/audio.js";

const GRID_BY_LEVEL = { 1: 2, 2: 3, 3: 4 };

export function slotIndexForPiece(n, row, col) {
  return row * n + col;
}

export default {
  id: "puzzle",
  start(container, { level, onWin }) {
    const n = GRID_BY_LEVEL[level] ?? GRID_BY_LEVEL[1];
    const picture = PICTURES[Math.floor(Math.random() * PICTURES.length)];
    let wrongDrops = 0;
    let placed = 0;
    const total = n * n;
    const cleanups = [];

    // üst bar: ilerleme + referans küçük resim
    const bar = document.createElement("div");
    bar.className = "hint";
    const statusEl = document.createElement("span");
    const refBtn = document.createElement("button");
    refBtn.type = "button";
    refBtn.textContent = "🖼️";
    refBtn.setAttribute("aria-label", "Referans resmi göster");
    let refImg = null;
    refBtn.addEventListener("click", () => {
      if (refImg) {
        refImg.remove();
        refImg = null;
        return;
      }
      refImg = document.createElement("img");
      refImg.src = picture;
      refImg.alt = "Referans";
      refImg.style.cssText = "width:96px;height:96px;object-fit:cover;border-radius:8px;margin-left:8px";
      bar.append(refImg);
    });
    bar.append(statusEl, refBtn);

    const area = document.createElement("div");
    area.style.cssText =
      "display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;justify-content:center;width:100%";

    // yuvalar (hedef tahta)
    const board = document.createElement("div");
    board.style.cssText = `display:grid;grid-template-columns:repeat(${n},1fr);width:min(90vw,420px);gap:4px;background:var(--surface);padding:8px;border-radius:var(--radius);box-shadow:var(--shadow)`;
    const slots = [];
    for (let i = 0; i < total; i++) {
      const slot = document.createElement("div");
      slot.dataset.slot = i;
      slot.style.cssText = "aspect-ratio:1;background:var(--border);border-radius:6px";
      board.append(slot);
      slots.push(slot);
    }

    // parçalar (karışık tepsi)
    const tray = document.createElement("div");
    tray.style.cssText = `display:grid;grid-template-columns:repeat(${n},minmax(56px,80px));gap:6px;width:min(90vw,${80 * n + 8 * n}px)`;
    const order = [...Array(total).keys()];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    const tap = createTapSelect({
      onSelect(el, on) {
        el.style.outline = on ? "4px solid var(--accent)" : "";
      },
      onTargetPick(target, el) {
        tryPlace(el, target);
      },
    });

    function tryPlace(piece, slot) {
      if (slot.children.length > 0) return;
      if (Number(piece.dataset.piece) === Number(slot.dataset.slot)) {
        slot.textContent = "";
        slot.append(piece.firstChild); // parça görseli yerleşir
        piece.remove();
        placed += 1;
        sfx.correct();
        statusEl.textContent = `${placed} / ${total}`;
        if (placed === total) {
          onWin({ stars: starsFromWrong(wrongDrops) });
        }
      } else {
        wrongDrops += 1;
        sfx.wrong();
        slot.classList.remove("shake");
        void slot.offsetWidth;
        slot.classList.add("shake");
      }
    }

    for (const idx of order) {
      const piece = document.createElement("button");
      piece.type = "button";
      piece.dataset.piece = idx;
      piece.setAttribute("aria-label", `parça ${idx + 1}`);
      piece.style.cssText = `aspect-ratio:1;padding:0;border-width:2px;overflow:hidden;background-image:url(${picture});background-size:${n * 100}% ${n * 100}%;background-position:${(idx % n) * (100 / (n - 1))}% ${Math.floor(idx / n) * (100 / (n - 1))}%`;
      const row = Math.floor(idx / n);
      const col = idx % n;
      cleanups.push(
        enableDrag(piece, {
          getTargets: () => slots,
          onDrop: (slot) => tryPlace(piece, slot),
        }),
      );
      piece.addEventListener("click", () => tap.pickItem(piece));
      tray.append(piece);
    }
    slots.forEach((slot) => slot.addEventListener("click", () => tap.pickTarget(slot)));

    area.append(board, tray);
    container.append(bar, area);
    statusEl.textContent = `0 / ${total}`;

    return {
      pause() {},
      resume() {},
      destroy() {
        cleanups.forEach((fn) => fn());
        container.replaceChildren();
      },
    };
  },
};
