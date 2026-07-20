import { SGFooter, QuadratoHeader } from '@sensorario/sg-components'
import { useState } from 'react'
import './App.css'
import GuitarFretboard from './GuitarFretboard'

// Cookie condiviso su .simonegentili.com: un utente già autenticato su un
// altro prodotto della famiglia (es. quadrato) risulta loggato anche qui.
const AUTH_URL = 'https://api.simonegentili.com/quadrato/authenticate'
const COOKIE_NAME = 'simonegentili.com-access-token'
const USERNAME_KEY = 'simonegentili.com-username'

function setAuthCookie(token) {
  document.cookie = `${COOKIE_NAME}=${token}; path=/; domain=.simonegentili.com; secure; samesite=strict`
}

function clearAuthCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; domain=.simonegentili.com; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`
}

function App() {
  const [username, setUsername] = useState(() => localStorage.getItem(USERNAME_KEY))

  const handleLogin = async (loginUsername, password) => {
    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginUsername, password }),
    })
    if (!res.ok) {
      throw new Error('Authentication failed')
    }
    const { token } = await res.json()
    localStorage.setItem(USERNAME_KEY, loginUsername)
    setAuthCookie(token)
    setUsername(loginUsername)
  }

  const handleLogout = () => {
    clearAuthCookie()
    localStorage.removeItem(USERNAME_KEY)
    setUsername(null)
  }

  return (
    <>

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
        <QuadratoHeader
          title="guitar.simonegentili.com"
          username={username}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
        <GuitarFretboard />
      </main>
      <SGFooter />
    </>
  )
}

export default App
