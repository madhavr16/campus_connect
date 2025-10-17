import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { trips } from '../api'
import socket, { connect } from '../socket'

export default function Trips() {
    const navigate = useNavigate();
    const [tripForm, setTripForm] = useState({ totalSeats: 4, totalCostEstimate: 0, originName: '', destinationName: '', date: '', time: '' });
    const [matches, setMatches] = useState([]);
    const [tripsList, setTripsList] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [chatMessages, setChatMessages] = useState([]);
    const chatInputRef = useRef();
    const prevRoomRef = useRef(null);

    useEffect(() => {
        connect();
        function onRiderJoined(data) { if (selectedTrip && data.tripId === selectedTrip._id) setChatMessages(m => [...m, { system: true, text: `A rider joined. Seats left: ${data.seatsAvailable}`, createdAt: new Date() }]) }
        function onRiderLeft(data) { if (selectedTrip && data.tripId === selectedTrip._id) setChatMessages(m => [...m, { system: true, text: `A rider left. Seats left: ${data.seatsAvailable}`, createdAt: new Date() }]) }
        function onChat(msg) { if (selectedTrip && msg && msg.tripId === selectedTrip._id) setChatMessages(m => [...m, { userId: msg.userId, text: msg.text, createdAt: msg.createdAt }]) }

        socket.on('riderJoined', onRiderJoined);
        socket.on('riderLeft', onRiderLeft);
        socket.on('tripChatMessage', onChat);

        return () => {
            socket.off('riderJoined', onRiderJoined);
            socket.off('riderLeft', onRiderLeft);
            socket.off('tripChatMessage', onChat);
        }
    }, [selectedTrip])

    // load trips when page mounts
    useEffect(() => {
        loadTrips();
    }, [])

    async function create(e) {
        e.preventDefault();
        try {
            let departureTime = null;
            if (tripForm.date) {
                const t = tripForm.time || '00:00';
                departureTime = new Date(`${tripForm.date}T${t}:00`).toISOString();
            }
            const created = await trips.create({
                driverId: null,
                originName: tripForm.originName,
                destinationName: tripForm.destinationName,
                departureTime,
                totalSeats: tripForm.totalSeats,
                totalCostEstimate: tripForm.totalCostEstimate
            });
            alert('created: ' + created._id);
            // refresh list
            loadTrips();
            setShowModal(false);
            setTripForm({ totalSeats: 4, totalCostEstimate: 0, originName: '', destinationName: '', date: '', time: '' });
        } catch (e) { console.error(e) }
    }

    async function loadTrips() {
        try {
            const list = await trips.list();
            setTripsList(list);
        } catch (err) { console.error(err) }
    }

    async function doMatch() {
        try {
            const [oLng, oLat] = tripForm.origin.coordinates;
            const [dLng, dLat] = tripForm.destination.coordinates;
            const res = await trips.match({ originLng: oLng, originLat: oLat, destLng: dLng, destLat: dLat, radiusMeters: 5000 });
            setMatches(res);
        } catch (e) { console.error(e) }
    }

    async function joinTrip(tripOrId) {
        // accept either trip object or id
        const trip = typeof tripOrId === 'object' ? tripOrId : (tripsList.find(t => t._id === tripOrId) || matches.find(m => m._id === tripOrId));
        if (!trip) return alert('Trip not found');
        const seatsAvailable = trip.totalSeats - (trip.riders?.length || 0);
        if (seatsAvailable <= 0) return alert('This trip is full');

        const userId = prompt('userId (optional)') || null;
        try {
            const r = await trips.join(trip._id, { userId, seats: 1 });
            alert('joined. costPerRider: ' + r.costPerRider);
            // refresh lists to show updated seat counts
            loadTrips();
            // if matches are shown, refresh them conservatively
            // (re-running match requires coordinates; leave it to user action)
        } catch (err) {
            console.error(err);
            alert('Could not join: ' + (err?.message || err));
        }
    }

    function enterRoom(trip) {
        // leave previous room if any
        try {
            if (prevRoomRef.current && socket.connected) socket.emit('leaveTripRoom', prevRoomRef.current);
        } catch (e) { }

        setSelectedTrip(trip);
        setChatMessages([]);
        prevRoomRef.current = trip._id;

        // ensure socket connected then join the room
        connect();
        if (socket.connected) {
            socket.emit('joinTripRoom', trip._id);
        } else {
            socket.once('connect', () => socket.emit('joinTripRoom', trip._id));
        }

        // load existing messages for this trip
        (async () => {
            try {
                const msgs = await trips.getMessages(trip._id);
                // messages from server may have userId as object if populated
                setChatMessages(msgs.map(m => ({ text: m.text, userId: m.userId && (m.userId.registrationNumber || m.userId._id) || m.userId, createdAt: m.createdAt })));
            } catch (e) { console.error('failed to load messages', e) }
        })();
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
        window.location.reload();
    }

    function sendChat() {
        const text = chatInputRef.current?.value;
        if (!text || !selectedTrip) return;
        const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null } })();
        const userId = user?.id || user?._id || null;
        // post message to server (server will persist and broadcast)
        trips.postMessage(selectedTrip._id, { userId, text }).catch(err => console.error('post message failed', err));
        // local echo while server round-trip completes
        setChatMessages(m => [...m, { text, userId: userId || 'me', createdAt: new Date(), self: true }]);
        if (chatInputRef.current) chatInputRef.current.value = '';
    }

    return (
        <div className="trips-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Trips</h2>
                    <p className="small">Create a trip or search for matching shared rides.</p>
                </div>
                <div></div>
            </div>

            <button className="fab" title="Create Trip" onClick={() => setShowModal(true)}>+</button>

            <h3>Recent Trips</h3>
            {tripsList.length === 0 && (
                <div className="card small">No trips posted yet — be the first to create one.</div>
            )}
            {tripsList.map(t => {
                const seatsAvailable = t.totalSeats - (t.riders?.length || 0);
                return (
                    <div key={t._id} className="card">
                        <div><strong>{t.originName || 'Unknown'}</strong> → <strong>{t.destinationName || 'Unknown'}</strong></div>
                        <div>Departure: {t.departureTime ? new Date(t.departureTime).toLocaleString() : 'TBD'}</div>
                        <div>Seats available: {seatsAvailable}</div>
                        <div>Cost per rider: {t.costPerRider}</div>
                        <div style={{ marginTop: 6 }}>
                            <button className="btn btn-sm btn-room" onClick={() => enterRoom(t)}>Open Room</button>
                            {seatsAvailable > 0 ? (
                                <button className="btn btn-sm btn-join" style={{ marginLeft: 8 }} onClick={() => joinTrip(t)}>Join</button>
                            ) : (
                                <span className="full-badge" style={{ marginLeft: 8 }}>Full</span>
                            )}
                        </div>
                    </div>
                )
            })}

            <h3>Matches</h3>
            {matches.map(t => {
                const seatsAvailable = t.totalSeats - (t.riders?.length || 0);
                return (
                    <div key={t._id} className="card">
                        <div>Seats available: {seatsAvailable}</div>
                        <div>Cost per rider: {t.costPerRider}</div>
                        {seatsAvailable > 0 ? (
                            <button className="btn btn-sm btn-join" onClick={() => joinTrip(t)}>Join</button>
                        ) : (
                            <span className="full-badge">Full</span>
                        )}
                        <button className="btn btn-sm btn-room" style={{ marginLeft: 8 }} onClick={() => enterRoom(t)}>Open Room</button>
                    </div>
                )
            })}

            {selectedTrip && (
                <div className="card">
                    <h4>Trip Room: {selectedTrip._id}</h4>
                    <div className="trip-room">
                        <div className="messages" ref={el => { if (el) el.scrollTop = el.scrollHeight }}>
                            {chatMessages.map((m, i) => (
                                <div key={i} className={"message " + (m.system ? 'system' : (m.self ? 'self' : 'other'))}>
                                    {m.system ? <em>{m.text}</em> : <>
                                        <div className="msg-meta"><strong>{m.self ? 'You' : (m.userId || 'Anon')}</strong> <span className="ts">{m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}</span></div>
                                        <div className="msg-body">{m.text}</div>
                                    </>}
                                </div>
                            ))}
                        </div>
                        <div className="msg-input-row">
                            <input ref={chatInputRef} placeholder="Write a message" />
                            <button className="btn btn-primary" onClick={sendChat}>Send</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Create Trip</h3>
                        <form onSubmit={create}>
                            <label className="small">Origin (place name)</label>
                            <input value={tripForm.originName} onChange={e => setTripForm({ ...tripForm, originName: e.target.value })} />
                            <label className="small">Destination (place name)</label>
                            <input value={tripForm.destinationName} onChange={e => setTripForm({ ...tripForm, destinationName: e.target.value })} />
                            <div className="row">
                                <div className="col">
                                    <label className="small">Date</label>
                                    <input type="date" value={tripForm.date} onChange={e => setTripForm({ ...tripForm, date: e.target.value })} />
                                </div>
                                <div className="col">
                                    <label className="small">Time</label>
                                    <input type="time" value={tripForm.time} onChange={e => setTripForm({ ...tripForm, time: e.target.value })} />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col">
                                    <label className="small">Total seats</label>
                                    <input type="number" value={tripForm.totalSeats} onChange={e => setTripForm({ ...tripForm, totalSeats: Number(e.target.value) })} />
                                </div>
                                <div className="col">
                                    <label className="small">Total cost estimate</label>
                                    <input type="number" value={tripForm.totalCostEstimate} onChange={e => setTripForm({ ...tripForm, totalCostEstimate: Number(e.target.value) })} />
                                </div>
                            </div>
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
