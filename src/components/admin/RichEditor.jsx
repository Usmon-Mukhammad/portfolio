import { useEffect, useRef } from 'react'
import { Crepe } from '@milkdown/crepe'
import { editorViewCtx, commandsCtx } from '@milkdown/kit/core'
import { clearTextInCurrentBlockCommand } from '@milkdown/kit/preset/commonmark'
import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import { $prose } from '@milkdown/kit/utils'
import '@milkdown/crepe/theme/common/style.css'
import { videoEmbed } from '../../lib/media'

const videoIcon =
  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="15" height="14" rx="2.5"/><path d="m17.5 10 4-2.5v9l-4-2.5"/></svg>'

// Shows the real player under any paragraph that is just a YouTube/Vimeo
// link, so videos look in the editor the way they will on the site.
const videoPreview = $prose(
  () =>
    new Plugin({
      key: new PluginKey('video-preview'),
      props: {
        decorations(state) {
          const decorations = []
          state.doc.descendants((node, pos) => {
            if (node.type.name !== 'paragraph') return true
            const text = node.textContent.trim()
            const video = text && !/\s/.test(text) ? videoEmbed(text) : null
            if (video) {
              decorations.push(
                Decoration.widget(
                  pos + node.nodeSize,
                  () => {
                    const box = document.createElement('div')
                    box.className = 'embed-editor'
                    box.contentEditable = 'false'
                    const frame = document.createElement('iframe')
                    frame.src = video.src
                    frame.title = `${video.provider} video`
                    frame.allow = 'encrypted-media; picture-in-picture'
                    frame.allowFullscreen = true
                    box.append(frame)
                    return box
                  },
                  { side: -1, key: video.src, ignoreSelection: true },
                ),
              )
            }
            return false
          })
          return DecorationSet.create(state.doc, decorations)
        },
      },
    }),
)

/**
 * Medium-style editor (Milkdown Crepe) that reads and writes Markdown.
 * Recreated when `docKey` changes (another post opened); otherwise it keeps
 * its own state and reports every change through `onChange(markdown)`.
 */
export default function RichEditor({ docKey, initialMarkdown, onChange, onUpload, displayUrl }) {
  const root = useRef(null)
  const handlers = useRef({ onChange, onUpload, displayUrl })
  handlers.current = { onChange, onUpload, displayUrl }

  useEffect(() => {
    const crepe = new Crepe({
      root: root.current,
      defaultValue: initialMarkdown,
      features: { [Crepe.Feature.TopBar]: false, [Crepe.Feature.AI]: false },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: 'Tell your story… Type / for images, video, code, maths and more.',
          mode: 'doc',
        },
        [Crepe.Feature.ImageBlock]: {
          onUpload: file => handlers.current.onUpload(file),
          proxyDomURL: url => handlers.current.displayUrl(url),
          blockUploadButton: 'Upload image',
          blockUploadPlaceholderText: 'or paste an image link',
          blockCaptionPlaceholderText: 'Write a caption (optional)',
        },
        [Crepe.Feature.BlockEdit]: {
          buildMenu: builder => {
            builder.addGroup('media', 'Media').addItem('video', {
              label: 'Video (YouTube / Vimeo)',
              icon: videoIcon,
              onRun: ctx => {
                ctx.get(commandsCtx).call(clearTextInCurrentBlockCommand.key)
                const url = window.prompt('Paste a YouTube or Vimeo link')?.trim()
                if (!url) return
                if (!videoEmbed(url)) {
                  window.alert('That is not a YouTube or Vimeo link.')
                  return
                }
                // Inserted as a link so it is saved as <url>, which the site
                // turns into a player.
                const view = ctx.get(editorViewCtx)
                const { schema } = view.state
                const link = schema.marks.link?.create({ href: url })
                view.dispatch(view.state.tr.replaceSelectionWith(schema.text(url, link ? [link] : []), false))
                view.focus()
              },
            })
          },
        },
      },
    })
    crepe.editor.use(videoPreview)
    // Changes reported while the document loads are not edits.
    let loaded = false
    crepe.on(listener => {
      listener.markdownUpdated((_, markdown, previous) => {
        if (loaded && markdown !== previous) handlers.current.onChange(markdown)
      })
    })
    const ready = crepe.create().then(() => {
      loaded = true
    })
    return () => {
      ready.then(() => crepe.destroy())
    }
    // Recreate only when another document is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey])

  return <div ref={root} className="blog-editor" />
}
