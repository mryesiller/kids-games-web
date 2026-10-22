// game.js — O6 Harf Balıkları (PRD): resim + kelime, eksik harf balıklardan seçilir.
// Türkçe karakterler ve I/İ kuralı: harf eşleşmeleri trEquals ile (G-15).
// Benzersiz çözüm: eksilen harf (Türkçe büyük harf eşdeğeriyle) kelimede yalnız 1 kez geçer.
import wordsData from "./words.json";
import { trUpper, trEquals } from "../../shared/i18n.js";
import { starsFromCorrect } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";

export const WORDS = wordsData.words;
export const TARGET = 10;

const TURKISH_ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";

/** Kelime için geçerli eksik harf konumları: harf (büyük eşdeğeriyle) kelimede tam 1 kez. */
export function validBlanks(word) {
  const indices = [];
  for (let i = 0; i < word.length; i++) {
    const c = trUpper(word[i]);
    const count = [...word].filter((ch) => trUpper(ch) === c).length;
    if (count === 1) indices.push(i);
  }
  return indices;
}

/** Soru üret: {word, emoji, blankIndex, answer, options}. Zorluk: min kelime uzunluğu seviyeyle artar.
 * Benzersiz çözüm garantili: benzersiz harfi olmayan kelime atlanır; son kullanılan kelimeler tekrarlanmaz. */
export function makeQuestion(level, rng = Math.random, usedWords = new Set()) {
  const minLen = level === 1 ? 3 : level === 2 ? 4 : 5;
  const lenPool = WORDS.filter((w) => w.word.length >= minLen);
  let pool = lenPool.filter((w) => !usedWords.has(w.word));
  if (pool.length === 0) pool = lenPool.length > 0 ? lenPool : WORDS;
  for (let attempt = 0; attempt < 10; attempt++) {
    const source = pool[Math.floor(rng() * pool.length)] ?? pool[0];
    const blanks = validBlanks(source.word);
    if (blanks.length === 0) continue; // benzersiz çözüm yok: kelimeyi atla
    const blankIndex = blanks[Math.floor(rng() * blanks.length)];
    const answer = trUpper(source.word[blankIndex]);
    const options = new Set([answer]);
    let ai = Math.floor(rng() * TURKISH_ALPHABET.length);
    while (options.size < 4) {
      options.add(TURKISH_ALPHABET[ai % TURKISH_ALPHABET.length]);
      ai += 1 + Math.floor(rng() * 3);
    }
    const arr = [...options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    usedWords.add(source.word);
    return { word: source.word, emoji: source.emoji, blankIndex, answer, options: arr };
  }
  return makeQuestion(1, rng, usedWords); // güvenli düşüş: en kolay havuz
}

export default {
  id: "letter-fish",
  start(container, { level, onWin }) {
    let current = 0;
    let correct = 0;
    const usedWords = new Set();

    const progress = document.createElement("div");
    progress.className = "hint";
    const board = document.createElement("div");
    board.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:16px;width:100%";
    const picture = document.createElement("div");
    picture.style.fontSize = "clamp(4rem,16vw,7rem)";
    const wordRow = document.createElement("div");
    wordRow.style.cssText = "display:flex;gap:6px;font-size:clamp(2rem,9vw,3.4rem);font-weight:800";
    const fishRow = document.createElement("div");
    fishRow.style.cssText = "display:flex;gap:12px;flex-wrap:wrap;justify-content:center";

    function showQuestion() {
      const q = makeQuestion(level, Math.random, usedWords);
      progress.textContent = `${current + 1} / ${TARGET}`;
      picture.textContent = q.emoji;
      wordRow.replaceChildren();
      [...q.word].forEach((ch, i) => {
        const span = document.createElement("span");
        if (i === q.blankIndex) {
          span.textContent = "_";
          span.style.cssText = "color:var(--accent);border-bottom:6px solid var(--accent);min-width:1.1em;text-align:center";
        } else {
          span.textContent = trUpper(ch);
        }
        wordRow.append(span);
      });
      fishRow.replaceChildren();
      for (const opt of q.options) {
        const b = document.createElement("button");
        b.type = "button";
        b.style.cssText = "min-width:72px;font-size:1.8rem;color:var(--accent)";
        b.textContent = opt;
        b.addEventListener("pointerdown", () => {
          if (trEquals(opt, q.answer)) {
            correct += 1;
            sfx.correct();
            current += 1;
            if (current === TARGET) onWin({ stars: starsFromCorrect(correct) });
            else showQuestion();
          } else {
            sfx.wrong();
            b.classList.remove("shake");
            void b.offsetWidth;
            b.classList.add("shake");
          }
        });
        fishRow.append(b);
      }
    }

    board.append(picture, wordRow, fishRow);
    container.append(progress, board);
    showQuestion();

    return {
      pause() {},
      resume() {},
      destroy() {
        container.replaceChildren();
      },
    };
  },
};
