import { paths } from '../../router'

export default function NotFound() {
  return (
    <section className="py-20 sm:py-28">
      <div className="shell max-w-readable">
        <p className="badge">404</p>
        <h1 className="mt-5 text-section font-semibold text-ink">This page doesn't exist</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          The link may be old or mistyped.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <a href="/" className="btn-solid">
            Home
          </a>
          <a href={paths.blog} className="btn-quiet">
            Blog
          </a>
        </div>
      </div>
    </section>
  )
}
