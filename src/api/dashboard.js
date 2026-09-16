/** api/dashboard.js — maps to api_dashboard in views.py */
import { apiGet } from "./client";

export function getDashboard() {
  return apiGet("/dashboard/");
}
