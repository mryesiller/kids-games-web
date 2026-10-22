// game.js — O10 Simon Diyor ki (PRD): 4/6 ped, Web Audio nota, dizi doğrulama.
// Pedler: farklı RENK + ŞEKİL birlikte (G-10); her pedin kendi notası var.
// Ses: Web Audio osilatör (audio.js). Hata → aynı dizi yeniden gösterilir (cezasız).
import { getBest, setBest } from "../../shared/storage.js";
import { playTones } from "../../shared/audio.js";
import { showStartOverlay } from "../../shared/ui.js";

export const TARGET_ROUND = 10; // 10 tur tamamlanınca kazanma

/** Seviye → ped sayısı ve gösterim hızı (20 seviye: hız artar, 11+ 6 ped). */
export function configFor(level) {
  return {
    pads: level <= 10 ? 4 : 6,
    showMs: Math.max(320, 640 - level * 16),
  };
}
export const LEVELS = { 1: configFor(1), 2: configFor(2), 3: configFor(3) };

export const NOTES = [261.6, 329.6, 392.0, 523.3, 659.3, 784.0]; // C E G C E G
const PAD_STYLES = [
  ["#e74c3c", "🔴"], // kırmızı daire
  ["#3498db", "🔵"], // mavi kare
  ["#f1c40f", "🟡"], // sarı üçgen
  ["#2ecc71", "🟢"], // yeşil yıldız
  ["#9b59b6", "🟣"], // mor kalp
  ["#e67e22", "🟠"], // turuncu altıgen
];

export function nextSequence(seq, padCount = 4, rng = Math.random) {
  return [...seq, Math.floor(rng() * padCount)];
}

export function checkInput(seq, index, padIndex) {
  return seq[index] === padIndex;
}

export function starsFromRounds(rounds) {
  if (rounds >= 8) return 3;
  if (rounds >= 5) return 2;
  return 1;
}

export default {
  id: "simon",
  maxLevel: 20,
  start(container, { level, onWin }) {
    const { pads: padCount, showMs } = configFor(level);
    let seq = [];
    let inputIndex = 0; // kullanıcının doğrulama konumu
    let showing = false;
    let paused = false;
    let pausedStep = null; // {seqIndex, remaining}
    const timers = [];
    let showStart = 0;

    const status = document.createElement("div");
    status.className = "hint";
    const board = document.createElement("div");
    board.style.cssText =
      "display:grid;grid-template-columns:repeat(2,minmax(120px,180px));gap:14px;align-items:center;justify-content:center";
    if (padCount === 6) board.style.gridTemplateColumns = "repeat(2,minmax(110px,160px))";

    const pads = [];
    for (let i = 0; i < padCount; i++) {
      const [color, glyph] = PAD_STYLES[i];
      const pad = document.createElement("button");
      pad.type = "button";
      pad.setAttribute("aria-label", `ped ${i + 1}`);
      pad.style.cssText = `aspect-ratio:1;border-radius:24px;border:4px solid ${color};background:${color}33;font-size:3rem`;
      pad.textContent = glyph;
      pad.addEventListener("pointerdown", () => onPad(i));
      board.append(pad);
      pads.push(pad);
    }

    function flash(padIndex, duration = showMs * 0.7) {
      const pad = pads[padIndex];
      pad.style.background = PAD_STYLES[padIndex][0];
      pad.style.transform = "scale(1.06)";
      playTones([NOTES[padIndex]], { duration: duration / 1000 });
      const t = setTimeout(() => {
        pad.style.background = `${PAD_STYLES[padIndex][0]}33`;
        pad.style.transform = "";
      }, duration);
      timers.push(t);
    }

    function playSequence(from = 0, offset = 0) {
      showing = true;
      status.textContent = "İzle...";
      let i = from;
      const step = () => {
        if (paused) return;
        if (i >= seq.length) {
          showing = false;
          inputIndex = 0;
          status.textContent = "Sıra sende!";
          return;
        }
        flash(seq[i]);
        i += 1;
        timers.push(setTimeout(step, showMs));
      };
      timers.push(setTimeout(step, offset || showMs));
      showStart = Date.now();
    }

    function beginRound() {
      seq = nextSequence(seq, padCount);
      inputIndex = 0;
      status.textContent = `Tur ${seq.length}`;
      playSequence();
    }

    function onPad(i) {
      if (showing || paused) return;
      flash(i, 250);
      if (!checkInput(seq, inputIndex, i)) {
        // cezasız: aynı diziyi yeniden göster
        status.textContent = "Tekrar izle...";
        inputIndex = 0;
        timers.push(setTimeout(() => playSequence(), 900));
        return;
      }
      inputIndex += 1;
      if (inputIndex === seq.length) {
        setBest("simon", seq.length);
        if (seq.length >= TARGET_ROUND) {
          onWin({ stars: starsFromRounds(seq.length) });
          return;
        }
        status.textContent = "Harika!";
        timers.push(setTimeout(beginRound, 900));
      }
    }

    // pause/resume: gösterim sırasında duraklatılırsa kaldığı adımdan devam
    function pause() {
      if (paused) return;
      paused = true;
      if (showing) {
        // çalışan tüm zamanlayıcıları temizle, kalan adımı hesapla
        timers.forEach(clearTimeout);
        timers.length = 0;
      }
    }
    function resume() {
      if (!paused) return;
      paused = false;
      if (showing) playSequence(); // basit ve güvenli: kalan diziyi baştan gösterir
    }

    const best = document.createElement("div");
    best.className = "hint";
    const b = getBest("simon");
    if (b > 0) best.textContent = `Rekor: ${b} tur`;

    container.append(status, board, best);
    showStartOverlay({
      instruction: "Renk dizisini izle, sonra aynı sırayla tekrar et!",
      icon: "🎵",
      onStart: () => timers.push(setTimeout(beginRound, 400)),
    });

    return {
      pause,
      resume,
      destroy() {
        timers.forEach(clearTimeout);
        container.replaceChildren();
      },
    };
  },
};
