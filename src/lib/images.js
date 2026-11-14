// Prepares an image picked in the /admin editor for the repository: large
// photos are scaled down and re-encoded as WebP in the browser, so posts stay
// fast and the repository small. GIFs (animation) and SVGs are kept as they are.

const MAX_WIDTH = 1800
const RECOMPRESS_ABOVE = 400 * 1024
const MAX_BYTES = 8 * 1024 * 1024
const RASTER = ['image/jpeg', 'image/png', 'image/webp']
const KEEP = { 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif' }

const safeName = name =>
  name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image'

async function scaled(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_WIDTH / bitmap.width)
  if (scale === 1 && file.size <= RECOMPRESS_ABOVE) {
    bitmap.close()
    return null
  }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.85))
  return blob && blob.size < file.size ? blob : null
}

/**
 * Returns { blob, path } where path is where the file will live on the site,
 * e.g. /blog/media/2026/11/k3f9-attention-map.webp. Throws on unsupported or
 * oversized files.
 */
export async function prepareImage(file) {
  if (!RASTER.includes(file.type) && !KEEP[file.type]) {
    throw new Error(`"${file.name}" is not an image the site can show (use JPG, PNG, WebP, GIF or SVG).`)
  }

  let blob = file
  let ext = KEEP[file.type] || file.type.split('/')[1].replace('jpeg', 'jpg')
  if (RASTER.includes(file.type)) {
    const smaller = await scaled(file)
    if (smaller) {
      blob = smaller
      ext = 'webp'
    }
  }
  if (blob.size > MAX_BYTES) {
    throw new Error(`"${file.name}" is ${(blob.size / 1048576).toFixed(1)} MB after compression; the limit is 8 MB.`)
  }

  const now = new Date()
  const month = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  const id = Math.random().toString(36).slice(2, 6)
  return { blob, path: `/blog/media/${month}/${id}-${safeName(file.name)}.${ext}` }
}

export async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}
