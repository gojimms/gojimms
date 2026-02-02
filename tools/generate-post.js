/**
 * Static Blog Generator (posts + index listing)
 * Run: node tools/generate-post.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const templatePath = path.join(ROOT, "templates", "post.template.html");
const dataPath = path.join(ROOT, "data", "posts.json");

const outDirId = path.join(ROOT, "id", "blog");
const outDirEn = path.join(ROOT, "en", "blog");
const blogIndexIdPath = path.join(outDirId, "index.html");
const blogIndexEnPath = path.join(outDirEn, "index.html");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tagsText(tags = []) {
  if (!Array.isArray(tags) || tags.length === 0) return "Blog";
  return tags.join(" • ");
}

function tagsSlugFromTags(tags = []) {
  return (tags || [])
    .map((t) => String(t).toLowerCase().trim())
    .filter(Boolean)
    .join(" ");
}

function renderTOC(toc = []) {
  if (!Array.isArray(toc) || toc.length === 0) {
    return `<p style="margin:0;color:var(--muted);">—</p>`;
  }
  const items = toc
    .map((t) => `<li><a href="#${escapeHtml(t.id)}">${escapeHtml(t.label)}</a></li>`)
    .join("");
  return `<ol class="toc-list">${items}</ol>`;
}

function renderCover(coverImage) {
  if (!coverImage) return "";
  return `
    <div class="post-cover">
      <img src="${escapeHtml(coverImage)}" alt="Cover artikel" loading="lazy" />
    </div>
  `;
}

function ogImage(post) {
  return post.ogImage || "/assets/images/og/default.jpg";
}

function replaceAllTemplate(template, map) {
  let out = template;
  for (const [key, value] of Object.entries(map)) {
    out = out.split(`{{${key}}}`).join(value ?? "");
  }
  return out;
}

function renderBlogListItemId(post) {
  const href = `/id/blog/${escapeHtml(post.slug)}.html`;
  const tagText = escapeHtml(tagsText(post.tags));
  const title = escapeHtml(post.title || post.slug);
  const excerpt = escapeHtml(post.excerpt || post.description || "");
  const dateLabel = escapeHtml(post.dateLabel || post.year || "—");
  const read = escapeHtml(post.readingTime || "—");
  const tagsSlug = escapeHtml(post.tagsSlug || tagsSlugFromTags(post.tags));

  return `
<a class="blog-item" href="${href}" data-tags="${tagsSlug}">
  <div class="blog-left">
    <p class="blog-tag">${tagText}</p>
    <h2 class="blog-title">${title}</h2>
    <p class="blog-excerpt">${excerpt}</p>
  </div>
  <div class="blog-right">
    <span class="blog-date">${dateLabel}</span>
    <span class="blog-read">${read}</span>
    <span class="work-arrow" aria-hidden="true">→</span>
  </div>
</a>`.trim();
}

function renderBlogListItemEn(post) {
  const href = `/en/blog/${escapeHtml(post.slug)}.html`;

  // EN minimal (kalau titleEn/contentEn belum ada)
  const title = escapeHtml((post.titleEn || "").trim() || post.title || post.slug);
  const excerpt = escapeHtml((post.excerptEn || "").trim() || post.excerpt || post.description || "");
  const tagText = escapeHtml(tagsText(post.tags));
  const dateLabel = escapeHtml(post.dateLabel || post.year || "—");
  const read = escapeHtml(post.readingTime || "—");
  const tagsSlug = escapeHtml(post.tagsSlug || tagsSlugFromTags(post.tags));

  return `
<a class="blog-item" href="${href}" data-tags="${tagsSlug}">
  <div class="blog-left">
    <p class="blog-tag">${tagText}</p>
    <h2 class="blog-title">${title}</h2>
    <p class="blog-excerpt">${excerpt}</p>
  </div>
  <div class="blog-right">
    <span class="blog-date">${dateLabel}</span>
    <span class="blog-read">${read}</span>
    <span class="work-arrow" aria-hidden="true">→</span>
  </div>
</a>`.trim();
}

function updateBlogIndex(filePath, posts, renderer, label) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ Skipped ${label}: file not found -> ${filePath}`);
    return;
  }
  const html = fs.readFileSync(filePath, "utf8");
  const start = "<!-- POSTS:START -->";
  const end = "<!-- POSTS:END -->";

  const startIdx = html.indexOf(start);
  const endIdx = html.indexOf(end);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.warn(`⚠ Skipped ${label}: markers not found. Pastikan ada ${start} dan ${end}`);
    return;
  }

  // sort newest first (by datePublished > year fallback)
  const sorted = [...posts].sort((a, b) => {
    const da = a.datePublished ? new Date(a.datePublished).getTime() : 0;
    const db = b.datePublished ? new Date(b.datePublished).getTime() : 0;
    if (db !== da) return db - da;
    const ay = parseInt(a.year || "0", 10);
    const by = parseInt(b.year || "0", 10);
    return by - ay;
  });

  const listHtml = sorted.map(renderer).join("\n");

  const before = html.slice(0, startIdx + start.length);
  const after = html.slice(endIdx);

  const updated = `${before}\n${listHtml}\n${after}`;
  fs.writeFileSync(filePath, updated, "utf8");
  console.log(`✅ Updated: ${label}`);
}

function main() {
  ensureDir(outDirId);
  ensureDir(outDirEn);

  const template = fs.readFileSync(templatePath, "utf8");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  const siteUrl = (data.siteUrl || "").replace(/\/+$/, "");
  const author = data.author || "gojimms";
  const posts = (data.posts || []).filter((p) => p && p.slug);

  // Generate post pages (ID)
  posts.forEach((p) => {
    const slug = p.slug;
    const outFile = path.join(outDirId, `${slug}.html`);

    const canonicalUrl = siteUrl ? `${siteUrl}/id/blog/${slug}.html` : `/id/blog/${slug}.html`;
    const altEnUrl = siteUrl ? `${siteUrl}/en/blog/${slug}.html` : `/en/blog/${slug}.html`;

    const html = replaceAllTemplate(template, {
      SLUG: escapeHtml(slug),
      TITLE: escapeHtml(p.title || slug),
      DESCRIPTION: escapeHtml(p.description || ""),
      YEAR: escapeHtml(p.year || ""),
      READING_TIME: escapeHtml(p.readingTime || "—"),
      AUTHOR: escapeHtml(author),
      TAGS_TEXT: escapeHtml(tagsText(p.tags)),
      TOC_BLOCK: renderTOC(p.toc),
      COVER_BLOCK: renderCover(p.coverImage),
      CONTENT_HTML: p.contentHtml || `<p class="lead">(Tulis konten di sini)</p>`,
      PREV_BLOCK: "", // opsional: isi next/prev kalau mau
      NEXT_BLOCK: "",
      OG_IMAGE: escapeHtml(siteUrl ? `${siteUrl}${ogImage(p)}` : ogImage(p)),
      DATE_PUBLISHED: escapeHtml(p.datePublished || `${p.year || "2026"}-01-01`),
      CANONICAL_URL: escapeHtml(canonicalUrl),
      ALT_EN_URL: escapeHtml(altEnUrl),
    });

    fs.writeFileSync(outFile, html, "utf8");
  });

  // Generate EN post pages (simple fallback)
  posts.forEach((p) => {
    const slug = p.slug;
    const outFileEn = path.join(outDirEn, `${slug}.html`);

    const title = (p.titleEn || "").trim() || p.title || slug;
    const desc = (p.descriptionEn || "").trim() || p.description || "";

    const canonical = siteUrl ? `${siteUrl}/en/blog/${slug}.html` : `/en/blog/${slug}.html`;
    const idUrl = siteUrl ? `${siteUrl}/id/blog/${slug}.html` : `/id/blog/${slug}.html`;

    const htmlEn = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} — gojimms</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />

  <link rel="stylesheet" href="/assets/css/theme.css" />
  <link rel="stylesheet" href="/assets/css/style.css" />
  <link rel="stylesheet" href="/assets/css/animation.css" />
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>

  <header class="site-header">
    <nav class="navbar container">
      <div class="brand"><a href="/en/">gojimms</a></div>
      <ul class="nav-links">
        <li><a href="/en/">Home</a></li>
        <li><a href="/en/about.html">About</a></li>
        <li><a href="/en/portfolio.html">Portfolio</a></li>
        <li><a href="/en/blog/" class="is-active">Blog</a></li>
        <li><a href="/en/contact.html">Contact</a></li>
      </ul>
      <div class="nav-actions">
        <a href="/id/blog/${escapeHtml(slug)}.html" class="lang-switch">ID</a>
        <button id="darkModeToggle" aria-label="Toggle dark mode">🌙</button>
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu" aria-controls="mobileMenu" aria-expanded="false">☰</button>
      </div>
    </nav>
    <div class="mobile-menu" id="mobileMenu" aria-hidden="true">
      <div class="mobile-menu-inner container">
        <div class="mobile-menu-top">
          <p class="mobile-menu-title">Menu</p>
          <button class="menu-close" id="menuClose">×</button>
        </div>
        <ul class="mobile-links">
          <li><a href="/en/">Home</a></li>
          <li><a href="/en/about.html">About</a></li>
          <li><a href="/en/portfolio.html">Portfolio</a></li>
          <li><a href="/en/blog/">Blog</a></li>
          <li><a href="/en/contact.html">Contact</a></li>
        </ul>
      </div>
    </div>
  </header>

  <main id="main-content">
    <section class="section">
      <div class="container post-header">
        <a href="/en/blog/" class="text-link">← Back to Blog</a>
        <p class="post-kicker">${escapeHtml(tagsText(p.tags))}</p>
        <h1 class="post-title">${escapeHtml(title)}</h1>

        <div class="post-meta">
          <span class="pill">${escapeHtml(p.year || "")}</span>
          <span class="pill">${escapeHtml(p.readingTime || "—")}</span>
          <span class="pill">by ${escapeHtml(author)}</span>
        </div>

        ${renderCover(p.coverImage)}
      </div>
    </section>

    <section class="section section-soft">
      <div class="container post-grid">
        <aside class="post-toc">
          <div class="toc-card">
            <p class="toc-title">Table of Contents</p>
            ${renderTOC(p.toc)}
          </div>
        </aside>

        <article class="post-content">
          ${(p.contentHtmlEn && p.contentHtmlEn.trim()) ? p.contentHtmlEn : `<p class="lead">English version is coming soon.</p><p>Read Indonesian version: <a class="text-link" href="${escapeHtml(idUrl)}">${escapeHtml(idUrl)}</a></p>`}
        </article>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p class="footer-left">© <span id="year"></span> gojimms</p>
      <div class="footer-right">
        <a href="#" class="footer-link">LinkedIn</a>
        <a href="#" class="footer-link">GitHub</a>
        <a href="/en/contact.html" class="footer-link">Email</a>
      </div>
    </div>
  </footer>

  <button id="scrollTopBtn" class="scroll-top">↑</button>

  <script>
    document.getElementById("year").textContent = new Date().getFullYear();
  </script>

  <script src="/assets/js/darkmode.js" defer></script>
  <script src="/assets/js/nav.js" defer></script>
  <script src="/assets/js/active-nav.js" defer></script>
  <script src="/assets/js/motion.js" defer></script>
  <script src="/assets/js/scroll-top.js" defer></script>
  <script src="/assets/js/scroll-progress.js" defer></script>
  <script src="/assets/js/page-transition.js" defer></script>
</body>
</html>`;

    fs.writeFileSync(outFileEn, htmlEn, "utf8");
  });

  // Update listing pages
  updateBlogIndex(blogIndexIdPath, posts, renderBlogListItemId, "/id/blog/index.html (listing)");
  updateBlogIndex(blogIndexEnPath, posts, renderBlogListItemEn, "/en/blog/index.html (listing)");

  console.log("\nDone.");
}

main();
