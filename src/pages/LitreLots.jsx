import { useEffect, useState } from "react";
import { getLitreLots } from "../api/lots";
import { Clock, AlertTriangle, X, Info } from "../components/icons";
import LoadingScreen from "../components/LoadingScreen";

function badgeFor(lot) {
  if (lot.status !== "ACTIVE") {
    return (
      <span className="badge badge-expired">
        <X size={11} /> {lot.status === "EXPIRED" ? "Expired" : "Used up"}
      </span>
    );
  }
  if (lot.days_left <= 14) {
    return (
      <span className="badge badge-warning">
        <AlertTriangle size={11} /> Expires in {lot.days_left} days
      </span>
    );
  }
  return (
    <span className="badge badge-healthy">
      <Clock size={11} /> Expires in {lot.days_left} days
    </span>
  );
}

function LotCard({ lot }) {
  return (
    <div className="lot-card">
      <div className="lot-top">
        <div>
          <div className="lot-litres">
            {lot.litres_remaining}
            <span style={{ fontSize: 13, color: "var(--ink-faint)" }}> L</span>
          </div>
          <div className="lot-meta">
            Bought at <span className="mono">₦{lot.price_per_litre}/L</span>
          </div>
        </div>
        {badgeFor(lot)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: "var(--ink-soft)" }}>
        <span>Expires {new Date(lot.expires_at).toLocaleDateString()}</span>
      </div>
      <div className="lot-bar">
        <i style={{ width: `${lot.percent_remaining}%` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11.5, color: "var(--ink-faint)" }}>
        <span>Remaining</span>
        <span className="mono" style={{ color: "var(--ink)" }}>
          {lot.litres_remaining}L of {lot.litres_purchased}L
        </span>
      </div>
    </div>
  );
}

export default function LitreLots() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getLitreLots()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingScreen label="Loading your litres…" />;
  if (error) return <div className="notice notice-red">Couldn't load your litres: {error}</div>;

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Balance breakdown</span>
        <h1>My Litres</h1>
        <p className="page-sub">
          Your {data.available_litres}L balance is made up of individual litre lots, each locked at the price you paid.
        </p>
      </div>

      <div className="stat-grid" style={{ marginTop: 18 }}>
        <div className="stat-card">
          <div className="stat-label">Total balance</div>
          <div className="stat-value">{data.available_litres}L</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active lots</div>
          <div className="stat-value">{data.active_lot_count}</div>
        </div>
      </div>

      <div className="section-head">
        <h2>Active lots</h2>
      </div>
      <div className="lot-grid">
        {data.active_lots.length > 0 ? (
          data.active_lots.map((lot) => <LotCard key={lot.id} lot={lot} />)
        ) : (
          <p style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-faint)", fontSize: 13 }}>
            No active litres yet.
          </p>
        )}
      </div>

      {data.expired_lots.length > 0 && (
        <>
          <div className="section-head">
            <h2>Expired lots</h2>
          </div>
          <div className="lot-grid">
            {data.expired_lots.map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>
        </>
      )}

      <div className="notice notice-green" style={{ marginTop: 20 }}>
        <Info size={16} />
        <div>When you redeem fuel, LitreVault always draws from your earliest-expiring lot first, so nothing goes to waste.</div>
      </div>
    </>
  );
}
