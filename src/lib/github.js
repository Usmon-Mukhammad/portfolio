// Minimal GitHub REST client for the /admin editor. Posts are files in the
// repository; saving one commits it to `main`, which triggers the Pages
// deploy workflow.

export const REPO = { owner: 'Usmon-Mukhammad', name: 'portfolio', branch: 'main', dir: 'content/blog' }

const API = 'https://api.github.com'
const TOKEN_KEY = 'blog-admin-token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY) || '',
  set: token => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class GitHubError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(token, path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new GitHubError(data?.message || `GitHub returned ${res.status}`, res.status)
  return data
}

const repoPath = `/repos/${REPO.owner}/${REPO.name}`
const filePath = slug => `${REPO.dir}/${slug}.md`

// Contents API bodies are base64 of the file's bytes; posts are UTF-8.
function encode(text) {
  let binary = ''
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decode(base64) {
  const binary = atob(base64.replace(/\s/g, ''))
  return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)))
}

/** Confirms the token works and can see the repository. */
export async function checkAccess(token) {
  const [user, repo] = await Promise.all([
    request(token, '/user'),
    request(token, repoPath).catch(err => {
      if (err.status === 404) {
        throw new GitHubError(`This token cannot see ${REPO.owner}/${REPO.name}. Give it access to that repository.`, 404)
      }
      throw err
    }),
  ])
  return { login: user.login, repo: repo.full_name }
}

/** Slugs of every post file on `main`, drafts included. */
export async function listPostSlugs(token) {
  const items = await request(token, `${repoPath}/contents/${REPO.dir}?ref=${REPO.branch}`)
  return items
    .filter(i => i.type === 'file' && i.name.endsWith('.md') && i.name !== 'README.md')
    .map(i => i.name.replace(/\.md$/, ''))
    .sort()
}

export async function loadPostFile(token, slug) {
  const file = await request(token, `${repoPath}/contents/${filePath(slug)}?ref=${REPO.branch}`)
  return { source: decode(file.content), sha: file.sha }
}

async function currentSha(token, path) {
  try {
    return (await request(token, `${repoPath}/contents/${path}?ref=${REPO.branch}`)).sha
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

const friendly = err => {
  if (err.status === 403 || err.status === 404) {
    return new GitHubError('The token is not allowed to write to the repository. It needs "Contents: Read and write".', err.status)
  }
  return err
}

/**
 * Saves a post and any new images in ONE commit on `main` (Git Data API), so
 * each save triggers one deploy. `sha` is the version of the post that was
 * opened (null for a new post); the save is refused if GitHub has a different
 * version, so nothing written elsewhere is overwritten.
 *
 * media: [{ path: '/blog/media/…', base64 }] — stored under public/.
 */
export async function savePost(token, { slug, source, sha, message, media = [] }) {
  const postPath = filePath(slug)
  try {
    const existing = await currentSha(token, postPath)
    if (!sha && existing) {
      throw new GitHubError(`A post with the URL "${slug}" already exists. Open it from the list or choose another URL.`, 422)
    }
    if (sha && existing !== sha) {
      throw new GitHubError('This post changed on GitHub since you opened it. Reopen it to get the latest version.', 409)
    }

    const files = [
      { path: postPath, base64: encode(source) },
      ...media.map(m => ({ path: `public${m.path}`, base64: m.base64 })),
    ]
    const blobs = []
    for (const f of files) {
      const blob = await request(token, `${repoPath}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: f.base64, encoding: 'base64' }),
      })
      blobs.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha })
    }

    // Retry once if main moved while the files were uploading.
    for (let attempt = 0; ; attempt++) {
      const ref = await request(token, `${repoPath}/git/ref/heads/${REPO.branch}`)
      const head = await request(token, `${repoPath}/git/commits/${ref.object.sha}`)
      const tree = await request(token, `${repoPath}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({ base_tree: head.tree.sha, tree: blobs }),
      })
      const commit = await request(token, `${repoPath}/git/commits`, {
        method: 'POST',
        body: JSON.stringify({ message, tree: tree.sha, parents: [ref.object.sha] }),
      })
      try {
        await request(token, `${repoPath}/git/refs/heads/${REPO.branch}`, {
          method: 'PATCH',
          body: JSON.stringify({ sha: commit.sha, force: false }),
        })
      } catch (err) {
        if (err.status === 422 && attempt === 0) continue
        throw err
      }
      return {
        sha: blobs[0].sha,
        commitUrl: `https://github.com/${REPO.owner}/${REPO.name}/commit/${commit.sha}`,
      }
    }
  } catch (err) {
    // Our own conflict messages pass through; GitHub's 403/404 get a clearer one.
    throw friendly(err)
  }
}

/** Where a committed image can be shown right away, before the site redeploys. */
export const rawUrl = path => `https://raw.githubusercontent.com/${REPO.owner}/${REPO.name}/${REPO.branch}/public${path}`

export const actionsUrl = `https://github.com/${REPO.owner}/${REPO.name}/actions`
export const newTokenUrl = 'https://github.com/settings/personal-access-tokens/new'
