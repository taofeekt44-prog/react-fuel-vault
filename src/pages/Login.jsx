import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Droplet, Eye, EyeOff } from "../components/icons";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Enter your username/email and password.");
      return;
    }

    setSubmitting(true);
    try {
      // api_login expects { username, password } — note the Django view
      // authenticates by `username`, not email, even though the field
      // holds either in this form's placeholder. If your users log in by
      // email, update api_login to also try User.objects.get(email=...)
      // before calling authenticate().
      await login(username.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid username or password.");
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

          <h1 style={{ fontSize: 23, textAlign: "center" }}>Welcome back</h1>
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>
            Log in to manage your litres
          </p>

          {error && (
            <div className="notice notice-red" style={{ marginTop: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ marginTop: 20 }}>
            <div className="field">
              <label htmlFor="login-username">Username</label>
              <input
                className="input"
                type="text"
                id="login-username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="login-password" style={{ display: "flex", justifyContent: "space-between" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: 14,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: showPassword ? "var(--green-700)" : "var(--ink-faint)",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 6 }}>
              {submitting ? "Logging in…" : "Log In"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-soft)", marginTop: 22 }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--green-700)", fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
