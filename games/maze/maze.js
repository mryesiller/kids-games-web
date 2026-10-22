// maze.js — labirent üreteci: saf fonksiyonlar (tests/maze.test.js).
// Recursive backtracker; her labirent çözülebilir (üreteç garantisi, BFS ile test edilir).

/** n×n labirent: hücre duvarları {top,right,bottom,left}. */
export function generateMaze(n, rng = Math.random) {
  const walls = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => ({ top: true, right: true, bottom: true, left: true })),
  );
  const visited = Array.from({ length: n }, () => Array(n).fill(false));
  const stack = [[0, 0]];
  visited[0][0] = true;
  const dirs = [
    ["top", 0, -1, "bottom"],
    ["right", 1, 0, "left"],
    ["bottom", 0, 1, "top"],
    ["left", -1, 0, "right"],
  ];
  while (stack.length > 0) {
    const [x, y] = stack.at(-1);
    const neighbors = dirs.filter(([, dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      return nx >= 0 && nx < n && ny >= 0 && ny < n && !visited[ny][nx];
    });
    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }
    const [wall, dx, dy, opp] = neighbors[Math.floor(rng() * neighbors.length)];
    walls[y][x][wall] = false;
    const nx = x + dx;
    const ny = y + dy;
    walls[ny][nx][opp] = false;
    visited[ny][nx] = true;
    stack.push([nx, ny]);
  }
  return walls;
}

/** BFS: girişten (0,0) çıkışa (n-1,n-1) yol var mı? Yol döner (varlığını kanıtlar). */
export function solveMaze(walls) {
  const n = walls.length;
  const prev = Array.from({ length: n }, () => Array(n).fill(null));
  const seen = Array.from({ length: n }, () => Array(n).fill(false));
  const queue = [[0, 0]];
  seen[0][0] = true;
  const dirs = [
    ["top", 0, -1],
    ["right", 1, 0],
    ["bottom", 0, 1],
    ["left", -1, 0],
  ];
  while (queue.length > 0) {
    const [x, y] = queue.shift();
    if (x === n - 1 && y === n - 1) {
      const path = [];
      let cur = [x, y];
      while (cur) {
        path.push(cur);
        cur = prev[cur[1]][cur[0]];
      }
      return path.reverse();
    }
    for (const [wall, dx, dy] of dirs) {
      if (walls[y][x][wall]) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= n || ny < 0 || ny >= n || seen[ny][nx]) continue;
      seen[ny][nx] = true;
      prev[ny][nx] = [x, y];
      queue.push([nx, ny]);
    }
  }
  return null;
}

/** Adım → yıldız: optimal = BFS yol uzunluğu − 1; PRD hamle eşiği ×1.5 / ×2. */
export function starsFromSteps(steps, optimal) {
  return steps <= Math.ceil(optimal * 1.5) ? 3 : steps <= optimal * 2 ? 2 : 1;
}
