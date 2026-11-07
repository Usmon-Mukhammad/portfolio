// Vite plugin that turns content/blog/*.md into JS modules at build time.
//
//   import meta from './post.md?meta'  -> { slug, title, date, series, ... }
//   import html from './post.md?html'  -> rendered article HTML
//
// Markdown, syntax highlighting (Shiki) and maths (KaTeX) all run here, in
// Node, so none of those libraries ship to the browser. The post list only
// needs the small `?meta` modules; the article HTML is loaded per post.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Marked } from 'marked'
import markedKatex from 'marked-katex-extension'
import { createHighlighter } from 'shiki'

export const SERIES = ['ai', 'quantum']
const LANGS = ['python', 'bash', 'shell', 'json', 'javascript', 'typescript', 'jsx', 'yaml', 'toml', 'sql', 'text']
const WORDS_PER_MINUTE = 220

let highlighterPromise
const highlighter = () =>
  (highlighterPromise ??= createHighlighter({ themes: ['github-light', 'github-dark'], langs: LANGS }))

/**
 * Minimal frontmatter reader: `key: value` lines, `[a, b]` lists, quoted
 * strings and booleans. Enough for post metadata without pulling in YAML.
 */
export function parseFrontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) throw new Error(`${file}: missing frontmatter (--- block at the top)`)

  const data = {}
  for (const raw of match[1].split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const at = line.indexOf(':')
    if (at === -1) throw new Error(`${file}: bad frontmatter line "${line}"`)
    const key = line.slice(0, at).trim()
    let value = line.slice(at + 1).trim()

    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map(v => unquote(v.trim()))
        .filter(Boolean)
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true'
    } else {
      data[key] = unquote(value)
    }
  }
  return { data, body: source.slice(match[0].length) }
}

const unquote = v => v.replace(/^(['"])(.*)\1$/, '$2')

function validate(data, file) {
  for (const key of ['title', 'description', 'date', 'series']) {
    if (!data[key]) throw new Error(`${file}: frontmatter needs "${key}"`)
  }
  if (!SERIES.includes(data.series)) {
    throw new Error(`${file}: series must be one of ${SERIES.join(', ')} (got "${data.series}")`)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error(`${file}: date must be YYYY-MM-DD (got "${data.date}")`)
  }
}

const slugify = text =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')

function readingMinutes(body) {
  const prose = body.replace(/```[\s\S]*?```/g, ' ').replace(/\$\$[\s\S]*?\$\$/g, ' ')
  const words = prose.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

export async function renderMarkdown(body) {
  const hl = await highlighter()
  const marked = new Marked(markedKatex({ throwOnError: true, nonStandard: true }), {
    gfm: true,
    renderer: {
      code({ text, lang }) {
        const wanted = (lang || 'text').split(/\s/)[0]
        const language = hl.getLoadedLanguages().includes(wanted) ? wanted : 'text'
        return hl.codeToHtml(text, {
          lang: language,
          themes: { light: 'github-light', dark: 'github-dark' },
        })
      },
      // Ids on headings so sections can be linked to directly.
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens)
        return `<h${depth} id="${slugify(inner)}">${inner}</h${depth}>\n`
      },
    },
  })
  return marked.parse(body)
}

export async function loadPost(file) {
  const source = await readFile(file, 'utf8')
  const { data, body } = parseFrontmatter(source, file)
  validate(data, file)
  const slug = path.basename(file, '.md')
  if (SERIES.includes(slug)) throw new Error(`${file}: "${slug}" is reserved for the series page`)
  const meta = {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    updated: data.updated || null,
    series: data.series,
    tags: data.tags || [],
    draft: data.draft === true,
    medium: data.medium || null,
    code: data.code || null,
    minutes: readingMinutes(body),
  }
  return { meta, body }
}

export default function blogMarkdown() {
  let building = false
  return {
    name: 'blog-markdown',
    enforce: 'pre',
    configResolved(config) {
      building = config.command === 'build'
    },
    async load(id) {
      const [file, query] = id.split('?')
      if (!file.endsWith('.md') || (query !== 'meta' && query !== 'html')) return null
      this.addWatchFile(file)
      const { meta, body } = await loadPost(file)
      // Drafts must not reach the built site at all — not even as a JS chunk.
      if (building && meta.draft) return 'export default null'
      const value = query === 'meta' ? meta : await renderMarkdown(body)
      return `export default ${JSON.stringify(value)}`
    },
  }
}
