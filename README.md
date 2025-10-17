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

## Deploy backend to Render

This repo includes a `render.yaml` manifest you can use to deploy the backend service on Render. Steps:

1. Push your repo to GitHub (if not already).
2. In Render, choose "New -> Import from GitHub" and connect to this repository.
3. Render will detect the `render.yaml` manifest; confirm service `campus-connect-backend`.
4. In the Render service settings add environment variables:
	- `MONGO_URI` — your MongoDB Atlas connection string (mongodb+srv://...)
	- `JWT_SECRET` — a secure random secret for JWT signing
	- `NODE_ENV` — set to `production` (default)

5. Deploy. Render will run `npm install` and `npm run start` in the `backend` folder.

6. After the service is live, update your Vercel frontend environment variables:
	- `VITE_API_BASE` = https://<your-backend-host>/api
	- `VITE_API_SOCKET` = https://<your-backend-host>

7. (Optional) Run migration script against the production DB if you're migrating from an old schema:

```bash
MONGO_URI="your_atlas_uri" node backend/scripts/migrate_registration.js
```

Notes:
- Replace `<YOUR_GITHUB_ORG/REPO>` in `render.yaml` with your GitHub repo path if you prefer using the manifest; you can also configure the service manually in the Render UI.
- Render provides automatic deploys on commits to the configured branch.


