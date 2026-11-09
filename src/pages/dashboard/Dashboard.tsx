import { Bell, CalendarClock, Plus, Repeat } from "lucide-react";
import { Link } from "react-router-dom";
import { useModules } from "../../api/useModules";
import { useRoutines } from "../../api/useRoutines";
import { useAuth } from "../../auth/AuthProvider";
import { useNotifications } from "../../notifications/NotificationsProvider";
import { StatCard } from "./StatCard";
import { NotificationRow, UpcomingRoutineRow } from "./ActivityRows";
import "./Dashboard.css";

const rawDate = new Date().toLocaleDateString("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const TODAY_LABEL = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

const LIST_LIMIT = 5;

export function Dashboard() {
  const { routines, loading, error } = useRoutines();
  const { modules } = useModules();
  const { notifications, unreadCount } = useNotifications();
  const { user } = useAuth();
  const firstName = user?.fullName.split(" ")[0];

  const activeRoutines = routines.filter((r) => r.status === "Active");
  const upcoming = activeRoutines
    .filter((r) => r.nextRunAt)
    .sort((a, b) => new Date(a.nextRunAt!).getTime() - new Date(b.nextRunAt!).getTime())
    .slice(0, LIST_LIMIT);
  const nextRun = upcoming[0]?.nextRunAt;

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1>Olá{firstName ? `, ${firstName}` : ""}! 👋</h1>
          <p>Aqui está o resumo das suas rotinas e lembretes.</p>
        </div>
        <span className="dashboard__date">{TODAY_LABEL}</span>
      </header>

      <section className="dashboard__stats">
        <StatCard
          icon={Repeat}
          tone="success"
          label="Rotinas"
          value={routines.length}
          suffix={`(${activeRoutines.length} ativas)`}
        />
        <StatCard
          icon={CalendarClock}
          tone="info"
          label="Próxima execução"
          value={
            nextRun
              ? new Date(nextRun).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              : "—"
          }
        />
        <StatCard icon={Bell} tone="danger" label="Notificações não lidas" value={unreadCount} />
      </section>

      <section className="dashboard__columns">
        <div className="dashboard__section">
          <div className="dashboard__section-header">
            <h2>Próximas execuções</h2>
            <div className="dashboard__section-actions">
              <Link to="/rotinas" className="link-arrow">
                Ver rotinas →
              </Link>
            </div>
          </div>
          {loading ? (
            <p className="dashboard__hint">Carregando rotinas…</p>
          ) : error ? (
            <p className="dashboard__hint dashboard__hint--error">{error}</p>
          ) : upcoming.length === 0 ? (
            <p className="dashboard__hint">
              Nenhuma rotina ativa.{" "}
              <Link to="/rotinas" className="link-arrow">
                <Plus size={13} strokeWidth={2.4} /> Criar rotina
              </Link>
            </p>
          ) : (
            <ul className="activity-list">
              {upcoming.map((routine) => (
                <UpcomingRoutineRow key={routine.id} routine={routine} />
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard__section">
          <div className="dashboard__section-header">
            <h2>Notificações recentes</h2>
            <Link to="/configuracoes/notificacoes" className="link-arrow">
              Ver todas →
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="dashboard__hint">Nenhuma notificação ainda.</p>
          ) : (
            <ul className="activity-list">
              {notifications.slice(0, LIST_LIMIT).map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  moduleName={modules.find((m) => m.id === notification.moduleId)?.name ?? "Módulo removido"}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
