/**
 * Static Blog Generator (Decap CMS -> HTML)
 * - Read Markdown from: content/posts/id/*.md and content/posts/en/*.md
 * - Generate post pages: /id/blog/{slug}.html and /en/blog/{slug}.html
 * - Update listings: /id/blog/index.html and /en/blog/index.html between:
 *     <!-- POSTS:START --> ... <!-- POSTS:END -->
 *
 * Run: node tools/generate-post.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const POSTS_ID_DIR = path.join(ROOT, "content", "posts", "id");
const POSTS_EN_DIR = path.join(ROOT, "content", "posts", "en");

const TEMPLATE_PATH = path.join(ROOT, "templates", "post.template.html");

const OUT_ID_DIR = path.join(ROOT, "id", "blog");
const OUT_EN_DIR = path.join(ROOT, "en", "blog");

const BLOG_INDEX_ID = path.join(OUT_ID_DIR, "index.html");
const BLOG_INDEX_EN = path.join(OUT_EN_DIR, "index.html");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readFileSafe(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Very small frontmatter parser:
 * ---
 * title: "..."
 * description: "..."
 * date: "2026-02-02"
 * tags:
 *   - IT
 *   - Komputer
 * coverImage: "/assets/....jpg"
 * ---
 */
function parseFrontmatter(md) {
  const fm = { data: {}, body: md };
  const start = md.indexOf("---");
  if (start !== 0) return fm;

  const end = md.indexOf("\n---", 3);
  if (end === -1) return fm;

  const raw = md.slice(3, end).trim();
  const body = md.slice(end + "\n---".length).trim();

  const lines = raw.split("\n");
  let currentKey = null;

  for (const line of lines) {
    // list item: "  - xxx"
    const listMatch = line.match(/^\s*-\s+(.*)\s*$/);
    if (listMatch && currentKey) {
      fm.data[currentKey] = fm.data[currentKey] || [];
      fm.data[currentKey].push(cleanYamlValue(listMatch[1]));
      continue;
    }

    // key: value
    const kv = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)\s*$/);
    if (kv) {
      currentKey = kv[1];
      const valueRaw = kv[2];
      if (valueRaw === "" || valueRaw === "[]") {
        fm.data[currentKey] = valueRaw === "[]" ? [] : "";
      } else if (valueRaw === "|") {
        // (not supported multi-line block here)
        fm.data[currentKey] = "";
      } else {
        const v = cleanYamlValue(valueRaw);
        fm.data[currentKey] = v;
      }
    }
  }

  fm.body = body;
  return fm;
}

function cleanYamlValue(v) {
  let s = String(v).trim();
  // strip quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s;
}

/**
 * Tiny markdown -> HTML converter (basic but usable)
 */
function mdToHtml(md) {
  const lines = md.split("\n");
  let html = "";
  let inUl = false;
  let inOl = false;
  let inCode = false;

  const closeLists = () => {
    if (inUl) { html += "</ul>\n"; inUl = false; }
    if (inOl) { html += "</ol>\n"; inOl = false; }
  };

  for (let rawLine of lines) {
    let line = rawLine;

    // code fence
    if (line.trim().startsWith("```")) {
      if (!inCode) {
        closeLists();
        inCode = true;
        html += `<pre><code>`;
      } else {
        inCode = false;
        html += `</code></pre>\n`;
      }
      continue;
    }
    if (inCode) {
      html += escapeHtml(line) + "\n";
      continue;
    }

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeLists();
      const lvl = h[1].length;
      html += `<h${lvl}>${inlineMd(h[2])}</h${lvl}>\n`;
      continue;
    }

    // ordered list "1. item"
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) {
      if (inUl) { html += "</ul>\n"; inUl = false; }
      if (!inOl) { html += "<ol>\n"; inOl = true; }
      html += `<li>${inlineMd(ol[1])}</li>\n`;
      continue;
    }

    // unordered list "- item"
    const ul = line.match(/^\s*-\s+(.*)$/);
    if (ul) {
      if (inOl) { html += "</ol>\n"; inOl = false; }
      if (!inUl) { html += "<ul>\n"; inUl = true; }
      html += `<li>${inlineMd(ul[1])}</li>\n`;
      continue;
    }

    // blank line
    if (line.trim() === "") {
      closeLists();
      html += "\n";
      continue;
    }

    // paragraph
    closeLists();
    html += `<p>${inlineMd(line)}</p>\n`;
  }

  // cleanup
  if (inCode) html += `</code></pre>\n`;
  if (inUl) html += "</ul>\n";
  if (inOl) html += "</ol>\n";

  return html.trim();
}

