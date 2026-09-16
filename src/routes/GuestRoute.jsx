/**
 * routes/GuestRoute.jsx
 * The inverse of ProtectedRoute — this is the piece that "prevents an
 * authenticated user" from landing back on /login or /register. Wrap the
 * public-only routes with it:
 *
 *   <Route element={<GuestRoute />}>
 *     <Route path="/login" element={<Login />} />
 *     <Route path="/register" element={<Register />} />
 *   </Route>
 *
 * Without this, a logged-in user who manually navigates to /login (or
 * clicks a stale bookmark) would see the login form again instead of being
 * sent straight to their dashboard.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

export default function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen label="Checking your session…" />;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
