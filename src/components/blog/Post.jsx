import { ArrowLeft, ArrowRight, Code2 } from 'lucide-react'
import { findPost, formatDate, seriesNeighbours, series } from '../../data/blog'
import { paths } from '../../router'
import { socialIcons } from '../iconRegistry'
import PostMeta from './PostMeta'
import 'katex/dist/katex.min.css'

export default function Post({ slug, html }) {
  const post = findPost(slug)
  const { prev, next } = seriesNeighbours(post)
  const MediumIcon = socialIcons.medium

  return (
    <article className="py-10 sm:py-16">
      <div className="shell">
        <div className="mx-auto max-w-[44rem]">
          <a
            href={paths.series(post.series)}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            {series[post.series].title} series
          </a>

          <header className="mt-8">
            <PostMeta post={post} />
            <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
              {post.title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">{post.description}</p>
            {post.updated && (
              <p className="mt-3 text-sm text-ink-faint">
                Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
              </p>
            )}
          </header>

          <div className="prose-post mt-10 border-t border-edge pt-10" dangerouslySetInnerHTML={{ __html: html }} />

          {(post.code || post.medium || post.tags.length > 0) && (
            <footer className="mt-12 flex flex-col gap-5 border-t border-edge pt-8">
              {post.tags.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Tags">
                  {post.tags.map(t => (
                    <li key={t} className="chip">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2">
                {post.code && (
                  <a href={post.code} target="_blank" rel="noreferrer" className="btn-quiet">
                    <Code2 size={15} aria-hidden="true" />
                    Code for this article
                  </a>
                )}
                {post.medium && (
                  <a href={post.medium} target="_blank" rel="noreferrer" className="btn-quiet">
                    <MediumIcon size={15} />
                    Also on Medium
                  </a>
                )}
              </div>
            </footer>
          )}

          {(prev || next) && (
            <nav aria-label="More in this series" className="mt-12 grid gap-3 sm:grid-cols-2">
              {prev ? <Neighbour post={prev} dir="prev" /> : <span aria-hidden="true" />}
              {next && <Neighbour post={next} dir="next" />}
            </nav>
          )}
        </div>
      </div>
    </article>
  )
}

function Neighbour({ post, dir }) {
  const Icon = dir === 'prev' ? ArrowLeft : ArrowRight
  return (
    <a
      href={paths.post(post.slug)}
      className={`card-interactive flex flex-col gap-2 p-6 ${dir === 'next' ? 'sm:items-end sm:text-right' : ''}`}
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint">
        {dir === 'prev' && <Icon size={13} aria-hidden="true" />}
        {dir === 'prev' ? 'Previous' : 'Next'} · Part {post.part}
        {dir === 'next' && <Icon size={13} aria-hidden="true" />}
      </span>
      <span className="font-display text-base font-semibold text-ink">{post.title}</span>
    </a>
  )
}
