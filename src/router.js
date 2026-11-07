import { findPost, series } from './data/blog'

/**
 * The site is a set of static pages (built by tools/prerender.js), so routing
 * is just reading the path: links between pages are ordinary <a href>.
 */
export function parseRoute(pathname) {
  const parts = pathname.replace(/index\.html$/, '').split('/').filter(Boolean)

  if (parts.length === 0) return { name: 'home' }
  if (parts[0] !== 'blog') return { name: 'notfound' }
  if (parts.length === 1) return { name: 'blog' }
  if (parts.length === 2 && series[parts[1]]) return { name: 'series', series: parts[1] }
  if (parts.length === 2 && findPost(parts[1])) return { name: 'post', slug: parts[1] }
  return { name: 'notfound' }
}

export const paths = {
  blog: '/blog/',
  series: id => `/blog/${id}/`,
  post: slug => `/blog/${slug}/`,
}
