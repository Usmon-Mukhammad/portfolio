// In-browser Markdown preview for the /admin editor. Uses the same Markdown
// and KaTeX settings as the build, so a maths error shown here would also
// fail the deploy. Code is shown unhighlighted; the site highlights it.
// Videos and figures render exactly as on the site (src/lib/media.js).

import { Marked } from 'marked'
import markedKatex from 'marked-katex-extension'
import { mediaRenderer } from './media'

const marked = new Marked(markedKatex({ throwOnError: true, nonStandard: true }), { renderer: mediaRenderer, gfm: true })

export function renderPreview(body) {
  try {
    return { html: marked.parse(body), error: null }
  } catch (err) {
    const message = err.message.split('\nPlease report this')[0]
    return { html: null, error: message.replace(/^KaTeX parse error: /, 'Maths error: ') }
  }
}
