# NoteNest – Backend + New Frontend

## What is included
- `noteapp/` is your existing Express + MongoDB backend (kept as provided).
- `frontend/` is a redesigned, responsive React + Vite frontend.
- Frontend uses the existing backend endpoints only: `POST /user/register`, `POST /user/login`, and `GET /dashboard`.

## Run it (two terminals in VS Code)

### 1. Start the backend
```bash
cd noteapp
npm install
npm run server
```
Make sure MongoDB is configured in `noteapp/db.js` and the database is running/reachable. Backend runs on `http://localhost:8080`.

### 2. Start the frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the local URL Vite prints (usually `http://localhost:5173`).

## Important
This backend currently supports registration, login and a protected dashboard response. It does **not** contain note create/edit/delete APIs, so the frontend intentionally does not pretend to save notes. The dashboard explains that the account is connected. To add real notes later, note CRUD routes and a Note model will need to be added to the backend.
