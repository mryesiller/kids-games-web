// game.js — O7 Labirent Kaşifi (PRD): saf Canvas, recursive backtracker üreteci.
// Kontroller: parmakla kaydırma, ok tuşları, ekran okları. Adım → yıldız (BFS optimal).
import { generateMaze, solveMaze, starsFromSteps } from "./maze.js";
import { sfx } from "../../shared/audio.js";

const FOX_SRC = new URL("./assets/fox.webp", import.meta.url).href;

export default {
  id: "maze",
  start(container, { level, onWin }) {
    const n = { 1: 5, 2: 8, 3: 12 }[level] ?? 5;
    const walls = generateMaze(n);
    const optimal = solveMaze(walls).length - 1;
    let pos = [0, 0];
    let steps = 0;
    let finished = false;
    let winTimer = 0;
    let foxImg = null;

    const bar = document.createElement("div");
    bar.className = "hint";
    const statusEl = document.createElement("span");
    bar.append(statusEl);

    const wrap = document.createElement("div");
    wrap.style.cssText = "position:relative;width:min(92vw,70vh,520px);aspect-ratio:1";
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block;touch-action:none";
    wrap.append(canvas);
    container.append(bar, wrap);

    // ekran okları (dokunmatik)
    const arrows = document.createElement("div");
    arrows.style.cssText = "display:grid;grid-template-columns:repeat(3,64px);gap:6px;justify-content:center;margin-top:8px";
    const mk = (label, dx, dy, col) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.style.gridColumn = col;
      b.setAttribute("aria-label", label);
      b.addEventListener("click", () => move(dx, dy));
      arrows.append(b);
    };
    mk("⬆", 0, -1, 2);
    mk("⬅", -1, 0, 1);
    mk("⬇", 0, 1, 2);
    mk("➡", 1, 0, 3);
    container.append(arrows);

    const fox = new Image();
    fox.src = FOX_SRC;
    fox.onload = () => {
      foxImg = fox;
      draw();
    };

    const ctx = canvas.getContext("2d");
    let size = 0;
    function resize() {
      const r = wrap.getBoundingClientRect();
      size = r.width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // zoom/ekran değişiminde taze okunur
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);
      const cell = size / n;
      // hücre zeminleri
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#ffe9b8";
      ctx.fillRect((n - 1) * cell, (n - 1) * cell, cell, cell);
      ctx.strokeStyle = "#2d2a26";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const w = walls[y][x];
          if (w.top) {
            ctx.moveTo(x * cell, y * cell);
            ctx.lineTo((x + 1) * cell, y * cell);
          }
          if (w.left) {
            ctx.moveTo(x * cell, y * cell);
            ctx.lineTo(x * cell, (y + 1) * cell);
          }
        }
      }
      ctx.moveTo(size, 0);
      ctx.lineTo(size, size);
      ctx.moveTo(0, size);
      ctx.lineTo(size, size);
      ctx.stroke();
      // karakter (Higgsfield tilki yavrusu) veya fallback daire
      const cx = pos[0] * cell + cell / 2;
      const cy = pos[1] * cell + cell / 2;
      if (foxImg) {
        const s = cell * 0.8;
        ctx.drawImage(foxImg, cx - s / 2, cy - s / 2, s, s);
      } else {
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function move(dx, dy) {
      if (finished) return;
      const [x, y] = pos;
      const w = walls[y][x];
      const wall = dy === -1 ? "top" : dy === 1 ? "bottom" : dx === -1 ? "left" : "right";
      if (w[wall]) return; // duvardan geçilmez
      pos = [x + dx, y + dy];
      steps += 1;
      sfx.tap();
      statusEl.textContent = `${steps} adım (en az ${optimal})`;
      draw();
      if (pos[0] === n - 1 && pos[1] === n - 1) {
        finished = true;
        sfx.star();
        winTimer = setTimeout(() => onWin({ stars: starsFromSteps(steps, optimal) }), 400);
      }
    }

    const onKey = (e) => {
      const map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      if (map[e.key]) {
        e.preventDefault();
        move(...map[e.key]);
      }
    };
    window.addEventListener("keydown", onKey);

    // parmakla kaydırma
    let swipeStart = null;
    const onDown = (e) => (swipeStart = [e.clientX, e.clientY]);
    const onUp = (e) => {
      if (!swipeStart) return;
      const dx = e.clientX - swipeStart[0];
      const dy = e.clientY - swipeStart[1];
      swipeStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) move(Math.sign(dx), 0);
      else move(0, Math.sign(dy));
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    resize();
    statusEl.textContent = `0 adım (en az ${optimal})`;

    return {
      pause() {},
      resume() {},
      destroy() {
        clearTimeout(winTimer);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", onResize);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointerup", onUp);
        container.replaceChildren();
      },
    };
  },
};
