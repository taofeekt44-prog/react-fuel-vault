/**
 * api/admin.js — maps to api_admin_price / api_admin_stations / api_admin_users
 * GET on these three only needs is_staff. POST (mutating) additionally
 * requires is_superuser in the Django view itself — the view returns 405 for
 * a staff-but-not-superuser POST, so mirror that in the UI (see
 * useAuth().isSuperuser) rather than relying on the backend alone to hide it.
 */
import { apiGet, apiPost } from "./client";

export function getPriceInfo() {
  return apiGet("/admin/price/");
}

export function setNewPrice(price_per_litre) {
  return apiPost("/admin/price/", { price_per_litre });
}

export function getStations() {
  return apiGet("/admin/stations/");
}

export function addStation({ name, address, code }) {
  return apiPost("/admin/stations/", { name, address, code });
}

export function toggleStation(station_id) {
  return apiPost("/admin/stations/", { action: "toggle", station_id });
}

export function getUsers(page = 1) {
  return apiGet("/admin/users/", { page });
}
