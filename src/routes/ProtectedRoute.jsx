/**
 * routes/ProtectedRoute.jsx
 * Wrap any set of routes that should only be reachable while logged in.
 * Usage in App.js:
 *
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/" element={<Dashboard />} />
 *     <Route path="/lots" element={<LitreLots />} />
 *   </Route>
 *
 * `isLoading` matters here as much as `isAuthenticated`: on a hard refresh,
 * AuthContext hasn't finished asking Django "is this cookie still valid?"
 * yet. If we redirected purely on `!isAuthenticated` during that window,
 * every logged-in user would get bounced to /login on every page reload,
 * for a split second, before the real answer came back. Waiting for
 * isLoading to become false avoids that flash.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen label="Checking your session…" />;

  if (!isAuthenticated) {
    // `state={{ from: location }}` lets the Login page send the user back
    // to whatever page they originally tried to reach, after logging in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
