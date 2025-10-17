import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const client = axios.create({ baseURL: API_BASE });
client.interceptors.request.use(cfg => {
    const token = localStorage.getItem('token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

export const auth = {
    register: (data) => client.post('/auth/register', data).then(r => r.data),
    login: (data) => client.post('/auth/login', data).then(r => r.data),
}

export const posts = {
    list: (type) => client.get('/posts', { params: { type } }).then(r => r.data),
    create: (data) => client.post('/posts', data).then(r => r.data)
}

export const trips = {
    create: (data) => client.post('/trips', data).then(r => r.data),
    list: () => client.get('/trips').then(r => r.data),
    match: (params) => client.get('/trips/match', { params }).then(r => r.data),
    join: (id, body) => client.post(`/trips/${id}/join`, body).then(r => r.data),
    leave: (id, body) => client.post(`/trips/${id}/leave`, body).then(r => r.data)
    ,
    getMessages: (id) => client.get(`/trips/${id}/messages`).then(r => r.data),
    postMessage: (id, body) => client.post(`/trips/${id}/messages`, body).then(r => r.data)
}

export const complaints = {
    list: () => client.get('/complaints').then(r => r.data),
    create: (data) => client.post('/complaints', data).then(r => r.data),
    updateStatus: (id, status) => client.patch(`/complaints/${id}/status`, { status }).then(r => r.data)
}

export default client;
