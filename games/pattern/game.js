// game.js — O5 Örüntü Tamamla (PRD): ikon/ö pé Örüntü üreteci saf fonksiyon (tests/).
// Seviyeler: AB → AAB/ABC → sayı örüntüleri (2,4,6,?) / büyüyen diziler.
// Örüntü öğeleri: Higgsfield hayvan ikonları (kid-friendly, memory ile paylaşılan set).
import { starsFromCorrect } from "../../shared/difficulty.js";
import { ICON_URL, ICON_COUNT } from "../../shared/icons.js";

export const QUESTION_COUNT = 10;
export const MAX_LEVEL = 20;

/** deterministik ikon seçimi: seed tabanlı, tekrar eden çağrıda aynı */
function pickIcon(seed, exclude = []) {
  let n = (seed * 7 + 3) % ICON_COUNT;
  while (exclude.includes(n)) n = (n + 1) % ICON_COUNT;
  return n;
}

function iconQuestion(seqKind, i) {
  const a = pickIcon(i * 3 + 1);
  const b = pickIcon(i * 3 + 2, [a]);
  const c = pickIcon(i * 3 + 3, [a, b]);
  const seq = seqKind === "AB" ? [a, b] : seqKind === "AAB" ? [a, a, b] : [a, b, c];
  const full = Array.from({ length: 5 }, (_, k) => seq[k % seq.length]);
  const answer = full[4]; // sonraki öğe
  const shown = full.slice(0, 4);
  // çeldiriciler: sekansın diğer öğeleri + rastgele benzersiz ikon
  const pool = [...new Set([a, b, c, pickIcon(i * 5 + 4, seq)])].filter((n) => n !== answer);
  const options = [answer, ...pool.slice(0, 3)];
  // options karıştır (deterministik)
  for (let k = options.length - 1; k > 0; k--) {
    const j = (i * (k + 3)) % (k + 1);
    [options[k], options[j]] = [options[j], options[k]];
  }
  return { shown, options, answer };
}

function numberQuestion(kind, i) {
  if (kind === "arithmetic") {
    const start = 2 + (i % 5);
    const step = 2 + (i % 3);
    const shown = [0, 1, 2, 3].map((k) => start + k * step);
    return { shown, answer: start + 4 * step, options: null }; // sayı seçenekleri aşağıda
  }
  // büyüyen: 1, 2, 4, 7 (fark artar)
  let v = 1;
  const shown = [];
  for (let k = 0; k < 4; k++) {
    shown.push(v);
    v += k + 1;
  }
  return { shown, answer: v, options: null };
}

function numericOptions(answer, i) {
  const opts = new Set([answer]);
  let d = 1;
  while (opts.size < 4) {
    opts.add(answer + d);
    if (opts.size < 4) opts.add(Math.max(0, answer - d));
    d += 2;
  }
  const arr = [...opts].slice(0, 4);
  for (let k = arr.length - 1; k > 0; k--) {
    const j = (i * (k + 5)) % (k + 1);
    [arr[k], arr[j]] = [arr[j], arr[k]];
  }
  return arr;
}

/** 20 seviye: 5 şablon döngüsü — AB → AAB/ABC → sayı örüntüleri → büyüyen. */
function kindForLevel(level) {
  return ["AB", "AAB", "ABC", "arithmetic", "growing"][(level - 1) % 5];
}

/** Saf üreteci: seviye ve soru indeksinden çözülebilir, TEK doğru cevaplı soru. */
export function makeQuestion(level, i) {
  const kind = kindForLevel(level);
  const q = kind === "arithmetic" || kind === "growing" ? numberQuestion(kind, i) : iconQuestion(kind, i);
  const options = q.options ?? numericOptions(q.answer, i);
  return { kind, shown: q.shown, options, answer: q.answer };
}

export function isSolvable(q) {
  return q.options.includes(q.answer) && new Set(q.options).size === q.options.length;
}

export default {
  id: "pattern",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    let current = 0;
    let correct = 0;
    let locked = false;
    const timers = [];

    const progress = document.createElement("div");
    progress.className = "hint";
    const seq = document.createElement("div");
    seq.style.cssText =
      "display:flex;gap:12px;align-items:center;justify-content:center;font-size:clamp(2rem,8vw,3.2rem);margin:16px 0";
    const opts = document.createElement("div");
    opts.className = "grid";
    opts.style.cssText = "grid-template-columns:repeat(4,1fr);max-width:480px";

    function showQuestion() {
      locked = false;
      const q = makeQuestion(level, current);
      progress.textContent = `${current + 1} / ${QUESTION_COUNT}`;
      seq.replaceChildren();
      for (const v of q.shown) {
        const el = document.createElement("span");
        if (q.kind === "arithmetic" || q.kind === "growing") el.textContent = v;
        else {
          const img = document.createElement("img");
          img.src = ICON_URL(v);
          img.alt = "";
          img.draggable = false;
          img.style.cssText = "width:1.4em;height:1.4em;object-fit:contain";
          el.append(img);
        }
        seq.append(el);
      }
      const hole = document.createElement("span");
      hole.textContent = "?";
      hole.style.cssText = "min-width:1.4em;text-align:center;color:var(--accent);font-weight:800";
      seq.append(hole);

      opts.replaceChildren();
      for (const opt of q.options) {
        const b = document.createElement("button");
        b.type = "button";
        b.style.cssText = "aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:8px";
        if (q.kind === "arithmetic" || q.kind === "growing") {
          b.textContent = opt;
          b.style.fontSize = "1.6rem";
        } else {
          const img = document.createElement("img");
          img.src = ICON_URL(opt);
          img.alt = "";
          img.draggable = false;
          img.style.cssText = "width:100%;height:100%;object-fit:contain";
          b.append(img);
        }
        b.addEventListener("pointerdown", () => {
          if (locked) return;
          if (opt === q.answer) {
            locked = true;
            correct += 1;
            sfx.correct();
            // üstteki ? kutusunu seçilen öğeyle doldur + ✓ işareti
            const hole = seq.lastChild;
            hole.textContent = "";
            hole.style.cssText = "min-width:1.4em;text-align:center;background:var(--success);color:#fff;border-radius:10px;padding:2px 6px;font-weight:900";
            if (q.kind === "arithmetic" || q.kind === "growing") {
              hole.textContent = `${q.answer} ✓`;
            } else {
              const img = document.createElement("img");
              img.src = ICON_URL(q.answer);
              img.alt = "";
              img.draggable = false;
              img.style.cssText = "width:1.3em;height:1.3em;object-fit:contain;vertical-align:middle";
              hole.append(img, " ✓");
            }
            // sonraki soruya geçiş oku
            const arrow = document.createElement("div");
            arrow.className = "hint";
            arrow.textContent = "Devam ➜";
            arrow.style.color = "var(--success)";
            arrow.style.fontWeight = "800";
            container.append(arrow);
            timers.push(
              setTimeout(() => {
                arrow.remove();
                current += 1;
                if (current === QUESTION_COUNT) onWin({ stars: starsFromCorrect(correct) });
                else showQuestion();
              }, 1200),
            );
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

    container.append(progress, seq, opts);
    showQuestion();

    return {
      pause() {},
      resume() {},
      destroy() {
        timers.forEach(clearTimeout);
        container.replaceChildren();
      },
    };
  },
};
