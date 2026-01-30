// ============================
// Hero Parallax (lightweight)
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  // Hormati user yang tidak suka animasi
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const left = hero.querySelector(".hero-left");
  const rightCard = hero.querySelector(".hero-card");

  let ticking = false;

  const update = () => {
    ticking = false;

    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight;

    // progress 0..1 saat hero berada di viewport
    const visible = Math.min(Math.max((vh - rect.top) / (vh + rect.height), 0), 1);

    // gerakan sangat kecil (px)
    const yLeft = visible * 6;     // 0..6px
    const yCard = visible * 10;    // 0..10px

    if (left) left.style.transform = `translateY(${yLeft}px)`;
    if (rightCard) rightCard.style.transform = `translateY(${yCard}px)`;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
});
