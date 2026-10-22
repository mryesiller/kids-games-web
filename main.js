// main.js — ana sayfa: oyun kartları + kategori filtresi + yıldız gösterimi (PRD §5)
import { t } from "./shared/i18n.js";
import { getProgress, getTotalStars } from "./shared/storage.js";
import { initAudio } from "./shared/audio.js";
import { starsEl } from "./shared/ui.js";
import { REWARDS, unlockedRewards, nextReward } from "./shared/rewards.js";

let filter = "all";

/** @type {{id: string, name: string, icon: string, age: string, category: string, ready: boolean}[]} */
const GAMES = [
  { id: "memory", name: "Hafıza Kartları", icon: "🃏", age: "5-8", category: "memory", ready: true },
  { id: "odd-one-out", name: "Farklı Olanı Bul", icon: "🔍", age: "5-9", category: "logic", ready: true },
  { id: "number-hunter", name: "Sayı Avcısı", icon: "🎈", age: "6-10", category: "math", ready: true },
  { id: "pattern", name: "Örüntü Tamamla", icon: "🔗", age: "5-10", category: "logic", ready: true },
  { id: "letter-fish", name: "Kelime Tamamla", icon: "🐟", age: "6-9", category: "language", ready: true },
  { id: "maze", name: "Labirent Kaşifi", icon: "🌀", age: "6-10", category: "logic", ready: true },
  { id: "sorter", name: "Ayıklayıcı", icon: "🧺", age: "5-7", category: "logic", ready: true },
  { id: "hanoi", name: "Hanoi Kuleleri", icon: "🗼", age: "7-10", category: "logic", ready: true },
  { id: "simon", name: "Simon Diyor ki", icon: "🎵", age: "5-10", category: "memory", ready: true },
  { id: "counting", name: "Say Bak", icon: "🔢", age: "4-6", category: "math", ready: true },
  { id: "ordering", name: "Sıraya Diz", icon: "📊", age: "5-8", category: "math", ready: true },
  { id: "shadow", name: "Gölge Eşleştir", icon: "👤", age: "4-7", category: "logic", ready: true },
  { id: "bigger", name: "Hangisi Büyük", icon: "⚖️", age: "5-8", category: "math", ready: true },
  { id: "missing-number", name: "Eksik Sayı", icon: "❓", age: "5-9", category: "math", ready: true },
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
        // blink fix: geçiş overlay'i senkron görünür olur, sonra navigasyon
        const overlay = document.createElement("div");
        overlay.className = "loading";
        overlay.innerHTML = '<span class="spinner"></span><span>Yükleniyor...</span>';
        document.body.append(overlay);
        setTimeout(() => {
          window.location.href = `./games/${g.id}/index.html`;
        }, 30);
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
function refreshStars() {
  const total = getTotalStars(GAMES.filter((g) => g.ready).map((g) => g.id));
  document.getElementById("totalStars").textContent = `⭐ ${total}`;
  const next = nextReward(total);
  document.getElementById("nextReward").textContent = next
    ? `Sıradaki ödül: ${next.icon} ${next.name} (${total}/${next.cost} ⭐)`
    : "Tüm ödüller açık! 🎉";
  return total;
}

function showRewards() {
  const total = refreshStars();
  const unlocked = new Set(unlockedRewards(total).map((r) => r.id));
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgb(0 0 0 / 0.4);z-index:30;display:flex;align-items:center;justify-content:center;padding:16px";
  const panel = document.createElement("div");
  panel.style.cssText =
    "background:var(--bg);border-radius:24px;padding:20px;max-width:min(94vw,560px);max-height:86vh;overflow:auto";
  const head = document.createElement("div");
  head.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:12px";
  head.innerHTML = `<strong style="font-size:1.3rem">🎁 Ödüller · ⭐ ${total}</strong>`;
  const close = document.createElement("button");
  close.textContent = "✕";
  close.style.cssText = "min-width:44px;min-height:44px;padding:4px";
  close.addEventListener("click", () => overlay.remove());
  head.append(close);
  panel.append(head);

  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px";
  for (const r of REWARDS) {
    const open = unlocked.has(r.id);
    const cell = document.createElement("div");
    cell.style.cssText = `border-radius:16px;padding:12px;text-align:center;border:3px solid ${open ? "var(--success)" : "var(--border)"};background:${open ? "#e9f9ef" : "var(--surface)"};opacity:${open ? 1 : 0.72}`;
    const art = document.createElement("div");
    art.style.cssText = "font-size:1.9rem;letter-spacing:2px;margin-bottom:6px;filter:" + (open ? "none" : "grayscale(1)");
    art.textContent = open ? r.art.join(" ") : "🔒";
    const name = document.createElement("div");
    name.style.fontWeight = "800";
    name.textContent = r.name;
    const cost = document.createElement("div");
    cost.style.cssText = "font-size:0.9rem;color:var(--muted)";
    cost.textContent = open ? "Açıldı! ✓" : `⭐ ${r.cost} yıldız gerekli`;
    cell.append(art, name, cost);
    grid.append(cell);
  }
  panel.append(grid);
  overlay.append(panel);
  document.body.append(overlay);
}

document.getElementById("rewardsBtn").addEventListener("click", showRewards);
initAudio(); // G-9: ilk dokunuşta ses kilidi açılır
document.getElementById("loading")?.remove();
refreshStars();
render();
