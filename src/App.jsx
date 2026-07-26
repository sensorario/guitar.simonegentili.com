import { SGFooter, QuadratoHeader } from "@sensorario/sg-components";
import { useRef, useState } from "react";
import "./App.css";
import GuitarFretboard from "./GuitarFretboard";
import configRepository from "./repositories/ConfigRepository";

// Cookie condiviso su .simonegentili.com: un utente già autenticato su un
// altro prodotto della famiglia (es. quadrato) risulta loggato anche qui.
const AUTH_URL = "https://api.simonegentili.com/quadrato/authenticate";
const COOKIE_NAME = "simonegentili.com-access-token";
const USERNAME_KEY = "simonegentili.com-username";
// Chiave usata prima che le canzoni fossero legate all'account: da ripulire al logout.
const LEGACY_SONGS_STORAGE_KEY = "guitar-songs";

function setAuthCookie(token) {
    document.cookie = `${COOKIE_NAME}=${token}; path=/; domain=.simonegentili.com; secure; samesite=strict`;
}

function clearAuthCookie() {
    document.cookie = `${COOKIE_NAME}=; path=/; domain=.simonegentili.com; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`;
}

function getAuthToken() {
    const entry = document.cookie
        .split("; ")
        .find((e) => e.startsWith(`${COOKIE_NAME}=`));
    return entry ? entry.slice(COOKIE_NAME.length + 1) : null;
}

function App() {
    const [username, setUsername] = useState(() =>
        localStorage.getItem(USERNAME_KEY)
    );
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const headerRef = useRef(null);

    const handleLogin = async (loginUsername, password) => {
        const res = await fetch(AUTH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: loginUsername, password }),
        });
        if (!res.ok) {
            throw new Error("Authentication failed");
        }
        const { token } = await res.json();
        localStorage.setItem(USERNAME_KEY, loginUsername);
        setAuthCookie(token);
        setUsername(loginUsername);
    };

    const handleLogout = () => {
        clearAuthCookie();
        localStorage.removeItem(USERNAME_KEY);
        localStorage.removeItem(LEGACY_SONGS_STORAGE_KEY);
        configRepository.clear();
        setUsername(null);
    };

    return (
        <>
            <QuadratoHeader
                ref={headerRef}
                title="guitar.simonegentili.com"
                username={username}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onUserAuthenticated={(authenticated) =>
                    setIsAuthenticated(authenticated)
                }
            />

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
                <GuitarFretboard
                    isAuthenticated={isAuthenticated}
                    authToken={getAuthToken()}
                    onRequireLogin={() => headerRef.current?.openLoginModal()}
                />
            </main>
            <SGFooter />
        </>
    );
}

export default App;
