// questions.js — O4 soru üreteci: saf fonksiyonlar (tests/number-hunter.test.js).
// Seviyeler: toplama (0-10) → çıkarma/toplama (0-20) → çarpma temelleri.
// Kural: doğru cevap her zaman ekrandaki balonlardan biridir; sorular tekrarsız dağılır (near-miss çeldiriciler).

export const TARGET_CORRECT = 10;

/** Seviye → işlem türleri. */
export function opsForLevel(level) {
  if (level === 1) return ["add"];
  if (level === 2) return ["add", "sub"];
  return ["mul"];
}

/** Tek soru üret: {text, answer, options} — options'ta cevap tam 1 kez. */
export function makeQuestion(level, rng = Math.random) {
  const ops = opsForLevel(level);
  const op = ops[Math.floor(rng() * ops.length)];
  let a, b, answer;
  if (op === "add") {
    const max = level === 1 ? 10 : 20;
    a = Math.floor(rng() * (max + 1));
    b = Math.floor(rng() * (max - a + 1));
    answer = a + b;
  } else if (op === "sub") {
    a = Math.floor(rng() * 21);
    b = Math.floor(rng() * (a + 1)); // sonuç hiç negatif olmaz (çocuk dostu)
    answer = a - b;
  } else {
    a = 1 + Math.floor(rng() * 5);
    b = 1 + Math.floor(rng() * 5);
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
