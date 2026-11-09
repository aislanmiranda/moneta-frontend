import { LogOut, Plus, Search } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useModules } from "../api/useModules";
import { useAuth } from "../auth/AuthProvider";
import { resolveModuleIcon } from "../constants/moduleIcons";
import { NAV_GROUPS } from "./navConfig";
import "./Sidebar.css";

export function Sidebar() {
  const { modules } = useModules();
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark" aria-hidden="true">
          M
        </span>
        <span className="sidebar__brand-name">Moneta</span>
      </div>

      <label className="sidebar__search">
        <Search size={15} strokeWidth={2} />
        <input type="text" placeholder="Buscar..." readOnly />
        <kbd>Ctrl K</kbd>
      </label>

      <nav className="sidebar__nav">
        {NAV_GROUPS.slice(0, 1).map((group, i) => (
          <div className="sidebar__group" key={group.title ?? `group-${i}`}>
            {group.title && (
              <span className="sidebar__group-title">{group.title}</span>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  "sidebar__item" +
                  (isActive ? " sidebar__item--active" : "") +
                  (item.accent ? ` sidebar__item--${item.accent}` : "")
                }
              >
                <item.icon size={16} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar__group">
          <span className="sidebar__group-title">Módulos</span>
          {modules.map((module) => {
            const Icon = resolveModuleIcon(module.icon);
            return (
              <NavLink
                key={module.id}
                to={`/modulos/${module.slug}`}
                className={({ isActive }) =>
                  "sidebar__item" + (isActive ? " sidebar__item--active" : "")
                }
              >
                <Icon size={16} strokeWidth={2} />
                <span>{module.name}</span>
              </NavLink>
            );
          })}
          <NavLink
            to="/modulos/novo"
            className={({ isActive }) =>
              "sidebar__item" + (isActive ? " sidebar__item--active" : "")
            }
          >
            <Plus size={16} strokeWidth={2} />
            <span>Criar módulo</span>
          </NavLink>
        </div>

        {NAV_GROUPS.slice(1).map((group, i) => (
          <div className="sidebar__group" key={group.title ?? `group-${i + 1}`}>
            {group.title && (
              <span className="sidebar__group-title">{group.title}</span>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  "sidebar__item" +
                  (isActive ? " sidebar__item--active" : "") +
                  (item.accent ? ` sidebar__item--${item.accent}` : "")
                }
              >
                <item.icon size={16} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <button type="button" className="sidebar__user" onClick={logout} title="Sair">
        <span className="sidebar__user-avatar" aria-hidden="true">
          {user?.fullName.charAt(0).toUpperCase()}
        </span>
        <span className="sidebar__user-info">
          <span className="sidebar__user-name">{user?.fullName}</span>
          <span className="sidebar__user-email">{user?.login}</span>
        </span>
        <LogOut size={15} strokeWidth={2} aria-label="Sair" />
      </button>
    </aside>
  );
}
