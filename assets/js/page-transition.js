// ============================
// Page Transition (fade in/out)
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Fade in saat load
  if (!reduceMotion) {
    document.body.classList.add("is-loading");
    requestAnimationFrame(() => {
      document.body.classList.remove("is-loading");
    });
  }

  // Fade out saat klik link internal
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    // Abaikan link yang tidak perlu transition
    const isExternal = link.origin && link.origin !== window.location.origin;
    const isAnchor = href.startsWith("#");
    const isMailOrTel = href.startsWith("mailto:") || href.startsWith("tel:");
    const newTab = link.target === "_blank" || e.ctrlKey || e.metaKey || e.shiftKey;

    if (reduceMotion || isExternal || isAnchor || isMailOrTel || newTab) return;

    // Hanya untuk navigasi internal (site)
    e.preventDefault();
    document.body.classList.add("is-leaving");

    // Delay kecil biar fade terasa
    setTimeout(() => {
      window.location.href = href;
    }, 240);
  });
});
