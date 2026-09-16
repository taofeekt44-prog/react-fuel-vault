import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../api/dashboard";
import { useAuth } from "../context/AuthContext";
import { PlusCircle, QrCode, ShieldCheck, AlertTriangle, Droplet } from "../components/icons";
import LoadingScreen from "../components/LoadingScreen";

function Gauge({ fraction = 0.7 }) {
  const heights = [6, 8, 10, 12, 14, 16, 14, 12, 16, 10, 8, 14, 9, 12];
  const onCount = Math.round(heights.length * fraction);
  return (
    <div className="gauge">
      {heights.map((h, i) => (
        <i key={i} className={i < onCount ? "on" : ""} style={{ height: h }} />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await getDashboard();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingScreen label="Loading your dashboard…" />;
  if (error) {
    return (
      <div className="notice notice-red" style={{ marginTop: 20 }}>
        Couldn't load your dashboard: {error}
      </div>
    );
  }

  const wallet = data.wallet || { available_litres: "0.000" };
  const price = data.fuel_price;
  const litres = Number(wallet.available_litres);
  const fraction = Math.min(litres / 50, 1); // purely visual scale for the gauge

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Good to see you</span>
        <h1>{user?.first_name || user?.username}</h1>
      </div>

      <div className="wallet-card">
        <div className="wallet-label">My LitreWallet</div>
        <div className="wallet-figure">
          {litres.toFixed(3)}
          <span className="unit">L</span>
        </div>
        <div className="wallet-sub">Available to redeem</div>
        <Gauge fraction={fraction} />
        <div className="wallet-protect">
          <ShieldCheck size={15} />
          <div>Your litres are protected from future price increases until expiry.</div>
        </div>
        <div className="wallet-actions">
          <Link className="btn btn-primary" to="/buy">
            <PlusCircle size={16} /> Buy Litres
          </Link>
          <Link className="btn btn-secondary" to="/redeem">
            <QrCode size={16} /> Redeem Fuel
          </Link>
        </div>
      </div>

      <div className="section-head">
        <h2>Current fuel price</h2>
        <Link className="section-link" to="/price-history">
          Price history
        </Link>
      </div>
      <div className="card">
        <div className="price-row">
          <div>
            <div className="eyebrow">Per litre today</div>
            <div className="price-figure" style={{ fontSize: 28, marginTop: 4 }}>
              {price ? `₦${price.price_per_litre}` : "—"}
              <span style={{ fontSize: 14, color: "var(--ink-faint)" }}>/L</span>
            </div>
          </div>
        </div>
        <div className="divider" />
        <div className="eyebrow">Estimated current value of your wallet</div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>
          {data.estimated_value ? `₦${Number(data.estimated_value).toLocaleString("en-NG")}` : "—"}
        </div>
        <div className="input-help" style={{ marginTop: 4 }}>
          Based on today's price — not a cash balance. Your litres, not this figure, are what's guaranteed.
        </div>
      </div>

      {data.expiring_lot && (
        <>
          <div className="section-head">
            <h2>Expiring soon</h2>
            <Link className="section-link" to="/lots">
              See all
            </Link>
          </div>
          <div
            className="notice notice-amber"
            style={{
              borderLeft: "3px solid var(--amber-600)",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>{data.expiring_lot.litres_remaining}L</strong> expire in{" "}
                <strong>{data.expiring_lot.days_left} days</strong>. Redeem soon to avoid losing access.
              </div>
            </div>
            <Link className="btn btn-sm" style={{ background: "var(--amber-700)", color: "#fff", flexShrink: 0 }} to="/redeem">
              Redeem
            </Link>
          </div>
        </>
      )}

      <div className="section-head">
        <h2>Recent purchases</h2>
        <Link className="section-link" to="/transactions">
          See all
        </Link>
      </div>
      <div className="card-flush" style={{ padding: "6px 16px" }}>
        {data.recent_purchases && data.recent_purchases.length > 0 ? (
          data.recent_purchases.map((p) => (
            <div className="txn" key={p.id}>
              <div className="txn-icon buy">
                <Droplet size={17} />
              </div>
              <div className="txn-body">
                <div className="txn-title">Litres purchased</div>
                <div className="txn-sub">
                  {new Date(p.created_at).toLocaleDateString()} · ₦{p.price_per_litre}/L
                </div>
              </div>
              <div className="txn-amt">
                <div className="txn-litres">+{p.litres_bought}L</div>
                <div className="txn-naira">₦{Number(p.total_amount).toLocaleString("en-NG")}</div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-faint)", fontSize: 13 }}>
            No purchases yet — <Link to="/buy" style={{ color: "var(--green-700)", fontWeight: 600 }}>buy your first litres</Link>.
          </p>
        )}
      </div>

      <footer className="foot-note">
        Your purchased litres remain available at the quantity you bought, subject to their validity period.
      </footer>
    </>
  );
}
