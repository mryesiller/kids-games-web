// game.js — O8 Renk ve Şekil Ayıklayıcı (PRD): nesne doğru kutuya; kural tur değiştirir.
// Renk modeli: nesnenin ALTINDAKİ RENKLİ ROZET (kırmızı/mavi daire) — filtre kullanılmaz,
// böylece kutu etiketi ile nesne rengi her zaman birebir aynıdır (çocuk için tek yorum).
// Seviyeler: tek kural (renk) → kural değişimi (renk/şekil) → iki kural birlikte.
import { enableDrag, createTapSelect } from "../../shared/drag.js";
import { starsFromWrong } from "../../shared/drag-helpers.js";
import { ICON_URL, ICON_COUNT } from "../../shared/icons.js";
import { sfx } from "../../shared/audio.js";

export const OBJECTS_PER_ROUND = 8;

const COLORS = {
  red: { css: "#e74c3c", label: "Kırmızı", glyph: "🔴" },
  blue: { css: "#3498db", label: "Mavi", glyph: "🔵" },
  yellow: { css: "#f1c40f", label: "Sarı", glyph: "🟡" },
  green: { css: "#2ecc71", label: "Yeşil", glyph: "🟢" },
  purple: { css: "#9b59b6", label: "Mor", glyph: "🟣" },
};
const COLOR_ORDER = ["red", "blue", "yellow", "green", "purple"];

/** 20 seviye: 1-4 arası 2 renk, sonra her 4 seviyede 1 renk eklenir (maks 5). */
export function colorsForLevel(level) {
  const count = Math.min(5, 2 + Math.floor((level - 1) / 4));
  return COLOR_ORDER.slice(0, count);
}

export function makeObjects(roundIndex, colors, rng = Math.random) {
  const objs = [];
  for (let i = 0; i < OBJECTS_PER_ROUND; i++) {
    objs.push({
      iconId: 1 + Math.floor(rng() * ICON_COUNT),
      color: colors[i % colors.length],
    });
  }
  for (let i = objs.length - 1; i > 0; i--) {
    const j = (roundIndex * (i + 3)) % (i + 1);
    [objs[i], objs[j]] = [objs[j], objs[i]];
  }
  return objs;
}

export function ruleFor(level, roundIndex) {
  // 20 seviye: 1-6 renk, 7-13 kural değişimi, 14-20 iki kural
  if (level <= 6) return "color";
  if (level <= 13) return roundIndex % 2 === 0 ? "color" : "shape";
  return "both";
}

export function accepts(rule, obj, box) {
  if (rule === "color") return obj.color === box.color;
  if (rule === "shape") return obj.iconId === box.iconId;
  return obj.color === box.color && obj.iconId === box.iconId;
}

