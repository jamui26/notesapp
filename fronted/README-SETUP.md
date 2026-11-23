# NoteNest – Frontend and Backend

## What is included
- `../noteapp/` is the Express + MongoDB backend.
- `frontend/` is the React + Vite frontend.
- The frontend uses the backend for account registration/login and per-user note create, list, update, and delete operations.

## Run it (two terminals in VS Code)

Run the backend and frontend in two terminals, starting both commands from the repository root.

### 1. Start the backend
```bash
cd noteapp
copy .env.example .env
npm install
npm run server
```

Set `MONGODB_URI` in `noteapp/.env` to your local MongoDB or Atlas connection string. Replace `JWT_SECRET` with a long random value. The backend runs on `http://localhost:8080`.

### 2. Start the frontend
Open a second terminal:
```bash
cd fronted\frontend
copy .env.example .env
npm install
npm run dev
```
Open the local URL Vite prints (usually `http://localhost:5173`).

If the backend is hosted elsewhere, set `VITE_API_URL` in `frontend/.env` to its URL and set `FRONTEND_URL` in `noteapp/.env` to the frontend's origin.
