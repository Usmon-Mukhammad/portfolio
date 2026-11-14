// The blog post file format, shared by the build (tools/blog-markdown.js) and
// the /admin editor so both read, check and write posts the same way.
// Plain JavaScript only: this runs in Node and in the browser.

export const SERIES = ['ai', 'quantum']

/** Fields in the order they are written to the frontmatter block. */
const FIELDS = ['title', 'description', 'date', 'series', 'tags', 'draft', 'updated', 'code', 'medium']

/**
 * Minimal frontmatter reader: `key: value` lines, `[a, b]` lists, quoted
 * strings and booleans. Enough for post metadata without pulling in YAML.
 */
export function parseFrontmatter(source, file = 'post') {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) throw new Error(`${file}: missing frontmatter (--- block at the top)`)

  const data = {}
  for (const raw of match[1].split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const at = line.indexOf(':')
    if (at === -1) throw new Error(`${file}: bad frontmatter line "${line}"`)
    const key = line.slice(0, at).trim()
    const value = line.slice(at + 1).trim()

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

/** Returns a list of problems; empty when the post is valid. */
export function postProblems(data, slug) {
  const problems = []
  for (const key of ['title', 'description', 'date', 'series']) {
    if (!data[key]) problems.push(`"${key}" is required`)
  }
  if (data.series && !SERIES.includes(data.series)) {
    problems.push(`series must be one of ${SERIES.join(', ')} (got "${data.series}")`)
  }
  for (const key of ['date', 'updated']) {
    if (data[key] && !/^\d{4}-\d{2}-\d{2}$/.test(data[key])) {
      problems.push(`${key} must be YYYY-MM-DD (got "${data[key]}")`)
    }
  }
  if (slug !== undefined) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      problems.push('the URL slug may use only lowercase letters, digits and single dashes')
    }
    if (SERIES.includes(slug)) problems.push(`"${slug}" is reserved for the series page`)
  }
  return problems
}

/** Single-line frontmatter value; the reader keeps everything after the first colon. */
const clean = v => String(v).replace(/[\r\n]+/g, ' ').trim()

export function serializePost(data, body) {
  const lines = ['---']
  for (const key of FIELDS) {
    const value = data[key]
    if (value === undefined || value === null || value === '' || value === false) continue
    if (Array.isArray(value)) {
      const items = value.map(clean).map(t => t.replace(/[,[\]]/g, '')).filter(Boolean)
      if (items.length) lines.push(`${key}: [${items.join(', ')}]`)
    } else {
      lines.push(`${key}: ${value === true ? 'true' : clean(value)}`)
    }
  }
  lines.push('---', '')
  return `${lines.join('\n')}\n${body.replace(/^\n+/, '').replace(/\s*$/, '')}\n`
}

/** "How LLMs Work: Part 1" -> "how-llms-work-part-1" */
export function slugFromTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}
