// ============================
// Mobile Menu Toggle
// ============================
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const mobileMenu = document.getElementById("mobileMenu");

function openMenu() {
  mobileMenu?.classList.add("is-open");
  mobileMenu?.setAttribute("aria-hidden", "false");
  menuToggle?.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  mobileMenu?.classList.remove("is-open");
  mobileMenu?.setAttribute("aria-hidden", "true");
  menuToggle?.setAttribute("aria-expanded", "false");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = mobileMenu?.classList.contains("is-open");
  isOpen ? closeMenu() : openMenu();
});

menuClose?.addEventListener("click", closeMenu);

// Close menu when clicking a link
mobileMenu?.addEventListener("click", (e) => {
  const target = e.target;
  if (target && target.tagName === "A") closeMenu();
});

// Close on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

// ============================
// Active Nav Link Highlight
// ============================
document.addEventListener("app:ready", () => {
  const navLinks = document.querySelectorAll(".nav-links a, .mobile-links a");
  if (!navLinks.length) return;

  // Ambil pathname tanpa trailing slash (kecuali root)
  let path = window.location.pathname;

  // Normalisasi: /id -> /id/ (biar match folder index)
  if (path === "/id") path = "/id/";
  if (path === "/en") path = "/en/";

  // Kalau sedang di dalam blog post: /id/blog/post-1.html => highlight /id/blog/
  const isBlog = path.includes("/blog/");
  const blogRoot = path.startsWith("/en/") ? "/en/blog/" : "/id/blog/";

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    // Normalisasi href untuk perbandingan
    let normalizedHref = href;
    if (normalizedHref === "/id") normalizedHref = "/id/";
    if (normalizedHref === "/en") normalizedHref = "/en/";

    // Logic highlight:
    // 1) Kalau sedang di blog area, aktifkan link blog root
    if (isBlog && normalizedHref === blogRoot) {
      link.classList.add("is-active");
      return;
    }

    // 2) Exact match
    if (normalizedHref === path) {
      link.classList.add("is-active");
      return;
    }

    // 3) Folder index match: contoh /id/ harus match /id/ (sudah handled) — tidak perlu tambahan
  });
});
