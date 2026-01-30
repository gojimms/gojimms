// ============================
// Scroll Progress Bar
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const bar = document.getElementById("scrollProgressBar");
  if (!bar) return;

  const update = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
});
