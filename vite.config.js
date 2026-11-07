import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import blogMarkdown from './tools/blog-markdown.js'

export default defineConfig({
  plugins: [blogMarkdown(), react()],
  // Absolute: the blog adds nested pages (/blog/<slug>/) served from the
  // ameer.uz root, where relative asset paths would break.
  base: '/',
})
