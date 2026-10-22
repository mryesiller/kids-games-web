import { describe, it, expect } from "vitest";
import { generateMaze, solveMaze, starsFromSteps } from "../games/maze/maze.js";

describe("labirent üreteci (PRD O7)", () => {
  it.each([5, 8, 12])("%ix%i: her açılışta rastgele ama her zaman çözülebilir", (n) => {
    const mazes = new Set();
    for (let seed = 1; seed <= 5; seed++) {
      let s = seed * 7919;
      const rng = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      const walls = generateMaze(n, rng);
      const path = solveMaze(walls);
      expect(path).not.toBeNull(); // üreteç garantisi: en az bir yol
      expect(path[0]).toEqual([0, 0]);
      expect(path.at(-1)).toEqual([n - 1, n - 1]);
      mazes.add(JSON.stringify(walls));
    }
    expect(mazes.size).toBeGreaterThan(1); // rastgele
  });

  it("duvarlar çift yönlü tutarlıdır (bir yandan açıksa öbür yandan da açık)", () => {
    const walls = generateMaze(8, () => 0.5);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (x < 7) expect(walls[y][x].right).toBe(walls[y][x + 1].left);
        if (y < 7) expect(walls[y][x].bottom).toBe(walls[y + 1][x].top);
      }
    }
  });

  it("tam labirent: her hücreye ulaşılır (spanning tree → n² hücre)", () => {
    for (const n of [5, 8, 12]) {
      const walls = generateMaze(n);
      const seen = new Set();
      const stack = [[0, 0]];
      while (stack.length) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!walls[y][x].top && y > 0) stack.push([x, y - 1]);
        if (!walls[y][x].bottom && y < n - 1) stack.push([x, y + 1]);
        if (!walls[y][x].left && x > 0) stack.push([x - 1, y]);
        if (!walls[y][x].right && x < n - 1) stack.push([x + 1, y]);
      }
      expect(seen.size).toBe(n * n);
    }
  });

  it("adım → yıldız: optimal×1.5 → 3★, ×2 → 2★, aksi 1★", () => {
    expect(starsFromSteps(10, 7)).toBe(3);
    expect(starsFromSteps(14, 7)).toBe(2);
    expect(starsFromSteps(15, 7)).toBe(1);
  });
});
