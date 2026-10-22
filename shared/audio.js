// audio.js — ses yöneticisi (PRD G-9): %100 Web Audio sentezi, ses dosyası yok.
// AudioContext ilk kullanıcı dokunuşunda açılır (iOS/Safari uyumu). Mute kalıcıdır.

let ctx = null;
let muted = false;

export function initAudio() {
  try {
    muted = window.localStorage.getItem("kg:muted") === "1";
  } catch {
    /* yoksay */
  }
  // İlk dokunuşta unlock
  const unlock = () => {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
  };
  window.addEventListener("pointerdown", unlock, { once: false, passive: true });
}

export function isMuted() {
  return muted;
}

export function setMuted(m) {
  muted = Boolean(m);
  try {
    window.localStorage.setItem("kg:muted", muted ? "1" : "0");
  } catch {
    /* yoksay */
  }
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

/**
 * Kısa ton çal. Nota için freq (Hz), efekt için hazır sesler kullan.
 * SESLER: { correct: [523, 659, 784], wrong: [220, 180], star: [659, 784, 1047], tap: [440] }
 */
export function playTones(freqs, { duration = 0.12, gap = 0.02, type = "sine", volume = 0.2 } = {}) {
  if (!ctx || muted) return;
  let t = ctx.currentTime;
  for (const f of freqs) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = f;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
    t += duration + gap;
  }
}

export const sfx = {
  tap: () => playTones([440], { duration: 0.06 }),
  correct: () => playTones([523, 659, 784]),
  wrong: () => playTones([220, 180], { duration: 0.15, type: "triangle" }),
  star: () => playTones([659, 784, 1047], { duration: 0.15 }),
  /** Kısa alkış: rastgele aralıklı gürültü patlamaları (dosya sesi yok). */
  applause: () => {
    if (!ctx || muted) return;
    const duration = 0.9;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1800;
    band.Q.value = 0.8;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.08);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(band).connect(env).connect(ctx.destination);
    src.start();
  },
};
