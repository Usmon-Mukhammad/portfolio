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

## Publishing workflow

1. Write with `draft: true` and preview with `npm run dev` → `/blog/`.
2. Remove `draft` (or set it to `false`) when ready, then commit to `main`; the
   GitHub Pages workflow builds and deploys.
3. Import it into Medium from the post URL (Medium → *Import a story*), which
   sets the canonical link back to ameer.uz, then add the Medium URL as
   `medium:` here.

The site also publishes `/rss.xml` and `/sitemap.xml`, updated on every build.
