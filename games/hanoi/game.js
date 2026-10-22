// game.js — O9 Hanoi Kuleleri (PRD): 3/4/5 disk, nazik geçersiz hamle reddi,
// hamle sayacı + en az hamle bilgisi, ipucu butonu (rules.js çözüm algoritması).
import { initialTowers, isValidMove, applyMove, isSolved, optimalMoves, nextHintMove } from "./rules.js";
import { starsFromMoves } from "../../shared/difficulty.js";
import { createTapSelect } from "../../shared/drag.js";
import { sfx } from "../../shared/audio.js";

const DISKS_BY_LEVEL = (level) => Math.min(8, 3 + Math.floor((level - 1) / 2)); // 20 seviye: 3-4(1-4) → 5-6(5-8) → 7-8(9+) disk
const DISK_COLORS = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6", "#e91e8c", "#16a085"];

export default {
  id: "hanoi",
  maxLevel: 20,
  start(container, { level, onWin }) {
    const disks = DISKS_BY_LEVEL(level);
    let towers = initialTowers(disks);
    let moves = 0;
    let pickedPeg = null; // dokun-seç: seçilen kaynak çubuk

    const bar = document.createElement("div");
    bar.className = "hint";
    const statusEl = document.createElement("span");
    const hintBtn = document.createElement("button");
    hintBtn.type = "button";
    hintBtn.textContent = "💡";
    hintBtn.setAttribute("aria-label", "İpucu");
    hintBtn.addEventListener("click", () => {
      const hint = nextHintMove(towers, disks);
      if (!hint) return;
      const [from, to] = hint;
      pegs[from].style.outline = "4px solid var(--warning)";
      pegs[to].style.outline = "4px dashed var(--warning)";
      setTimeout(() => pegs.forEach((p) => (p.style.outline = "")), 1200);
    });
    bar.append(statusEl, hintBtn);

    const board = document.createElement("div");
    board.style.cssText = "display:flex;gap:16px;justify-content:center;width:100%";
    const pegs = [];
    const tap = createTapSelect({
      onSelect(el, on) {
        el.style.outline = on ? "4px solid var(--accent)" : "";
      },
      onTargetPick(target) {
        tryMove(Number(pickedPeg.dataset.peg), Number(target.dataset.peg));
        pickedPeg = null;
      },
    });

    function render() {
      for (const peg of pegs) {
        const stack = peg.firstChild; // disk yığını
        stack.replaceChildren();
        for (const d of towers[Number(peg.dataset.peg)]) {
          const disk = document.createElement("div");
          const width = 30 + (d - 1) * (120 / disks);
          disk.style.cssText = `height:22px;width:${width}%;max-width:100%;background:${DISK_COLORS[d - 1]};border-radius:11px;margin:3px auto`;
          stack.append(disk);
        }
      }
    }

    function tryMove(from, to) {
      if (!isValidMove(towers, from, to)) {
        if (from !== to) {
          sfx.wrong();
          pegs[to].classList.remove("shake");
          void pegs[to].offsetWidth;
          pegs[to].classList.add("shake");
        }
        return false;
      }
      towers = applyMove(towers, from, to);
      moves += 1;
      sfx.correct();
      statusEl.textContent = `Seviye ${level} · ${moves} hamle (en az ${optimalMoves(disks)})`;
      render();
      if (isSolved(towers, disks)) {
        setTimeout(() => onWin({ stars: starsFromMoves(moves, optimalMoves(disks)) }), 500);
      }
      return true;
    }

    for (let i = 0; i < 3; i++) {
      const peg = document.createElement("button");
      peg.type = "button";
      peg.dataset.peg = i;
      peg.setAttribute("aria-label", `çubuk ${i + 1}`);
      peg.style.cssText =
        "width:min(30vw,150px);height:min(52vw,260px);display:flex;flex-direction:column;justify-content:flex-end;padding:8px;border-width:3px";
      const stack = document.createElement("div");
      stack.style.cssText = "width:100%;display:flex;flex-direction:column-reverse;justify-content:flex-start;gap:3px";
      peg.append(stack);
      peg.addEventListener("click", () => {
        // dokun-seç: ilk dokunuş kaynak, ikinci hedef
        if (pickedPeg === peg) {
          pickedPeg = null;
          peg.style.outline = "";
          return;
        }
        if (!pickedPeg) {
          if (towers[i].length === 0) return;
          pickedPeg = peg;
          tap.pickItem(peg);
        } else {
          tap.pickTarget(peg);
        }
      });
      board.append(peg);
      pegs.push(peg);
    }

    container.append(bar, board);
    statusEl.textContent = `Seviye ${level} · 0 hamle (en az ${optimalMoves(disks)})`;
    render();

    return {
      pause() {},
      resume() {},
      destroy() {
        container.replaceChildren();
      },
    };
  },
};
