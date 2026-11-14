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

/** Creates the post (no sha) or updates it (sha of the version being replaced). */
export async function savePostFile(token, { slug, source, sha, message }) {
  try {
    const res = await request(token, `${repoPath}/contents/${filePath(slug)}`, {
      method: 'PUT',
      body: JSON.stringify({ message, content: encode(source), branch: REPO.branch, ...(sha ? { sha } : {}) }),
    })
    return { sha: res.content.sha, commitUrl: res.commit.html_url }
  } catch (err) {
    if (err.status === 422 && !sha) {
      throw new GitHubError(`A post with the URL "${slug}" already exists. Open it from the list or choose another URL.`, 422)
    }
    if (err.status === 409) {
      throw new GitHubError('This post changed on GitHub since you opened it. Reopen it to get the latest version.', 409)
    }
    if (err.status === 403 || err.status === 404) {
      throw new GitHubError('The token is not allowed to write to the repository. It needs "Contents: Read and write".', err.status)
    }
    throw err
  }
}

export const actionsUrl = `https://github.com/${REPO.owner}/${REPO.name}/actions`
export const newTokenUrl = 'https://github.com/settings/personal-access-tokens/new'