export default {
  id: "sorter",
  maxLevel: 20,
  start(container, { level, onWin }) {
    const ROUNDS = 3;
    let round = 0;
    let wrongDrops = 0;
    let placedThisRound = 0;
    const cleanups = [];

    container.style.cssText = "width:100%;display:flex;flex-direction:column;gap:10px";

    const ruleBanner = document.createElement("div");
    ruleBanner.className = "hint";
    ruleBanner.style.fontWeight = "800";
    ruleBanner.style.color = "var(--fg)";
    const boxRow = document.createElement("div");
    boxRow.style.cssText = "display:flex;gap:12px;justify-content:space-evenly;width:100%;flex-wrap:wrap";
    const objGrid = document.createElement("div");
    objGrid.style.cssText =
      "display:grid;grid-template-columns:repeat(4,minmax(64px,96px));gap:10px;justify-content:center;width:100%";

    const tap = createTapSelect({
      onSelect(el, on) {
        el.style.outline = on ? "4px solid var(--accent)" : "";
      },
      onTargetPick(target, el) {
        tryBox(target, el);
      },
    });

    let boxes = [];

    function tryBox(boxEl, piece) {
      if (!piece.isConnected) return; // yerleşmiş/geçici öğeye ikinci olay: yoksay (donma fix)
      const obj = { color: piece.dataset.color, iconId: Number(piece.dataset.icon) };
      const box = boxes.find((b) => b.el === boxEl);
      if (accepts(ruleFor(level, round), obj, box)) {
        // nazik yerleşim: parça küçülerek kaybolur, shake yok
        piece.style.transition = "transform 0.25s, opacity 0.25s";
        piece.style.transform = "scale(0.4)";
        piece.style.opacity = "0";
        piece.style.pointerEvents = "none";
        setTimeout(() => piece.remove(), 260);
        placedThisRound += 1;
        sfx.correct();
        if (placedThisRound === OBJECTS_PER_ROUND) {
          round += 1;
          if (round === ROUNDS) {
            onWin({ stars: starsFromWrong(wrongDrops) });
          } else {
            startRound();
          }
        }
      } else {
        wrongDrops += 1;
        sfx.wrong();
        boxEl.classList.remove("shake");
        void boxEl.offsetWidth;
        boxEl.classList.add("shake"); // yanlış KUTU sarsılır, nesne yerinde kalır
      }
    }

    function makeObjectButton(obj) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.color = obj.color;
      b.dataset.icon = obj.iconId;
      b.setAttribute("aria-label", "nesne");
      b.style.cssText =
        "aspect-ratio:1;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px";
      const img = document.createElement("img");
      img.src = ICON_URL(obj.iconId);
      img.alt = "";
      img.draggable = false;
      img.style.cssText = "width:78%;height:70%;object-fit:contain";
      const badge = document.createElement("span");
      badge.style.cssText = `width:34%;aspect-ratio:1;border-radius:50%;background:${COLORS[obj.color].css};border:3px solid #fff;box-shadow:0 0 0 2px ${COLORS[obj.color].css}`;
      b.append(img, badge);
      cleanups.push(
        enableDrag(b, {
          getTargets: () => boxes.map((x) => x.el),
          onDrop: (boxEl) => tryBox(boxEl, b),
        }),
      );
      b.addEventListener("click", () => tap.pickItem(b));
      return b;
    }

    function startRound() {
      placedThisRound = 0;
      const rule = ruleFor(level, round);
      const activeColors = colorsForLevel(level);
      const objs = makeObjects(round, activeColors);
      ruleBanner.textContent =
        rule === "color" ? "RENE GÖRE AYIR!" : rule === "shape" ? "ŞEKLİNE GÖRE AYIR!" : "RENK + ŞEKİL BİRLİKTE!";

      boxRow.replaceChildren();
      boxes = [];
      const firstIcon = objs[0].iconId;
      const secondIcon = objs.find((o) => o.iconId !== firstIcon)?.iconId ?? firstIcon;
      const defs =
        rule === "color"
          ? activeColors.map((c) => ({ color: c }))
          : rule === "shape"
            ? [{ color: null, iconId: firstIcon }, { color: null, iconId: secondIcon }]
            : [
                { color: "red", iconId: firstIcon },
                { color: "blue", iconId: firstIcon },
                { color: "red", iconId: secondIcon },
                { color: "blue", iconId: secondIcon },
              ];

      for (const def of defs) {
        const box = { ...def, el: document.createElement("button") };
        box.el.type = "button";
        box.el.style.cssText =
          "flex:1;max-width:220px;min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:10px";
        // kutu başlığı: renk kuralında düz renkli rozet (bozuk img yok), şekil kuralında örnek ikon
        const head = document.createElement("span");
        if (rule === "color") {
          head.style.cssText = `width:44px;aspect-ratio:1;border-radius:50%;background:${COLORS[def.color].css};border:4px solid #fff;box-shadow:0 0 0 3px ${COLORS[def.color].css}`;
        } else {
          const img = document.createElement("img");
          img.src = ICON_URL(def.iconId);
          img.alt = "";
          img.draggable = false;
          img.style.cssText = "width:48px;height:48px;object-fit:contain";
          head.append(img);
          head.style.display = "block";
        }
        const label = document.createElement("span");
        label.style.fontSize = "0.95rem";
        label.style.fontWeight = "800";
        label.textContent =
          rule === "color"
            ? COLORS[def.color].label
            : rule === "shape"
              ? "Bu hayvan/nesne"
              : `${COLORS[def.color].glyph} Bu renk`;
        box.el.append(head, label);
        box.el.addEventListener("click", () => tap.pickTarget(box.el));
        boxRow.append(box.el);
        boxes.push(box);
      }

      objGrid.replaceChildren();
      for (const obj of objs) objGrid.append(makeObjectButton(obj));
    }

    container.append(ruleBanner, boxRow, objGrid);
    startRound();

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
