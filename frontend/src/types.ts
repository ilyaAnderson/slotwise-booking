export type AppointmentStatus = "new" | "confirmed" | "completed" | "cancelled";

export type Service = {
  id: number;
  name: string;
  duration_minutes: number;
  price: number | string;
};

export type Appointment = {
  id: number;
  customer_name: string;
  customer_phone: string;
  service_id: number;
  service: Service;
  starts_at: string;
  status: AppointmentStatus;
  note: string | null;
};

export type Summary = {
  today_total: number;
  needs_confirmation: number;
  completed_this_month: number;
  revenue_this_month: number | string;
};
