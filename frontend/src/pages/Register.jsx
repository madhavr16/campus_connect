import React, { useState } from 'react'
import { auth } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Register({ onRegister }) {
    const [form, setForm] = useState({ name: '', registrationNumber: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const nav = useNavigate();

    async function submit(e) {
        e.preventDefault();
        setError('');
        try {
            const res = await auth.register(form);
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            window.dispatchEvent(new Event('auth-change'));
            if (onRegister) onRegister(res.user);
            nav('/');
        } catch (err) { setError(err?.response?.data?.error || err.message) }
    }

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <h2>Create an account</h2>
                <form onSubmit={submit}>
                    <div className="form-row">
                        <label className="small">Full name</label>
                        <input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="form-row">
                        <label className="small">Registration Number</label>
                        <input placeholder="e.g. AB12345 or 01234" value={form.registrationNumber} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} />
                    </div>
                    <div className="form-row">
                        <label className="small">Password</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input placeholder="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                            <button type="button" className="btn btn-ghost" onClick={() => setShowPassword(s => !s)}>{showPassword ? 'Hide' : 'Show'}</button>
                        </div>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <div className="auth-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => nav('/login')}>Login</button>
                        <button className="btn btn-primary" type="submit">Register</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
