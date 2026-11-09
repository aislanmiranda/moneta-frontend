import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NotificationBell } from "../components/NotificationBell";
import { ThemeToggle } from "../components/ThemeToggle";
import { NotificationsProvider } from "../notifications/NotificationsProvider";
import { Sidebar } from "./Sidebar";
import "./AppShell.css";

export function AppShell() {
  // Only matters on narrow screens, where the sidebar becomes an off-canvas drawer (AppShell.css).
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // NotificationsProvider lives here (inside the auth gate) so it only connects with a token and
  // is torn down — state and SignalR connection — when the user signs out.
  return (
    <NotificationsProvider>
    <div className={"app-shell" + (menuOpen ? " app-shell--menu-open" : "")}>
      <Sidebar />
      <div className="app-shell__backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <div className="app-shell__main">
        <header className="app-shell__topbar">
          <button
            type="button"
            className="app-shell__menu-btn"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <ThemeToggle />
          <NotificationBell />
        </header>
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
    </NotificationsProvider>
  );
}
