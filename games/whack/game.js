// Köstebek Vur: delikten çıkan köstebeğe dokun. Erken seviye yavaş ve tuzaksız.
import { ramp, clampLevel } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";

export const MAX_LEVEL = 20;

export function configFor(level) {
  const l = clampLevel(level, MAX_LEVEL);
  return {
    holes: l <= 8 ? 6 : 9,
    upMs: ramp(l, 1800, 600, MAX_LEVEL),
    gapMs: ramp(l, 900, 320, MAX_LEVEL),
    goal: ramp(l, 5, 12, MAX_LEVEL),
    bombChance: l <= 8 ? 0 : Math.min(0.25, (l - 8) * 0.03),
    missLimit: l <= 6 ? 99 : Math.max(4, 12 - (l - 6)),
  };
}

/** Dolu olmayan bir delik seçer. Hepsi doluysa -1. */
export function nextHole(holeCount, busy, rng = Math.random) {
  const free = [];
  for (let i = 0; i < holeCount; i++) if (!busy[i]) free.push(i);
  if (free.length === 0) return -1;
  return free[Math.floor(rng() * free.length)];
}

export function rollKind(level, rng = Math.random) {
  return rng() < configFor(level).bombChance ? "bomb" : "mole";
}

export function starsForWhack(hits, goal, misses) {
  if (hits < goal) return 0;
  if (misses <= 1) return 3;
  if (misses <= 4) return 2;
  return 1;
}

export default {
  id: "whack",
  maxLevel: MAX_LEVEL,
  start(container, { level, onWin }) {
    const cfg = configFor(level);
    let hits = 0;
    let misses = 0;
    let dead = false;
    let paused = false;
    let active = -1;
    let popTimer = 0;
    let hideTimer = 0;

    const status = document.createElement("div");
    status.className = "hint";
    status.style.fontWeight = "800";
    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(92vw,420px)";

    const holes = [];
    for (let i = 0; i < cfg.holes; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hole";
      btn.setAttribute("aria-label", "delik");
      const face = document.createElement("span");
      face.className = "mole";
      btn.append(face);
      btn.addEventListener("pointerdown", () => onTap(i));
      grid.append(btn);
      holes.push(btn);
    }

    function paint() {
      status.textContent = `🐹 ${hits} / ${cfg.goal}`;
    }

    function hide(i) {
      const btn = holes[i];
      btn.dataset.kind = "";
      btn.querySelector(".mole").classList.remove("show");
      btn.querySelector(".mole").textContent = "";
      btn.setAttribute("aria-label", "delik");
    }

    function show(i, kind) {
      const btn = holes[i];
      btn.dataset.kind = kind;
      const face = btn.querySelector(".mole");
      face.textContent = kind === "bomb" ? "🪨" : "🐹";
      face.classList.add("show");
      btn.setAttribute("aria-label", kind === "bomb" ? "taş" : "köstebek");
    }

    function finish(stars) {
      if (dead) return;
      dead = true;
      clearTimeout(popTimer);
      clearTimeout(hideTimer);
      onWin({ stars });
    }

    function schedule(delay) {
      if (dead || paused) return;
      popTimer = setTimeout(spawn, delay);
    }

    function spawn() {
      if (dead || paused) return;
      const busy = Array(cfg.holes).fill(false);
      if (active >= 0) busy[active] = true;
      const hole = nextHole(cfg.holes, busy, Math.random);
      if (hole < 0) {
        schedule(cfg.gapMs);
        return;
      }
      active = hole;
      const kind = rollKind(level, Math.random);
      show(hole, kind);
      hideTimer = setTimeout(() => {
        const missedMole = holes[hole].dataset.kind === "mole";
        hide(hole);
        active = -1;
        if (missedMole) {
          misses += 1;
          sfx.wrong();
          if (misses >= cfg.missLimit) {
            finish(0);
            return;
          }
        }
        schedule(cfg.gapMs);
      }, cfg.upMs);
    }

    function onTap(i) {
      if (dead || paused) return;
      if (i !== active || !holes[i].dataset.kind) {
        sfx.tap();
        return;
      }
      const kind = holes[i].dataset.kind;
      clearTimeout(hideTimer);
      hide(i);
      active = -1;
      if (kind === "mole") {
        hits += 1;
        sfx.correct();
        paint();
        if (hits >= cfg.goal) {
          finish(starsForWhack(hits, cfg.goal, misses));
          return;
        }
      } else {
        misses += 1;
        sfx.wrong();
        holes[i].classList.remove("shake");
        void holes[i].offsetWidth;
        holes[i].classList.add("shake");
        if (misses >= cfg.missLimit) {
          finish(0);
          return;
        }
      }
      schedule(cfg.gapMs);
    }

    container.append(status, grid);
    paint();
    schedule(400);

    return {
      pause() {
        paused = true;
        clearTimeout(popTimer);
        clearTimeout(hideTimer);
      },
      resume() {
        if (!paused || dead) return;
        paused = false;
        if (active >= 0) hide(active);
        active = -1;
        schedule(300);
      },
      destroy() {
        dead = true;
        clearTimeout(popTimer);
        clearTimeout(hideTimer);
        container.replaceChildren();
      },
    };
  },
};
