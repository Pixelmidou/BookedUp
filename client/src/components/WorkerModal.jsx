import { useState } from "react";
import { ArrowUpRight, Users, X } from "lucide-react";

export default function WorkerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
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
      <form className="modal worker-modal" onSubmit={submit}>
        <div className="modal-head">
          <div className="modal-flower">
            <Users size={20} />
          </div>
          <button type="button" className="close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="eyebrow">GROW YOUR TEAM</div>
        <h2>Add a worker</h2>
        <p className="modal-intro">
          They can submit appointments and update approved visits. You stay in
          control of approvals and deletions.
        </p>
        <label className="field">
          Name
          <input
            required
            maxLength="70"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Taylor Morgan"
          />
        </label>
        <label className="field">
          Email address
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="taylor@example.com"
          />
        </label>
        <label className="field">
          Temporary password
          <input
            required
            type="password"
            minLength="8"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="add-btn" disabled={saving}>
            {saving ? "Creating…" : "Create worker account"}{" "}
            <ArrowUpRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
