# TalkFlow AI

TalkFlow AI is a React and FastAPI application for AI-assisted chat, interview practice, coding exercises, voice interaction, and student profile tracking.

## Requirements

- Node.js 18 or newer
- Python 3.10 or newer

## Setup

1. Install frontend dependencies:

   ```powershell
   cd frontend
   npm install
   cd ..
   ```

2. Create and activate a Python virtual environment:

   ```powershell
   py -3 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r backend\requirements.txt
   ```

3. Copy `backend/.env.example` to `backend/.env` and add an AI provider key if needed.

4. Start the application from the project root:

   ```powershell
   npm run dev
   ```

The frontend runs at `http://localhost:5173`. Vite starts and proxies the FastAPI backend at `http://127.0.0.1:8000`.

## Commands

- `npm run dev` — start the frontend and backend together
- `npm run dev:frontend` — start only the frontend
- `npm run dev:backend` — start only the backend
- `npm run build` — build the frontend for production
- `npm run test:backend` — run backend tests

SQLite is the default database and requires no additional setup. To use MySQL, configure `DATABASE_URL` in `backend/.env`.
