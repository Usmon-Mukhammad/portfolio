import { useCallback, useEffect, useState } from 'react'

const KEY = 'theme'

function resolve() {
  // Blog pages are prerendered in Node, where there is no window.
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Light is the default, so only dark mode carries a class. The matching
 * pre-paint script in index.html applies it before first render so there is
 * no flash of the wrong theme.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(resolve)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(KEY, theme)
  }, [theme])

  // Follow the OS until the visitor makes an explicit choice.
  useEffect(() => {
    if (localStorage.getItem(KEY)) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = e => setTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, toggle }
}
