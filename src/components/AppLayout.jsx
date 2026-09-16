/**
 * components/AppLayout.jsx
 * The visual shell (sidebar + topbar + mobile bottom nav) around every
 * authenticated page. Rendered once by the router (see App.js) around a
 * nested <Outlet/>, so individual pages only render their own content —
 * they never rebuild the nav themselves. Reads the current user straight
 * from AuthContext, so the sidebar's name/initials/logout button are always
 * accurate without being passed down as props.
 */
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { Home, Droplet, PlusCircle, QrCode, Clock, TrendingUp, LogOut, Bell } from "./icons";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: Home, end: true },
  { to: "/lots", label: "My Litres", icon: Droplet },
  { to: "/buy", label: "Buy Litres", icon: PlusCircle },
  { to: "/redeem", label: "Redeem", icon: QrCode },
  { to: "/transactions", label: "Transactions", icon: Clock },
  { to: "/price-history", label: "Price History", icon: TrendingUp },
];

const BOTTOM_NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/lots", label: "My Litres", icon: Droplet },
  { to: "/buy", label: "Buy", icon: PlusCircle },
  { to: "/redeem", label: "Redeem", icon: QrCode },
  { to: "/transactions", label: "History", icon: Clock },
];

function initialsOf(user) {
  const source = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "U";
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { availableLitres } = useWallet();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "Account";

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Droplet size={16} color="#fff" />
          </div>
          <span className="brand-name">LitreVault</span>
        </div>

        <nav className="side-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => "side-link" + (isActive ? " active" : "")}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="side-foot">
          <div className="side-user">
            <div className="side-avatar">{initialsOf(user)}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{displayName}</div>
              <div className="mono" style={{ color: "var(--ink-faint)", fontSize: 11 }}>
                Litres: {availableLitres.toFixed(3)}L
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 12, padding: "9px 12px", fontSize: 13 }}
            onClick={handleLogout}
          >
            <LogOut size={15} style={{ marginRight: 6, verticalAlign: "-2px" }} />
            Log out
          </button>
        </div>
      </aside>

      <div>
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark">
              <Droplet size={16} color="#fff" />
            </div>
            <span className="brand-name">LitreVault</span>
          </div>
          <button type="button" className="icon-btn" aria-label="Notifications">
            <Bell size={18} />
          </button>
        </div>

        <div className="content">
          {/* Each protected page renders here */}
          <Outlet />
        </div>
      </div>

      <nav className="bottomnav">
        {BOTTOM_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
