const toggle = document.getElementById("darkModeToggle");
const root = document.documentElement;

function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  // Update icon + tooltip di button (karena isi button adalah emoji langsung)
  if (toggle) {
    if (theme === "dark") {
      toggle.textContent = "☀️";
      toggle.title = "Light Mode";
      toggle.setAttribute("aria-label", "Switch to light mode");
    } else {
      toggle.textContent = "🌙";
      toggle.title = "Dark Mode";
      toggle.setAttribute("aria-label", "Switch to dark mode");
    }
  }
}

toggle?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme") || "light";
  setTheme(current === "dark" ? "light" : "dark");
});

// Load awal: pakai localStorage kalau ada, kalau tidak ikut default HTML (light)
const saved = localStorage.getItem("theme");
setTheme(saved || (root.getAttribute("data-theme") || "light"));
