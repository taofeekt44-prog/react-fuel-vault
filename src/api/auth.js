/**
 * api/auth.js — maps to api_register / api_login in views.py
 *
 * NOTE: there is currently no /api/logout/ endpoint in the uploaded
 * views.py/urls.py. See GUIDE.md Section 5 for the two-line Django view to
 * add. AuthContext.logout() works today regardless (it clears local React
 * state so the UI reacts instantly) but won't invalidate the Django session
 * until you add that endpoint.
 */
import { apiPost } from "./client";

/**
 * @param {{firstname:string,lastname:string,username:string,email:string,password1:string,password2:string}} payload
 * matches exactly the keys api_register reads with data.get(...)
 */
export function registerUser(payload) {
  return apiPost("/register/", payload);
}

export function loginUser({ username, password }) {
  return apiPost("/login/", { username, password });
}
