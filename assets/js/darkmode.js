const toggle = document.getElementById("darkModeToggle");
const root = document.documentElement;

toggle?.addEventListener("click", () => {
  const currentTheme = root.getAttribute("data-theme");
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  root.setAttribute("data-theme", nextTheme);
  localStorage.setItem("theme", nextTheme);
});

// Load saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  root.setAttribute("data-theme", savedTheme);
}
