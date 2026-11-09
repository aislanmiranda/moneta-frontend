import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { DAY_LABELS, DAY_ORDER } from "../../../constants/frequencyPresets";
import type { DateTimeControlEntry } from "../../../types";
import { STATUS_META } from "./dateTimeControlLabels";
import "./CalendarView.css";

const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Every cell shown in the 7xN grid, including the trailing days of the previous/next month
 * needed to fill whole weeks (Sunday-first, same convention as DAY_ORDER). */
function buildMonthGrid(visibleMonth: Date): Date[] {
  const first = startOfMonth(visibleMonth);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

  const totalWeeks = Math.ceil((first.getDay() + daysInMonth(visibleMonth)) / 7);

  return Array.from({ length: totalWeeks * 7 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

const MAX_VISIBLE_PER_DAY = 3;

export function CalendarView({
  entries,
  onEditEntry,
  onCreateOnDate,
}: {
  entries: DateTimeControlEntry[];
  onEditEntry: (entry: DateTimeControlEntry) => void;
  onCreateOnDate: (date: Date) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));

  const entriesByDay = useMemo(() => {
    const map = new Map<string, DateTimeControlEntry[]>();
    for (const entry of entries) {
      const key = toDateKey(new Date(entry.scheduledAt));
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const cells = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const todayKey = toDateKey(new Date());

  function goToMonth(offset: number) {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  return (
    <div className="calendar-view">
      <div className="calendar-view__toolbar">
        <button type="button" className="calendar-view__nav" onClick={() => goToMonth(-1)} aria-label="Mês anterior">
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <span className="calendar-view__month">
          {MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
        </span>
        <button type="button" className="calendar-view__nav" onClick={() => goToMonth(1)} aria-label="Próximo mês">
          <ChevronRight size={16} strokeWidth={2} />
        </button>
        <button type="button" className="btn btn--outline calendar-view__today" onClick={() => setVisibleMonth(startOfMonth(new Date()))}>
          Hoje
        </button>
      </div>

      <div className="calendar-view__grid">
        {DAY_ORDER.map((day) => (
          <div key={day} className="calendar-view__weekday">
            {DAY_LABELS[day]}
          </div>
        ))}

        {cells.map((date) => {
          const key = toDateKey(date);
          const dayEntries = entriesByDay.get(key) ?? [];
          const isOutsideMonth = date.getMonth() !== visibleMonth.getMonth();
          const isToday = key === todayKey;
          const visible = dayEntries.slice(0, MAX_VISIBLE_PER_DAY);
          const overflow = dayEntries.length - visible.length;

          return (
            <button
              type="button"
              key={key}
              className={
                "calendar-view__cell" +
                (isOutsideMonth ? " calendar-view__cell--outside" : "") +
                (isToday ? " calendar-view__cell--today" : "")
              }
              onClick={() => onCreateOnDate(date)}
            >
              <span className="calendar-view__cell-day">{date.getDate()}</span>
              <span className="calendar-view__cell-entries">
                {visible.map((entry) => (
                  <span
                    key={entry.id}
                    className={`calendar-view__chip calendar-view__chip--${STATUS_META[entry.status].tone}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEntry(entry);
                    }}
                  >
                    {entry.title}
                  </span>
                ))}
                {overflow > 0 && <span className="calendar-view__chip-more">+{overflow}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
