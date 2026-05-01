import './App.css'
import GuitarFretboard from './GuitarFretboard'

function App() {
  return (
    <main className="app-shell">
      <a
        className="github-ribbon"
        href="https://github.com/sensorario/guitar.simonegentili.com"
        target="_blank"
        rel="noreferrer"
        aria-label="View on GitHub"
      >
        <img
          loading="lazy"
          decoding="async"
          width="149"
          height="149"
          src="https://github.blog/wp-content/uploads/2008/12/forkme_right_white_ffffff.png"
          className="attachment-full size-full"
          alt="Fork me on GitHub"
        />
      </a>
      <header className="app-hero">
        <p className="app-eyebrow">guitar.simonegentili.com</p>
      </header>
      <GuitarFretboard />
    </main>
  )
}

export default App
