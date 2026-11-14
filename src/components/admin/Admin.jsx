import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Eye, ExternalLink, FilePlus2, KeyRound, LogOut, PenLine, RefreshCw, Save, Send } from 'lucide-react'
import {
  actionsUrl,
  checkAccess,
  listPostSlugs,
  loadPostFile,
  newTokenUrl,
  rawUrl,
  REPO,
  savePost,
  tokenStore,
} from '../../lib/github'
import { parseFrontmatter, postProblems, serializePost, SERIES, slugFromTitle } from '../../lib/postFormat'
import { renderPreview } from '../../lib/previewMarkdown'
import { blobToBase64, prepareImage } from '../../lib/images'
import { series as seriesInfo, SITE_URL } from '../../data/blog'
import RichEditor from './RichEditor'
import 'katex/dist/katex.min.css'

const today = () => new Date().toISOString().slice(0, 10)

const emptyPost = () => ({
  slug: '',
  title: '',
  description: '',
  date: today(),
  series: 'ai',
  tags: '',
  code: '',
  medium: '',
  updated: '',
  body: '',
})

function fromSource(slug, source) {
  const { data, body } = parseFrontmatter(source, `${slug}.md`)
  return {
    post: {
      slug,
      title: data.title || '',
      description: data.description || '',
      date: data.date || today(),
      series: data.series || 'ai',
      tags: (data.tags || []).join(', '),
      code: data.code || '',
      medium: data.medium || '',
      updated: data.updated || '',
      body,
    },
    draft: data.draft === true,
  }
}

const tagList = tags =>
  tags
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)

/**
 * /admin — a Medium-style editor for blog posts. Text, images, videos, code
 * and maths are edited visually; the post is stored as Markdown. Saving
 * commits the post and its new images to the repository in one commit, and
 * the deploy workflow publishes it.
 */
