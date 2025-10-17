import React, { useEffect, useState } from 'react'
import { complaints } from '../api'

export default function Complaints() {
    const [list, setList] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', locationName: '', anonymous: true });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => { complaints.list().then(setList).catch(console.error) }, [])

    async function submit(e) {
        e.preventDefault();
        try {
            const created = await complaints.create(form);
            setList([created, ...list]);
        } catch (e) { console.error(e) }
    }

    async function setStatus(id) {
        const status = prompt('new status (REPORTED, IN_PROGRESS, RESOLVED)');
        if (!status) return;
        try {
            const updated = await complaints.updateStatus(id, status);
            setList(list.map(l => l._id === id ? updated : l));
        } catch (e) { alert('admin only or error'); console.error(e) }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Complaints</h2>
                <p className="small">File anonymous campus maintenance reports.</p>
            </div>

            <button className="fab" title="Create Complaint" onClick={() => setShowModal(true)}>+</button>

            {list.map(c => (
                <div key={c._id} className="card">
                    <strong>{c.title}</strong>
                    <p>{c.description}</p>
                    <div className="small">Status: {c.status}</div>
                    <div style={{ marginTop: 8 }}>
                        <button className="btn btn-ghost" onClick={() => setStatus(c._id)}>Set Status (admin)</button>
                    </div>
                </div>
            ))}

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Create Complaint</h3>
                        <form onSubmit={submit}>
                            <label className="small">Title</label>
                            <input placeholder="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            <label className="small">Description</label>
                            <textarea placeholder="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            <label className="small">Location (text)</label>
                            <input placeholder="e.g. Library - North Wing" value={form.locationName} onChange={e => setForm({ ...form, locationName: e.target.value })} />
                            <label className="small"><input type="checkbox" checked={form.anonymous} onChange={e => setForm({ ...form, anonymous: e.target.checked })} /> Anonymous</label>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn btn-primary" type="submit">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
