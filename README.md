# kids-games-web — Zeka Oyunları

**Canlı (VPS):** https://kids.mryesiller.dev · Repo: https://git.mryesiller.dev/admin/kids-games-web (Coolify, `main` branch otomatik deploy)

Orijinal GitHub kopyası ayrı duruyor ve değişmeyecek: https://mryesiller.github.io/kids-games-web/ · https://github.com/mryesiller/kids-games-web

5-10 yaş çocuklar için reklamsız, girişsiz, kurulumsuz mini oyunlar. Statik site (Vite MPA, vanilla JS, PWA).

PRD: `../../../../01_Requirements_and_Scope/PRD_KidsGamesWeb.md` · Görev planı: `../../../../05_Documentation_and_Guides/TASK_PLAN_KidsGamesWeb.md`

```bash
npm install
npm run dev          # yerel geliştirme (--host ile ağ üzerinden cihaz testi)
npm run test         # Vitest (83 test)
npm run build        # dist/ — base './', PWA (service worker + manifest)
npm run check        # CI kontrolleri: G-12 harici URL + G-11 giriş boyut bütçesi
```

## Durum (F4 sonrası)

- **19 oyun** — memory, odd-one-out, number-hunter, pattern, letter-fish, maze, sorter, hanoi, simon, counting, ordering, shadow, bigger, missing-number, whack, colors, even-odd, make-ten, vanish
- **v2:** kademeli seviye, her oyunda ana sayfa, Web Audio efekt + konfeti, kalıcı sessiz, ebeveyn sıfırlama (tümü / oyun)
- **PWA aktif:** `vite-plugin-pwa` (generateSW, autoUpdate); derlenen tüm HTML/JS precache edilir, yeni oyunlar da çevrimdışı açılır
- **Lighthouse (mobil):** Performans 100 · Erişilebilirlik 100 · Best Practices 96
- **Görseller:** Higgsfield AI ile üretilmiş sprite sheet'ler → lokal dilimlenmiş WebP (`CREDITS.md`)

## Deployment (karar)

Bu kopya VPS üzerinde Coolify + Docker (çok aşamalı Node derlemesi, nginx statik yayın) ile `https://kids.mryesiller.dev` adresinde çalışır. `vite.config.js` içindeki `base: './'` kök etki alanında da doğru yol üretir; PWA `start_url` / `scope` görecelidir.

Yerel statik dağıtım da duruyor:
1. `npm run build`
2. `dist/` klasörünü yayınla. `base: './'` sayesinde kök VEYA alt dizinden çalışır.
3. Şart: HTTPS (service worker için). Build'de harici istek sıfırdır (`npm run check` doğrular) — çerez/analitik/izleyici yok (KVKK/GDPR-K/COPPA uyumlu, yalnız yerel localStorage).
4. `nginx.conf` header önerisini uygular: `sw.js`, `index.html`, `manifest.webmanifest` → `Cache-Control: no-cache`; `assets/*` → `max-age=31536000, immutable`.

## Yapı

`shared/` çekirdek (core.css, storage, audio, i18n, ui, difficulty, game-shell, drag, icons), `games/<id>/` başına bağımsız sayfa, ortak sözleşme `{id, start(container, ctx), pause, resume, destroy}`.
