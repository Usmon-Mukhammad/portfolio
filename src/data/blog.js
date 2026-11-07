// Blog posts live in content/blog/*.md — see content/blog/README.md for the
// frontmatter. Metadata for every post is bundled (it is small); the article
// HTML is loaded only for the post being read.

export const SITE_URL = 'https://ameer.uz'

export const series = {
  ai: {
    id: 'ai',
    label: 'AI',
    title: 'Artificial Intelligence',
    blurb:
      'How modern AI systems work — from tokens and embeddings to RAG, agents, evaluation and safety — explained plainly, with code you can run.',
  },
  quantum: {
    id: 'quantum',
    label: 'Quantum',
    title: 'Quantum Computing',
    blurb:
      'Quantum computing from first principles — qubits, gates, error correction, the key algorithms and where the field really stands.',
  },
}

const metas = import.meta.glob(['/content/blog/*.md', '!/content/blog/README.md'], {
  query: '?meta',
  import: 'default',
  eager: true,
})

const bodies = import.meta.glob(['/content/blog/*.md', '!/content/blog/README.md'], {
  query: '?html',
  import: 'default',
})

const byDateAsc = (a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug)

// Drafts show while writing (`npm run dev`). In a build the plugin turns them
// into null, so they never reach the site.
const visible = Object.values(metas).filter(Boolean)

// Part numbers follow publishing order inside each series.
const numbered = Object.keys(series).flatMap(id =>
  visible
    .filter(p => p.series === id)
    .sort(byDateAsc)
    .map((p, i) => ({ ...p, part: i + 1 })),
)

/** Newest first. */
export const posts = numbered.sort((a, b) => byDateAsc(b, a))

export const findPost = slug => posts.find(p => p.slug === slug)

/** Posts of one series in reading order (part 1 first). */
export const postsInSeries = id => posts.filter(p => p.series === id).sort((a, b) => a.part - b.part)

export function seriesNeighbours(post) {
  const list = postsInSeries(post.series)
  const at = list.findIndex(p => p.slug === post.slug)
  return { prev: list[at - 1] || null, next: list[at + 1] || null }
}

export async function loadPostHtml(slug) {
  const load = bodies[`/content/blog/${slug}.md`]
  return load ? load() : null
}

export function formatDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
