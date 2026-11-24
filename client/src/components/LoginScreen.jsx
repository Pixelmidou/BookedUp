import { useState } from "react";
import { ArrowUpRight, Flower2, Moon, Sun } from "lucide-react";

export default function LoginScreen({ onSignIn, theme, setTheme }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      await onSignIn(form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-top">
        <a className="logo" href="#">
          <span className="logo-mark">
            <Flower2 size={21} />
          </span>
          <span>
            bookedup<span className="logo-dot">.</span>
          </span>
        </a>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </div>
      <div className="auth-body">
        <div className="auth-copy">
          <span className="eyebrow">A BETTER FLOW FOR THE WORKDAY</span>
          <h1>
            Make room for a<br />
            <span>really good day.</span>
          </h1>
          <p>
            One shared schedule. Clear roles. A calmer way to keep every
            appointment moving.
          </p>
          <div className="auth-deco">
            <div className="blob-a" />
            <div className="blob-b" />
            <span>✳</span>
          </div>
        </div>
        <form className="auth-card" onSubmit={submit}>
          <div className="modal-flower">
            <Flower2 size={20} />
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to your workspace.</p>
          <label className="field">
            Email address
            <input
              type="email"
              autoComplete="username"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Your password"
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="add-btn auth-submit" disabled={working}>
            {working ? "Signing in…" : "Sign in"} <ArrowUpRight size={16} />
          </button>
          <small className="auth-footnote">
            Your workspace owner creates team accounts.
          </small>
        </form>
      </div>
    </div>
  );
}
