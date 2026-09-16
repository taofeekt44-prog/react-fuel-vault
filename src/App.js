import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WalletProvider } from "./context/WalletContext";

import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import StaffRoute from "./routes/StaffRoute";
import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LitreLots from "./pages/LitreLots";
import BuyLitres from "./pages/BuyLitres";
import PaymentCallback from "./pages/PaymentCallback";
import RedeemFuel from "./pages/RedeemFuel";
import QrRedemption from "./pages/QrRedemption";
import AttendantPortal from "./pages/AttendantPortal";
import AdminPrice from "./pages/AdminPrice";
import NotFound from "./pages/NotFound";

import "./index.css";

/**
 * Route map, grouped by who's allowed to see them:
 *
 *   GuestRoute    -> only reachable when logged OUT (login, register)
 *   ProtectedRoute -> only reachable when logged IN (everything else)
 *   StaffRoute    -> only reachable when logged in AND is_staff
 *
 * AuthProvider wraps the whole router because GuestRoute/ProtectedRoute/
 * StaffRoute all call useAuth() — it has to be an ancestor of every route.
 * WalletProvider sits just inside AuthProvider (it depends on
 * isAuthenticated) and wraps only the app pages that need the live balance.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <Routes>
            {/* Public-only: redirects to "/" if already logged in */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Payment callback needs to be reachable while logged in but
                sits outside AppLayout — it's a full-screen result page, not
                part of the sidebar/bottomnav shell. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/payment/callback" element={<PaymentCallback />} />
              <Route path="/redeem/qr/:redemptionId" element={<QrRedemption />} />
            </Route>

            {/* Main app shell: sidebar + topbar + bottom nav around every page */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/lots" element={<LitreLots />} />
                <Route path="/buy" element={<BuyLitres />} />
                <Route path="/redeem" element={<RedeemFuel />} />
              </Route>
            </Route>

            {/* Staff-only */}
            <Route element={<StaffRoute />}>
              <Route path="/attendant" element={<AttendantPortal />} />
              <Route path="/admin/price" element={<AdminPrice />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