function inlineMd(text) {
  let s = escapeHtml(text);

  // bold **text**
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // italic *text*
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // inline code `code`
  s = s.replace(/`(.+?)`/g, "<code>$1</code>");
  // link [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2">$1</a>`);

  return s;
}

function slugFromFilename(filename) {
  return filename.replace(/\.md$/i, "").trim();
}

function listMarkdownPosts(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .map((f) => path.join(dir, f));
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean).map(String);
  if (typeof tags === "string" && tags.trim()) {
    // allow "IT, Komputer"
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

function tagsSlugFromTags(tags) {
  // your filter buttons use: it, system, web, docs
  // We'll make a single string for data-tags attribute: "it system"
  return tags
    .map((t) => String(t).toLowerCase().trim())
    .filter(Boolean)
    .join(" ");
}

function replaceBetweenMarkers(html, startMarker, endMarker, newBlock) {
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`Markers not found: ${startMarker} / ${endMarker}`);
  }
  const before = html.slice(0, startIdx + startMarker.length);
  const after = html.slice(endIdx);
  return `${before}\n${newBlock}\n${after}`;
}

function renderBlogListItem(post, lang) {
  const href = `/${lang}/blog/${escapeHtml(post.slug)}.html`;
  const tagText = escapeHtml((post.tags || []).join(" • ") || "Blog");
  const excerpt = escapeHtml(post.excerpt || post.description || "");
  const dateLabel = escapeHtml(post.dateLabel || post.year || "");
  const read = escapeHtml(post.readingTime || "—");
  const dataTags = escapeHtml(post.tagsSlug || "");

  return `
<a class="blog-item" href="${href}" data-tags="${dataTags}">
  <div class="blog-left">
    <p class="blog-tag">${tagText}</p>
    <h2 class="blog-title">${escapeHtml(post.title || post.slug)}</h2>
    <p class="blog-excerpt">${excerpt}</p>
  </div>
  <div class="blog-right">
    <span class="blog-date">${dateLabel}</span>
    <span class="blog-read">${read}</span>
    <span class="work-arrow" aria-hidden="true">→</span>
  </div>
</a>`.trim();
}

function buildPostHtml(template, post, lang) {
  const siteUrl = ""; // optional (not required for local)
  const canonical = `${siteUrl}/${lang}/blog/${post.slug}.html`.replace(/\/{2,}/g, "/");
  const altEn = `${siteUrl}/en/blog/${post.slug}.html`.replace(/\/{2,}/g, "/");

  const coverBlock = post.coverImage
    ? `<div class="post-cover"><img src="${escapeHtml(post.coverImage)}" alt="Cover artikel" loading="lazy" /></div>`
    : "";

  const contentHtml = post.contentHtml || `<p class="lead">(Tulis konten di sini)</p>`;
  const tagsText = escapeHtml((post.tags || []).join(" • ") || "Blog");

  // IMPORTANT: your template uses {{PLACEHOLDER}}
  const map = {
    SLUG: escapeHtml(post.slug),
    TITLE: escapeHtml(post.title || post.slug),
    DESCRIPTION: escapeHtml(post.description || post.excerpt || ""),
    YEAR: escapeHtml(post.year || ""),
    READING_TIME: escapeHtml(post.readingTime || "—"),
    AUTHOR: escapeHtml(post.author || "gojimms"),
    TAGS_TEXT: tagsText,
    CANONICAL_URL: escapeHtml(canonical),
    ALT_EN_URL: escapeHtml(altEn),
    OG_IMAGE: escapeHtml(post.ogImage || post.coverImage || "/assets/images/og/default.jpg"),
    DATE_PUBLISHED: escapeHtml(post.datePublished || ""),
    CONTENT_HTML: contentHtml,
    COVER_BLOCK: coverBlock,
    TOC_BLOCK: "", // keep empty if you don't generate TOC
    PREV_BLOCK: "",
    NEXT_BLOCK: "",
    NEXT_URL: "",
    NEXT_LABEL: "",
  };

  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => (map[key] ?? ""));
}

