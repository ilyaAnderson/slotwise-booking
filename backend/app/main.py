from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.db import Base, SessionLocal, engine, get_session
from app.models import Appointment, Service
from app.schemas import (
    AppointmentCreate,
    AppointmentRead,
    AppointmentStatusUpdate,
    DashboardSummary,
    ServiceRead,
)


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        if session.scalar(select(func.count(Service.id))) == 0:
            session.add_all(
                [
                    Service(name="Стрижка и укладка", duration_minutes=60, price=Decimal("2400.00")),
                    Service(name="Окрашивание", duration_minutes=120, price=Decimal("6800.00")),
                    Service(name="Консультация", duration_minutes=30, price=Decimal("900.00")),
                ]
            )
            session.commit()
        if session.scalar(select(func.count(Appointment.id))) == 0:
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            services = list(session.scalars(select(Service).order_by(Service.id)))
            session.add_all(
                [
                    Appointment(
                        customer_name="Мария Иванова",
                        customer_phone="+7 900 000-00-01",
                        service_id=services[0].id,
                        starts_at=today.replace(hour=11, minute=0),
                        status="confirmed",
                        note="Демо-запись",
                    ),
                    Appointment(
                        customer_name="Екатерина Волкова",
                        customer_phone="+7 900 000-00-02",
                        service_id=services[1].id,
                        starts_at=today.replace(hour=14, minute=30),
                        status="new",
                        note="Демо-запись",
                    ),
                    Appointment(
                        customer_name="Алина Петрова",
                        customer_phone="+7 900 000-00-03",
                        service_id=services[2].id,
                        starts_at=(today + timedelta(days=1)).replace(hour=10, minute=0),
                        status="confirmed",
                        note="Демо-запись",
                    ),
                ]
            )
            session.commit()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="Slotwise API",
    description="Booking and customer management for independent service businesses.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/services", response_model=list[ServiceRead])
def list_services(session: Session = Depends(get_session)) -> list[Service]:
    return list(session.scalars(select(Service).where(Service.is_active.is_(True)).order_by(Service.id)))


@app.get("/api/appointments", response_model=list[AppointmentRead])
def list_appointments(
    day: datetime | None = Query(default=None, description="Filter by calendar day"),
    session: Session = Depends(get_session),
) -> list[Appointment]:
    query = select(Appointment).options(joinedload(Appointment.service)).order_by(Appointment.starts_at)
    if day:
        start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.where(Appointment.starts_at >= start, Appointment.starts_at < start + timedelta(days=1))
    return list(session.scalars(query))


@app.post("/api/appointments", response_model=AppointmentRead, status_code=201)
def create_appointment(payload: AppointmentCreate, session: Session = Depends(get_session)) -> Appointment:
    service = session.get(Service, payload.service_id)
    if not service or not service.is_active:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    requested_end = payload.starts_at + timedelta(minutes=service.duration_minutes)
    existing = session.scalars(
        select(Appointment).options(joinedload(Appointment.service)).where(Appointment.status != "cancelled")
    ).unique()
    for appointment in existing:
        existing_end = appointment.starts_at + timedelta(minutes=appointment.service.duration_minutes)
        if appointment.starts_at < requested_end and payload.starts_at < existing_end:
            raise HTTPException(status_code=409, detail="Это время уже занято")
    appointment = Appointment(**payload.model_dump())
    session.add(appointment)
    session.commit()
    session.refresh(appointment)
    return session.scalar(
        select(Appointment).options(joinedload(Appointment.service)).where(Appointment.id == appointment.id)
    )


@app.patch("/api/appointments/{appointment_id}", response_model=AppointmentRead)
def update_appointment_status(
    appointment_id: int,
    payload: AppointmentStatusUpdate,
    session: Session = Depends(get_session),
) -> Appointment:
    appointment = session.scalar(
        select(Appointment).options(joinedload(Appointment.service)).where(Appointment.id == appointment_id)
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    appointment.status = payload.status
    session.commit()
    session.refresh(appointment)
    return appointment


@app.delete("/api/appointments/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: int, session: Session = Depends(get_session)) -> Response:
    appointment = session.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    session.delete(appointment)
    session.commit()
    return Response(status_code=204)


@app.get("/api/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary(session: Session = Depends(get_session)) -> DashboardSummary:
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    today_total = session.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.starts_at >= today_start,
            Appointment.starts_at < today_start + timedelta(days=1),
            Appointment.status != "cancelled",
        )
    ) or 0
    needs_confirmation = session.scalar(
        select(func.count(Appointment.id)).where(Appointment.status == "new")
    ) or 0
    completed = session.scalars(
        select(Appointment).options(joinedload(Appointment.service)).where(
            Appointment.starts_at >= month_start, Appointment.status == "completed"
        )
    ).unique().all()
    return DashboardSummary(
        today_total=today_total,
        needs_confirmation=needs_confirmation,
        completed_this_month=len(completed),
        revenue_this_month=sum((row.service.price for row in completed), Decimal("0.00")),
    )
