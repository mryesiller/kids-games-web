// ui.js — ortak UI parçaları: üst bar (geri + ses), yıldızlar, kazanma ekranı (PRD G-5, G-6, G-9)
import { t } from "./i18n.js";
import { sfx } from "./audio.js";

/** Oyun sayfası iskeletini kurar: header (geri + ses), #game, footer hint. */
export function buildShell({ hint = "", hintIcon = "" } = {}) {
  document.body.innerHTML = "";
  const header = document.createElement("header");
  header.innerHTML = `
    <button type="button" data-action="back">⬅ ${t("game.back")}</button>
    <button type="button" data-action="sound" aria-pressed="false">🔊</button>`;
  const main = document.createElement("main");
  main.id = "game";
  const hintEl = document.createElement("div");
  hintEl.className = "hint";
  hintEl.innerHTML = hintIcon ? `<span aria-hidden="true">${hintIcon}</span><span>${hint}</span>` : hint;
  document.body.append(header, main, hintEl);
  return { main, header, hintEl };
}

/** 1-3 yıldız gösterimi; off yıldızlar soluk. */
export function starsEl(stars) {
  const el = document.createElement("div");
  el.className = "stars";
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", `${stars} / 3`);
  for (let i = 1; i <= 3; i++) {
    const s = document.createElement("span");
    s.textContent = "★";
    if (i > stars) s.className = "off";
    el.append(s);
  }
  return el;
}

/**
 * Kazanma ekranı (G-6 cezasız): yıldız + Tekrar Oyna (+ varsa Sonraki Seviye).
 * @param {{ stars: number, onAgain: () => void, onNext?: () => void }} opts
 */
export function showWinOverlay({ stars, onAgain, onNext }) {
  sfx.star();
  const overlay = document.createElement("div");
  overlay.className = "win-overlay pop";
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgb(0 0 0 / 0.35);display:flex;align-items:center;justify-content:center;z-index:10";
  const card = document.createElement("div");
  card.style.cssText =
    "background:var(--surface);border-radius:var(--radius);padding:24px;text-align:center;box-shadow:var(--shadow)";
  card.append(starsEl(stars));
  const again = document.createElement("button");
  again.className = "primary";
  again.textContent = t("game.again");
  again.addEventListener("click", () => {
    overlay.remove();
    onAgain();
  });
  card.append(document.createElement("br"), again);
  if (onNext) {
    const next = document.createElement("button");
    next.className = "success";
    next.textContent = t("game.next");
    next.addEventListener("click", () => {
      overlay.remove();
      onNext();
    });
    card.append(document.createElement("br"), next);
  }
  overlay.append(card);
  document.body.append(overlay);
  return overlay;
}
