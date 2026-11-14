// In-browser Markdown preview for the /admin editor. Uses the same Markdown
// and KaTeX settings as the build, so a maths error shown here would also
// fail the deploy. Code is shown unhighlighted; the site highlights it.

import { Marked } from 'marked'
import markedKatex from 'marked-katex-extension'

const marked = new Marked(markedKatex({ throwOnError: true, nonStandard: true }), { gfm: true })

export function renderPreview(body) {
  try {
    return { html: marked.parse(body), error: null }
  } catch (err) {
    const message = err.message.split('\nPlease report this')[0]
    return { html: null, error: message.replace(/^KaTeX parse error: /, 'Maths error: ') }
  }
}
