import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyPayment } from "../api/purchases";
import { useWallet } from "../context/WalletContext";
import { CheckCircle2, AlertTriangle } from "../components/icons";
import LoadingScreen from "../components/LoadingScreen";

/**
 * pages/PaymentCallback.jsx
 * ---------------------------------------------------------------------------
 * This is the page Paystack redirects the browser back to after checkout.
 * Register its URL (e.g. https://yourapp.com/payment/callback) as the
 * callback_url your Django utils_pay.py passes to Paystack's Initialize
 * Transaction API — that's what makes Paystack land here instead of
 * wherever its own default redirect would go.
 *
 * Paystack appends `?reference=...&trxref=...` to that URL. We read
 * `reference`, call GET /api/verify-payment/?reference=... (api_verify_payment
 * in views.py), and show success/failure. That view is what actually
 * creates the LitrePurchase + LitreLot rows — nothing is "purchased" until
 * this verification step succeeds, so it's safe even if a user closes the
 * tab mid-payment or Paystack's redirect never fires (they just won't have
 * litres yet, and no money was silently lost track of on our side).
 * ---------------------------------------------------------------------------
 */
export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const { refreshWallet } = useWallet();

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const hasRun = useRef(false);

  useEffect(() => {
    // Guard against React 18 StrictMode's double-invoke in development,
    // which would otherwise call verify-payment twice for one reference.
    if (hasRun.current) return;
    hasRun.current = true;

    if (!reference) {
      setStatus("error");
      setError("No payment reference was found in the URL.");
      return;
    }

    verifyPayment(reference)
      .then(async (data) => {
        setResult(data);
        setStatus("success");
        await refreshWallet(); // so Dashboard/RedeemFuel show the new balance immediately
      })
      .catch((err) => {
        setError(err.message || "We couldn't verify this payment.");
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  if (status === "verifying") {
    return <LoadingScreen label="Confirming your payment…" />;
  }

  if (status === "error") {
    return (
      <div className="app no-shell">
        <div className="content" style={{ padding: "0 22px" }}>
          <div style={{ paddingTop: 60, textAlign: "center" }}>
            <div
              style={{
                width: 66,
                height: 66,
                borderRadius: "50%",
                background: "var(--red-100)",
                color: "var(--red-700)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <AlertTriangle size={32} />
            </div>
            <h1 style={{ fontSize: 20, marginTop: 18 }}>We couldn't confirm this payment</h1>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>{error}</p>
            <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4 }}>
              If Paystack charged you, no litres are lost — contact support with reference{" "}
              <span className="mono">{reference}</span> and we'll sort it out.
            </p>
            <Link className="btn btn-primary" style={{ marginTop: 24 }} to="/buy">
              Try Again
            </Link>
            <Link className="btn btn-secondary" style={{ marginTop: 10 }} to="/">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { purchase } = result;
  return (
    <div className="app no-shell">
      <div className="content" style={{ padding: "0 22px" }}>
        <div style={{ paddingTop: 56, textAlign: "center" }}>
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: "50%",
              background: "var(--green-100)",
              color: "var(--green-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <CheckCircle2 size={34} />
          </div>
          <h1 style={{ fontSize: 20, marginTop: 18 }}>Purchase successful</h1>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
            {purchase.litres_bought}L successfully added to your wallet
          </p>

          <div className="wallet-figure" style={{ justifyContent: "center", color: "var(--ink)", marginTop: 22 }}>
            {purchase.litres_bought}
            <span className="unit" style={{ color: "var(--ink-faint)" }}>L</span>
          </div>

          <div className="card" style={{ marginTop: 24, textAlign: "left" }}>
            <div className="price-row">
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Locked price</span>
              <span className="mono" style={{ fontWeight: 500 }}>₦{purchase.price_per_litre}/L</span>
            </div>
            <div className="divider" />
            <div className="price-row">
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Amount paid</span>
              <span className="mono" style={{ fontWeight: 500 }}>₦{Number(purchase.total_amount).toLocaleString("en-NG")}</span>
            </div>
            <div className="divider" />
            <div className="price-row">
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Payment reference</span>
              <span className="mono" style={{ fontWeight: 500, fontSize: 12.5 }}>{purchase.payment_reference}</span>
            </div>
          </div>

          <Link className="btn btn-primary" style={{ marginTop: 26 }} to="/lots">
            View My Litres
          </Link>
          <Link className="btn btn-secondary" style={{ marginTop: 10 }} to="/">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
