# Slotwise

Slotwise is a booking and customer-management app for independent service businesses. It is being built as a portfolio project with a real API and persistent database.

## Stack

- Frontend: React, TypeScript, Vite
- API: Python, FastAPI, Pydantic
- Database: SQLite with SQLAlchemy

## Current scope

- Manage appointments and their statuses
- Keep customer and service details with each booking
- Add bookings from the dashboard
- View daily workload and key booking metrics

## Run locally

Start the API from `backend/`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
```

Start the web app from `frontend/` in another terminal:

```bash
npm install
npm run dev
```

The API docs are available at `http://127.0.0.1:8000/docs`.

## Project status

Early development. Authentication, public booking links, automated reminders, and deployment configuration are planned for later iterations.
