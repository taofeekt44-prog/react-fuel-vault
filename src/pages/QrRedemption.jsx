import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getQrStatus } from "../api/redeem";
import { useWallet } from "../context/WalletContext";
import { Clock, AlertTriangle } from "../components/icons";

function formatCountdown(seconds) {
  const s = Math.max(seconds, 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}

export default function QrRedemption() {
  const { redemptionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshWallet } = useWallet();

  // Passed straight from RedeemFuel's navigate(..., { state }) so this page
  // renders instantly without a second round trip. Falls back to null if
  // someone lands here directly (e.g. a refresh) — see the effect below.
  const initialPayload = location.state?.redemption || null;
  const [payload] = useState(initialPayload);
  const [secondsLeft, setSecondsLeft] = useState(
    initialPayload ? initialPayload.seconds_remaining : null
  );
  const [expired, setExpired] = useState(false);

  // If the user refreshes this page, router state is gone — re-derive
  // what we can from api_qr_expired, which at least confirms the
  // redemption's current status even though it doesn't resend the QR image.
  useEffect(() => {
    if (payload) return;
    getQrStatus(redemptionId)
      .then((data) => {
        if (!data.redemption) return;
        if (data.redemption.status !== "PENDING") {
          setExpired(true);
        }
      })
      .catch(() => {});
  }, [payload, redemptionId]);

  useEffect(() => {
    if (secondsLeft === null || expired) return;
    if (secondsLeft <= 0) {
      setExpired(true);
      // Tell the backend so it flips this redemption's status to EXPIRED too
      getQrStatus(redemptionId).catch(() => {});
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, expired, redemptionId]);

  const redemption = payload?.redemption;
  const countdownLabel = useMemo(() => formatCountdown(secondsLeft ?? 0), [secondsLeft]);

  function handleCancel() {
    navigate("/redeem", { replace: true });
  }

  async function handleGenerateNew() {
    await refreshWallet();
    navigate("/redeem", { replace: true });
  }

  if (expired) {
    return (
      <div className="app no-shell">
        <div className="content" style={{ padding: "0 22px" }}>
          <div style={{ paddingTop: 60, textAlign: "center" }}>
            <div
              style={{
                width: 66,
                height: 66,
                borderRadius: "50%",
                background: "var(--line-soft)",
                color: "var(--ink-faint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <Clock size={30} />
            </div>
            <h1 style={{ fontSize: 20, marginTop: 18 }}>Redemption expired</h1>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
              This QR code is no longer valid. Your litres are safe in your wallet — nothing was deducted.
            </p>
            <button type="button" className="btn btn-primary" style={{ marginTop: 26 }} onClick={handleGenerateNew}>
              Generate New QR
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="app no-shell">
        <div className="content" style={{ padding: "0 22px" }}>
          <div style={{ paddingTop: 60, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              This QR was generated for a previous session and can't be redisplayed after a refresh.
            </p>
            <button type="button" className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleGenerateNew}>
              Start a New Redemption
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
          <div className="eyebrow">Redemption QR</div>
          <div className="wallet-figure" style={{ justifyContent: "center", color: "var(--ink)", marginTop: 6 }}>
            {redemption.litres_redeemed}
            <span className="unit" style={{ color: "var(--ink-faint)" }}>L</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>{redemption.station}</div>

          <div className="card" style={{ marginTop: 22, display: "inline-block", padding: 22 }}>
            {/* api_generate_qr returns a base64 PNG — this <img> is the whole QR, no client-side QR library needed */}
            <img
              src={`data:image/png;base64,${payload.qr_image_base64}`}
              alt="Scan this QR code at the station"
              style={{ width: 210, height: 210, display: "block" }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="eyebrow">Verification code</div>
            <div className="mono" style={{ fontSize: 26, letterSpacing: "0.1em", fontWeight: 500, marginTop: 4 }}>
              {redemption.verification_code}
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--red-100)",
              color: "var(--red-700)",
              padding: "8px 16px",
              borderRadius: 100,
              fontFamily: "'IBM Plex Mono'",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            <Clock size={15} /> {countdownLabel}
          </div>

          <div className="notice notice-amber" style={{ marginTop: 22, textAlign: "left" }}>
            <AlertTriangle size={16} />
            <div>
              <strong>Show this code to the station attendant.</strong> This QR expires 10 minutes after it was generated.
            </div>
          </div>

          <button type="button" className="btn btn-secondary" style={{ marginTop: 18 }} onClick={handleCancel}>
            Cancel Redemption
          </button>
        </div>
      </div>
    </div>
  );
}
