/**
 * context/AuthContext.jsx
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS (read this before copying the pattern elsewhere):
 *
 * Without Context, "is the user logged in, and who are they" would have to
 * be fetched and re-fetched in every single component that cares — the
 * sidebar (to show their name), every protected page (to gate access), the
 * buy-litres page (to know whose wallet to charge). That's both wasteful
 * (duplicate network calls) and fragile (they can drift out of sync).
 *
 * Context solves this by hoisting that one piece of shared state — plus the
 * functions that change it — to a single Provider near the root of the app.
 * Any component anywhere in the tree can call `useAuth()` and read/update
 * the SAME state, without threading props down through every layer
 * ("prop drilling").
 *
 * Django backend specifics this context is built around:
 *   - Session-based auth: after api_login/api_register succeed, Django has
 *     already set a `sessionid` cookie on the response. There is no token to
 *     store in localStorage — the browser handles the cookie automatically
 *     as long as every fetch uses `credentials: "include"` (see api/client.js).
 *   - There's no dedicated "who am I" endpoint, so we piggyback on
 *     GET /api/dashboard/ to establish the session on page load: if it
 *     succeeds, the `user` field in the response tells us who's logged in;
 *     if api/client.js throws an isAuthError, nobody's logged in.
 *     (See GUIDE.md Section 4 for a cheap /api/me/ you can add instead.)
 * ---------------------------------------------------------------------------
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginUser, registerUser } from "../api/auth";
import { getDashboard } from "../api/dashboard";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // isLoading starts true: on first paint we don't yet know if the
  // sessionid cookie (if any) is still valid, so every route guard must
  // wait for this before deciding to redirect anyone.
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDashboard();
      setUser(data.user);
    } catch (err) {
      // Any failure here (401/403, or the HTML-redirect case api/client.js
      // detects) means: as far as the UI is concerned, nobody is logged in.
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run once when the app first mounts (e.g. on a hard refresh) to restore
  // the session from the cookie the browser already has.
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (username, password) => {
    setAuthError(null);
    try {
      const data = await loginUser({ username, password });
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const register = useCallback(async (payload) => {
    setAuthError(null);
    try {
      // api_register calls Django's login() right after creating the user,
      // so a successful registration logs the user in immediately — no
      // separate login step needed.
      const data = await registerUser(payload);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    // IMPORTANT: the uploaded views.py/urls.py has no /api/logout/ endpoint.
    // This clears the LOCAL React state, so every screen reacts instantly
    // (ProtectedRoute redirects to /login, sidebar disappears, etc), but the
    // Django session cookie itself is NOT invalidated server-side until you
    // add the logout view in GUIDE.md Section 5. Add it before shipping —
    // otherwise the "logged out" user's session cookie is still technically
    // valid if someone replays it directly against the API.
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isStaff: !!user?.is_staff,
      isSuperuser: !!user?.is_superuser,
      isLoading,
      authError,
      login,
      register,
      logout,
      refreshUser: checkAuth,
    }),
    [user, isLoading, authError, login, register, logout, checkAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Practical usage anywhere in the tree:
 *
 *   import { useAuth } from "../context/AuthContext";
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 * Throws loudly if used outside <AuthProvider> so misuse fails fast in dev
 * instead of silently returning undefined.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be called inside an <AuthProvider>. Check src/App.js.");
  }
  return ctx;
}
