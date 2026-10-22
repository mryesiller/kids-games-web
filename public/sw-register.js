// sw-register.js — SW kaydı; updateViaCache:'none' ile sw.js HTTP cache'ini BYPASS eder.
// (GitHub Pages sw.js'e 10 dk cache veriyor; varsayılan ayarda bayat sw.js güncellemeyi geciktiriyordu.)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js', { scope: './', updateViaCache: 'none' })
      .then((reg) => {
        // autoUpdate: yeni SW bulunduğunda hemen etkinleştir ve sayfayı tazele
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          sw?.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              sw.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch(() => {
        /* SW desteklenmiyor/kapalı: site yine çalışır */
      });
  });
}
