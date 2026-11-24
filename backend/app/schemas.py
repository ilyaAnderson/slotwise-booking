from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


AppointmentStatus = Literal["new", "confirmed", "completed", "cancelled"]


class ServiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    duration_minutes: int
    price: Decimal


class AppointmentCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    customer_phone: str = Field(min_length=5, max_length=40)
    service_id: int
    starts_at: datetime
    note: str | None = Field(default=None, max_length=1000)


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_name: str
    customer_phone: str
    service_id: int
    service: ServiceRead
    starts_at: datetime
    status: AppointmentStatus
    note: str | None


class DashboardSummary(BaseModel):
    today_total: int
    needs_confirmation: int
    completed_this_month: int
    revenue_this_month: Decimal
