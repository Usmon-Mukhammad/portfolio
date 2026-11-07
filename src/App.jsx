import Nav from './components/Nav'
import Hero from './components/Hero'
import Profile from './components/Profile'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Skills from './components/Skills'
import Education from './components/Education'
import Contact from './components/Contact'
import Footer from './components/Footer'
import BlogList from './components/blog/BlogList'
import Post from './components/blog/Post'
import NotFound from './components/blog/NotFound'

function Home() {
  return (
    <>
      <Hero />
      <Profile />
      <Experience />
      <Skills />
      <Projects />
      <Education />
      <Contact />
    </>
  )
}

function Page({ route, postHtml }) {
  switch (route.name) {
    case 'home':
      return <Home />
    case 'blog':
      return <BlogList />
    case 'series':
      return <BlogList seriesId={route.series} />
    case 'post':
      return <Post slug={route.slug} html={postHtml} />
    default:
      return <NotFound />
  }
}

export default function App({ route, postHtml = null }) {
  return (
    <>
      <a
        href={route.name === 'home' ? '#profile' : '#content'}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-paper"
      >
        Skip to content
      </a>

      <Nav route={route} />

      <main id="content">
        <Page route={route} postHtml={postHtml} />
      </main>

      <Footer />
    </>
  )
}
