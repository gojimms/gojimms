// ============================
// Hero Scroll Indicator Hide
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const indicator = document.querySelector(".hero-scroll-indicator");
  if (!indicator) return;

  const hideOnScroll = () => {
    if (window.scrollY > 80) {
      indicator.style.opacity = "0";
    } else {
      indicator.style.opacity = "0.8";
    }
  };

  window.addEventListener("scroll", hideOnScroll, { passive: true });
  hideOnScroll();
});
