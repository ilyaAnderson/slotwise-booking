import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, LayoutDashboard, Menu, MoreHorizontal, Plus, Search, Settings2, Sparkles, UsersRound, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import type { Appointment, AppointmentStatus, Service, Summary } from "./types";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
const labels: Record<AppointmentStatus, string> = { new: "Новая", confirmed: "Подтверждена", completed: "Завершена", cancelled: "Отменена" };
const dateLabel = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const timeLabel = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [summary, setSummary] = useState<Summary>({ today_total: 0, needs_confirmation: 0, completed_this_month: 0, revenue_this_month: "0" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState(new Date());

  async function load() {
    setLoading(true);
    setError("");
    try {
      const responses = await Promise.all([fetch(API + "/appointments"), fetch(API + "/services"), fetch(API + "/dashboard/summary")]);
      if (responses.some((response) => !response.ok)) throw new Error();
      const data = await Promise.all(responses.map((response) => response.json()));
      setAppointments(data[0]);
      setServices(data[1]);
      setSummary(data[2]);
    } catch {
      setError("Не удалось связаться с API. Запусти backend по инструкции в README.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const shown = useMemo(() => appointments.filter((item) => {
    const matchesFilter = filter === "all" || item.status === filter;
    const text = (item.customer_name + " " + item.service.name).toLocaleLowerCase("ru-RU");
    return matchesFilter && text.includes(search.toLocaleLowerCase("ru-RU"));
  }), [appointments, filter, search]);

  async function setStatus(id: number, status: AppointmentStatus) {
    try {
      const response = await fetch(API + "/appointments/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error();
      await load();
    } catch { setError("Не удалось изменить статус записи."); }
  }

  async function create(payload: Record<string, string>) {
    const response = await fetch(API + "/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, service_id: Number(payload.service_id) }),
    });
    if (!response.ok) throw new Error("Проверь данные записи и попробуй ещё раз.");
    setModal(false);
    await load();
  }

  const nav = [
    { icon: LayoutDashboard, text: "Обзор", active: true },
    { icon: CalendarDays, text: "Записи" },
    { icon: UsersRound, text: "Клиенты" },
    { icon: Sparkles, text: "Услуги" },
  ];

  return <div className="app-shell">
    <aside className={"sidebar " + (menu ? "sidebar-open" : "")}>
      <a className="brand" href="#top"><span className="brand-mark"><span /></span><span>slotwise</span></a>
      <button className="workspace-switcher"><span className="workspace-avatar">M</span><span className="workspace-copy"><b>Мастерская</b><small>Рабочее пространство</small></span><ChevronDown size={15} /></button>
      <span className="nav-caption">МЕНЮ</span>
      <nav className="main-nav" aria-label="Основная навигация">{nav.map(({ icon: Icon, text, active }) => <button key={text} className={"nav-link " + (active ? "active" : "")}><Icon size={18} /><span>{text}</span>{text === "Записи" && <span className="nav-count">{appointments.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="help-card"><span className="help-icon"><CircleHelp size={16} /></span><b>Нужна помощь?</b><p>Подскажем, как организовать расписание.</p><button>Открыть справку <ArrowUpRight size={13} /></button></div>
        <button className="nav-link"><Settings2 size={18} /><span>Настройки</span></button>
        <div className="profile-card"><span className="profile-avatar">А</span><span className="profile-copy"><b>Анна Смирнова</b><small>Владелец</small></span><MoreHorizontal size={18} /></div>
      </div>
    </aside>
    {menu && <button className="sidebar-scrim" aria-label="Закрыть меню" onClick={() => setMenu(false)} />}
    <main className="main-area" id="top">
      <header className="topbar"><button className="mobile-menu icon-button" aria-label="Открыть меню" onClick={() => setMenu(true)}><Menu size={20} /></button><div className="breadcrumb"><span>Рабочее пространство</span><ChevronRight size={15} /><b>Обзор</b></div><div className="topbar-actions"><span className="today-chip"><i /> Сегодня, {dateLabel.format(new Date())}</span><button className="icon-button notification" aria-label="Уведомления"><Bell size={18} /><i /></button><span className="profile-avatar top-avatar">А</span></div></header>
      <div className="page-content">
        <div className="page-heading"><div><span className="eyebrow">{new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(new Date()).toLocaleUpperCase("ru-RU")}</span><h1>Доброе утро, Анна <span>✳</span></h1><p>Вот что происходит в вашей студии сегодня.</p></div><button className="primary-button" onClick={() => setModal(true)}><Plus size={17} /> Новая запись</button></div>
        {error && <div className="error-banner" role="alert">{error}<button onClick={() => void load()}>Повторить</button></div>}
        <section className="stats-grid" aria-label="Ключевые показатели">
          <Stat title="Записи сегодня" value={String(summary.today_total).padStart(2, "0")} hint="В расписании на сегодня" icon={<CalendarDays size={18} />} tone="lilac" trend="+12%" />
          <Stat title="Ждут подтверждения" value={String(summary.needs_confirmation).padStart(2, "0")} hint="Нужно ответить клиентам" icon={<Clock3 size={18} />} tone="peach" trend="Требует внимания" />
          <Stat title="Завершено за месяц" value={String(summary.completed_this_month).padStart(2, "0")} hint="Услуг оказано" icon={<Check size={18} />} tone="mint" trend="+8,4%" />
          <Stat title="Выручка за месяц" value={Number(summary.revenue_this_month).toLocaleString("ru-RU") + " ₽"} hint="По завершённым записям" icon={<ArrowUpRight size={18} />} tone="blue" trend="+4,7%" />
        </section>
        <div className="dashboard-grid">
          <section className="panel appointments-panel">
            <div className="panel-heading"><div><h2>Записи</h2><p>Управляйте расписанием и запросами клиентов</p></div><button className="subtle-button" onClick={() => setModal(true)}><Plus size={15} /> Добавить</button></div>
            <div className="table-tools"><div className="tabs" role="tablist" aria-label="Фильтр записей">{([["all", "Все"], ["new", "Новые"], ["confirmed", "Подтверждены"], ["completed", "Завершены"]] as const).map(([key, title]) => <button role="tab" aria-selected={filter === key} key={key} className={filter === key ? "selected" : ""} onClick={() => setFilter(key)}>{title}<span>{key === "all" ? appointments.length : appointments.filter((row) => row.status === key).length}</span></button>)}</div><label className="search-box"><Search size={15} /><input aria-label="Поиск записей" placeholder="Поиск" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label></div>
            <div className="appointment-list"><div className="list-header"><span>КЛИЕНТ</span><span>УСЛУГА</span><span>ВРЕМЯ</span><span>СТАТУС</span><span /></div>
              {loading ? <div className="empty-state">Загружаем записи…</div> : shown.length === 0 ? <div className="empty-state"><span className="empty-icon"><CalendarDays size={19} /></span><b>Записей пока нет</b><span>Создайте первую запись для расписания.</span><button className="subtle-button" onClick={() => setModal(true)}><Plus size={14} /> Новая запись</button></div> : shown.map((item) => <AppointmentRow key={item.id} appointment={item} onChange={(status) => void setStatus(item.id, status)} />)}
            </div>
            <div className="panel-footer"><span>Показано <b>{shown.length}</b> из <b>{appointments.length}</b> записей</span><button className="text-button">Все записи <ArrowUpRight size={14} /></button></div>
          </section>
          <section className="panel calendar-panel">
            <div className="calendar-heading"><div><h2>Расписание</h2><p>{new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(selected)}</p></div><div className="calendar-controls"><button aria-label="Предыдущая неделя" onClick={() => setSelected((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7))}><ChevronLeft size={17} /></button><button aria-label="Следующая неделя" onClick={() => setSelected((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7))}><ChevronRight size={17} /></button></div></div>
            <div className="week-strip">{weekDays(selected).map((day) => <button key={day.toISOString()} className={"week-day " + (sameDay(day, selected) ? "current" : "")} onClick={() => setSelected(day)}><span>{new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(day)}</span><b>{day.getDate()}</b></button>)}</div>
            <div className="schedule-caption"><span>ЗАПИСИ НА {dateLabel.format(selected).toLocaleUpperCase("ru-RU")}</span><span className="schedule-dot" /><span>{appointments.filter((item) => sameDay(new Date(item.starts_at), selected) && item.status !== "cancelled").length} записи</span></div>
            <div className="schedule-list">{appointments.filter((item) => sameDay(new Date(item.starts_at), selected) && item.status !== "cancelled").sort((a, b) => a.starts_at.localeCompare(b.starts_at)).map((item) => <div className="schedule-item" key={item.id}><span className="schedule-time">{timeLabel.format(new Date(item.starts_at))}</span><div className="schedule-card"><span className="schedule-accent" /><div><b>{item.service.name}</b><span>{item.customer_name}</span></div><span className="schedule-duration">{item.service.duration_minutes} мин</span></div></div>)}{appointments.filter((item) => sameDay(new Date(item.starts_at), selected) && item.status !== "cancelled").length === 0 && <div className="schedule-empty"><span>На этот день записей пока нет</span><button onClick={() => setModal(true)}>Добавить запись <Plus size={14} /></button></div>}</div>
            <button className="calendar-more">Открыть календарь <ArrowUpRight size={14} /></button>
          </section>
        </div>
        <section className="bottom-banner"><span className="banner-sparkle"><Sparkles size={21} /></span><div><b>Порядок в расписании — больше времени на клиентов</b><p>Slotwise помогает держать все записи и контакты под рукой.</p></div><button onClick={() => setModal(true)}>Добавить запись <ArrowUpRight size={14} /></button><span className="banner-orbit orbit-one" /><span className="banner-orbit orbit-two" /></section>
        <footer><span>© 2026 Slotwise</span><span>Создано для небольших студий <span className="footer-mark">✳</span></span><button><CircleHelp size={14} /> Поддержка</button></footer>
      </div>
    </main>
    {modal && <AppointmentModal services={services} onClose={() => setModal(false)} onSubmit={create} />}
  </div>;
}

function Stat({ title, value, hint, icon, tone, trend }: { title: string; value: string; hint: string; icon: ReactNode; tone: string; trend: string }) {
  return <article className="stat-card"><div className="stat-top"><span>{title}</span><span className={"stat-icon " + tone}>{icon}</span></div><div className="stat-value">{value}</div><div className="stat-bottom"><span>{hint}</span><span className={"stat-trend " + (trend.startsWith("+") ? "positive" : "attention")}>{trend}</span></div></article>;
}

function AppointmentRow({ appointment, onChange }: { appointment: Appointment; onChange: (status: AppointmentStatus) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="appointment-row"><div className="client-cell"><span className="client-avatar">{appointment.customer_name.charAt(0).toLocaleUpperCase("ru-RU")}</span><div><b>{appointment.customer_name}</b><span>{appointment.customer_phone}</span></div></div><div className="service-cell"><b>{appointment.service.name}</b><span>{appointment.service.duration_minutes} мин · {Number(appointment.service.price).toLocaleString("ru-RU")} ₽</span></div><div className="time-cell"><b>{timeLabel.format(new Date(appointment.starts_at))}</b><span>{dateLabel.format(new Date(appointment.starts_at))}</span></div><div className="status-cell"><span className={"status-pill " + appointment.status}><i />{labels[appointment.status]}</span></div><div className="row-actions"><button className="row-menu icon-button" aria-label={"Действия: " + appointment.customer_name} onClick={() => setOpen(!open)}><MoreHorizontal size={18} /></button>{open && <div className="row-menu-popover">{(Object.keys(labels) as AppointmentStatus[]).map((status) => <button key={status} onClick={() => { onChange(status); setOpen(false); }}>{labels[status]}{appointment.status === status && <Check size={14} />}</button>)}</div>}</div></div>;
}

function AppointmentModal({ services, onClose, onSubmit }: { services: Service[]; onClose: () => void; onSubmit: (payload: Record<string, string>) => Promise<void> }) {
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setFormError("");
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(Array.from(data.entries()).map(([key, value]) => [key, String(value)]));
    try { await onSubmit(payload); } catch (error) { setFormError(error instanceof Error ? error.message : "Не удалось создать запись."); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="eyebrow">РАСПИСАНИЕ</span><h2 id="modal-title">Новая запись</h2><p>Добавьте клиента в расписание студии.</p></div><button className="icon-button" aria-label="Закрыть" onClick={onClose}><X size={19} /></button></div><form onSubmit={(event) => void submit(event)}><label>Имя клиента<input name="customer_name" placeholder="Например, Мария Иванова" required minLength={2} /></label><label>Телефон<input name="customer_phone" type="tel" placeholder="+7 900 000-00-00" required minLength={5} /></label><label>Услуга<select name="service_id" required defaultValue=""><option value="" disabled>Выберите услугу</option>{services.map((service) => <option value={service.id} key={service.id}>{service.name} · {Number(service.price).toLocaleString("ru-RU")} ₽</option>)}</select></label><label>Дата и время<input name="starts_at" type="datetime-local" required /></label><label>Комментарий <span className="optional">необязательно</span><textarea name="note" placeholder="Пожелания клиента" rows={3} /></label>{formError && <div className="form-error" role="alert">{formError}</div>}<div className="modal-actions"><button type="button" className="cancel-button" onClick={onClose}>Отмена</button><button className="primary-button" disabled={saving || services.length === 0}>{saving ? "Сохраняем…" : <><Plus size={16} /> Создать запись</>}</button></div></form></section></div>;
}

function weekDays(date: Date) {
  const start = new Date(date);
  start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}
function sameDay(one: Date, two: Date) {
  return one.getFullYear() === two.getFullYear() && one.getMonth() === two.getMonth() && one.getDate() === two.getDate();
}
