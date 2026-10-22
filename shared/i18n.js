// i18n.js — anahtarlı sözlük (PRD G-15, §11.5). Varsayılan dil: tr.
// İkinci dil v1'de yok; API anahtarlı olduğundan sonradan sözlük eklemek yeterli.

const dict = {
  tr: {
    "app.title": "Zeka Oyunları",
    "home.play": "Oyna",
    "home.category.all": "Tümü",
    "home.category.memory": "Hafıza",
    "home.category.logic": "Mantık",
    "home.category.math": "Matematik",
    "home.category.language": "Dil",
    "game.back": "Ana Sayfa",
    "game.win": "Harika! Kazandın!",
    "game.again": "Tekrar Oyna",
    "game.next": "Sonraki Seviye",
    "game.howto.memory": "Aynı resimleri eşleştir!",
    "game.muted": "Sesi Aç",
    "game.sound": "Sesi Kapat",
    "game.moves": "Hamle",
  },
};

let lang = "tr";

export function setLanguage(l) {
  if (dict[l]) lang = l;
}

/** Anahtarlı metin; eksik anahtarda anahtarın kendisi döner (sessiz hata yok ama çökme de yok). */
export function t(key) {
  return dict[lang]?.[key] ?? key;
}

/**
 * Türkçe güvenli harf normalizasyonu (G-15): I/ı, İ/i ayrımı korunur.
 * Harf karşılaştırmalarında toLowerCase() ASLA doğrudan kullanma — Türkçe'de
 * "I".toLowerCase() === "i" hatalı eşleşme üretir.
 */
export function trLower(s) {
  return String(s).replaceAll("I", "ı").replaceAll("İ", "i").toLowerCase();
}

export function trUpper(s) {
  return String(s).replaceAll("i", "İ").replaceAll("ı", "I").toUpperCase();
}

/** Aksan duyarlı eşitlik: harfler Türkçe kuralla büyütülüp karşılaştırılır. */
export function trEquals(a, b) {
  return trUpper(a) === trUpper(b);
}
