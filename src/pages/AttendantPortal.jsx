import { useState } from "react";
import { lookupByCode, confirmRedemption } from "../api/attendant";
import { ScanLine, CheckCircle2 } from "../components/icons";

/**
 * pages/AttendantPortal.jsx
 * Only reachable via <StaffRoute> (see routes/StaffRoute.jsx and App.js),
 * which mirrors Django's @staff_member_required on every endpoint this page
 * calls. There's no camera-based QR scanning here (that needs a real device
 * API/library) — this implements the "Enter Code" path against
 * api_attendant_portal, which is fully functional today.
 */
export default function AttendantPortal() {
  const [code, setCode] = useState("");
  const [redemption, setRedemption] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmedResult, setConfirmedResult] = useState(null);

  async function handleLookup(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await lookupByCode(code.trim());
      setRedemption(data.redemption);
    } catch (err) {
      setError(err.message || "No matching pending redemption found.");
      setRedemption(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      const data = await confirmRedemption(redemption.qr_code);
      setConfirmedResult(data.redemption);
    } catch (err) {
      setError(err.message || "Could not confirm this redemption.");
    } finally {
      setConfirming(false);
    }
  }

  function reset() {
    setCode("");
    setRedemption(null);
    setConfirmedResult(null);
    setError(null);
  }

  if (confirmedResult) {
    return (
      <div className="app no-shell">
        <div className="content" style={{ padding: "0 22px" }}>
          <div style={{ paddingTop: 60, textAlign: "center" }}>
            <div style={{ width: 66, height: 66, borderRadius: "50%", background: "var(--green-100)", color: "var(--green-700)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
              <CheckCircle2 size={34} />
            </div>
            <h1 style={{ fontSize: 20, marginTop: 18 }}>Redemption successful</h1>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>
              <span className="mono" style={{ color: "var(--ink)" }}>{confirmedResult.litres_redeemed}L</span> deducted from the customer's wallet
            </p>
            <button type="button" className="btn btn-primary" style={{ marginTop: 26 }} onClick={reset}>
              <ScanLine size={16} /> Next Customer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app no-shell">
      <div className="content" style={{ padding: "0 22px" }}>
        <div style={{ paddingTop: 44, textAlign: "center" }}>
          <h1 style={{ fontSize: 22 }}>Fuel Redemption</h1>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>
            Enter the customer's 6-digit verification code.
          </p>

          {error && <div className="notice notice-red" style={{ marginTop: 16, textAlign: "left" }}>{error}</div>}

          {!redemption ? (
            <form onSubmit={handleLookup} style={{ marginTop: 22, textAlign: "left" }}>
              <div className="field">
                <label htmlFor="attendant-code">6-digit verification code</label>
                <input
                  className="input mono"
                  style={{ textAlign: "center", letterSpacing: "0.2em", fontSize: 20 }}
                  type="text"
                  id="attendant-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading || code.length !== 6}>
                {loading ? "Looking up…" : "Look Up Redemption"}
              </button>
            </form>
          ) : (
            <div style={{ marginTop: 22, textAlign: "left" }}>
              <div className="card">
                <div className="price-row">
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Redeeming</span>
                  <span className="mono" style={{ fontWeight: 600, fontSize: 18 }}>{redemption.litres_redeemed}L</span>
                </div>
                <div className="divider" />
                <div className="price-row">
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Station</span>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{redemption.station}</span>
                </div>
              </div>
              <button type="button" className="btn btn-primary" style={{ marginTop: 16, background: "var(--green-700)" }} disabled={confirming} onClick={handleConfirm}>
                {confirming ? "Confirming…" : "Confirm Fuel Redemption"}
              </button>
              <button type="button" className="btn btn-secondary" style={{ marginTop: 10 }} onClick={reset}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
