import { useEffect, useMemo, useState } from "react";
import { getBuyLitresInfo, initiatePayment } from "../api/purchases";
import { ShieldCheck } from "../components/icons";
import LoadingScreen from "../components/LoadingScreen";

const PRESETS = [10, 20, 50, 100];

export default function BuyLitres() {
  const [price, setPrice] = useState(null);
  const [litres, setLitres] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBuyLitresInfo()
      .then((data) => {
        if (!cancelled) setPrice(data.fuel_price);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const pricePerLitre = price ? Number(price.price_per_litre) : 0;
  const total = useMemo(() => litres * pricePerLitre, [litres, pricePerLitre]);

  async function handlePay(e) {
    e.preventDefault();
    setError(null);

    if (!litres || litres <= 0) {
      setError("Enter how many litres you'd like to buy.");
      return;
    }

    setSubmitting(true);
    try {
      /**
       * PAYSTACK FLOW (matches api_initiate_payment / api_verify_payment
       * exactly — see GUIDE.md Section 7 for the full walkthrough):
       *
       * 1. We POST { litres } to /api/initiate-payment/. Django computes
       *    the total server-side (never trust a client-sent amount for
       *    money), creates an InitializePaymentRecord row, and calls
       *    Paystack's Initialize Transaction API using the SECRET key —
       *    which never leaves the server. It returns a `payment_url`
       *    pointing at Paystack's hosted checkout page.
       *
       * 2. We redirect the whole browser tab there with
       *    window.location.href. There is no Paystack public key needed on
       *    this screen — the backend already did the heavy lifting.
       *
       * 3. The user pays on Paystack's page. Paystack then redirects back
       *    to whatever callback_url utils_pay.py configured when it called
       *    Paystack's initialize endpoint. That should point at this app's
       *    /payment/callback route (see pages/PaymentCallback.jsx), with
       *    ?reference=... in the URL.
       */
      const result = await initiatePayment({ litres });
      window.location.href = result.payment_url;
    } catch (err) {
      setError(err.message || "Could not start payment. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen label="Loading current price…" />;

  return (
    <div className="content" style={{ padding: 0 }}>
      <p className="page-sub" style={{ marginTop: 0 }}>
        Lock in today's price. Your litres stay valid for 90 days from purchase.
      </p>

      {error && (
        <div className="notice notice-red" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={handlePay}>
        <div className="card" style={{ marginTop: 18, textAlign: "center" }}>
          <label htmlFor="litres-input" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>
            How many litres?
          </label>
          <div style={{ position: "relative", marginTop: 12 }}>
            <input
              className="input mono input-litres"
              style={{ border: "none", background: "transparent", fontSize: 44 }}
              type="number"
              id="litres-input"
              min="1"
              max="2000"
              step="0.001"
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
          <div className="chip-group" style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 6 }}>
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p}
                className={"chip" + (litres === p ? " active" : "")}
                onClick={() => setLitres(p)}
              >
                {p}L
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="price-row">
            <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Current price</span>
            <span className="mono" style={{ fontWeight: 500 }}>
              ₦{pricePerLitre}/L
            </span>
          </div>
          <div className="divider" />
          <div className="price-row">
            <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              {litres}L × ₦{pricePerLitre}/L
            </span>
          </div>
          <div className="mono" style={{ fontSize: 30, fontWeight: 500, marginTop: 6 }}>
            = ₦{total.toLocaleString("en-NG", { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="notice notice-green" style={{ marginTop: 14 }}>
          <ShieldCheck size={16} />
          <div>Once paid, this price is locked to your {litres}L — even if the pump price rises before you redeem.</div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 20 }}>
          {submitting ? "Redirecting to payment…" : `Pay ₦${total.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`}
        </button>
      </form>
    </div>
  );
}
