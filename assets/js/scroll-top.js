// ============================
// Scroll To Top Button
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  const toggleVisibility = () => {
    // muncul setelah scroll 400px
    if (window.scrollY > 400) {
      btn.classList.add("is-visible");
    } else {
      btn.classList.remove("is-visible");
    }
  };

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  toggleVisibility();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
