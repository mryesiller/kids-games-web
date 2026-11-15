import { describe, it, expect, beforeEach } from "vitest";
import { ramp, clampLevel, shouldAdvance } from "../shared/difficulty.js";
import { setStars, getStars, setLevel, getLevel, setBest, getBest, clearGame, clearProgress } from "../shared/storage.js";
import { pairsForLevel } from "../games/memory/game.js";
import { countForLevel } from "../games/counting/game.js";
import { sizeForLevel as orderSize } from "../games/ordering/game.js";
import { optionsForLevel } from "../games/shadow/game.js";
import { maxForLevel } from "../games/bigger/game.js";
import { sizeForLevel as missSize } from "../games/missing-number/game.js";
import { disksForLevel } from "../games/hanoi/game.js";
import { sizeForLevel as mazeSize } from "../games/maze/game.js";
import { minLengthForLevel } from "../games/letter-fish/game.js";
import { configFor } from "../games/simon/game.js";
import { colorsForLevel, objectsForLevel, ruleFor } from "../games/sorter/game.js";
import { specForLevel } from "../games/odd-one-out/game.js";
import { sumCap, subCap, mulHi, opsForLevel } from "../games/number-hunter/questions.js";

function monotonic(fn, dir = 1) {
  let prev = fn(1);
  for (let level = 2; level <= 20; level++) {
    const next = fn(level);
    expect(dir * next).toBeGreaterThanOrEqual(dir * prev);
    prev = next;
  }
}

describe("ortak rampa", () => {
  it("uçları tutar ve hiç geri gitmez", () => {
    expect(ramp(1, 3, 12, 20)).toBe(3);
    expect(ramp(20, 3, 12, 20)).toBe(12);
    expect(ramp(1, 1300, 520, 20)).toBe(1300);
    expect(ramp(20, 1300, 520, 20)).toBe(520);
    monotonic((l) => ramp(l, 3, 12, 20));
    monotonic((l) => ramp(l, 1300, 520, 20), -1);
    expect(clampLevel(0, 20)).toBe(1);
    expect(clampLevel(99, 20)).toBe(20);
    expect(shouldAdvance(0)).toBe(false);
    expect(shouldAdvance(1)).toBe(true);
  });
});

describe("seviye eğrileri kolaydan zora", () => {
  it("sayma 3'ten 12'ye yayılır, 10. seviyede tavan yapmaz", () => {
    expect(countForLevel(1)).toBe(3);
    expect(countForLevel(20)).toBe(12);
    expect(countForLevel(10)).toBeLessThan(countForLevel(20));
    monotonic(countForLevel);
  });

  it("hafıza çiftleri 2'den 8'e çıkar ve telefonda 10 çifti aşmaz", () => {
    expect(pairsForLevel(1)).toBe(2);
    expect(pairsForLevel(20)).toBe(8);
    monotonic(pairsForLevel);
  });

  it("sıralama, gölge, büyük sayı ve eksik sayı uçları korunur", () => {
    expect(orderSize(1)).toBe(3);
    expect(orderSize(20)).toBe(6);
    expect(optionsForLevel(1)).toBe(3);
    expect(optionsForLevel(20)).toBe(5);
    expect(maxForLevel(1)).toBeLessThan(maxForLevel(20));
    expect(maxForLevel(1)).toBeLessThanOrEqual(10);
    expect(missSize(1)).toBe(4);
    expect(missSize(20)).toBe(9);
    monotonic(orderSize);
    monotonic(optionsForLevel);
    monotonic(maxForLevel);
    monotonic(missSize);
  });

  it("hanoi en fazla 5 disk, labirent en fazla 8, kelime 3'ten 6'ya", () => {
    expect(disksForLevel(1)).toBe(3);
    expect(disksForLevel(20)).toBe(5);
    expect(mazeSize(1)).toBe(5);
    expect(mazeSize(20)).toBe(8);
    expect(minLengthForLevel(1)).toBe(3);
    expect(minLengthForLevel(20)).toBe(6);
    monotonic(disksForLevel);
    monotonic(mazeSize);
    monotonic(minLengthForLevel);
  });

  it("simon ped eşiği durur, hız artar, başlangıç dizisi uzar", () => {
    expect(configFor(1).pads).toBe(4);
    expect(configFor(10).pads).toBe(4);
    expect(configFor(11).pads).toBe(6);
    expect(configFor(20).showMs).toBeLessThan(configFor(1).showMs);
    expect(configFor(1).startLen).toBe(1);
    expect(configFor(20).startLen).toBeGreaterThan(1);
    monotonic((l) => configFor(l).pads);
    monotonic((l) => configFor(l).showMs, -1);
    monotonic((l) => configFor(l).startLen);
  });

  it("ayıklayıcı renk ve nesne sayısı artar; kural sırası renk → karışık → ikisi", () => {
    expect(colorsForLevel(1)).toHaveLength(2);
    expect(colorsForLevel(20)).toHaveLength(5);
    expect(objectsForLevel(1)).toBeLessThan(objectsForLevel(20));
    expect(ruleFor(1, 0)).toBe("color");
    expect(ruleFor(9, 0)).toBe("color");
    expect(ruleFor(9, 1)).toBe("shape");
    expect(ruleFor(20, 0)).toBe("both");
    monotonic((l) => colorsForLevel(l).length);
    monotonic(objectsForLevel);
  });

  it("farklı olan: arama zorluğu geri gitmez", () => {
    const rank = { icon: 1, tone: 2, rotate: 3 };
    monotonic((l) => rank[specForLevel(l).mode] * 10 + specForLevel(l).count);
    expect(specForLevel(1)).toMatchObject({ mode: "icon", count: 4 });
    expect(specForLevel(20).mode).toBe("rotate");
  });

  it("sayı avcısı işlem bantları ve üst sınırlar kademeli", () => {
    expect(opsForLevel(1)).toEqual(["add"]);
    expect(opsForLevel(7)).toEqual(["add"]);
    expect(opsForLevel(8)).toContain("sub");
    expect(opsForLevel(15)).toEqual(["mul"]);
    expect(sumCap(1)).toBe(10);
    expect(sumCap(6)).toBeGreaterThan(sumCap(1));
    expect(sumCap(14)).toBeLessThanOrEqual(20);
    expect(subCap(8)).toBeLessThan(subCap(14));
    expect(mulHi(15)).toBeLessThan(mulHi(20));
    expect(mulHi(20)).toBeLessThanOrEqual(5);
    monotonic(sumCap);
    monotonic((l) => (l < 8 ? 0 : subCap(l)));
    monotonic((l) => (l < 15 ? 0 : mulHi(l)));
  });
});

describe("ilerleme sıfırlama", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("yıldız 0 yazılmaz; oyun ve tüm ilerleme ayrı silinir, ses ayarı kalır", () => {
    setStars("memory", 0);
    expect(getStars("memory")).toBe(0);
    setStars("memory", 2);
    setLevel("memory", 4);
    setBest("simon", 9);
    setLevel("simon", 3);
    localStorage.setItem("kg:muted", "1");

    clearGame("memory");
    expect(getStars("memory")).toBe(0);
    expect(getLevel("memory")).toBe(1);
    expect(getBest("simon")).toBe(9);
    expect(getLevel("simon")).toBe(3);

    clearProgress();
    expect(getBest("simon")).toBe(0);
    expect(getLevel("simon")).toBe(1);
    expect(localStorage.getItem("kg:muted")).toBe("1");
  });
});
