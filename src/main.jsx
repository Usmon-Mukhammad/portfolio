import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadPostHtml } from './data/blog'
import { parseRoute } from './router'

const route = parseRoute(window.location.pathname)

// Blog pages arrive prerendered; wait for the article HTML before rendering
// so the page is replaced by identical content instead of a loading state.
const postHtml = route.name === 'post' ? await loadPostHtml(route.slug) : null

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App route={route} postHtml={postHtml} />
  </StrictMode>,
)
