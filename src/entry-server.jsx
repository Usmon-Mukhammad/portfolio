/* eslint-disable react/only-export-components -- build-time module, not hot-reloaded */
// Used only by tools/prerender.js at build time: renders one blog route to
// static HTML, plus the details that page's <head> needs.
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import { findPost, loadPostHtml, posts, series, SITE_URL } from './data/blog'
import { parseRoute, paths } from './router'

export { posts, series, SITE_URL }

export function routes() {
  return [
    paths.blog,
    ...Object.keys(series).map(paths.series),
    ...posts.map(p => paths.post(p.slug)),
    '/404.html',
  ]
}

function headFor(route, url) {
  const base = { url: `${SITE_URL}${url}`, type: 'website' }
  if (route.name === 'blog') {
    return {
      ...base,
      title: 'Blog — Muhammad Usmonov',
      description: 'Writing on AI and quantum computing: two series explained plainly, with code you can run.',
    }
  }
  if (route.name === 'series') {
    const s = series[route.series]
    return { ...base, title: `${s.title} series — Muhammad Usmonov`, description: s.blurb }
  }
  if (route.name === 'post') {
    const p = findPost(route.slug)
    return {
      ...base,
      type: 'article',
      title: `${p.title} — Muhammad Usmonov`,
      description: p.description,
      publishedTime: p.date,
      modifiedTime: p.updated,
      tags: p.tags,
    }
  }
  return { ...base, title: 'Page not found — Muhammad Usmonov', description: 'This page does not exist.', noindex: true }
}

export async function render(url) {
  const route = url === '/404.html' ? { name: 'notfound' } : parseRoute(url)
  const postHtml = route.name === 'post' ? await loadPostHtml(route.slug) : null
  const html = renderToString(<App route={route} postHtml={postHtml} />)
  return { html, head: headFor(route, url) }
}
