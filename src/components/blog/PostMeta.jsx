import { formatDate, series } from '../../data/blog'

/** "AI · Part 3", date and reading time, shared by cards and the article. */
export default function PostMeta({ post, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-faint ${className}`}>
      <span className="chip">
        {series[post.series].label} · Part {post.part}
      </span>
      {post.draft && <span className="chip !bg-ink !text-page !ring-ink">Draft</span>}
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.minutes} min read</span>
    </div>
  )
}
