import { useEffect, useState } from "react";
import { getPriceInfo, setNewPrice } from "../api/admin";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

/**
 * pages/AdminPrice.jsx
 * GET /api/admin/price/ only needs is_staff (StaffRoute already enforces
 * that). POST additionally requires is_superuser in the Django view — a
 * staff-but-not-superuser request gets a 405 back. We mirror that here by
 * disabling the form for non-superusers instead of letting them submit and
 * hit an error, which is better UX and matches the backend's real rule.
 */
export default function AdminPrice() {
  const { isSuperuser } = useAuth();
  const [data, setData] = useState(null);
  const [newPrice, setNewPriceValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function load() {
    setLoading(true);
    getPriceInfo()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await setNewPrice(newPrice);
      setSuccess(true);
      setNewPriceValue("");
      load(); // refresh current price + history
    } catch (err) {
      setError(err.message || "Could not update the price.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen label="Loading price data…" />;

  return (
    <div className="content" style={{ padding: 0 }}>
      <div className="page-head">
        <span className="eyebrow">Pricing</span>
        <h1>Price Management</h1>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div>
          <div className="card">
            <div className="eyebrow">Current price</div>
            <div className="mono" style={{ fontSize: 38, fontWeight: 500, marginTop: 6 }}>
              ₦{data.current ? data.current.price_per_litre : "—"}
              <span style={{ fontSize: 16, color: "var(--ink-faint)" }}>/L</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="card" style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Set new price
            </div>

            {error && <div className="notice notice-red" style={{ marginBottom: 14 }}>{error}</div>}
            {success && <div className="notice notice-green" style={{ marginBottom: 14 }}>New price is now live.</div>}

            {!isSuperuser && (
              <div className="notice notice-amber" style={{ marginBottom: 14 }}>
                Only superusers can change the price. You can view current and historical prices.
              </div>
            )}

            <div className="field">
              <label htmlFor="new-price">New price per litre (₦)</label>
              <input
                className="input mono"
                type="number"
                id="new-price"
                min="1"
                step="0.01"
                placeholder="1050"
                value={newPrice}
                onChange={(e) => setNewPriceValue(e.target.value)}
                disabled={!isSuperuser}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!isSuperuser || submitting}>
              {submitting ? "Saving…" : "Set New Price"}
            </button>
          </form>
        </div>

        <div>
          <div className="section-head" style={{ marginTop: 0 }}>
            <h2>Price history</h2>
          </div>
          <div className="card-flush" style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Price</th>
                  <th scope="col">Set by</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((p, i) => (
                  <tr key={i}>
                    <td>{new Date(p.effective_from).toLocaleDateString()}</td>
                    <td className="mono">₦{p.price_per_litre}/L</td>
                    <td>{p.set_by || "System"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
