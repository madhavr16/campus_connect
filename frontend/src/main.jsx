import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Feed from './pages/Feed'
import Trips from './pages/Trips'
import Complaints from './pages/Complaints'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import './styles.css'
import { useState, useEffect } from 'react'

function App() {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null') } catch (e) { return null }
    });

    // keep user state in sync with localStorage and storage events (other tabs or manual sets)
    useEffect(() => {
        function onStorage(e) {
            if (e.key === 'user') {
                try { setUser(JSON.parse(e.newValue || 'null')) } catch { setUser(null) }
            }
        }
        window.addEventListener('storage', onStorage);
        function onAuthChange() {
            try { setUser(JSON.parse(localStorage.getItem('user') || 'null')) } catch { setUser(null) }
        }
        window.addEventListener('auth-change', onAuthChange);
        // also refresh from localStorage on mount in case it was changed
        try { const s = JSON.parse(localStorage.getItem('user') || 'null'); if (!user && s) setUser(s) } catch (e) { }
        return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('auth-change', onAuthChange); };
    }, [])

    function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); window.location.reload(); }
    function HeaderNav() {
        const location = useLocation();
        const token = localStorage.getItem('token');
        const onLanding = location.pathname === '/' && !user && !token;
        return (
            <header className="site-header">
                <div className="container header-inner">
                    <div className="brand">
                        <Link to="/" className="brand-link">Campus Connect</Link>
                        {user && (
                            <div className="brand-meta">
                                <span className="user-greet">Hello {user.name || user.registrationNumber}</span>
                            </div>
                        )}
                    </div>
                    <nav className="site-nav">
                        {(user || token) ? (
                            <>
                                <Link to="/">Feed</Link>
                                <Link to="/trips">Trips</Link>
                                <Link to="/complaints">Complaints</Link>
                                <button className="btn btn-sm btn-room" onClick={logout}>Logout</button>
                            </>
                        ) : (
                            !onLanding && (
                                <>
                                    <Link to="/login" className="btn btn-link">Login</Link>
                                    <Link to="/register" className="btn btn-primary">Register</Link>
                                </>
                            )
                        )}
                    </nav>
                </div>
            </header>
        )
    }

    return (
        <BrowserRouter>
            <HeaderNav />

            <main className="container main-content">
                <Routes>
                    <Route path='/' element={(user || localStorage.getItem('token')) ? <Feed /> : <Landing />} />
                    <Route path='/trips' element={<Trips />} />
                    <Route path='/complaints' element={<Complaints />} />
                    <Route path='/login' element={<Login onLogin={u => setUser(u)} />} />
                    <Route path='/register' element={<Register onRegister={u => setUser(u)} />} />
                </Routes>
            </main>
        </BrowserRouter>
    )
}

createRoot(document.getElementById('root')).render(<App />)
