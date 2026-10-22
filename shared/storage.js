// storage.js — localStorage sarmalayıcı, tek yazım noktası (PRD §3.1.1, G-8)
// Anahtar formatı: `kg:<gameId>:<field>`; alanlar: stars (1-3), level (int), best (int, örn. Simon rekor tur).
// localStorage erişilemezse işlemler sessizce no-op olur; oyun çalışmaya devam eder.

const PREFIX = "kg:";
const VERSION_KEY = "kg:v1";
const SCHEMA_VERSION = 1;

function available() {
  try {
    const probe = PREFIX + "__probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const ok = available();

// Şema versiyonu ileride değişirse migrasyon burada.
export function init() {
  if (!ok) return;
  try {
    const v = Number(window.localStorage.getItem(VERSION_KEY));
    if (!v) window.localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
  } catch {
    /* yoksay */
  }
}

function key(gameId, field) {
  return `${PREFIX}${gameId}:${field}`;
}

function read(gameId, field) {
  if (!ok) return null;
  try {
    const raw = window.localStorage.getItem(key(gameId, field));
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

function write(gameId, field, value) {
  if (!ok) return;
  try {
    window.localStorage.setItem(key(gameId, field), String(value));
  } catch {
    /* quota/gizli mod: yoksay */
  }
}

export function getStars(gameId) {
  return read(gameId, "stars") ?? 0;
}

export function getLevel(gameId) {
  return read(gameId, "level") ?? 1;
}

/** Yıldız yalnızca artırılır (en iyi sonuç korunur). */
export function setStars(gameId, stars) {
  const s = Math.max(1, Math.min(3, Math.trunc(stars)));
  if (s > getStars(gameId)) write(gameId, "stars", s);
}

/** Seviye yalnızca artırılır (en yüksek açılan korunur). */
export function setLevel(gameId, level) {
  const l = Math.max(1, Math.trunc(level));
  if (l > getLevel(gameId)) write(gameId, "level", l);
}

/** Rekor (örn. Simon tur sayısı); yalnızca artırılır. */
export function getBest(gameId) {
  return read(gameId, "best") ?? 0;
}

export function setBest(gameId, value) {
  const v = Math.max(0, Math.trunc(value));
  if (v > getBest(gameId)) write(gameId, "best", v);
}

/** Ana sayfa kartları için: {stars, level} */
export function getProgress(gameId) {
  return { stars: getStars(gameId), level: getLevel(gameId) };
}

/** Testler için: tüm kg: kayıtlarını temizle. */
export function clearAll() {
  if (!ok) return;
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* yoksay */
  }
}
