// ============================
// Scroll Reveal (lightweight)
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll("[data-reveal]");

  // Jika tidak support IntersectionObserver, tampilkan semua
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target); // reveal sekali saja
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  items.forEach((el) => observer.observe(el));
});
