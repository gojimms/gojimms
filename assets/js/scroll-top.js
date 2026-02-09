(() => {
  const btn = document.getElementById("scrollTop");
  if (!btn) return;

  const THRESHOLD = 300; // px, bebas kamu atur (200-500 enak)

  const toggle = () => {
    if (window.scrollY > THRESHOLD) btn.classList.add("is-visible");
    else btn.classList.remove("is-visible");
  };

  window.addEventListener("scroll", toggle, { passive: true });
  toggle();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
