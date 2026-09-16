/**
 * api/purchases.js — maps to api_buy_litres / api_initiate_payment / api_verify_payment
 *
 * Payment flow (matches the backend exactly, no Paystack keys needed here):
 *   1. initiatePayment({ litres })  -> Django creates an InitializePaymentRecord
 *      and calls Paystack (with the SECRET key, server-side only) to get a
 *      hosted checkout page. Returns { payment_reference, payment_url, amount }.
 *   2. Redirect the browser to `payment_url` (Paystack's hosted page).
 *   3. Paystack redirects back to whatever callback URL your utils_pay.py
 *      configured (should point at this app's /payment/callback route).
 *   4. That page calls verifyPayment(reference) -> Django verifies with
 *      Paystack (SECRET key again, server-side) and atomically creates the
 *      LitrePurchase + LitreLot rows if it matches.
 */
import { apiGet, apiPost } from "./client";

export function getBuyLitresInfo() {
  return apiGet("/buy/litres/");
}

export function initiatePayment({ litres }) {
  return apiPost("/initiate-payment/", { litres });
}

export function verifyPayment(reference) {
  return apiGet("/verify-payment/", { reference });
}
