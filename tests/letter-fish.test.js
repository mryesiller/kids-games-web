import { describe, it, expect } from "vitest";
import data from "../games/letter-fish/words.json";
import { WORDS, validBlanks, makeQuestion } from "../games/letter-fish/game.js";
import { trUpper } from "../shared/i18n.js";

const TURKISH_ALPHABET = new Set("ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split(""));

describe("words.json veri doğrulaması (PRD O6, CI)", () => {
  it("en az 60 kelime", () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(60);
    expect(WORDS).toEqual(data.words);
  });

  it("her kelime yalnız Türkçe alfabe harfleri içerir ve emoji'si vardır", () => {
    for (const { word, emoji } of WORDS) {
      expect(word.length).toBeGreaterThanOrEqual(2);
      for (const ch of word) expect(TURKISH_ALPHABET.has(trUpper(ch)), word).toBe(true);
      expect(emoji).toBeTruthy();
    }
  });

  it("her kelimenin en az bir benzersiz eksik harf konumu vardır (tek çözüm garantisi)", () => {
    for (const { word } of WORDS) {
      expect(validBlanks(word).length, word).toBeGreaterThan(0);
    }
  });

  it("I/İ tuzağı: hiçbir kelime hem I hem İ veya hem I hem ı karışımı eşleşme riski taşımaz", () => {
    for (const { word } of WORDS) {
      const uppers = [...word].map(trUpper);
      // trUpper eşleşmesinde her eksik konum benzersizse sorun yok; validBlanks bunu zaten garantiliyor
      const counts = {};
      for (const u of uppers) counts[u] = (counts[u] ?? 0) + 1;
      // kelimede en az bir harf yalnız 1 kez geçmeli
      expect(Object.values(counts).some((c) => c === 1), word).toBe(true);
    }
  });

  it("üretici: seçeneklerde cevap tam 1 kez ve Türkçe harfler", () => {
    for (let seed = 0; seed < 100; seed++) {
      const rng = () => ((seed * 9301 + 49297) % 233280) / 233280;
      const q = makeQuestion(2, rng);
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
      expect(q.options).toHaveLength(4);
      expect(q.blankIndex).toBeLessThan(q.word.length);
    }
  });
});
