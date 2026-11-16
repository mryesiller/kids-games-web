// ui.js — ortak UI parçaları: üst bar (geri + ses), yıldızlar, kazanma ekranı (PRD G-5, G-6, G-9)
import { t } from "./i18n.js";
import { sfx } from "./audio.js";
import { confetti } from "./fx.js";

/** Oyun sayfası iskeletini kurar: header (geri + ses), #game, footer hint. */
export function buildShell({ hint = "", hintIcon = "" } = {}) {
  document.body.innerHTML = "";
  const header = document.createElement("header");
  header.className = "game-bar";
  header.innerHTML = `
    <button type="button" data-action="back">⬅ ${t("game.back")}</button>
    <strong data-role="level"></strong>
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
 * Başlatma overlay'i: talimat + büyük Başla butonu; arka fon silik kalır.
 * Anlık gösterim gereken oyunlar (memory, simon) için: çocuk talimatı okur,
 * Başla'ya basınca overlay kalkar ve gösterim süresi başlar.
 * @param {{ instruction: string, icon?: string, buttonText?: string, onStart: () => void }} opts
 */
export function showStartOverlay({
  instruction,
  icon = "",
  buttonText = "Başla!",
  levelLabel = "",
  onStart,
  onHome,
  onEasier,
}) {
  const overlay = document.createElement("div");
  overlay.className = "start-overlay";
  const card = document.createElement("div");
  card.className = "pop start-card";
  if (icon) {
    const ic = document.createElement("div");
    ic.textContent = icon;
    ic.className = "start-icon";
    card.append(ic);
  }
  if (levelLabel) {
    const lv = document.createElement("div");
    lv.className = "level-pill";
    lv.textContent = levelLabel;
    card.append(lv);
  }
  const inst = document.createElement("p");
  inst.textContent = instruction;
  card.append(inst);
  const btn = document.createElement("button");
  btn.className = "primary";
  btn.type = "button";
  btn.textContent = `▶ ${buttonText}`;
  btn.addEventListener("click", () => {
    sfx.tap();
    overlay.remove();
    onStart();
  });
  card.append(btn);
  if (onEasier) {
    const easy = document.createElement("button");
    easy.type = "button";
    easy.textContent = "Daha kolay";
    easy.addEventListener("click", () => {
      overlay.remove();
      onEasier();
    });
    card.append(easy);
  }
  if (onHome) {
    const home = document.createElement("button");
    home.type = "button";
    home.dataset.action = "home";
    home.textContent = `⬅ ${t("game.back")}`;
    home.addEventListener("click", () => {
      overlay.remove();
      onHome();
    });
    card.append(home);
  }
  overlay.append(card);
  document.body.append(overlay);
  return overlay;
}

/**
 * Kazanma ekranı (G-6 cezasız): yıldız + Tekrar Oyna (+ varsa Sonraki Seviye).
 * @param {{ stars: number, onAgain: () => void, onNext?: () => void }} opts
 */
export function showWinOverlay({ stars, onAgain, onNext, onHome }) {
  if (stars > 0) {
    sfx.star();
    if (onNext) sfx.levelup();
    confetti();
  }
  const overlay = document.createElement("div");
  overlay.className = "win-overlay";
  const card = document.createElement("div");
  card.className = "pop start-card";
  const title = document.createElement("strong");
  title.className = "win-title";
  title.textContent = stars > 0 ? (onNext ? "Seviye atladın!" : "Harika!") : "Bir daha deneyelim!";
  card.append(title, starsEl(Math.max(0, stars)));
  const again = document.createElement("button");
  again.className = "primary";
  again.textContent = t("game.again");
  again.style.cssText = "width:100%;font-size:1.2rem";
  again.addEventListener("click", () => {
    overlay.remove();
    onAgain();
  });
  card.append(again);
  if (onNext) {
    const next = document.createElement("button");
    next.className = "success";
    next.textContent = t("game.next");
    next.style.cssText = "width:100%;font-size:1.2rem";
    next.addEventListener("click", () => {
      overlay.remove();
      onNext();
    });
    card.append(next);
  }
  if (onHome) {
    const home = document.createElement("button");
    home.type = "button";
    home.dataset.action = "home";
    home.textContent = `⬅ ${t("game.back")}`;
    home.addEventListener("click", () => {
      overlay.remove();
      onHome();
    });
    card.append(home);
  }
  overlay.append(card);
  document.body.append(overlay);
  return overlay;
}
