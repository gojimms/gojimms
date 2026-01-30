// ============================
// App Bootstrap
// Pastikan ini dipanggil SETELAH includes.js
// ============================
function initAll() {
  // trigger ulang event DOMContentLoaded-like untuk script yang butuh elemen
  document.dispatchEvent(new Event("app:ready"));
}

// Jika tidak ada include, langsung ready
if (!document.querySelector("[data-include]")) {
  initAll();
} else {
  // Tunggu sebentar setelah includes injected
  setTimeout(initAll, 50);
}
