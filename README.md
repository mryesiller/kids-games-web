# kids-games-web — Zeka Oyunları

5-10 yaş çocuklar için reklamsız, girişsiz, kurulumsuz 10 mini oyun. Statik site (Vite MPA, vanilla JS, PWA).

PRD: `../../../../01_Requirements_and_Scope/PRD_KidsGamesWeb.md` · Görev planı: `../../../../05_Documentation_and_Guides/TASK_PLAN_KidsGamesWeb.md`

```bash
npm install
npm run dev          # yerel geliştirme (--host ile ağ üzerinden cihaz testi)
npm run test         # Vitest (45 birim + veri testi)
npm run build        # dist/ — base './', PWA (service worker + manifest)
npm run check        # CI kontrolleri: G-12 harici URL + G-11 giriş boyut bütçesi
```

## Durum (F4 sonrası)

- **10/10 oyun tamam** — memory, odd-one-out, puzzle, number-hunter, pattern, letter-fish, maze, sorter, hanoi, simon
- **PWA aktif:** `vite-plugin-pwa` (generateSW, autoUpdate); uçak modunda ana sayfa + 10 oyun açılır (kabul testi geçti)
- **Lighthouse (mobil):** Performans 100 · Erişilebilirlik 100 · Best Practices 96
- **Görseller:** Higgsfield AI ile üretilmiş sprite sheet'ler → lokal dilimlenmiş WebP (`CREDITS.md`)

## Deployment (karar)

Tam statik dağıtım — **herhangi bir statik host** (Cloudflare Pages / GitHub Pages / Netlify):
1. `npm run build`
2. `dist/` klasörünü yayınla. `base: './'` sayesinde kök VEYA alt dizinden (ör. `username.github.io/kids-games-web/`) çalışır.
3. Şart: HTTPS (service worker için). Build'de harici istek sıfırdır (`npm run check` doğrular) — çerez/analitik/izleyici yok (KVKK/GDPR-K/COPPA uyumlu, yalnız yerel localStorage).
4. Header önerisi: `sw.js`, `index.html`, `manifest.webmanifest` → `Cache-Control: no-cache`; `assets/*` → `max-age=31536000, immutable`. (Bayat `sw.js` HTTP önbelleğinde güncellemeyi 24 saate kadar geciktirir.)

## Yapı

`shared/` çekirdek (core.css, storage, audio, i18n, ui, difficulty, game-shell, drag, icons), `games/<id>/` başına bağımsız sayfa, ortak sözleşme `{id, start(container, ctx), pause, resume, destroy}`.
