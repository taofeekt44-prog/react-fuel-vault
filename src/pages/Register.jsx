import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Droplet } from "../components/icons";

const initialForm = {
  firstname: "",
  lastname: "",
  username: "",
  email: "",
  password1: "",
  password2: "",
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function clientSideValidate() {
    if (!form.email || !form.password1 || !form.password2) {
      return "All details must be provided.";
    }
    if (form.password1.length < 6) {
      return "Password is too short.";
    }
    if (form.password1 !== form.password2) {
      return "Passwords do not match.";
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const clientError = clientSideValidate();
    if (clientError) {
      setError(clientError);
      return;
    }

    setSubmitting(true);
    try {
      // Field names below match exactly what api_register reads via
      // data.get('firstname') / data.get('lastname') / etc — this is the
      // one place that has to stay in lockstep with views.py.
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app no-shell">
      <div className="content" style={{ padding: "0 22px" }}>
        <div style={{ paddingTop: 52, paddingBottom: 40, maxWidth: 400, margin: "0 auto" }}>
          <div className="brand" style={{ justifyContent: "center", marginBottom: 36 }}>
            <div className="brand-mark">
              <Droplet size={16} color="#fff" />
            </div>
            <span className="brand-name">LitreVault</span>
          </div>

          <h1 style={{ fontSize: 23, textAlign: "center" }}>Create your account</h1>
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>
            Start buying litres in under a minute
          </p>

          {error && (
            <div className="notice notice-red" style={{ marginTop: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ marginTop: 20 }}>
            <div className="stat-grid">
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="reg-firstname">First name</label>
                <input
                  className="input"
                  type="text"
                  id="reg-firstname"
                  autoComplete="given-name"
                  value={form.firstname}
                  onChange={update("firstname")}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="reg-lastname">Last name</label>
                <input
                  className="input"
                  type="text"
                  id="reg-lastname"
                  autoComplete="family-name"
                  value={form.lastname}
                  onChange={update("lastname")}
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="reg-username">Username</label>
              <input
                className="input"
                type="text"
                id="reg-username"
                autoComplete="username"
                value={form.username}
                onChange={update("username")}
              />
              <div className="input-help">Optional — leave blank and Django won't require one, but you'll need it to log in unless you also add email-based login (see GUIDE.md).</div>
            </div>

            <div className="field">
              <label htmlFor="reg-email">Email address</label>
              <input
                className="input"
                type="email"
                id="reg-email"
                autoComplete="email"
                value={form.email}
                onChange={update("email")}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="reg-password1">Password</label>
              <input
                className="input"
                type="password"
                id="reg-password1"
                autoComplete="new-password"
                value={form.password1}
                onChange={update("password1")}
                required
              />
              <div className="input-help">Minimum 6 characters (matches the Django view's check).</div>
            </div>

            <div className="field">
              <label htmlFor="reg-password2">Confirm password</label>
              <input
                className="input"
                type="password"
                id="reg-password2"
                autoComplete="new-password"
                value={form.password2}
                onChange={update("password2")}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 6 }}>
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-soft)", marginTop: 22 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--green-700)", fontWeight: 600 }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
