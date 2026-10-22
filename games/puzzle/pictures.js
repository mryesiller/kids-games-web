// pictures.js — Higgsfield ile üretilmiş yapboz resimleri (build'e dahil, PRD O3: >= 5 resim).
const mods = import.meta.glob("./assets/picture-*.webp", { eager: true, import: "default", query: "?url" });

export const PICTURES = Object.entries(mods)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url);
