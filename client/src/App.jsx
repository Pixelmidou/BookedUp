import { useEffect, useMemo, useState } from "react";
import {
  AlarmClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flower2,
  LogOut,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";
import AppointmentCard from "./components/AppointmentCard.jsx";
import AppointmentModal from "./components/AppointmentModal.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import WorkerModal from "./components/WorkerModal.jsx";
import { dateKey, initials, prettyDay, today } from "./utils.js";

// In development Vite proxies /api locally; production sets VITE_API_URL.
const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const apiUrl = (path) => `${API_ORIGIN}${path}`;
const API = "/api/appointments";
const tabs = ["Today", "Upcoming", "All"];
const statuses = [
  "All status",
  "Pending",
  "Approved",
  "Arrived",
  "Done",
  "Rejected",
  "Cancelled",
];
// Add the saved session token to every protected API request.
const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("bookedup-token");
  return fetch(apiUrl(url), {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState("Today");
  const [day, setDay] = useState(today());
  const [status, setStatus] = useState("All status");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("bookedup-theme") || "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("bookedup-theme", theme);
  }, [theme]);
  // Restore the signed-in user when the page is refreshed.
  useEffect(() => {
    if (!localStorage.getItem("bookedup-token")) {
      setAuthChecking(false);
      return;
    }
    authFetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem("bookedup-token"))
      .finally(() => setAuthChecking(false));
  }, []);
  useEffect(() => {
    if (user) loadAppointments();
  }, [user]);

  async function signIn(email, password) {
    const response = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Sign in failed.");
    localStorage.setItem("bookedup-token", data.token);
    setUser(data.user);
  }
  function signOut() {
    localStorage.removeItem("bookedup-token");
    setUser(null);
    setAppointments([]);
    setModal("");
  }
  async function loadAppointments() {
    setLoading(true);
    try {
      const response = await authFetch(API);
      if (response.status === 401) {
        signOut();
        throw new Error("Please sign in again.");
      }
      if (!response.ok) throw new Error("Could not load appointments.");
      setAppointments(await response.json());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  async function createAppointment(form) {
    const response = await authFetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "Could not create appointment.");
    setAppointments((current) => [...current, data]);
    setModal("");
  }
  async function addWorker(form) {
    const response = await authFetch("/api/auth/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Could not add worker.");
    setModal("");
  }
  async function updateStatus(appointment, nextStatus) {
    const response = await authFetch(`${API}/${appointment._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Could not update appointment.");
      return;
    }
    setAppointments((current) =>
      current.map((item) => (item._id === appointment._id ? data : item)),
    );
  }
  async function removeAppointment(appointment) {
    if (!window.confirm(`Delete the appointment for ${appointment.customer}?`))
      return;
    const response = await authFetch(`${API}/${appointment._id}`, {
      method: "DELETE",
    });
    if (response.ok)
      setAppointments((current) =>
        current.filter((item) => item._id !== appointment._id),
      );
  }

  // Derive the displayed list from the date tab, status filter, and search.
  const visible = useMemo(
    () =>
      appointments
        .filter(
          (item) =>
            tab === "All" ||
            (tab === "Today" ? item.date === day : item.date > day),
        )
        .filter((item) => status === "All status" || item.status === status)
        .filter((item) =>
          `${item.customer} ${item.service} ${item.phone}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
        ),
    [appointments, tab, day, status, query],
  );

  if (authChecking)
    return <div className="auth-loading">Loading your workspace…</div>;
  if (!user)
    return <LoginScreen onSignIn={signIn} theme={theme} setTheme={setTheme} />;

  const todayItems = appointments.filter((item) => item.date === today());
  const completed = todayItems.filter((item) => item.status === "Done").length;
  const activeCount = todayItems.filter(
    (item) => !["Done", "Rejected", "Cancelled"].includes(item.status),
  ).length;
  const pendingCount = appointments.filter(
    (item) => item.status === "Pending",
  ).length;
  const nextUp = todayItems.find((item) => item.status === "Approved");

  function shiftDay(amount) {
    const date = new Date(`${day}T12:00:00`);
    date.setDate(date.getDate() + amount);
    setDay(dateKey(date));
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <a href="#" className="logo">
          <span className="logo-mark">
            <Flower2 size={21} />
          </span>
          <span>
            bookedup<span className="logo-dot">.</span>
          </span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <div className="side-link selected">
          <CalendarDays size={17} />
          Appointments<span className="side-count">{activeCount}</span>
        </div>
        {user.role === "owner" && (
          <div className="approval-note">
            <ShieldCheck size={16} />
            <span>{pendingCount} waiting for your review</span>
          </div>
        )}
        <div className="side-label tools-label">QUICK LOOK</div>
        <div className="side-note">
          <span className="note-icon coral">
            <AlarmClock size={16} />
          </span>
          <div>
            <small>Next approved</small>
            <b>{nextUp ? nextUp.time : "All caught up!"}</b>
          </div>
        </div>
        <div className="side-note">
          <span className="note-icon lilac">
            <Check size={16} />
          </span>
          <div>
            <small>Completed today</small>
            <b>{completed} appointments</b>
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className="help-card">
            <b>
              A smoother day
              <br />
              starts here.
            </b>
            <span>Keep your schedule feeling light.</span>
          </div>
          <div className="profile">
            <div className="profile-avatar">{initials(user.name)}</div>
            <div>
              <b>{user.name}</b>
              <small>{user.role === "owner" ? "Owner" : "Worker"}</small>
            </div>
            <button
              onClick={signOut}
              className="signout-small"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <b>Appointments</b>
          </div>
          <div className="top-actions">
            <span className="open-status">
              <i />
              {user.role === "owner" ? "Owner view" : "Worker view"}
            </span>
            {user.role === "owner" && (
              <button
                className="staff-button"
                onClick={() => setModal("worker")}
              >
                <Users size={14} /> Add worker
              </button>
            )}
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button className="user-chip" onClick={signOut} title="Sign out">
              <span className="mini-profile">{initials(user.name)}</span>
              <span>
                {user.name}
                <small>Sign out</small>
              </span>
            </button>
          </div>
        </header>
        <section className="welcome">
          <div className="welcome-copy">
            <div className="date-stamp">
              <span className="date-icon">
                <CalendarDays size={14} />
              </span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
            <h1>
              Make room for a<br />
              <span>really good day.</span>
            </h1>
            <p>Your day, thoughtfully organized. One appointment at a time.</p>
            <button className="add-btn" onClick={() => setModal("appointment")}>
              <Plus size={17} /> New appointment{" "}
            </button>
          </div>
          <div className="welcome-visual">
            <div className="blob blob-a" />
            <div className="blob blob-b" />
            <div className="visual-note">
              <span className="note-small-icon">
                <Clock3 size={16} />
              </span>
              <span>
                <b>A little breathing room</b>
                <small>is part of a good schedule</small>
              </span>
            </div>
            <div className="visual-calendar">
              <div>
                <span>MON</span>
                <b>24</b>
              </div>
              <i />
              <p>
                <b>10:30</b>
                <small>your next moment</small>
              </p>
            </div>
          </div>
        </section>
        <section className="stats">
          <div className="stat-card stat-peach">
            <div className="stat-top">
              <span>ON THE BOOKS</span>
              <span className="stat-icon">
                <CalendarDays size={17} />
              </span>
            </div>
            <strong>{activeCount.toString().padStart(2, "0")}</strong>
            <small>active appointments today</small>
          </div>
          <div className="stat-card stat-blue">
            <div className="stat-top">
              <span>NEEDS REVIEW</span>
              <span className="stat-icon">
                <ShieldCheck size={17} />
              </span>
            </div>
            <strong>{pendingCount.toString().padStart(2, "0")}</strong>
            <small>pending approval</small>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-top">
              <span>ALL WRAPPED UP</span>
              <span className="stat-icon">
                <Check size={17} />
              </span>
            </div>
            <strong>{completed.toString().padStart(2, "0")}</strong>
            <small>completed today</small>
            <div className="progress">
              <i
                style={{
                  width: `${todayItems.length ? (completed / todayItems.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </section>
        <section className="schedule">
          <div className="schedule-title">
            <div>
              <div className="eyebrow">YOUR LITTLE RUN OF THE DAY</div>
              <h2>
                {tab === "Today"
                  ? "The day, at a glance"
                  : tab === "Upcoming"
                    ? "Coming up next"
                    : "Your whole schedule"}{" "}
                <span>{visible.length}</span>
              </h2>
            </div>
            <div className="day-nav">
              <button onClick={() => shiftDay(-1)} aria-label="Previous day">
                <ChevronLeft size={16} />
              </button>
              <button
                className="day-current"
                onClick={() => {
                  setDay(today());
                  setTab("Today");
                }}
              >
                Today
              </button>
              <button onClick={() => shiftDay(1)} aria-label="Next day">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="schedule-tools">
            <div className="view-tabs">
              {tabs.map((item) => (
                <button
                  key={item}
                  className={tab === item ? "active" : ""}
                  onClick={() => setTab(item)}
                >
                  {item}
                  {item === "Today" && (
                    <span className="tab-count">{todayItems.length}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="filters">
              <label className="search">
                <Search size={15} />
                <input
                  placeholder="Find a person or service"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label className="status-filter">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {statuses.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </label>
            </div>
          </div>
          {tab === "Today" && (
            <div className="day-heading">
              <span>{prettyDay(day)}</span>
              <span className="day-line" />
              <span>
                {visible.length}{" "}
                {visible.length === 1 ? "appointment" : "appointments"}
              </span>
            </div>
          )}
          {error && (
            <div className="error">
              {error}
              <button onClick={loadAppointments}>Try again</button>
            </div>
          )}
          {loading ? (
            <div className="empty">
              <div className="spinner" />
              <p>Getting your day ready…</p>
            </div>
          ) : visible.length ? (
            <div className="appointment-list">
              {visible.map((item, index) => (
                <AppointmentCard
                  key={item._id}
                  item={item}
                  index={index}
                  user={user}
                  onStatus={updateStatus}
                  onDelete={removeAppointment}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <h3>
                {query
                  ? "No matching appointments"
                  : "A little breathing room."}
              </h3>
              <p>
                {query
                  ? "Try another name or service."
                  : "Nothing on the schedule here yet."}
              </p>
              {!query && (
                <button
                  className="add-btn"
                  onClick={() => setModal("appointment")}
                >
                  <Plus size={16} /> Book a spot
                </button>
              )}
            </div>
          )}
        </section>
        <footer>
          <span>
            Make today a little easier
          </span>
          <span>
            BOOKEDUP <i>·</i> APPOINTMENTS, MADE EASY
          </span>
        </footer>
      </main>
      {modal === "appointment" && (
        <AppointmentModal
          role={user.role}
          onClose={() => setModal("")}
          onSave={createAppointment}
        />
      )}
      {modal === "worker" && (
        <WorkerModal onClose={() => setModal("")} onSave={addWorker} />
      )}
    </div>
  );
}
