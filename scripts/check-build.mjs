// check-build.mjs — CI kontrolleri: G-12 (harici URL yok) + G-11 (giriş boyut bütçesi).
// Giriş → chunk eşleşmesi, giriş HTML'lerindeki script/img referanslarından okunur (O1 düzeltmesi).
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = "dist";
const budgets = { default: 300_000, "number-hunter": 500_000, maze: 500_000 }; // bytes, gzipped

// 1) Harici URL taraması (G-12) — protokol-baıl //cdn... deseni de (K4)
const bad = [];
const scan = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) scan(p);
    else if (/\.(html|js|css|json|svg|webp)$/.test(name) && !/^workbox-/.test(name)) {
      const text = readFileSync(p, "utf8");
      for (const m of text.matchAll(/(?:https?:)?\/\/[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/g)) {
        if (!m[0].includes("www.w3.org")) bad.push(`${p}: ${m[0]}`);
      }
    }
  }
};
scan(DIST);
if (bad.length > 0) {
  console.error("G-12 İHLALİ — harici URL bulundu:\n" + bad.join("\n"));
  process.exit(1);
}
console.log("G-12 ✓ harici URL yok");

// 2) Giriş boyut bütçesi (G-11): HTML'in referans verdiği chunk + görseller + ortak chunk'lar
const SHARED_CHUNK_RE = /^(game-shell|storage|difficulty|icons|drag|drag-helpers|i18n|audio)-/;
const assetFiles = readdirSync(join(DIST, "assets"));
const entryHtmls = [
  { entry: "index", html: "index.html" },
  ...readdirSync(join(DIST, "games")).map((g) => ({ entry: g, html: `games/${g}/index.html` })),
];

function referencedAssets(htmlPath) {
  const html = readFileSync(join(DIST, htmlPath), "utf8");
  const refs = new Set();
  // entry chunk: assets/<name>-<hash>.js — modulepreload/script src'leri
  for (const m of html.matchAll(/assets\/([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g)) refs.add(m[1]);
  // JS içinden yüklenen varlıklar (örn. maze fox.webp): giriş chunk'larını da tara
  for (const name of [...refs]) {
    try {
      const js = readFileSync(join(DIST, "assets", name), "utf8");
      for (const m of js.matchAll(/(?:assets\/)?([a-zA-Z0-9_-]+\.(?:webp|png|svg|json))["'`]/g)) refs.add(m[1]);
    } catch {
      /* chunk değilse atla */
    }
  }
  return refs;
}

let fail = false;
for (const { entry, html } of entryHtmls) {
  const names = referencedAssets(html);
  let total = gzipSync(readFileSync(join(DIST, html))).length;
  for (const name of names) {
    const p = join(DIST, "assets", name);
    try {
      total += gzipSync(readFileSync(p)).length;
    } catch {
      /* referans farklı klasördeyse atla */
    }
  }
  // ortak chunk'lar her girişte yüklenir (HTML referanslıysa zaten sayıldı — çift sayma yok)
  for (const asset of assetFiles) {
    if (SHARED_CHUNK_RE.test(asset) && !names.has(asset)) total += gzipSync(readFileSync(join(DIST, "assets", asset))).length;
  }
  // oyunun kendi statik görselleri (dist/games/<entry>/*.webp)
  try {
    for (const f of readdirSync(join(DIST, "games", entry))) {
      if (f.endsWith(".webp")) total += statSync(join(DIST, "games", entry, f)).size;
    }
  } catch {
    /* görsel yok */
  }
  const budget = budgets[entry] ?? budgets.default;
  const kb = (total / 1000).toFixed(1);
  if (total > budget) {
    console.error(`G-11 İHLALİ — ${entry}: ${kb} KB > ${budget / 1000} KB`);
    fail = true;
  } else {
    console.log(`G-11 ✓ ${entry}: ${kb} KB (bütçe ${budget / 1000} KB)`);
  }
}
process.exit(fail ? 1 : 0);
