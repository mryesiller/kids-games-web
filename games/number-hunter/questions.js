// questions.js — O4 soru üreteci: saf fonksiyonlar (tests/number-hunter.test.js).
// Seviyeler: toplama (0-10) → çıkarma/toplama (0-20) → çarpma temelleri.
// Kural: doğru cevap her zaman ekrandaki balonlardan biridir; sorular tekrarsız dağılır (near-miss çeldiriciler).

export const TARGET_CORRECT = 5;

/** Seviye → işlem türleri (20 seviye: 1-7 toplama, 8-14 toplama/çıkarma, 15-20 çarpma). */
export function opsForLevel(level) {
  if (level <= 7) return ["add"];
  if (level <= 14) return ["add", "sub"];
  return ["mul"];
}

/** Toplama sonucu tavanı. Seviye 1 = 10, sonra 20'ye çıkar. */
export function sumCap(level) {
  const l = Math.max(1, Math.min(20, Math.trunc(level) || 1));
  if (l <= 1) return 10;
  return Math.min(20, 10 + (l - 1) * 2);
}

/** Çıkarma üst sayısı. 8. seviyede 8, 14'te 20. */
export function subCap(level) {
  const l = Math.max(1, Math.min(20, Math.trunc(level) || 1));
  return Math.min(20, 8 + Math.max(0, l - 8) * 2);
}

/** Çarpma çarpanı üst sınırı (1..hi). 15'te 2, 20'de 4. */
export function mulHi(level) {
  const l = Math.max(1, Math.min(20, Math.trunc(level) || 1));
  return Math.min(5, 2 + Math.floor(Math.max(0, l - 15) / 2));
}

/** Tek soru üret: {text, answer, options} — options'ta cevap tam 1 kez. */
export function makeQuestion(level, rng = Math.random) {
  const ops = opsForLevel(level);
  const op = ops[Math.floor(rng() * ops.length)];
  let a, b, answer;
  if (op === "add") {
    const max = sumCap(level);
    a = Math.floor(rng() * (max + 1));
    b = Math.floor(rng() * (max - a + 1));
    answer = a + b;
  } else if (op === "sub") {
    const max = subCap(level);
    a = Math.floor(rng() * (max + 1));
    b = Math.floor(rng() * (a + 1));
    answer = a - b;
  } else {
    const hi = mulHi(level);
    a = 1 + Math.floor(rng() * hi);
    b = 1 + Math.floor(rng() * hi);
    answer = a * b;
  }
  const symbol = op === "add" ? "+" : op === "sub" ? "−" : "×";
  return finalize({ text: `${a} ${symbol} ${b} = ?`, answer }, rng);
}

/** Cevabı içeren 4 seçenek üretir; cevap tam 1 kez, komşu sayılarla (near-miss). */
export function finalize(q, rng = Math.random) {
  const opts = new Set([q.answer]);
  let d = 1;
  while (opts.size < 4) {
    const cand = q.answer + (rng() < 0.5 ? d : -d) * Math.ceil(opts.size / 2);
    if (cand >= 0 && !opts.has(cand)) opts.add(cand);
    if (opts.size < 4 && rng() < 0.3) opts.add(Math.max(0, q.answer + d + opts.size));
    d += 1;
    if (d > 20) {
      // güvence: sonlu döngü
      for (let x = 0; x <= 20 && opts.size < 4; x++) if (!opts.has(x)) opts.add(x);
    }
  }
  const options = [...opts];
  // karıştır
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { ...q, options };
}
