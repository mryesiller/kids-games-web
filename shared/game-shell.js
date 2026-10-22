// game-shell.js — sözleşmeyi UI kabuğuna bağlayan bootstrap (PRD §3.3).
// Her oyun sayfasının main.js'i bunu çağırır. Sorumluluklar:
// - oyunu kur, yıldızı storage'a yaz (setStars yalnız artırır)
// - visibilitychange → pause/resume
// - pagehide → destroy (timer sızıntısı önleme)
// - geri butonu → destroy + ana sayfaya dönüş
import { buildShell, showWinOverlay } from "./ui.js";
import { initAudio, toggleMuted, isMuted } from "./audio.js";
import { getLevel, setStars, setLevel } from "./storage.js";
import { t } from "./i18n.js";

/**
 * @param {import("./types").GameModule} game {id, start, pause, resume, destroy}
 * @param {{ hint?: string, hintIcon?: string, defaultLevel?: number }} opts
 */
export function bootGame(game, opts = {}) {
  initAudio();
  const { main, header } = buildShell({ hint: opts.hint, hintIcon: opts.hintIcon });
  const soundBtn = header.querySelector("[data-action='sound']");
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

  let level = Math.max(Math.min(getLevel(game.id), game.maxLevel ?? 3), opts.defaultLevel ?? 1);
  let instance = null;

  const run = () => {
    if (instance?.destroy) instance.destroy();
    main.replaceChildren();
    instance = game.start(main, {
      level,
      onWin: ({ stars }) => {
        setStars(game.id, stars);
        const maxL = game.maxLevel ?? 3;
        setLevel(game.id, Math.min(level + 1, maxL));
        showWinOverlay({
          stars,
          onAgain: () => run(),
          onNext: level < maxL ? (() => { level += 1; run(); }) : undefined,
        });
      },
      onExit: () => { window.location.href = "../../index.html"; },
    });
  };

  const onVisibility = () => {
    if (!instance) return;
    if (document.hidden) instance.pause?.();
    else instance.resume?.();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", () => instance?.destroy?.(), { once: true });
  header.querySelector("[data-action='back']").addEventListener("click", () => {
    instance?.destroy?.();
    window.location.href = "../../index.html";
  });

  run();
}
