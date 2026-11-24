import { useState } from "react";
import { Check, Flower2, X } from "lucide-react";
import { today } from "../utils.js";

export default function AppointmentModal({ role, onClose, onSave }) {
  const [form, setForm] = useState({
    customer: "",
    service: "",
    date: today(),
    time: "10:00",
    phone: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <div className="modal-flower">
            <Flower2 size={20} />
          </div>
          <button type="button" className="close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="eyebrow">
          {role === "owner"
            ? "ADD TO THE APPROVED SCHEDULE"
            : "SEND AN APPOINTMENT FOR REVIEW"}
        </div>
        <h2>Book an appointment</h2>
        <p className="modal-intro">
          {role === "owner"
            ? "Add a confirmed appointment to the schedule."
            : "The owner will review this appointment before it is confirmed."}
        </p>
        <div className="form-grid">
          <label className="field full">
            Customer name
            <input
              autoFocus
              required
              maxLength="70"
              placeholder="e.g. Maya Bennett"
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
            />
          </label>
          <label className="field full">
            Service
            <input
              required
              maxLength="70"
              placeholder="e.g. Haircut and style"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
            />
          </label>
          <label className="field">
            Date
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
          <label className="field">
            Time
            <input
              type="time"
              required
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </label>
          <label className="field full">
            Phone number <span className="optional">optional</span>
            <input
              type="tel"
              maxLength="30"
              placeholder="555-0100"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="field full">
            Note <span className="optional">optional</span>
            <textarea
              maxLength="240"
              rows="2"
              placeholder="Anything worth remembering?"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="add-btn" disabled={saving}>
            <Check size={16} />
            {saving
              ? "Saving…"
              : role === "owner"
                ? "Confirm appointment"
                : "Send for approval"}
          </button>
        </div>
      </form>
    </div>
  );
}
