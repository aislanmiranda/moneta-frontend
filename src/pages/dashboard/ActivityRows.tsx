import { Bell, Calendar, Receipt, Repeat } from "lucide-react";
import { describeSchedule } from "../../constants/frequencyPresets";
import type { Notification, Routine, RoutineType } from "../../types";

const TYPE_META: Record<RoutineType, { icon: typeof Bell; tone: "warning" | "accent" | "info" }> = {
  DateControlReminder: { icon: Receipt, tone: "warning" },
  TimeControlReminder: { icon: Repeat, tone: "info" },
  DateTimeControlReminder: { icon: Calendar, tone: "accent" },
};

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UpcomingRoutineRow({ routine }: { routine: Routine }) {
  const meta = TYPE_META[routine.type];
  const Icon = meta.icon;

  return (
    <li className="activity-row">
      <span className={`activity-row__icon activity-row__icon--${meta.tone}`}>
        <Icon size={15} strokeWidth={2} />
      </span>
      <span className="activity-row__info">
        <span className="activity-row__title">{routine.title}</span>
        <span className="activity-row__subtitle">
          {routine.moduleName} · {describeSchedule(routine)}
        </span>
      </span>
      <span className="activity-row__meta">
        <span className="activity-row__when">{formatWhen(routine.nextRunAt)}</span>
      </span>
    </li>
  );
}

export function NotificationRow({
  notification,
  moduleName,
}: {
  notification: Notification;
  moduleName: string;
}) {
  const meta = TYPE_META[notification.category];
  const Icon = meta.icon;

  return (
    <li className="activity-row">
      <span className={`activity-row__icon activity-row__icon--${meta.tone}`}>
        <Icon size={15} strokeWidth={2} />
      </span>
      <span className="activity-row__info">
        <span className="activity-row__title">{notification.message}</span>
        <span className="activity-row__subtitle">{moduleName}</span>
      </span>
      <span className="activity-row__meta">
        <span className="activity-row__when">{formatWhen(notification.deliveredAt)}</span>
        {!notification.readAt && (
          <span className="activity-row__tag activity-row__tag--warning">Nova</span>
        )}
      </span>
    </li>
  );
}
