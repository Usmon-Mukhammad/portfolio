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
import { parseFrontmatter, postProblems } from '../src/lib/postFormat.js'
import { mediaRenderer } from '../src/lib/media.js'
const LANGS = ['python', 'bash', 'shell', 'json', 'javascript', 'typescript', 'jsx', 'yaml', 'toml', 'sql', 'text']
const WORDS_PER_MINUTE = 220

let highlighterPromise
const highlighter = () =>
  (highlighterPromise ??= createHighlighter({ themes: ['github-light', 'github-dark'], langs: LANGS }))

function validate(data, slug, file) {
  const problems = postProblems(data, slug)
  if (problems.length) throw new Error(`${file}: ${problems.join('; ')}`)
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
  const marked = new Marked(markedKatex({ throwOnError: true, nonStandard: true }), { renderer: mediaRenderer }, {
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
  const slug = path.basename(file, '.md')
  validate(data, slug, file)
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
