const btn = document.getElementById("themeToggle");
if (btn) {
  const icon = btn.querySelector(".theme-icon");

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    const isDark = theme === "dark";
    icon.textContent = isDark ? "☀️" : "🌙";
    btn.title = isDark ? "Light Mode" : "Dark Mode";
    btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");

    localStorage.setItem("theme", theme);
  }

  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));

  btn?.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme;
    applyTheme(current === "dark" ? "light" : "dark");
  });
}
