// game.js — O8 Renk ve Şekil Ayıklayıcı (PRD): nesne doğru kutuya; kural tur değiştirir.
// Görseller: Higgsfield hayvan ikonları; "renk" nesnesi CSS hue-rotate filtresiyle (filtre = renk kimliği).
// Seviyeler: tek kural (renk) → kural değişimi (renk/şekil, kutu etiketi ikonla net) → iki kural birlikte.
import { enableDrag, createTapSelect } from "../../shared/drag.js";
import { starsFromWrong } from "../../shared/drag-helpers.js";
import { ICON_URL, ICON_COUNT } from "../../shared/icons.js";
import { sfx } from "../../shared/audio.js";

export const OBJECTS_PER_ROUND = 8;

const COLOR_FILTERS = {
  red: "filter:sepia(1) saturate(5) hue-rotate(-30deg)",
  blue: "filter:sepia(1) saturate(5) hue-rotate(170deg)",
};
const COLOR_LABELS = { red: ["🔴", "Kırmızı"], blue: ["🔵", "Mavi"] };

/** Bir turun nesnelerini üret: {iconId, color} — her renkten eşit sayıda, deterministik karışım. */
export function makeObjects(roundIndex, rng = Math.random) {
  const objs = [];
  for (let i = 0; i < OBJECTS_PER_ROUND; i++) {
    objs.push({
      iconId: 1 + Math.floor(rng() * ICON_COUNT),
      color: i % 2 === 0 ? "red" : "blue",
    });
  }
  // karıştır (roundIndex'e bağlı deterministik)
  for (let i = objs.length - 1; i > 0; i--) {
    const j = (roundIndex * (i + 3)) % (i + 1);
    [objs[i], objs[j]] = [objs[j], objs[i]];
  }
  return objs;
}

/** Kural: level 1-2'nin ilk yarısı renk, L2 ikinci yarısı şekil, L3 iki kural. */
export function ruleFor(level, roundIndex) {
  if (level === 1) return "color";
  if (level === 2) return roundIndex % 2 === 0 ? "color" : "shape";
  return "both";
}

export function accepts(rule, obj, box) {
  if (rule === "color") return obj.color === box.color;
  if (rule === "shape") return obj.iconId === box.iconId;
  return obj.color === box.color && obj.iconId === box.iconId;
}

export default {
  id: "sorter",
  start(container, { level, onWin }) {
    const ROUNDS = 3; // kural turu (her turda 8 nesne)
    let round = 0;
    let correct = 0;
    let wrongDrops = 0;
    let placedThisRound = 0;
    const cleanups = [];

    const ruleBanner = document.createElement("div");
    ruleBanner.className = "hint";
    const boxRow = document.createElement("div");
    boxRow.style.cssText = "display:flex;gap:16px;justify-content:center;width:100%";
    const objRow = document.createElement("div");
    objRow.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;justify-content:center;width:100%;min-height:90px";

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
      const obj = { color: piece.dataset.color, iconId: Number(piece.dataset.icon) };
      const box = boxes.find((b) => b.el === boxEl);
      if (accepts(ruleFor(level, round), obj, box)) {
        piece.remove();
        correct += 1;
        placedThisRound += 1;
        sfx.correct();
        if (placedThisRound === OBJECTS_PER_ROUND) {
          round += 1;
          if (round === ROUNDS) onWin({ stars: starsFromWrong(wrongDrops) });
          else startRound();
        }
      } else {
        wrongDrops += 1;
        sfx.wrong();
        piece.classList.remove("shake");
        void piece.offsetWidth;
        piece.classList.add("shake");
      }
    }

    function startRound() {
      placedThisRound = 0;
      const rule = ruleFor(level, round);
      const objs = makeObjects(round);
      ruleBanner.textContent =
        rule === "color" ? "RENE göre ayır!" : rule === "shape" ? "ŞEKLİNE göre ayır!" : "RENK ve ŞEKİL birleşti!";

      // kutular
      boxRow.replaceChildren();
      boxes = [];
      const defs =
        rule === "color"
          ? [{ color: "red" }, { color: "blue" }]
          : rule === "shape"
            ? [
                { color: null, iconId: objs[0].iconId },
                { color: null, iconId: objs.find((o) => o.iconId !== objs[0].iconId).iconId },
              ]
            : [
                { color: "red", iconId: objs[0].iconId },
                { color: "blue", iconId: objs[0].iconId },
                { color: "red", iconId: objs.find((o) => o.iconId !== objs[0].iconId).iconId },
                { color: "blue", iconId: objs.find((o) => o.iconId !== objs[0].iconId).iconId },
              ];
      for (const def of defs) {
        const box = { ...def, el: document.createElement("button") };
        box.el.type = "button";
        const tag =
          rule === "color"
            ? COLOR_LABELS[def.color].join(" ")
            : rule === "shape"
              ? "🧸 Bu hayvan"
              : `${COLOR_LABELS[def.color][0]} Bu hayvan`;
        box.el.style.cssText = "min-width:120px;min-height:130px;font-size:0.9rem;display:flex;flex-direction:column;gap:6px;align-items:center";
        if (rule !== "shape") {
          const img = document.createElement("img");
          img.src = ICON_URL(def.iconId);
          img.alt = "";
          img.draggable = false;
          img.style.cssText = `width:44px;height:44px;object-fit:contain;${def.color ? COLOR_FILTERS[def.color] : ""}`;
          box.el.append(img);
        } else {
          const g = document.createElement("span");
          g.textContent = "🧸";
          g.style.fontSize = "2rem";
          box.el.append(g);
        }
        const label = document.createElement("span");
        label.textContent = tag;
        box.el.append(label);
        box.el.addEventListener("click", () => tap.pickTarget(box.el));
        boxRow.append(box.el);
        boxes.push(box);
      }

      // nesneler
      objRow.replaceChildren();
      for (const obj of objs) {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.color = obj.color;
        b.dataset.icon = obj.iconId;
        b.setAttribute("aria-label", "nesne");
        b.style.cssText = "width:72px;height:72px;padding:6px;display:flex;align-items:center;justify-content:center";
        const img = document.createElement("img");
        img.src = ICON_URL(obj.iconId);
        img.alt = "";
        img.draggable = false;
        img.style.cssText = `width:100%;height:100%;object-fit:contain;${COLOR_FILTERS[obj.color]}`;
        b.append(img);
        cleanups.push(
          enableDrag(b, {
            getTargets: () => boxes.map((x) => x.el),
            onDrop: (boxEl) => tryBox(boxEl, b),
          }),
        );
        b.addEventListener("click", () => tap.pickItem(b));
        objRow.append(b);
      }
    }

    container.append(ruleBanner, boxRow, objRow);
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
