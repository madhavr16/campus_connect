# Campus Connect

Monorepo with a minimal backend (Express + Mongoose + Socket.io) and a frontend (Vite + React).

Run backend:

1. cd backend
2. npm install
3. copy `.env.example` to `.env` and adjust `MONGO_URI`
4. npm run dev

Run frontend:

1. cd frontend
2. npm install
3. npm run dev

Notes & next steps:
- Add real auth (JWT) and User model
- Integrate Cloudinary for image uploads
- Replace prompt-based userId with real auth
- Add mapping library (Mapbox/Leaflet) in frontend for route visualization
- Add tests and CI

Real-time features
- The backend exposes a Socket.io server (attached to the Express server). The frontend can connect to it using `socket.io-client`.
- Trip rooms: join a trip room with `socket.emit('joinTripRoom', tripId)` and the server will broadcast events to that room.
- Events emitted: `riderJoined`, `riderLeft`, and `tripChatMessage` for simple in-trip chat relay.

Development tips
- Ensure `MONGO_URI` in `.env` is valid and MongoDB is running locally or remotely.
- Frontend expects backend at `http://localhost:5000` by default; set `VITE_API_BASE` or `VITE_API_SOCKET` in the frontend env if needed.

Authentication
- This project now includes simple JWT authentication endpoints at `/api/auth/register` and `/api/auth/login`.
- After registering, the API returns a `token` and `user` object. Store the token (frontend stores in localStorage by default).
- To create an admin user for testing, register a user and then manually update its `role` to `ADMIN` in MongoDB, or use the included migration/seed script.

Migration / switching from email -> registrationNumber
- If you are upgrading from an older database that used `email`, there's a migration script to populate `registrationNumber` from `email`, drop the old `email` index, and create a unique index on `registrationNumber`.

Run it from the repo root (ensure `MONGO_URI` is set in `.env`):

```bash
node backend/scripts/migrate_registration.js
```

After migration, you can promote an account to admin using the admin role endpoint or via the Mongo shell. Example Mongo shell command (replace the selector if you used migration results):

```js
use campus_connect
db.users.updateOne({ registrationNumber: '01234' }, { $set: { role: 'ADMIN' } })
```


