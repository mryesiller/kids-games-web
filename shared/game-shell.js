// game-shell.js — sözleşmeyi UI kabuğuna bağlayan bootstrap (PRD §3.3).
// Her oyun sayfasının main.js'i bunu çağırır. Sorumluluklar:
// - başlamadan önce hazır ekranı (ana sayfa her zaman erişilebilir)
// - oyunu kur, yıldızı storage'a yaz (setStars yalnız artırır; 0 yıldız seviye açmaz)
// - visibilitychange → pause/resume
// - pagehide → destroy (timer sızıntısı önleme)
// - geri butonu → destroy + ana sayfaya dönüş
import { buildShell, showWinOverlay, showStartOverlay } from "./ui.js";
import { initAudio, toggleMuted, isMuted } from "./audio.js";
import { getLevel, setStars, setLevel } from "./storage.js";
import { t } from "./i18n.js";
import { clampLevel, shouldAdvance } from "./difficulty.js";

/**
 * @param {import("./types").GameModule} game {id, start, pause, resume, destroy}
 * @param {{ hint?: string, hintIcon?: string, defaultLevel?: number }} opts
 */
export function bootGame(game, opts = {}) {
  initAudio();
  const maxL = game.maxLevel ?? 3;
  const { main, header } = buildShell({ hint: opts.hint, hintIcon: opts.hintIcon });
  const soundBtn = header.querySelector("[data-action='sound']");
  const levelEl = header.querySelector("[data-role='level']");
  const syncSound = () => {
    soundBtn.textContent = isMuted() ? "🔇" : "🔊";
    soundBtn.setAttribute("aria-pressed", String(isMuted()));
    soundBtn.setAttribute("aria-label", isMuted() ? t("game.muted") : t("game.sound"));
  };
  soundBtn.addEventListener("click", () => {
    toggleMuted();
    syncSound();
  });
  syncSound();

  let level = clampLevel(Math.min(getLevel(game.id), maxL), maxL);
  if (opts.defaultLevel) level = clampLevel(Math.max(level, opts.defaultLevel), maxL);
  let instance = null;

  const goHome = () => {
    instance?.destroy?.();
    instance = null;
    window.location.href = "../../index.html";
  };

  const showLevel = () => {
    levelEl.textContent = `Seviye ${level}/${maxL}`;
  };

  const launch = () => {
    showLevel();
    instance = game.start(main, {
      level,
      onWin: ({ stars }) => {
        const advance = shouldAdvance(stars);
        if (advance) {
          setStars(game.id, stars);
          setLevel(game.id, Math.min(level + 1, maxL));
        }
        showWinOverlay({
          stars: advance ? stars : 0,
          onAgain: () => run(),
          onNext: advance && level < maxL ? () => { level += 1; run(); } : undefined,
          onHome: goHome,
        });
      },
      onExit: goHome,
    });
  };

  const run = () => {
    instance?.destroy?.();
    instance = null;
    main.replaceChildren();
    showLevel();
    showStartOverlay({
      instruction: opts.hint || "Hazır mısın?",
      icon: opts.hintIcon || "🎮",
      levelLabel: `Seviye ${level} / ${maxL}`,
      onHome: goHome,
      onEasier: level > 1 ? () => { level -= 1; run(); } : undefined,
      onStart: launch,
    });
  };

  const onVisibility = () => {
    if (!instance) return;
    if (document.hidden) instance.pause?.();
    else instance.resume?.();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", () => instance?.destroy?.(), { once: true });
  header.querySelector("[data-action='back']").addEventListener("click", goHome);

  run();
}
