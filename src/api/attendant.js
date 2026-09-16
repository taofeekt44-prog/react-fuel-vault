/**
 * api/attendant.js — maps to api_attendant_portal / api_attendant_confirm /
 * api_attendant_success. All three require request.user.is_staff (Django's
 * @staff_member_required), so gate any page that calls these behind
 * <StaffRoute> (see routes/StaffRoute.jsx).
 */
import { apiGet, apiPost } from "./client";

export function getAttendantRecent() {
  return apiGet("/attendant/");
}

/** Look a redemption up by the 6-digit code the customer reads off their QR screen */
export function lookupByCode(verification_code) {
  return apiPost("/attendant/", { verification_code });
}

export function getRedemptionForConfirm(qrCode) {
  return apiGet(`/attendant/confirm/${qrCode}/`);
}

export function confirmRedemption(qrCode) {
  return apiPost(`/attendant/confirm/${qrCode}/`, {});
}

export function getAttendantSuccess(redemptionId) {
  return apiGet(`/attendant/success/${redemptionId}/`);
}
