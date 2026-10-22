// rewards.js — ödül sistemi: oyunlardan kazanılan toplam yıldız, eşik ödüllerini açar.
// Ödül = çıkartma koleksiyonu (emoji panel). eşik: gereken toplam yıldız.

export const REWARDS = [
  { id: "rookie", name: "İlk Yıldız Rozeti", icon: "🌟", cost: 2, art: ["🌟", "✨", "🌟"] },
  { id: "fox", name: "Tilki Çıkartması", icon: "🦊", cost: 5, art: ["🦊", "🌈", "🌻"] },
  { id: "balloon", name: "Balon Partisi", icon: "🎈", cost: 9, art: ["🎈", "🎉", "🎈", "🎁"] },
  { id: "ocean", name: "Okyanus Dünyası", icon: "🌊", cost: 14, art: ["🐬", "🐠", "🐙", "🌊", "🐚"] },
  { id: "space", name: "Uzay Kaşifi", icon: "🚀", cost: 20, art: ["🚀", "🌙", "⭐", "🪐", "👽"] },
  { id: "dino", name: "Dinozor Krallığı", icon: "🦖", cost: 27, art: ["🦖", "🌋", "🦕", "🌴", "🥚"] },
  { id: "castle", name: "Şato Sarayı", icon: "🏰", cost: 35, art: ["🏰", "👑", "🛡️", "🐴", "💎"] },
  { id: "champion", name: "Şampiyon Kupası", icon: "🏆", cost: 44, art: ["🏆", "🥇", "🎯", "💪", "🎊", "⭐"] },
];

/** Toplam yıldıza göre açılmış ödüller. */
export function unlockedRewards(totalStars) {
  return REWARDS.filter((r) => totalStars >= r.cost);
}

/** Sıradaki kilitli ödül (yoksa null). */
export function nextReward(totalStars) {
  return REWARDS.find((r) => totalStars < r.cost) ?? null;
}
