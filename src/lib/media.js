// Images and video embeds in posts, shared by the build (tools/blog-markdown.js),
// the /admin preview and the /admin editor. Plain JavaScript: runs in Node and
// in the browser.
//
//   A YouTube or Vimeo link alone on its own line  -> responsive video player
//   An image alone on its own line                  -> <figure> with caption
//                                                      (caption = image title)

const esc = s =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** "90", "1m30s", "1h2m3s" -> seconds */
function startSeconds(value) {
  if (!value) return 0
  if (/^\d+$/.test(value)) return Number(value)
  const m = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  return m ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0
}

/** Returns { provider, src } for a YouTube/Vimeo URL, otherwise null. */
export function videoEmbed(raw) {
  let url
  try {
    url = new URL(String(raw).trim())
  } catch {
    return null
  }
  const host = url.hostname.replace(/^(www|m)\./, '')

  let id = null
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0]
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1]
  }
  if (id && /^[\w-]{6,20}$/.test(id)) {
    const start = startSeconds(url.searchParams.get('t') || url.searchParams.get('start'))
    // The no-cookie domain avoids tracking cookies until the reader presses play.
    return { provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ''}` }
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const vimeo = url.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/)?.[1]
    if (vimeo) return { provider: 'Vimeo', src: `https://player.vimeo.com/video/${vimeo}` }
  }
  return null
}

export function embedHtml({ provider, src }) {
  return (
    `<div class="embed"><iframe src="${esc(src)}" title="${provider} video" loading="lazy" ` +
    'allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
    'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>\n'
  )
}

// The visual editor stores an image's size ratio ("1.00") where Markdown
// keeps alt text, and its caption as the image title. Use the caption as the
// alt text in that case.
const altText = (alt, caption) => (/^\d+(\.\d+)?$/.test(alt || '') ? caption || '' : alt || caption || '')

function imgTag(href, alt) {
  return `<img src="${esc(href)}" alt="${esc(alt)}" loading="lazy" decoding="async">`
}

function figureHtml({ href, title, text }) {
  const caption = title ? `<figcaption>${esc(title)}</figcaption>` : ''
  return `<figure>${imgTag(href, altText(text, title))}${caption}</figure>\n`
}

// A paragraph that is only a URL: a bare/auto link, a link whose text is the
// URL, or text the visual editor escaped (e.g. "https\\://youtu.be/…").
function paragraphUrl(tokens) {
  let url = ''
  for (const t of tokens) {
    if (t.type === 'br') continue
    if (t.type === 'link' && t.text === t.href) url += t.href
    else if (t.type === 'text' || t.type === 'escape') url += t.text
    else return null
  }
  url = url.trim()
  return url && !/\s/.test(url) ? url : null
}

/** Renderer overrides for `marked`; returning false falls back to the default. */
export const mediaRenderer = {
  paragraph({ tokens }) {
    const parts = tokens.filter(t => !(t.type === 'text' && !t.text.trim()) && t.type !== 'br')
    if (parts.length === 1 && parts[0].type === 'image') return figureHtml(parts[0])

    const url = paragraphUrl(tokens)
    const video = url ? videoEmbed(url) : null
    return video ? embedHtml(video) : false
  },
  image({ href, title, text }) {
    return imgTag(href, altText(text, title))
  },
}
