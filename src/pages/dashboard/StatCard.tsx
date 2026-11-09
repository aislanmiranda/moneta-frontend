import type { LucideIcon } from "lucide-react";

type Tone = "success" | "info" | "accent" | "danger" | "health";

export function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  suffix,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__icon">
        <Icon size={17} strokeWidth={2} />
      </span>
      <span className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">
          {value}
          {suffix && <span className="stat-card__suffix"> {suffix}</span>}
        </span>
      </span>
    </div>
  );
}
