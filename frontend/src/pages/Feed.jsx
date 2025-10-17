import React, { useEffect, useState } from 'react'
import { posts } from '../api'

export default function Feed() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({ type: 'GENERAL', title: '', body: '' });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => { posts.list().then(setItems).catch(console.error) }, [])

    async function submit(e) {
        e.preventDefault();
        try {
            const created = await posts.create(form);
            setItems([created, ...items]);
            setForm({ type: 'GENERAL', title: '', body: '' });
            setShowModal(false);
        } catch (e) { console.error(e) }
    }

    return (
        <div className="feed-page">
            <div className="feed-header">
                <h2>Campus Feed</h2>
                <p className="small">Announcements, events, lost & found, and carpool requests.</p>
            </div>

            <div className="feed-list">
                {items.map(p => (
                    <article key={p._id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong style={{ display: 'block' }}>{p.title}</strong>
                                <span className="small">{p.type}</span>
                            </div>
                        </div>
                        <p style={{ marginTop: 8 }}>{p.body}</p>
                    </article>
                ))}
            </div>

            {/* Floating action button */}
            <button className="fab" title="Create Post" onClick={() => setShowModal(true)}>+</button>

            {/* Modal post form */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Create Post</h3>
                        <form onSubmit={submit}>
                            <label className="small">Type</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="GENERAL">General</option>
                                <option value="EVENT">Event</option>
                                <option value="LOST_FOUND">Lost & Found</option>
                                <option value="CARPOOL_REQUEST">Carpool</option>
                            </select>

                            <label className="small">Title</label>
                            <input placeholder="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

                            <label className="small">Body</label>
                            <textarea placeholder="body" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-primary" type="submit">Post</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
