// main.js — ana sayfa: oyun kartları + kategori filtresi + yıldız gösterimi (PRD §5)
import { t } from "./shared/i18n.js";
import { getProgress } from "./shared/storage.js";
import { initAudio } from "./shared/audio.js";
import { starsEl } from "./shared/ui.js";

let filter = "all";

/** @type {{id: string, name: string, icon: string, age: string, category: string, ready: boolean}[]} */
const GAMES = [
  { id: "memory", name: "Hafıza Kartları", icon: "🃏", age: "5-8", category: "memory", ready: true },
  { id: "odd-one-out", name: "Farklı Olanı Bul", icon: "🔍", age: "5-9", category: "logic", ready: true },
  { id: "puzzle", name: "Yap-Boz", icon: "🧩", age: "5-10", category: "logic", ready: true },
  { id: "number-hunter", name: "Sayı Avcısı", icon: "🎈", age: "6-10", category: "math", ready: true },
  { id: "pattern", name: "Örüntü Tamamla", icon: "🔗", age: "5-10", category: "logic", ready: true },
  { id: "letter-fish", name: "Harf Balıkları", icon: "🐟", age: "6-9", category: "language", ready: true },
  { id: "maze", name: "Labirent Kaşifi", icon: "🌀", age: "6-10", category: "logic", ready: true },
  { id: "sorter", name: "Ayıklayıcı", icon: "🧺", age: "5-7", category: "logic", ready: true },
  { id: "hanoi", name: "Hanoi Kuleleri", icon: "🗼", age: "7-10", category: "logic", ready: true },
  { id: "simon", name: "Simon Diyor ki", icon: "🎵", age: "5-10", category: "memory", ready: true },
];

const CATEGORIES = [
  ["all", t("home.category.all"), "var(--surface)"],
  ["memory", t("home.category.memory"), "#fde2e4"],
  ["logic", t("home.category.logic"), "#e0e7ff"],
  ["math", t("home.category.math"), "#fef3c7"],
  ["language", t("home.category.language"), "#d1fae5"],
];

const CARD_COLORS = { memory: "#fecdd3", logic: "#c7d2fe", math: "#fde68a", language: "#a7f3d0" };

function render() {
  const cards = document.getElementById("cards");
  cards.replaceChildren();
  for (const g of GAMES.filter((g) => filter === "all" || g.category === filter)) {
    const card = document.createElement("button");
    card.type = "button";
    card.style.cssText = `height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px;background:${CARD_COLORS[g.category]}`;
    const icon = document.createElement("span");
    icon.textContent = g.icon;
    icon.style.cssText = "font-size:2.8rem;line-height:1";
    const name = document.createElement("strong");
    name.textContent = g.name;
    name.style.textAlign = "center";
    const age = document.createElement("span");
    age.textContent = g.age;
    age.style.color = "var(--muted)";
    card.append(icon, name, age);
    if (g.ready) {
      const { stars } = getProgress(g.id);
      if (stars > 0) card.append(starsEl(stars));
      card.addEventListener("click", () => {
        window.location.href = `./games/${g.id}/index.html`;
      });
    } else {
      card.disabled = true;
      card.style.opacity = "0.45";
    }
    cards.append(card);
  }
}

document.getElementById("title").textContent = t("app.title");
const nav = document.getElementById("filters");
for (const [id, label, color] of CATEGORIES) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.style.minHeight = "44px";
  b.style.background = color;
  b.addEventListener("click", () => {
    filter = id;
    render();
  });
  nav.append(b);
}
initAudio(); // G-9: ilk dokunuşta ses kilidi açılır
document.getElementById("loading")?.remove();
render();
