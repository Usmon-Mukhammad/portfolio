import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, FilePlus2, KeyRound, LogOut, RefreshCw, Save, Send } from 'lucide-react'
import {
  actionsUrl,
  checkAccess,
  listPostSlugs,
  loadPostFile,
  newTokenUrl,
  REPO,
  savePostFile,
  tokenStore,
} from '../../lib/github'
import { parseFrontmatter, postProblems, serializePost, SERIES, slugFromTitle } from '../../lib/postFormat'
import { renderPreview } from '../../lib/previewMarkdown'
import { series as seriesInfo, SITE_URL } from '../../data/blog'
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
 * /admin — write and publish blog posts from the browser. Saving commits the
 * Markdown file to the repository through the GitHub API; the existing
 * deploy workflow then rebuilds the site.
 */
export default function Admin() {
  const [token, setToken] = useState('')
  const [account, setAccount] = useState(null)
  const [slugs, setSlugs] = useState([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)

  const [post, setPost] = useState(emptyPost)
  const [sha, setSha] = useState(null) // set when editing a post that exists on GitHub
  const [wasDraft, setWasDraft] = useState(true)
  const [slugTouched, setSlugTouched] = useState(false)
  const [dirty, setDirty] = useState(false)

  const editing = sha !== null
  const preview = useMemo(() => renderPreview(post.body), [post.body])
  const problems = useMemo(
    () => [
      ...postProblems({ ...post, tags: tagList(post.tags) }, post.slug),
      ...(post.body.trim() ? [] : ['the article text is empty']),
      ...(preview.error ? [preview.error] : []),
    ],
    [post, preview.error],
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

  function confirmDiscard() {
    return !dirty || window.confirm('Discard your unsaved changes?')
  }

  function startNew() {
    if (!confirmDiscard()) return
    setPost(emptyPost())
    setSha(null)
    setWasDraft(true)
    setSlugTouched(false)
    setDirty(false)
    setNotice(null)
    setError('')
  }

  async function open(slug) {
    if (!confirmDiscard()) return
    setBusy(`open:${slug}`)
    setError('')
    setNotice(null)
    try {
      const file = await loadPostFile(token, slug)
      const loaded = fromSource(slug, file.source)
      setPost(loaded.post)
      setWasDraft(loaded.draft)
      setSha(file.sha)
      setSlugTouched(true)
      setDirty(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
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
      const verb = editing ? 'Update' : 'Add'
      const result = await savePostFile(token, {
        slug: post.slug,
        source: serializePost(data, post.body),
        sha,
        message: `${verb} ${asDraft ? 'draft' : 'post'}: ${post.title}`,
      })
      setSha(result.sha)
      setWasDraft(asDraft)
      setSlugTouched(true)
      setDirty(false)
      setSlugs(s => (s.includes(post.slug) ? s : [...s, post.slug].sort()))
      setNotice({ asDraft, commitUrl: result.commitUrl, slug: post.slug })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="shell">
        <p className="badge">Admin</p>
        <h1 className="mt-5 text-section font-semibold text-ink">Blog editor</h1>
        <p className="mt-3 max-w-readable text-ink-muted">
          Posts are saved to <code className="text-ink">{REPO.owner}/{REPO.name}</code> on GitHub. Publishing
          rebuilds the site; the post is live in about two minutes.
        </p>

        {!account ? (
          <TokenForm busy={busy === 'connect'} error={error} onConnect={connect} />
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[16rem_1fr]">
            <aside className="card h-fit p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-ink-muted">
                  Signed in as <span className="font-semibold text-ink">{account.login}</span>
                </p>
                <button type="button" onClick={forget} className="text-ink-faint hover:text-ink" title="Forget token">
                  <LogOut size={15} aria-label="Forget token" />
                </button>
              </div>

              <button type="button" onClick={startNew} className="btn-solid mt-4 w-full !py-2.5">
                <FilePlus2 size={15} aria-hidden="true" />
                New post
              </button>

              <div className="mt-5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Posts on GitHub</p>
                <button
                  type="button"
                  onClick={() => listPostSlugs(token).then(setSlugs, e => setError(e.message))}
                  className="text-ink-faint hover:text-ink"
                  title="Refresh list"
                >
                  <RefreshCw size={13} aria-label="Refresh list" />
                </button>
              </div>
              <ul className="mt-2 space-y-1">
                {slugs.map(slug => (
                  <li key={slug}>
                    <button
                      type="button"
                      onClick={() => open(slug)}
                      disabled={!!busy}
                      className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        editing && post.slug === slug
                          ? 'bg-card-2 font-medium text-ink ring-1 ring-inset ring-edge'
                          : 'text-ink-muted hover:bg-card-2 hover:text-ink'
                      }`}
                    >
                      {busy === `open:${slug}` ? 'Opening…' : slug}
                    </button>
                  </li>
                ))}
                {slugs.length === 0 && <li className="px-3 py-2 text-sm text-ink-faint">No posts yet.</li>}
              </ul>
            </aside>

            <div className="min-w-0">
              <Editor post={post} editing={editing} onChange={update} />

              {(error || notice) && <Status error={error} notice={notice} />}

              {problems.length > 0 && (
                <ul className="mt-4 space-y-1 text-sm text-ink-muted">
                  {problems.map(p => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => save(false)}
                  disabled={!!busy || problems.length > 0}
                  className="btn-solid disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={15} aria-hidden="true" />
                  {busy === 'publish' ? 'Publishing…' : editing && !wasDraft ? 'Update post' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => save(true)}
                  disabled={!!busy || problems.length > 0}
                  className="btn-quiet disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Save size={15} aria-hidden="true" />
                  {busy === 'draft' ? 'Saving…' : editing && !wasDraft ? 'Unpublish (save as draft)' : 'Save draft'}
                </button>
                {dirty && <span className="text-sm text-ink-faint">Unsaved changes</span>}
              </div>

              <Preview post={post} preview={preview} />
            </div>
          </div>
        )}
      </div>
    </section>
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

function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <span className="ml-2 text-xs text-ink-faint">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

function Editor({ post, editing, onChange }) {
  const bind = field => ({ value: post[field], onChange: e => onChange(field, e.target.value) })
  return (
    <div className="card p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <input className="field" {...bind('title')} placeholder="How LLMs actually generate text" />
        </Field>
        <Field label="URL" hint={editing ? 'fixed after the first save' : `${SITE_URL}/blog/…/`} className="sm:col-span-2">
          <input className="field font-mono text-sm" {...bind('slug')} disabled={editing} placeholder="how-llms-generate-text" />
        </Field>
        <Field label="Description" hint="shown on cards, Google and link previews" className="sm:col-span-2">
          <textarea className="field" rows={2} {...bind('description')} />
        </Field>
        <Field label="Series">
          <select className="field" {...bind('series')}>
            {SERIES.map(id => (
              <option key={id} value={id}>
                {seriesInfo[id].title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" className="field" {...bind('date')} />
        </Field>
        <Field label="Tags" hint="comma-separated" className="sm:col-span-2">
          <input className="field" {...bind('tags')} placeholder="LLMs, Foundations" />
        </Field>
        <Field label="Code link" hint="optional">
          <input type="url" className="field" {...bind('code')} placeholder="https://github.com/…" />
        </Field>
        <Field label="Medium link" hint="optional">
          <input type="url" className="field" {...bind('medium')} placeholder="https://medium.com/…" />
        </Field>
        <Field label="Article" hint="Markdown · $maths$ · ```python code```" className="sm:col-span-2">
          <textarea
            className="field min-h-[24rem] font-mono text-sm leading-relaxed"
            {...bind('body')}
            placeholder={'## First section\n\nWrite here…'}
          />
        </Field>
      </div>
    </div>
  )
}

function Status({ error, notice }) {
  if (error) return <p className="card mt-4 p-4 text-sm text-ink">⚠ {error}</p>
  const url = `${SITE_URL}/blog/${notice.slug}/`
  return (
    <div className="card mt-4 p-4 text-sm leading-relaxed text-ink-muted">
      <p className="font-medium text-ink">
        {notice.asDraft ? 'Saved as a draft — not visible on the site.' : 'Published. The site is rebuilding.'}
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

function Preview({ post, preview }) {
  return (
    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Preview</p>
      <article className="card mt-2 p-6 sm:p-10">
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight text-ink">
          {post.title || 'Untitled'}
        </h1>
        {post.description && <p className="mt-4 text-lg leading-relaxed text-ink-muted">{post.description}</p>}
        {preview.html ? (
          <div className="prose-post mt-8 border-t border-edge pt-8" dangerouslySetInnerHTML={{ __html: preview.html }} />
        ) : (
          <p className="mt-8 border-t border-edge pt-8 text-sm text-ink">⚠ {preview.error}</p>
        )}
      </article>
    </div>
  )
}
