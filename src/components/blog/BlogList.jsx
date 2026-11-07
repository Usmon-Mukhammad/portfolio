import { ArrowUpRight } from 'lucide-react'
import { posts, postsInSeries, series } from '../../data/blog'
import { paths } from '../../router'
import PostMeta from './PostMeta'

const tabs = [{ id: null, label: 'All posts', href: paths.blog }].concat(
  Object.values(series).map(s => ({ id: s.id, label: s.title, href: paths.series(s.id) })),
)

/**
 * The blog index (every post, newest first) or one series page (reading
 * order, part 1 first) when `seriesId` is given.
 */
export default function BlogList({ seriesId = null }) {
  const current = seriesId ? series[seriesId] : null
  const list = current ? postsInSeries(seriesId) : posts

  return (
    <section className="py-14 sm:py-20">
      <div className="shell">
        <div className="max-w-readable">
          <p className="badge">{current ? `${current.label} series` : 'Blog'}</p>
          <h1 className="mt-5 text-section font-semibold text-ink">
            {current ? current.title : 'Writing on AI and quantum computing'}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            {current
              ? current.blurb
              : 'Two series published side by side: one on how modern AI systems work, one on quantum computing from first principles.'}
          </p>
        </div>

        <nav aria-label="Series" className="mt-8 flex flex-wrap gap-2">
          {tabs.map(t => (
            <a
              key={t.label}
              href={t.href}
              aria-current={t.id === seriesId ? 'page' : undefined}
              className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${
                t.id === seriesId
                  ? 'bg-ink text-page'
                  : 'bg-card text-ink-muted ring-1 ring-inset ring-edge hover:text-ink'
              }`}
            >
              {t.label}
            </a>
          ))}
        </nav>

        {list.length === 0 ? (
          <p className="card mt-10 p-7 text-ink-muted sm:p-9">The first post is on its way.</p>
        ) : (
          <ul className="mt-10 grid gap-3 lg:grid-cols-2">
            {list.map(post => (
              <li key={post.slug}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function PostCard({ post }) {
  return (
    <article className="card-interactive group relative flex h-full flex-col p-7 sm:p-9">
      <div className="flex items-start justify-between gap-4">
        <PostMeta post={post} />
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-pill bg-card-2 ring-1 ring-inset ring-edge transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          <ArrowUpRight size={16} aria-hidden="true" className="text-ink" />
        </span>
      </div>

      <h2 className="mt-5 font-display text-xl font-semibold text-ink sm:text-2xl">
        <a href={paths.post(post.slug)}>
          {/* Stretched so the whole card is one hit target. */}
          <span aria-hidden="true" className="absolute inset-0" />
          {post.title}
        </a>
      </h2>

      <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">{post.description}</p>

      {post.tags.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-2 pt-6">
          {post.tags.map(t => (
            <li key={t} className="chip">
              {t}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
