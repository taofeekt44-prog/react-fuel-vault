/** api/wallet.js — maps to api_wallet in views.py */
import { apiGet } from "./client";

export function getWallet() {
  return apiGet("/wallet/");
}
