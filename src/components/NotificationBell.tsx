import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../notifications/NotificationsProvider";
import "./NotificationBell.css";

export function NotificationBell() {
  const { unreadCount, groupedUnread } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificações"
      >
        <Bell size={17} strokeWidth={2} />
        {unreadCount > 0 && <span className="notification-bell__badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <span>Notificações</span>
            <Link to="/configuracoes/notificacoes" onClick={() => setOpen(false)}>
              Ver todas
            </Link>
          </div>

          {groupedUnread.length === 0 ? (
            <p className="notification-bell__empty">Nenhuma notificação ainda.</p>
          ) : (
            <ul className="notification-bell__list">
              {groupedUnread.map((group) => (
                <li key={group.moduleId} className="notification-bell__item notification-bell__item--unread">
                  <Link
                    to={group.route}
                    className="notification-bell__item-body notification-bell__item-link"
                    onClick={() => setOpen(false)}
                  >
                    <p>{group.label}</p>
                    <span>
                      {group.count} pendência{group.count > 1 ? "s" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
