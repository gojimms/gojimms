document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll(".nav-links a, .mobile-links a");

  links.forEach((link) => {
    link.classList.remove("is-active", "active");

    const linkPath = new URL(link.href).pathname;

    const currentLang = currentPath.startsWith("/en/") ? "en" : "id";
    const homePath = `/${currentLang}/`;
    const blogPath = `/${currentLang}/blog/`;

    const isHome =
      (currentPath === homePath || currentPath === `${homePath}index.html`) &&
      linkPath === homePath;

    const isBlog =
      currentPath.startsWith(blogPath) &&
      linkPath === blogPath;

    const isExact = currentPath === linkPath;

    if (isHome || isBlog || isExact) {
      link.classList.add("is-active", "active");
    }
  });
});