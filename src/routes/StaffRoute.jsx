/**
 * routes/StaffRoute.jsx
 * Every attendant/admin API view in views.py is decorated with Django's
 * @staff_member_required, meaning request.user.is_staff must be true. This
 * route guard mirrors that on the frontend so non-staff users never even
 * see the attendant/admin UI shell (the API would reject them anyway, but
 * failing fast in the UI is better UX than showing a page full of error
 * toasts).
 *
 *   <Route element={<StaffRoute />}>
 *     <Route path="/attendant" element={<AttendantPortal />} />
 *     <Route path="/admin/price" element={<AdminPrice />} />
 *   </Route>
 *
 * Note: POST to /admin/price/ and /admin/stations/ additionally requires
 * is_superuser in the view itself (staff-but-not-superuser gets a clean 405
 * from Django). This guard only checks is_staff so staff can still view
 * those admin pages read-only — use `useAuth().isSuperuser` inside the page
 * to hide/disable the mutating form controls for non-superusers.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

export default function StaffRoute() {
  const { isAuthenticated, isStaff, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen label="Checking your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/" replace />;

  return <Outlet />;
}
