// icons.js — Higgsfield sprite sheet'ten dilimlenen oyun ikonları (build'e dahil, G-12 yerel).
const mods = import.meta.glob("../games/memory/assets/icon-*.webp", {
  eager: true,
  import: "default",
  query: "?url",
});

const BY_ID = Object.fromEntries(
  Object.entries(mods).map(([path, url]) => [Number(path.match(/icon-(\d+)\.webp$/)?.[1]), url]),
);

export const ICON_COUNT = Object.keys(BY_ID).length;

/** 1 tabanlı ikon no → paketlenmiş asset URL'i. */
export function ICON_URL(n) {
  return BY_ID[n];
}
