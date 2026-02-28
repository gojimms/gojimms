// ============================
// Simple HTML Includes (partials)
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  const includeEls = document.querySelectorAll("[data-include]");
  if (!includeEls.length) return;

  const fetchAndSet = async (el) => {
    const file = el.getAttribute("data-include");
    if (!file) return;

    try {
      const res = await fetch(file, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to load: ${file}`);
      const html = await res.text();
      el.outerHTML = html; // replace placeholder with actual HTML
    } catch (err) {
      console.error(err);
    }
  };

  // Load includes sequentially (lebih aman untuk urutan header/footer)
  for (const el of includeEls) {
    // eslint-disable-next-line no-await-in-loop
    await fetchAndSet(el);
  }

  // ✅ SET ACTIVE NAV AFTER HEADER IS INJECTED
  const setActiveNav = () => {
    const currentPath = window.location.pathname.replace(/\/+$/, "/"); // normalize trailing slash
    const links = document.querySelectorAll(".nav-links a, .mobile-links a");
    if (!links.length) return;

    links.forEach((a) => {
      a.classList.remove("is-active", "active");

      const linkPath = new URL(a.href).pathname.replace(/\/+$/, "/");

      // Home: /id/ (atau /id/index.html)
      const isHome =
        (currentPath === "/id/" || currentPath === "/id/index.html") &&
        linkPath === "/id/";

      // Blog section: /id/blog/...
      const isBlog =
        currentPath.startsWith("/id/blog") && linkPath === "/id/blog/";

      // Other exact match
      const isExact = currentPath === linkPath;

      if (isHome || isBlog || isExact) {
        // pasang dua-duanya biar cocok sama CSS kamu (desktop/mobile)
        a.classList.add("is-active");
        a.classList.add("active");
      }
    });
  };

  setActiveNav();
});