// ============================
// Blog Filter + Search (no backend)
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("blogSearch");
  const buttons = document.querySelectorAll(".tag-btn");
  const items = document.querySelectorAll(".blog-item");
  const empty = document.getElementById("blogEmpty");

  let activeTag = "all";

  const normalize = (s) => (s || "").toLowerCase().trim();

  const apply = () => {
    const q = normalize(search?.value);
    let visibleCount = 0;

    items.forEach((item) => {
      const tags = normalize(item.getAttribute("data-tags"));
      const text = normalize(item.innerText);

      const matchTag = activeTag === "all" ? true : tags.includes(activeTag);
      const matchText = q ? text.includes(q) : true;

      const show = matchTag && matchText;
      item.style.display = show ? "" : "none";
      if (show) visibleCount += 1;
    });

    if (empty) empty.style.display = visibleCount === 0 ? "" : "none";
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeTag = btn.getAttribute("data-tag") || "all";
      apply();
    });
  });

  search?.addEventListener("input", apply);

  apply();
});
