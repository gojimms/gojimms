/**
 * Static Blog Generator (posts + index listing)
 * Run: node tools/generate-post.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const templatePath = path.join(ROOT, "templates", "post.template.html");
const dataPath = path.join(ROOT, "data", "posts.json");

const outDir = path.join(ROOT, "id", "blog");
const outDirEn = path.join(ROOT, "en", "blog");
const blogIndexEnPath = path.join(outDirEn, "index.html");
const blogIndexPath = path.join(outDir, "index.html");

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
    <img src="${coverImage}" alt="Cover artikel" loading="lazy" />
  </div>`;
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

function replaceAll(template, map) {
  let out = template;
  for (const [key, value] of Object.entries(map)) {
    out = out.split(`{{${key}}}`).join(value ?? "");
  }
  return out;
}

function renderBlogListItem(post) {
  const href = `/id/blog/${escapeHtml(post.slug)}.html`;
  const tagText = escapeHtml((post.tags || []).join(" • ") || "Blog");
  const title = escapeHtml(post.title || post.slug);
  const excerpt = escapeHtml(post.excerpt || post.description || "");
  const dateLabel = escapeHtml(post.dateLabel || post.year || "");
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

function updateBlogIndex(posts) {
  if (!fs.existsSync(blogIndexPath)) {
    console.warn("⚠️ Skipped index update: id/blog/index.html not found.");
    return;
  }

  const html = fs.readFileSync(blogIndexPath, "utf8");

  const start = "<!-- POSTS:START -->";
  const end = "<!-- POSTS:END -->";

  const startIdx = html.indexOf(start);
  const endIdx = html.indexOf(end);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.warn("⚠️ Skipped index update: markers not found. Add <!-- POSTS:START --> and <!-- POSTS:END -->.");
    return;
  }

  // sort posts newest first (by year/dateLabel fallback)
  const sorted = [...posts].sort((a, b) => {
    const ay = parseInt(a.year || "0", 10);
    const by = parseInt(b.year || "0", 10);
    return by - ay;
  });

  const listHtml = sorted.map(renderBlogListItem).join("\n\n");

  const before = html.slice(0, startIdx + start.length);
  const after = html.slice(endIdx);

  const updated = `${before}\n${listHtml}\n${after}`;
  fs.writeFileSync(blogIndexPath, updated, "utf8");

  console.log("✅ Updated: /id/blog/index.html (posts list)");
}

function main() {
  const template = fs.readFileSync(templatePath, "utf8");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const siteUrl = data.siteUrl || "";       // ✅ NEW
  const author = data.author || "gojimms";
  const posts = (data.posts || []).filter((p) => p.slug);

  ensureDir(outDir);
  ensureDir(outDirEn);

  // Generate post pages
  posts.forEach((p) => {
    const slug = p.slug;
    const outFile = path.join(outDir, `${slug}.html`);

    const html = replaceAll(template, {
      SLUG: escapeHtml(slug),
      TITLE: escapeHtml(p.title || slug),
      DESCRIPTION: escapeHtml(p.description || ""),
      YEAR: escapeHtml(p.year || ""),
      READING_TIME: escapeHtml(p.readingTime || "—"),
      
      CANONICAL_URL: `${siteUrl}/id/blog/${slug}.html`,
      ALT_EN_URL: `${siteUrl}/en/blog/${slug}.html`,
      OG_IMAGE: `${siteUrl}${ogImage(p)}`,
      DATE_PUBLISHED: p.datePublished || `${p.year}-01-01`,
      
      AUTHOR: escapeHtml(author),
      TAGS_TEXT: escapeHtml(tagsText(p.tags)),
      TOC_BLOCK: renderTOC(p.toc),
      COVER_BLOCK: renderCover(p.coverImage),
      CONTENT_HTML: p.contentHtml || "<p class=\"lead\">(Tulis konten di sini)</p>",
      NEXT_URL: escapeHtml(p.nextUrl || "/id/blog/"),
      NEXT_LABEL: escapeHtml(p.nextLabel || "Next →")
    });

    fs.writeFileSync(outFile, html, "utf8");
    console.log(`✅ Generated: /id/blog/${slug}.html`);
  });

  // Update listing
  updateBlogIndex(posts);

  // Generate EN posts
   posts.forEach((p) => {
    const outFileEn = path.join(outDirEn, `${p.slug}.html`);
    const htmlEn = renderEnPostHtml(siteUrl, author, p);
    fs.writeFileSync(outFileEn, htmlEn, "utf8");
    console.log(`✅ Generated: /en/blog/${p.slug}.html`);
});

// Update EN blog listing
updateBlogIndexEn(posts);


  // Generate sitemap
  generateSitemap(siteUrl, posts);

  // Panggil RSS
  generateRSS(siteUrl, data, posts);

  console.log("\nDone.");
}

function generateSitemap(siteUrl, posts) {
  const base = (siteUrl || "").replace(/\/+$/, ""); // hapus trailing slash
  if (!base) {
    console.warn("⚠️ Skipped sitemap: siteUrl is empty. Add siteUrl in data/posts.json");
    return;
  }

  // pages statis utama
  const staticPages = [
    "/",
    "/id/",
    "/id/about.html",
    "/id/portfolio.html",
    "/id/contact.html",
    "/id/blog/",
    "/en/" // optional; kalau belum ada tetap aman
  ];

  // pages blog posts
  const postPages = posts.map((p) => `/id/blog/${p.slug}.html`);

  // gabung + unik
  const urls = Array.from(new Set([...staticPages, ...postPages]));

  // sitemap.xml content
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => {
        const loc = `${base}${u}`;
        return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
      })
      .join("\n") +
    `\n</urlset>\n`;

  const outPath = path.join(ROOT, "sitemap.xml");
  fs.writeFileSync(outPath, xml, "utf8");
  console.log("✅ Generated: /sitemap.xml");
}

function generateRSS(siteUrl, meta, posts) {
  const base = (siteUrl || "").replace(/\/+$/, "");
  if (!base) {
    console.warn("⚠️ Skipped RSS: siteUrl is empty.");
    return;
  }

  const escape = (str = "") =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const items = posts
    .map((p) => {
      const link = `${base}/id/blog/${p.slug}.html`;
      return `
    <item>
      <title>${escape(p.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description><![CDATA[${p.excerpt || p.description || ""}]]></description>
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escape(meta.siteTitle)}</title>
    <link>${base}</link>
    <description>${escape(meta.siteDescription)}</description>
    <language>id</language>
    <generator>gojimms static generator</generator>
    ${items}
  </channel>
</rss>`;

  const outPath = path.join(ROOT, "rss.xml");
  fs.writeFileSync(outPath, rss, "utf8");
  console.log("✅ Generated: /rss.xml");
}

function ogImage(post) {
  return post.ogImage || "/assets/images/og/default.jpg";
}

function hasEnglish(post) {
  return Boolean((post.titleEn && post.titleEn.trim()) || (post.contentHtmlEn && post.contentHtmlEn.trim()));
}

function enFallbackContent(slug) {
  const idUrl = `/id/blog/${slug}.html`;
  return `
<p class="lead">This English post is coming soon.</p>
<p style="color:var(--muted);line-height:1.7;">
  Meanwhile, you can read the Indonesian version here:
  <a class="text-link" href="${idUrl}">${idUrl}</a>
</p>
`;
}

function renderEnPostHtml(siteUrl, author, post) {
  const slug = post.slug;
  const title = post.titleEn?.trim() || post.title || slug;
  const desc = post.descriptionEn?.trim() || post.description || "";
  const excerpt = post.excerptEn?.trim() || post.excerpt || desc;

  const content = (post.contentHtmlEn && post.contentHtmlEn.trim())
    ? post.contentHtmlEn
    : enFallbackContent(slug);

  const canonical = `${siteUrl.replace(/\/+$/, "")}/en/blog/${slug}.html`;
  const og = `${siteUrl.replace(/\/+$/, "")}${post.ogImage || "/assets/images/og/default.jpg"}`;

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${escapeHtml(title)} — gojimms</title>
  <meta name="description" content="${escapeHtml(desc)}" />

  <link rel="stylesheet" href="/assets/css/theme.css" />
  <link rel="stylesheet" href="/assets/css/style.css" />
  <link rel="stylesheet" href="/assets/css/animation.css" />

  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${og}" />
</head>

<body>
  <main id="main-content">
    <section class="section">
      <div class="container post-header">
        <a href="/en/blog/" class="text-link">← Back to Blog (EN)</a>

        <p class="post-kicker">${escapeHtml((post.tags || []).join(" • ") || "Blog")}</p>
        <h1 class="post-title">${escapeHtml(title)}</h1>

        <div class="post-meta">
          <span class="pill">${escapeHtml(post.year || "")}</span>
          <span class="pill">${escapeHtml(post.readingTime || "—")}</span>
          <span class="pill">by ${escapeHtml(author)}</span>
        </div>

        <p style="margin-top:10px;color:var(--muted);">
          Indonesian version:
          <a class="text-link" href="/id/blog/${escapeHtml(slug)}.html">/id/blog/${escapeHtml(slug)}.html</a>
        </p>
      </div>
    </section>

    <section class="section section-soft">
      <div class="container post-grid">
        <article class="post-content" style="grid-column: 1 / -1;">
          ${content}
        </article>
      </div>
    </section>
  </main>

  <script src="/assets/js/darkmode.js" defer></script>
  <script src="/assets/js/nav.js" defer></script>
  <script src="/assets/js/page-transition.js" defer></script>
</body>
</html>`;
}

function updateBlogIndexEn(posts) {
  if (!fs.existsSync(blogIndexEnPath)) {
    console.warn("⚠️ Skipped EN index update: en/blog/index.html not found.");
    return;
  }

  const html = fs.readFileSync(blogIndexEnPath, "utf8");
  const start = "<!-- POSTS:START -->";
  const end = "<!-- POSTS:END -->";

  const startIdx = html.indexOf(start);
  const endIdx = html.indexOf(end);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.warn("⚠️ Skipped EN index update: markers not found.");
    return;
  }

  const listHtml = posts.map((p) => {
    const enUrl = `/en/blog/${escapeHtml(p.slug)}.html`;
    const idUrl = `/id/blog/${escapeHtml(p.slug)}.html`;
    const title = escapeHtml(p.titleEn?.trim() || p.title || p.slug);
    const excerpt = escapeHtml(p.excerptEn?.trim() || p.excerpt || p.description || "");
    const dateLabel = escapeHtml(p.dateLabel || p.year || "");
    const read = escapeHtml(p.readingTime || "—");
    const tagText = escapeHtml((p.tags || []).join(" • ") || "Blog");

    const note = hasEnglish(p)
      ? ""
      : `<p class="blog-excerpt" style="margin-top:8px;">EN coming soon — <span style="color:var(--muted);">read ID</span>: <a class="text-link" href="${idUrl}">${idUrl}</a></p>`;

    return `
<a class="blog-item" href="${enUrl}" data-tags="${escapeHtml((p.tagsSlug || "").toLowerCase())}">
  <div class="blog-left">
    <p class="blog-tag">${tagText}</p>
    <h2 class="blog-title">${title}</h2>
    <p class="blog-excerpt">${excerpt}</p>
    ${note}
  </div>
  <div class="blog-right">
    <span class="blog-date">${dateLabel}</span>
    <span class="blog-read">${read}</span>
    <span class="work-arrow" aria-hidden="true">→</span>
  </div>
</a>`.trim();
  }).join("\n\n");

  const before = html.slice(0, startIdx + start.length);
  const after = html.slice(endIdx);
  const updated = `${before}\n${listHtml}\n${after}`;
  fs.writeFileSync(blogIndexEnPath, updated, "utf8");
  console.log("✅ Updated: /en/blog/index.html (posts list)");
}

main();