function postFromMarkdownFile(filePath, lang) {
  const slug = slugFromFilename(path.basename(filePath));
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, body } = parseFrontmatter(raw);

  const title = data.title || slug;
  const description = data.description || data.excerpt || "";
  const dateStr = data.date || data.datePublished || "";
  const year = (dateStr && String(dateStr).slice(0, 4)) || "";
  const tags = normalizeTags(data.tags);
  const coverImage = data.coverImage || data.cover || data.image || "";

  const contentHtml = mdToHtml(body);
  const excerpt = description || stripHtml(contentHtml).slice(0, 140);

  return {
    lang,
    slug,
    title,
    description,
    excerpt,
    datePublished: dateStr,
    year,
    dateLabel: year || "",
    readingTime: data.readingTime || data.readTime || "—",
    tags,
    tagsSlug: tagsSlugFromTags(tags),
    coverImage,
    ogImage: data.ogImage || "",
    author: data.author || "Jimmy Suseno",
    contentHtml,
  };
}

function stripHtml(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function sortNewest(posts) {
  // Prefer datePublished, fallback year
  return [...posts].sort((a, b) => {
    const da = a.datePublished ? Date.parse(a.datePublished) : 0;
    const db = b.datePublished ? Date.parse(b.datePublished) : 0;
    if (db !== da) return db - da;
    const ya = parseInt(a.year || "0", 10);
    const yb = parseInt(b.year || "0", 10);
    return yb - ya;
  });
}

function updateBlogIndex(indexPath, posts, lang) {
  if (!fs.existsSync(indexPath)) {
    console.warn(`⚠️ Skipped: ${lang} blog index not found: ${indexPath}`);
    return;
  }
  const html = fs.readFileSync(indexPath, "utf8");
  const startMarker = "<!-- POSTS:START -->";
  const endMarker = "<!-- POSTS:END -->";

  const items = sortNewest(posts).map((p) => renderBlogListItem(p, lang)).join("\n");

  const updated = replaceBetweenMarkers(html, startMarker, endMarker, items);
  fs.writeFileSync(indexPath, updated, "utf8");
  console.log(`✅ Updated: /${lang}/blog/index.html (listing)`);
}

function main() {
  ensureDir(OUT_ID_DIR);
  ensureDir(OUT_EN_DIR);

  const template = readFileSafe(TEMPLATE_PATH);
  if (!template) {
    throw new Error(`Template not found: ${TEMPLATE_PATH}`);
  }

  // Load posts from markdown
  const idFiles = listMarkdownPosts(POSTS_ID_DIR);
  const enFiles = listMarkdownPosts(POSTS_EN_DIR);

  const idPosts = idFiles.map((f) => postFromMarkdownFile(f, "id"));
  const enPosts = enFiles.map((f) => postFromMarkdownFile(f, "en"));

  // Generate post pages (ID)
  idPosts.forEach((p) => {
    const out = path.join(OUT_ID_DIR, `${p.slug}.html`);
    const html = buildPostHtml(template, p, "id");
    fs.writeFileSync(out, html, "utf8");
    console.log(`✅ Generated: /id/blog/${p.slug}.html`);
  });

  // Generate post pages (EN)
  enPosts.forEach((p) => {
    const out = path.join(OUT_EN_DIR, `${p.slug}.html`);
    const html = buildPostHtml(template, p, "en");
    fs.writeFileSync(out, html, "utf8");
    console.log(`✅ Generated: /en/blog/${p.slug}.html`);
  });

  // Update blog listings
  updateBlogIndex(BLOG_INDEX_ID, idPosts, "id");
  updateBlogIndex(BLOG_INDEX_EN, enPosts, "en");

  console.log("\nDone.\n");
}

try {
  main();
} catch (e) {
  console.error("❌ Blog generator failed:", e.message);
  process.exit(1);
}
