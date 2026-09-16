/**
 * api/redeem.js — maps to api_redeem_info / api_generate_qr / api_qr_expired
 */
import { apiGet, apiPost } from "./client";

export function getRedeemInfo() {
  return apiGet("/redeem/");
}

/** @param {{litres:number|string, station_id:number|string}} payload */
export function generateQr(payload) {
  return apiPost("/generate-qr/", payload);
}

export function getQrStatus(redemptionId) {
  return apiGet(`/qr-expired/${redemptionId}/`);
}
