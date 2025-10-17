require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const postsRouter = require('./routes/posts');
const tripsRouter = require('./routes/trips');
const complaintsRouter = require('./routes/complaints');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// attach io to app for use in routes
app.set('io', io);

app.use('/api/posts', postsRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campus_connect', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('MongoDB connected');
        server.listen(PORT, () => console.log('Server listening on', PORT));
    })
    .catch(err => {
        console.error('Mongo connection error', err);
    });

// basic socket handlers
io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    socket.on('joinTripRoom', (tripId) => {
        socket.join(`trip_${tripId}`);
    });
    socket.on('leaveTripRoom', (tripId) => {
        socket.leave(`trip_${tripId}`);
    });
    // simple relay for trip chat messages
    socket.on('tripChatMessage', async (data) => {
        // data: { tripId, userId, text }
        try {
            if (!data || !data.tripId) return;
            const Trip = require('./models/Trip');
            const trip = await Trip.findById(data.tripId);
            if (trip) {
                const msg = { userId: data.userId || null, text: data.text || '', createdAt: new Date() };
                trip.messages = trip.messages || [];
                trip.messages.push(msg);
                await trip.save();
                io.to(`trip_${data.tripId}`).emit('tripChatMessage', { tripId: data.tripId, userId: data.userId || null, text: data.text || '', createdAt: msg.createdAt });
            }
        } catch (err) {
            console.error('Failed to persist tripChatMessage', err.message || err);
        }
    });
});
