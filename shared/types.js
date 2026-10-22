// types.js — yalnızca JSDoc typedef'leri (çalışma zamanı kodu yok).

/**
 * @typedef {Object} GameCtx
 * @property {number} level 1 tabanlı zorluk seviyesi
 * @property {({stars: number, score?: number}) => void} onWin oyun bittiğinde çağır
 * @property {() => void} onExit
 */

/**
 * @typedef {Object} GameModule
 * @property {string} id
 * @property {(container: HTMLElement, ctx: GameCtx) => {pause?: () => void, resume?: () => void, destroy: () => void}} start
 * @property {() => void} [pause]
 * @property {() => void} [resume]
 * @property {() => void} [destroy]
 */
