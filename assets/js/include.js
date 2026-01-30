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
});
