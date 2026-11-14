# Blog posts

Each post is one Markdown file in this folder. The file name becomes the URL:
`how-llms-generate-text.md` → `https://ameer.uz/blog/how-llms-generate-text/`.

## Frontmatter

```yaml
---
title: How LLMs actually generate text, and why they hallucinate
description: One or two sentences. Shown on the card, in search results and link previews.
date: 2026-11-10            # YYYY-MM-DD, publishing date
series: ai                  # ai | quantum
tags: [LLMs, Foundations]   # optional
draft: true                 # optional: visible in `npm run dev`, never published
updated: 2026-12-01         # optional
code: https://github.com/ameer611/...   # optional: "Code for this article" button
medium: https://usmon-muxammad.medium.com/...  # optional: "Also on Medium" button
---
```

`title`, `description`, `date` and `series` are required; the build fails with
a clear message if one is missing. Part numbers ("AI · Part 3") are worked out
from the date order inside each series, so there is nothing to number by hand.
The slugs `ai` and `quantum` are reserved for the series pages.

## Writing

- Standard Markdown plus GitHub tables.
- Code blocks get syntax highlighting: ```` ```python ````, `bash`, `json`,
  `javascript`, `typescript`, `jsx`, `yaml`, `toml`, `sql`.
- Maths uses KaTeX: `$\ket{\psi}$` inline, `$$ ... $$` on its own lines for
  display. It is rendered at build time; a typo in LaTeX fails the build.
- Images go in `public/blog/<slug>/` and are referenced as
  `![Alt text](/blog/<slug>/figure.png)`.

## Writing in the browser

`https://ameer.uz/admin/` is a Medium-style visual editor (Milkdown Crepe):
type `/` for headings, images, video, code, maths, tables and lists; select
text to format it. It saves posts straight to this folder on `main` through
the GitHub API, which redeploys the site. Uploaded images are resized in the
browser and committed with the post to `public/blog/media/<year>/<month>/`.

## Images and video

- An image on its own line becomes a figure; its title is the caption:
  `![Alt text](/blog/media/2026/11/figure.webp "Caption")`.
- A YouTube or Vimeo link on its own line becomes a responsive player
  (YouTube uses the privacy-friendly youtube-nocookie.com domain).
- Host videos on YouTube or Vimeo (unlisted is fine) rather than in the repo. It needs a fine-grained GitHub token limited to this repository with
**Contents: Read and write**; the page explains how to make one. The token is
kept only in that browser. The page is not linked anywhere and is `noindex`.

## Publishing workflow

1. Write with `draft: true` and preview with `npm run dev` → `/blog/`.
2. Remove `draft` (or set it to `false`) when ready, then commit to `main`; the
   GitHub Pages workflow builds and deploys.
3. Import it into Medium from the post URL (Medium → *Import a story*), which
   sets the canonical link back to ameer.uz, then add the Medium URL as
   `medium:` here.

The site also publishes `/rss.xml` and `/sitemap.xml`, updated on every build.