export default function Admin() {
  const [token, setToken] = useState('')
  const [account, setAccount] = useState(null)
  const [slugs, setSlugs] = useState([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)

  const [post, setPost] = useState(emptyPost)
  const [docKey, setDocKey] = useState(0) // bumps when another post is opened
  const [initialBody, setInitialBody] = useState('')
  const [sha, setSha] = useState(null) // version on GitHub when editing an existing post
  const [wasDraft, setWasDraft] = useState(true)
  const [slugTouched, setSlugTouched] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [view, setView] = useState('write')

  // Images chosen in this session: site path -> { blob, url (object URL), saved }.
  const media = useRef(new Map())

  const editing = sha !== null
  const preview = useMemo(() => (view === 'preview' ? renderPreview(post.body) : null), [view, post.body])
  const mathsError = useMemo(() => renderPreview(post.body).error, [post.body])
  const problems = useMemo(
    () => [
      ...postProblems({ ...post, tags: tagList(post.tags) }, post.slug),
      ...(post.body.trim() ? [] : ['the article is empty']),
      ...(mathsError ? [mathsError] : []),
    ],
    [post, mathsError],
  )

  async function connect(value) {
    setBusy('connect')
    setError('')
    try {
      const info = await checkAccess(value)
      tokenStore.set(value)
      setToken(value)
      setAccount(info)
      setSlugs(await listPostSlugs(value))
    } catch (err) {
      setError(err.message)
      setAccount(null)
    } finally {
      setBusy('')
    }
  }

  // Reconnect with a token saved on this device.
  useEffect(() => {
    const saved = tokenStore.get()
    if (saved) connect(saved)
  }, [])

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const onLeave = e => e.preventDefault()
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [dirty])

  function forget() {
    tokenStore.clear()
    setToken('')
    setAccount(null)
    setSlugs([])
  }

  function update(field, value) {
    setDirty(true)
    setNotice(null)
    if (field === 'slug') setSlugTouched(true)
    // The URL follows the title for a new post until it is edited by hand.
    const followTitle = field === 'title' && !editing && !slugTouched
    setPost(p => ({ ...p, [field]: value, ...(followTitle ? { slug: slugFromTitle(value) } : {}) }))
  }

  function load(next, { sha: nextSha = null, draft = true } = {}) {
    setPost(next)
    setInitialBody(next.body)
    setDocKey(k => k + 1)
    setSha(nextSha)
    setWasDraft(draft)
    setSlugTouched(nextSha !== null)
    setDirty(false)
    setNotice(null)
    setError('')
    setView('write')
  }

  const confirmDiscard = () => !dirty || window.confirm('Discard your unsaved changes?')

  function startNew() {
    if (confirmDiscard()) load(emptyPost())
  }

  async function open(slug) {
    if (!confirmDiscard()) return
    setBusy(`open:${slug}`)
    setError('')
    try {
      const file = await loadPostFile(token, slug)
      const loaded = fromSource(slug, file.source)
      load(loaded.post, { sha: file.sha, draft: loaded.draft })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function uploadImage(file) {
    try {
      const { blob, path } = await prepareImage(file)
      media.current.set(path, { blob, url: URL.createObjectURL(blob), saved: false })
      setDirty(true)
      return path
    } catch (err) {
      window.alert(err.message)
      return ''
    }
  }

  // Images in the editor: new ones from memory, saved ones straight from
  // GitHub (they reach the site only after the next deploy).
  function displayUrl(url) {
    const local = media.current.get(url)
    if (local) return local.url
    return url.startsWith('/blog/') ? rawUrl(url) : url
  }

  async function save(asDraft) {
    setBusy(asDraft ? 'draft' : 'publish')
    setError('')
    setNotice(null)
    try {
      const data = {
        title: post.title,
        description: post.description,
        date: post.date,
        series: post.series,
        tags: tagList(post.tags),
        draft: asDraft,
        updated: post.updated,
        code: post.code,
        medium: post.medium,
      }
      // Only images still in the article and not saved before.
      const newMedia = [...media.current.entries()].filter(([path, m]) => !m.saved && post.body.includes(path))
      const encoded = await Promise.all(newMedia.map(async ([path, m]) => ({ path, base64: await blobToBase64(m.blob) })))

      const verb = editing ? 'Update' : 'Add'
      const result = await savePost(token, {
        slug: post.slug,
        source: serializePost(data, post.body),
        sha,
        media: encoded,
        message: `${verb} ${asDraft ? 'draft' : 'post'}: ${post.title}`,
      })
      for (const [, m] of newMedia) m.saved = true
      setSha(result.sha)
      setWasDraft(asDraft)
      setSlugTouched(true)
      setDirty(false)
      setSlugs(s => (s.includes(post.slug) ? s : [...s, post.slug].sort()))
      setNotice({ asDraft, commitUrl: result.commitUrl, slug: post.slug, images: newMedia.length })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  if (!account) {
    return (
      <section className="py-10 sm:py-14">
        <div className="shell">
          <p className="badge">Admin</p>
          <h1 className="mt-5 text-section font-semibold text-ink">Blog editor</h1>
          <TokenForm busy={busy === 'connect'} error={error} onConnect={connect} />
        </div>
      </section>
    )
  }

  const status = editing ? (wasDraft ? 'Draft' : 'Published') : 'New post'

  return (
    <section className="pb-16 pt-6 sm:pt-8">
      <div className="shell">
        <div className="grid gap-6 xl:grid-cols-[13rem_minmax(0,1fr)_17rem]">
          {/* Posts */}
          <aside className="h-fit xl:sticky xl:top-28">
            <button type="button" onClick={startNew} className="btn-solid w-full !py-2.5">
              <FilePlus2 size={15} aria-hidden="true" />
              New post
            </button>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Your posts</p>
              <button
                type="button"
                onClick={() => listPostSlugs(token).then(setSlugs, e => setError(e.message))}
                className="text-ink-faint hover:text-ink"
                title="Refresh list"
              >
                <RefreshCw size={13} aria-label="Refresh list" />
              </button>
            </div>
            <ul className="mt-2 flex gap-1 overflow-x-auto xl:block xl:space-y-1">
              {slugs.map(slug => (
                <li key={slug} className="flex-none">
                  <button
                    type="button"
                    onClick={() => open(slug)}
                    disabled={!!busy}
                    className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      editing && post.slug === slug
                        ? 'bg-card font-medium text-ink ring-1 ring-inset ring-edge'
                        : 'text-ink-muted hover:bg-card hover:text-ink'
                    }`}
                  >
                    {busy === `open:${slug}` ? 'Opening…' : slug}
                  </button>
                </li>
              ))}
              {slugs.length === 0 && <li className="px-3 py-2 text-sm text-ink-faint">No posts yet.</li>}
            </ul>
            <div className="mt-6 flex items-center justify-between gap-2 border-t border-edge pt-4 text-xs text-ink-faint">
              <span className="truncate">{account.login}</span>
              <button type="button" onClick={forget} className="inline-flex items-center gap-1 hover:text-ink">
                <LogOut size={12} aria-hidden="true" />
                Forget token
              </button>
            </div>
          </aside>

          {/* Writing surface */}
          <div className="min-w-0">
            <div className="sticky top-24 z-30 flex flex-wrap items-center gap-2 rounded-pill border border-edge bg-card/90 px-3 py-2 shadow-soft backdrop-blur-xl">
              <span className="px-2 text-sm text-ink-muted">
                <span className="font-medium text-ink">{status}</span>
                {dirty && ' · unsaved changes'}
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <div className="flex rounded-pill bg-card-2 p-0.5 ring-1 ring-inset ring-edge">
                  {[
                    ['write', 'Write', PenLine],
                    ['preview', 'Preview', Eye],
                  ].map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setView(id)}
                      aria-pressed={view === id}
                      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium ${
                        view === id ? 'bg-card text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      <Icon size={13} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => save(true)}
                  disabled={!!busy || problems.length > 0}
                  className="btn-quiet !px-4 !py-2 !text-[0.8rem] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Save size={14} aria-hidden="true" />
                  {busy === 'draft' ? 'Saving…' : editing && !wasDraft ? 'Unpublish' : 'Save draft'}
                </button>
                <button
                  type="button"
                  onClick={() => save(false)}
                  disabled={!!busy || problems.length > 0}
                  className="btn-solid !px-4 !py-2 !text-[0.8rem] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={14} aria-hidden="true" />
                  {busy === 'publish' ? 'Publishing…' : editing && !wasDraft ? 'Update' : 'Publish'}
                </button>
              </div>
            </div>

            {(error || notice) && <Status error={error} notice={notice} />}
            {problems.length > 0 && (dirty || editing) && (
              <ul className="mt-3 space-y-0.5 px-4 text-sm text-ink-muted">
                {problems.map(p => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            )}

            <article className="card mt-4 px-5 py-8 sm:px-12 sm:py-12">
              <div className="mx-auto max-w-[44rem]">
                <AutoTextarea
                  value={post.title}
                  onChange={v => update('title', v)}
                  placeholder="Title"
                  className="font-display text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-ink"
                />
                <AutoTextarea
                  value={post.description}
                  onChange={v => update('description', v)}
                  placeholder="A short subtitle — shown on cards, Google and link previews"
                  className="mt-3 text-xl leading-relaxed text-ink-muted"
                />
                <div className="mt-6 border-t border-edge pt-6">
                  {/* Kept mounted while previewing so its undo history survives. */}
                  <div hidden={view !== 'write'}>
                    <RichEditor
                      docKey={docKey}
                      initialMarkdown={initialBody}
                      onChange={md => update('body', md)}
                      onUpload={uploadImage}
                      displayUrl={displayUrl}
                    />
                  </div>
                  {view === 'preview' &&
                    (preview.html ? (
                      <div
                        className="prose-post"
                        dangerouslySetInnerHTML={{ __html: withLocalImages(preview.html, displayUrl) }}
                      />
                    ) : (
                      <p className="text-sm text-ink">⚠ {preview.error}</p>
                    ))}
                </div>
              </div>
            </article>
          </div>

          {/* Settings */}
          <aside className="h-fit space-y-4 xl:sticky xl:top-28">
            <div className="card space-y-4 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Post settings</p>
              <Field label="Series">
                <select className="field" value={post.series} onChange={e => update('series', e.target.value)}>
                  {SERIES.map(id => (
                    <option key={id} value={id}>
                      {seriesInfo[id].title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="URL" hint={editing ? 'fixed' : undefined}>
                <input
                  className="field font-mono text-xs"
                  value={post.slug}
                  onChange={e => update('slug', e.target.value)}
                  disabled={editing}
                  placeholder="from the title"
                />
                <p className="mt-1 truncate text-xs text-ink-faint">
                  {SITE_URL.replace('https://', '')}/blog/{post.slug || '…'}/
                </p>
              </Field>
              <Field label="Date">
                <input type="date" className="field" value={post.date} onChange={e => update('date', e.target.value)} />
              </Field>
              <Field label="Tags" hint="comma-separated">
                <input className="field" value={post.tags} onChange={e => update('tags', e.target.value)} placeholder="LLMs, Foundations" />
              </Field>
              <Field label="Code link" hint="optional">
                <input type="url" className="field" value={post.code} onChange={e => update('code', e.target.value)} placeholder="https://github.com/…" />
              </Field>
              <Field label="Medium link" hint="optional">
                <input type="url" className="field" value={post.medium} onChange={e => update('medium', e.target.value)} placeholder="https://medium.com/…" />
              </Field>
            </div>
            <div className="card p-5 text-sm leading-relaxed text-ink-muted">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Tips</p>
              <ul className="mt-2 space-y-1.5">
                <li>
                  Type <kbd className="chip !px-1.5 !py-0">/</kbd> on an empty line for headings, images, video, code,
                  maths, tables, quotes and lists.
                </li>
                <li>Select text for bold, italic, links and inline code.</li>
                <li>Paste a YouTube or Vimeo link on its own line to embed the video.</li>
                <li>
                  Maths: <code>$x^2$</code> inline, or “Math” from the <kbd className="chip !px-1.5 !py-0">/</kbd> menu.
                </li>
                <li>Images are resized and saved with the post when you publish.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

/** New images exist only in this browser until saved; show those in the preview too. */
function withLocalImages(html, displayUrl) {
  return html.replace(/(<img src=")(\/blog\/[^"]+)"/g, (_, start, path) => `${start}${displayUrl(path)}"`)
}

function AutoTextarea({ value, onChange, placeholder, className }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={e => onChange(e.target.value.replace(/\n/g, ' '))}
      className={`block w-full resize-none overflow-hidden border-0 bg-transparent p-0 placeholder:text-ink-faint/70 focus:outline-none focus:ring-0 ${className}`}
    />
  )
}

function TokenForm({ busy, error, onConnect }) {
  const [value, setValue] = useState('')
  return (
    <form
      className="card mt-8 max-w-2xl p-6 sm:p-8"
      onSubmit={e => {
        e.preventDefault()
        if (value.trim()) onConnect(value.trim())
      }}
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <KeyRound size={18} aria-hidden="true" />
        Connect GitHub
      </h2>
      <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-muted">
        <li>
          Open{' '}
          <a href={newTokenUrl} target="_blank" rel="noreferrer" className="font-medium text-ink underline">
            new fine-grained token
          </a>{' '}
          (signed in as {REPO.owner}).
        </li>
        <li>
          Repository access: <b>Only select repositories</b> → <code>{REPO.name}</code>.
        </li>
        <li>
          Permissions → Repository → <b>Contents: Read and write</b>. Nothing else.
        </li>
        <li>Generate, copy and paste it below.</li>
      </ol>
      <p className="mt-3 text-xs text-ink-faint">
        The token is kept only in this browser (localStorage) and sent only to api.github.com. Use “Forget token”
        on shared computers.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          autoComplete="off"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="github_pat_…"
          aria-label="GitHub token"
          className="field flex-1"
        />
        <button type="submit" disabled={busy || !value.trim()} className="btn-solid disabled:opacity-40">
          {busy ? 'Checking…' : 'Connect'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-ink">⚠ {error}</p>}
    </form>
  )
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <span className="ml-2 text-xs text-ink-faint">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

function Status({ error, notice }) {
  if (error) return <p className="card mt-3 p-4 text-sm text-ink">⚠ {error}</p>
  const url = `${SITE_URL}/blog/${notice.slug}/`
  const images = notice.images ? ` with ${notice.images} new image${notice.images > 1 ? 's' : ''}` : ''
  return (
    <div className="card mt-3 p-4 text-sm leading-relaxed text-ink-muted">
      <p className="font-medium text-ink">
        {notice.asDraft ? `Saved as a draft${images} — not visible on the site.` : `Published${images}. The site is rebuilding.`}
      </p>
      <p className="mt-1">
        {!notice.asDraft && (
          <>
            Live in about two minutes at{' '}
            <a href={url} target="_blank" rel="noreferrer" className="font-medium text-ink underline">
              {url}
            </a>
            .{' '}
          </>
        )}
        <a href={notice.commitUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
          Commit <ExternalLink size={12} aria-hidden="true" />
        </a>{' '}
        ·{' '}
        <a href={actionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
          Deploy status <ExternalLink size={12} aria-hidden="true" />
        </a>
      </p>
    </div>
  )
}
