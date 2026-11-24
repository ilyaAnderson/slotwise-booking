# Slotwise

An appointment and customer management app for independent service businesses. The dashboard connects to a Python API backed by SQLite.

> **Status:** portfolio MVP in active development. It is not ready for production use; authentication and deployment hardening are still planned.

## Features

- View appointments and filter them by status or customer/service name
- Create appointments with a service, customer, date, and time
- Change appointment status from the dashboard
- Browse a weekly schedule and see daily/monthly summary metrics
- Reject a new appointment when its time overlaps an existing booking
- Start with sample services and appointments in a local SQLite database

## Stack

- **Frontend:** React, TypeScript, Vite
- **API:** Python, FastAPI, Pydantic
- **Database:** SQLite, SQLAlchemy

## Run locally

Requirements: Python 3.11+ and Node.js 20.19+ or 22.12+.

### 1. Start the API

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload
```

The API starts at `http://127.0.0.1:8000`. Interactive documentation is at `http://127.0.0.1:8000/docs`.

### 2. Start the dashboard

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. The default API URL is `http://localhost:8000/api`; set `VITE_API_URL` in a frontend `.env` file to use another API address.

## Main API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check API availability |
| `GET` | `/api/services` | List active services |
| `GET` | `/api/appointments` | List appointments; optional `day` filter |
| `POST` | `/api/appointments` | Create an appointment |
| `PATCH` | `/api/appointments/{id}` | Change appointment status |
| `DELETE` | `/api/appointments/{id}` | Delete an appointment |
| `GET` | `/api/dashboard/summary` | Read dashboard metrics |

## Next steps

- Add user accounts and business workspaces
- Add customer profiles and service management
- Add public booking pages and reminders
- Add validation and automated checks for the API and frontend

---

# Slotwise — по-русски

Система онлайн-записи и управления клиентами для небольших студий и частных специалистов. Панель управления работает через API на Python и хранит данные в SQLite.

> **Статус:** MVP для портфолио, проект активно развивается. Для реального использования ещё нужны авторизация и подготовка к развёртыванию.

## Что уже работает

- Просмотр записей и фильтрация по статусу, имени клиента или услуге
- Создание записи с клиентом, услугой, датой и временем
- Изменение статуса записи
- Недельное расписание и сводные показатели
- Проверка пересечения времени перед созданием записи
- Тестовые услуги и записи при первом запуске базы данных

## Запуск

Нужны Python 3.11+ и Node.js 20.19+ или 22.12+.

Для запуска API перейди в `backend/`, создай виртуальное окружение и выполни `pip install -e .`, затем `uvicorn app.main:app --reload`. Документация API появится по адресу `http://127.0.0.1:8000/docs`.

Для панели управления открой вторую консоль, перейди в `frontend/` и выполни `npm install`, затем `npm run dev`. Vite покажет локальный адрес приложения.

Авторизация, профили клиентов и услуг, публичная страница записи и напоминания входят в дальнейший план.
