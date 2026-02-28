<script>
document.addEventListener("DOMContentLoaded", function () {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-links a, .mobile-links a");

  navLinks.forEach(link => {
    const linkPath = new URL(link.href).pathname;

    // Home fix (untuk /id/ dan /id/index.html)
    if (
      (currentPath === "/id/" || currentPath === "/id/index.html") &&
      linkPath === "/id/"
    ) {
      link.classList.add("is-active");
      return;
    }

    // Halaman lain
    if (currentPath.startsWith(linkPath) && linkPath !== "/id/") {
      link.classList.add("is-active");
    }
  });
});
</script>