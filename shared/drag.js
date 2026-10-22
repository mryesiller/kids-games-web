// drag.js — ortak sürükleme yardımcısı (PRD F2): Pointer Events tabanlı,
// her sürükleme etkileşiminin DOKUN-SEÇ alternatifi zorunludur (Risk tablosu: küçük çocuklarda sürükleme zor).
//
// Kullanım:
//   enableDrag(el, { onDrop(target, el) , getTargets: () => HTMLElement[] })
//   enableTapSelect(el, { onTapSelect(el) })  // dokun-seç modu: önce öğe, sonra hedef
// Oyun, bırakma anında yerleştirme/kabul kararını verir; bu modül sadece olayları taşır.

/**
 * Pointer Events ile sürüklenebilir öğe. Ghost klonu imleci takip eder.
 * @returns {() => void} cleanup
 */
export function enableDrag(el, { onDrop, getTargets }) {
  let ghost = null;
  let offsetX = 0;
  let offsetY = 0;
  let active = false;

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    active = true;
    const r = el.getBoundingClientRect();
    const pr = e.clientX;
    offsetX = pr - r.left;
    offsetY = e.clientY - r.top;
    ghost = el.cloneNode(true);
    ghost.style.cssText = `position:fixed;z-index:100;pointer-events:none;width:${r.width}px;height:${r.height}px;left:${e.clientX - offsetX}px;top:${e.clientY - offsetY}px;opacity:0.85;transform:scale(1.05)`;
    document.body.append(ghost);
    el.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!active || !ghost) return;
    ghost.style.left = `${e.clientX - offsetX}px`;
    ghost.style.top = `${e.clientY - offsetY}px`;
  };

  const onPointerUp = (e) => {
    if (!active) return;
    active = false;
    ghost?.remove();
    ghost = null;
    for (const target of getTargets() ?? []) {
      const r = target.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        onDrop(target, el);
        return;
      }
    }
  };

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", onPointerUp);
  el.addEventListener("pointercancel", onPointerUp);
  return () => {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", onPointerUp);
    el.removeEventListener("pointercancel", onPointerUp);
    ghost?.remove();
  };
}

/**
 * Dokun-seç modu yöneticisi: tek seferde bir öğe seçilir; sonra hedefe dokunulur.
 * Seçim görselini oyun verir (örn. outline).
 */
export function createTapSelect({ onSelect, onTargetPick }) {
  let selected = null;
  return {
    /** Öğe dokunuşu — seçar/seçimi kaldırır. */
    pickItem(el) {
      selected = selected === el ? null : el;
      onSelect(el, selected === el);
      return selected;
    },
    /** Hedef dokunuşu — seçili öğe varsa teslim eder. */
    pickTarget(target) {
      if (!selected) return false;
      const el = selected;
      selected = null;
      onSelect(el, false);
      onTargetPick(target, el);
      return true;
    },
    get selected() {
      return selected;
    },
    clear() {
      if (selected) onSelect(selected, false);
      selected = null;
    },
  };
}
