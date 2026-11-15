// fx.js — çevrimdışı görsel efekt (konfeti, kıvılcım). prefers-reduced-motion'da çizilmez.

let last = { x: 0, y: 0 };

export function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function installFx() {
  if (installFx.done || typeof window === "undefined") return;
  installFx.done = true;
  window.addEventListener(
    "pointerdown",
    (e) => {
      last = { x: e.clientX || innerWidth / 2, y: e.clientY || innerHeight / 2 };
      if (e.target?.closest?.("button")) spark(last.x, last.y);
    },
    { capture: true, passive: true },
  );
}

function place(el, x, y) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.append(el);
  setTimeout(() => el.remove(), 700);
}

export function spark(x, y) {
  if (prefersReducedMotion() || typeof document === "undefined") return;
  const el = document.createElement("span");
  el.className = "fx-spark";
  el.textContent = "✦";
  place(el, x, y);
}

export function mark(text, color) {
  if (prefersReducedMotion() || typeof document === "undefined") return;
  const el = document.createElement("span");
  el.className = "fx-mark";
  el.textContent = text;
  el.style.color = color;
  place(el, last.x || innerWidth / 2, last.y || innerHeight / 2);
}

export function confetti() {
  if (prefersReducedMotion() || typeof document === "undefined") return;
  const layer = document.createElement("div");
  layer.className = "fx-layer";
  layer.setAttribute("aria-hidden", "true");
  const bits = ["🎉", "⭐", "✨", "🎈", "🌟", "🎊"];
  for (let i = 0; i < 18; i++) {
    const bit = document.createElement("span");
    bit.className = "fx-bit";
    bit.textContent = bits[i % bits.length];
    bit.style.left = `${(i * 17) % 100}%`;
    bit.style.animationDelay = `${(i % 5) * 0.04}s`;
    layer.append(bit);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 1200);
}
