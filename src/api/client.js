/**
 * api/client.js
 * ---------------------------------------------------------------------------
 * The ONE place that knows how to talk to Django. Every other file in api/
 * calls apiGet/apiPost from here instead of using fetch() directly, so if
 * the base URL, auth strategy, or error format ever changes, you fix it once.
 *
 * Two things matter for this project's specific backend:
 *
 * 1. Django uses SESSION-based auth (request.session via `login(request, user)`
 *    in api_login / api_register), not tokens. That means the browser must
 *    send the `sessionid` cookie on every request. `credentials: "include"`
 *    is what makes that happen — without it, every @login_required view will
 *    treat you as logged-out even right after a successful login.
 *
 * 2. The mutating endpoints (register, login, initiate-payment, generate-qr,
 *    attendant confirm) are all decorated with @csrf_exempt in views.py, so
 *    we do NOT need to attach a CSRF token here. If you ever remove
 *    @csrf_exempt from those views (recommended for production — see
 *    GUIDE.md Section 9), you'll need to read the `csrftoken` cookie and
 *    send it back as an `X-CSRFToken` header. The helper for that is left
 *    commented below so it's a one-line change when you're ready.
 * ---------------------------------------------------------------------------
 */

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

// --- Uncomment if/when you remove @csrf_exempt from views.py ---
// function getCookie(name) {
//   const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
//   return match ? decodeURIComponent(match[2]) : null;
// }

class ApiError extends Error {
  constructor(message, { status, isAuthError = false, fieldErrors = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isAuthError = isAuthError;
    this.fieldErrors = fieldErrors;
  }
}

async function request(path, { method = "GET", body, params } = {}) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    );
    const qs = new URLSearchParams(cleaned).toString();
    if (qs) url += `?${qs}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: "include", // send the Django sessionid cookie
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Django's default is to redirect unauthenticated @login_required
      // requests to a login page (302) instead of returning 401 JSON.
      // We detect that below via res.redirected / content-type, since
      // fetch() follows redirects by default and would otherwise hand us
      // an HTML page where we expected JSON.
    });
  } catch (networkErr) {
    throw new ApiError("Can't reach the server. Check your connection or that the Django server is running.", {
      status: 0,
    });
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  // Case 1: Django redirected us (login_required with no session) — fetch
  // silently followed it and we got back an HTML login page, not JSON.
  if (res.redirected || !isJson) {
    throw new ApiError("Your session has expired. Please log in again.", {
      status: res.status,
      isAuthError: true,
    });
  }

  // Case 2: proper JSON error response from a view (400/401/403/404/405/500)
  if (!res.ok) {
    const isAuthError = res.status === 401 || res.status === 403;
    throw new ApiError((data && data.error) || `Request failed (${res.status})`, {
      status: res.status,
      isAuthError,
    });
  }

  return data;
}

export const apiGet = (path, params) => request(path, { method: "GET", params });
export const apiPost = (path, body = {}) => request(path, { method: "POST", body });

export { ApiError };
