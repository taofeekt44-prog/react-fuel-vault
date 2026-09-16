/** api/lots.js — maps to api_litre_lots in views.py */
import { apiGet } from "./client";

export function getLitreLots() {
  return apiGet("/litre-lots/");
}
