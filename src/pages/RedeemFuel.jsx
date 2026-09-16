import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRedeemInfo, generateQr } from "../api/redeem";
import { getLitreLots } from "../api/lots";
import { QrCode, CheckCircle2, Fuel, Clock, AlertTriangle } from "../components/icons";
import LoadingScreen from "../components/LoadingScreen";

function buildBreakdown(activeLots, target) {
  let remaining = target;
  const rows = [];
  for (const lot of activeLots) {
    if (remaining <= 0.0001) break;
    const draw = Math.min(Number(lot.litres_remaining), remaining);
    if (draw <= 0) continue;
    rows.push({ id: lot.id, draw, daysLeft: lot.days_left, warning: lot.days_left <= 14 });
    remaining -= draw;
  }
  return rows;
}

export default function RedeemFuel() {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [activeLots, setActiveLots] = useState([]);
  const [stationId, setStationId] = useState(null);
  const [litres, setLitres] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getRedeemInfo(), getLitreLots()])
      .then(([redeemData, lotsData]) => {
        if (cancelled) return;
        setInfo(redeemData);
        setActiveLots(lotsData.active_lots || []); // already ordered by expires_at, same as the backend's draw-down order
        if (redeemData.stations.length > 0) setStationId(redeemData.stations[0].id);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingScreen label="Loading stations…" />;

  const available = info ? Number(info.available_litres) : 0;
  const overLimit = litres > available;
  const breakdown = buildBreakdown(activeLots, litres > 0 ? litres : 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!stationId) {
      setError("Please select a station.");
      return;
    }
    if (!litres || litres <= 0) {
      setError("Enter how many litres to redeem.");
      return;
    }
    if (overLimit) {
      setError(`You only have ${available}L available.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await generateQr({ litres, station_id: stationId });
      // api_generate_qr returns { redemption: { id, ... }, qr_image_base64, ... }
      // Hand the whole payload to the QR screen via router state so it
      // doesn't have to re-fetch anything to render immediately.
      navigate(`/redeem/qr/${result.redemption.id}`, { state: { redemption: result } });
    } catch (err) {
      setError(err.message || "Could not generate a redemption QR.");
      setSubmitting(false);
    }
  }

  return (
    <div className="content" style={{ padding: 0 }}>
      {error && (
        <div className="notice notice-red" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="section-head" style={{ marginTop: 0 }}>
          <h2>Select a station</h2>
        </div>
        <div role="radiogroup" aria-label="Partner station" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {info.stations.map((station) => (
            <label key={station.id} className={"station-card" + (stationId === station.id ? " selected" : "")}>
              <input
                type="radio"
                name="station"
                value={station.id}
                checked={stationId === station.id}
                onChange={() => setStationId(station.id)}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              />
              <div className="station-icon">
                <Fuel size={19} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="station-name">{station.name}</div>
                <div className="station-addr">{station.address}</div>
              </div>
              {stationId === station.id && (
                <div style={{ color: "var(--green-700)" }}>
                  <CheckCircle2 size={19} />
                </div>
              )}
            </label>
          ))}
          {info.stations.length === 0 && (
            <p style={{ textAlign: "center", padding: "20px 0", color: "var(--ink-faint)", fontSize: 13 }}>
              No partner stations are active right now.
            </p>
          )}
        </div>

        <div className="section-head">
          <h2>How many litres?</h2>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-soft)", marginBottom: 2 }}>
            <span>Available</span>
            <span className="mono" style={{ color: "var(--ink)", fontWeight: 500 }}>
              {available}L
            </span>
          </div>
          <div style={{ position: "relative", marginTop: 8 }}>
            <input
              className="input mono input-litres"
              style={{ border: "none", background: "transparent", fontSize: 44 }}
              type="number"
              min="0.5"
              max={available}
              step="0.5"
              inputMode="decimal"
              value={litres}
              onChange={(e) => setLitres(parseFloat(e.target.value) || 0)}
              required
            />
            <span
              aria-hidden="true"
              style={{ position: "absolute", right: "26%", top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "var(--ink-faint)" }}
            >
              L
            </span>
          </div>
          {overLimit && (
            <div className="input-help" style={{ color: "var(--red-700)" }}>
              You can't redeem more than your available balance.
            </div>
          )}
        </div>

        <div className="section-head">
          <h2>Lots this will draw from</h2>
        </div>
        <div className="card-flush" style={{ padding: "14px 16px" }}>
          {breakdown.length > 0 ? (
            breakdown.map((row, i) => (
              <div key={row.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{row.draw.toFixed(3)}L</div>
                    <div className="txn-sub">
                      {row.warning ? "From your earliest-expiring lot" : `From a lot expiring in ${row.daysLeft} days`}
                    </div>
                  </div>
                  {row.warning ? (
                    <span className="badge badge-warning">
                      <AlertTriangle size={11} /> Expiring soon
                    </span>
                  ) : (
                    <span className="badge badge-healthy">
                      <Clock size={11} /> {i === 0 ? "First lot" : "Next lot"}
                    </span>
                  )}
                </div>
                {i < breakdown.length - 1 && <div className="divider" style={{ margin: "6px 0" }} />}
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", padding: "14px 0", color: "var(--ink-faint)", fontSize: 13 }}>
              Enter how many litres to see which lots will be used.
            </p>
          )}
        </div>
        <div className="input-help" style={{ marginTop: 10 }}>
          LitreVault always redeems from your earliest-expiring litres first — you never need to choose manually.
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting || overLimit} style={{ marginTop: 22 }}>
          <QrCode size={16} /> {submitting ? "Generating…" : "Generate Redemption QR"}
        </button>
      </form>
    </div>
  );
}
