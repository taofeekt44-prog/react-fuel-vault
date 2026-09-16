import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="app no-shell">
      <div className="content" style={{ padding: "0 22px", textAlign: "center", paddingTop: 80 }}>
        <h1 style={{ fontSize: 24 }}>Page not found</h1>
        <p style={{ color: "var(--ink-soft)", marginTop: 8 }}>That page doesn't exist.</p>
        <Link className="btn btn-primary" to="/" style={{ marginTop: 20 }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
