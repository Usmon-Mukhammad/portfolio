// Runs after `vite build` and the SSR build (see the "build" script). Writes a
// static HTML file for every blog route so posts are readable without
// JavaScript, carry their own title/description/canonical for search engines
// and link previews, and load as real pages on GitHub Pages. Also writes
// rss.xml and sitemap.xml.
//
// The home page stays as Vite builds it.

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')

const { render, routes, posts, series, SITE_URL } = await import(
  pathToFileURL(path.join(ssrDir, 'entry-server.js')).href
)

const template = await readFile(path.join(dist, 'index.html'), 'utf8')

const esc = s =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Replace one existing <meta> tag (which may span lines) by attribute and key. */
function setMeta(html, attr, key, value) {
  const re = new RegExp(`<meta\\s+${attr}="${key.replace(':', '\\:')}"[\\s\\S]*?/>`)
  if (!re.test(html)) throw new Error(`index.html has no <meta ${attr}="${key}"> to replace`)
  return html.replace(re, `<meta ${attr}="${key}" content="${esc(value)}" />`)
}

function page(appHtml, head) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(head.title)}</title>`)
    .replace(/<link rel="canonical"[^>]*\/>/, `<link rel="canonical" href="${esc(head.url)}" />`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

  html = setMeta(html, 'name', 'description', head.description)
  html = setMeta(html, 'property', 'og:type', head.type)
  html = setMeta(html, 'property', 'og:url', head.url)
  html = setMeta(html, 'property', 'og:title', head.title)
  html = setMeta(html, 'property', 'og:description', head.description)
  html = setMeta(html, 'name', 'twitter:title', head.title)
  html = setMeta(html, 'name', 'twitter:description', head.description)

  const extra = []
  if (head.type === 'article') {
    extra.push(`<meta property="article:published_time" content="${esc(head.publishedTime)}" />`)
    if (head.modifiedTime) extra.push(`<meta property="article:modified_time" content="${esc(head.modifiedTime)}" />`)
    for (const tag of head.tags) extra.push(`<meta property="article:tag" content="${esc(tag)}" />`)
  }
  if (head.noindex) extra.push('<meta name="robots" content="noindex" />')
  if (extra.length) html = html.replace('</head>', `    ${extra.join('\n    ')}\n  </head>`)
  return html
}

for (const url of routes()) {
  const { html, head } = await render(url)
  const file = url.endsWith('.html') ? path.join(dist, url) : path.join(dist, url, 'index.html')
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, page(html, head))
}

// RSS: newest first. Medium's "Import a story" and feed readers both use it.
const rfc822 = iso => new Date(`${iso}T00:00:00Z`).toUTCString()
const items = posts
  .map(
    p => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}/</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}/</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <category>${esc(series[p.series].title)}</category>
      <description>${esc(p.description)}</description>
    </item>`,
  )
  .join('\n')

await writeFile(
  path.join(dist, 'rss.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Muhammad Usmonov — Blog</title>
    <link>${SITE_URL}/blog/</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Writing on AI and quantum computing.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`,
)

const urls = ['/', ...routes().filter(u => !u.endsWith('.html') && u !== '/admin/')]
const lastmod = new Map(posts.map(p => [`/blog/${p.slug}/`, p.updated || p.date]))
await writeFile(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(u => `  <url><loc>${SITE_URL}${u}</loc>${lastmod.has(u) ? `<lastmod>${lastmod.get(u)}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>
`,
)

await rm(ssrDir, { recursive: true, force: true })
console.log(`prerendered ${routes().length} blog pages, rss.xml and sitemap.xml (${posts.length} posts)`)
