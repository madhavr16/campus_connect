import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
    return (
        <div className="landing card" style={{ textAlign: 'center', padding: 32 }}>
            <h1 style={{ marginTop: 0 }}>Welcome to Campus Connect</h1>
            <p className="small" style={{ maxWidth: 720, margin: '8px auto 18px' }}>
                Campus Connect helps students share campus life: post updates on the Feed, find or offer rides with the Trips module, and report campus issues with Complaints. Join your campus community — connect, share, and help each other.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                <Link to="/login" className="btn btn-primary">Login</Link>
                <Link to="/register" className="btn btn-ghost">Register</Link>
            </div>

            <div style={{ marginTop: 20 }}>
                <small className="small">No account? Register to create posts, offer rides, and manage complaints. Logged-in users will see a personalized feed.</small>
            </div>
        </div>
    )
}
