import { useEffect, useState } from 'react'
import { Download, Menu, Moon, Sun, X } from 'lucide-react'
import { profile, resumes, sections } from '../data/site'
import useActiveSection from '../hooks/useActiveSection'
import useTheme from '../hooks/useTheme'
import { paths } from '../router'
import logo from '../assets/logo.png'

const ids = sections.map(s => s.id)
const cv = resumes[0]
const BLOG = 'blog'
const NONE = []

export default function Nav({ route }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const home = route.name === 'home'
  const onBlog = ['blog', 'series', 'post'].includes(route.name)
  const spied = useActiveSection(home ? ids : NONE)
  const active = onBlog ? BLOG : home ? spied : ''

  // Section links are in-page anchors on the home page and point back to it
  // from everywhere else.
  const links = [
    ...sections.map(({ id, label }) => ({ id, label, href: home ? `#${id}` : `/#${id}` })),
    { id: BLOG, label: 'Blog', href: paths.blog },
  ]
  const { theme, toggle } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = e => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="no-print sticky top-0 z-50 pt-3 sm:pt-4">
      <div className="shell">
        {/* Floating pill bar rather than a full-width newspaper masthead. */}
        <nav
          aria-label="Main"
          className={`flex h-16 items-center justify-between gap-4 rounded-pill border px-3 pl-5 transition-all duration-300 ${
            scrolled
              ? 'border-edge bg-card/80 shadow-soft backdrop-blur-xl'
              : 'border-transparent bg-transparent'
          }`}
        >
          <a href={home ? '#top' : '/'} className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-3.5 w-auto dark:invert" />
            <span className="whitespace-nowrap font-display text-sm font-bold tracking-tight text-ink">
              {profile.name}
            </span>
          </a>

          <ul className="hidden items-center gap-0.5 lg:flex xl:gap-1">
            {links.map(({ id, label, href }) => (
              <li key={id}>
                <a
                  href={href}
                  aria-current={active === id ? 'true' : undefined}
                  className={`whitespace-nowrap rounded-pill px-2.5 py-2 text-sm font-medium transition-colors xl:px-3.5 ${
                    active === id
                      ? 'bg-card-2 text-ink ring-1 ring-inset ring-edge'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="rounded-pill border border-edge bg-card p-2.5 text-ink-muted transition-colors hover:text-ink"
            >
              {theme === 'dark' ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
            </button>

            {/* Recruiters want the PDF — keep it reachable from anywhere. */}
            <a
              href={cv.href}
              download={cv.file}
              className="btn-solid hidden whitespace-nowrap !px-5 !py-2.5 !text-[0.8rem] sm:inline-flex"
            >
              <Download size={14} aria-hidden="true" />
              Download CV
            </a>

            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="rounded-pill border border-edge bg-card p-2.5 text-ink-muted transition-colors hover:text-ink lg:hidden"
            >
              {open ? <X size={15} aria-hidden="true" /> : <Menu size={15} aria-hidden="true" />}
            </button>
          </div>
        </nav>

        {open && (
          <div id="mobile-nav" className="card mt-2 p-2 lg:hidden">
            <ul className="flex flex-col">
              {links.map(({ id, label, href }) => (
                <li key={id}>
                  <a
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      active === id ? 'bg-card-2 text-ink' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <a href={cv.href} download={cv.file} className="btn-solid mt-2 w-full sm:hidden">
              <Download size={15} aria-hidden="true" />
              Download CV
            </a>
          </div>
        )}
      </div>
    </header>
  )
}
