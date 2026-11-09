export interface SchedulePreset {
  label: string;
  daysOfWeek: string[] | null;
  hours: number[];
  minute: number;
}

export const FREQUENCY_PRESETS: SchedulePreset[] = [
  { label: "A cada hora", daysOfWeek: null, hours: Array.from({ length: 24 }, (_, i) => i), minute: 0 },
  { label: "Diariamente às 08:00", daysOfWeek: null, hours: [8], minute: 0 },
  { label: "Semanalmente (segunda, 08:00)", daysOfWeek: ["MON"], hours: [8], minute: 0 },
];

export const DAY_ORDER = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const DAY_LABELS: Record<string, string> = {
  SUN: "Dom",
  MON: "Seg",
  TUE: "Ter",
  WED: "Qua",
  THU: "Qui",
  FRI: "Sex",
  SAT: "Sáb",
};

export const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export const MONTH_LABELS: Record<string, string> = {
  JAN: "janeiro",
  FEB: "fevereiro",
  MAR: "março",
  APR: "abril",
  MAY: "maio",
  JUN: "junho",
  JUL: "julho",
  AUG: "agosto",
  SEP: "setembro",
  OCT: "outubro",
  NOV: "novembro",
  DEC: "dezembro",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function describeParts(
  minute: number,
  hours: number[] | "every",
  days: string[] | null,
  months: string[] | null = null,
): string {
  const monthsLabel =
    months && months.length > 0 ? ` em ${months.map((m) => MONTH_LABELS[m] ?? m).join(", ")}` : "";

  if (hours === "every") {
    return (minute === 0 ? "De hora em hora" : `De hora em hora, no minuto ${minute}`) + monthsLabel;
  }

  const daysLabel =
    !days || days.length === 0
      ? "Todos os dias"
      : [...days]
          .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
          .map((d) => DAY_LABELS[d] ?? d)
          .join(", ");

  const hoursLabel = [...hours]
    .sort((a, b) => a - b)
    .map((h) => `${pad(h)}:${pad(minute)}`)
    .join(", ");

  return `${daysLabel} às ${hoursLabel}${monthsLabel}`;
}

/** Parses a cron month field ("*", "10", "OCT", "3,10", "MAR,OCT") into month codes.
 * Returns null for anything with ranges/steps it can't express in plain language. */
function parseMonths(month: string): string[] | null {
  if (month === "*") return null;
  if (!/^([A-Z]{3}|\d{1,2})(,([A-Z]{3}|\d{1,2}))*$/.test(month)) return null;

  const months = month.split(",").map((m) => {
    if (/^[A-Z]{3}$/.test(m)) return MONTH_ORDER.includes(m) ? m : null;
    const n = Number(m);
    return n >= 1 && n <= 12 ? MONTH_ORDER[n - 1] : null;
  });

  return months.every((m): m is string => m !== null) ? months : null;
}

/** Parses simple 6-field crons ("0 M H * * ?", "0 M H ? * MON,WED") into friendly parts.
 * Returns null for anything with ranges/steps/wildcards it can't express in plain language
 * (e.g. "MON-FRI", every-minute "*"), so the caller can fall back to showing the raw cron. */
function parseSimpleCron(
  cron: string,
): { minute: number; hours: number[] | "every"; days: string[] | null; months: string[] | null } | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 6) return null;
  const [sec, min, hour, dom, month, dow] = parts;

  if (sec !== "0" || (dom !== "*" && dom !== "?")) return null;
  if (!/^\d+$/.test(min)) return null;
  const minute = Number(min);

  if (month !== "*") {
    const months = parseMonths(month);
    if (months === null) return null;
    return parseSimpleCronRest(minute, hour, dow, months);
  }
  return parseSimpleCronRest(minute, hour, dow, null);
}

function parseSimpleCronRest(
  minute: number,
  hour: string,
  dow: string,
  months: string[] | null,
): { minute: number; hours: number[] | "every"; days: string[] | null; months: string[] | null } | null {
  let hours: number[] | "every";
  if (hour === "*") {
    hours = "every";
  } else if (/^\d+(,\d+)*$/.test(hour)) {
    hours = hour.split(",").map(Number);
  } else {
    return null;
  }

  let days: string[] | null;
  if (dow === "?" || dow === "*") {
    days = null;
  } else if (/^[A-Z]{3}(,[A-Z]{3})*$/.test(dow) && dow.split(",").every((d) => DAY_ORDER.includes(d))) {
    days = dow.split(",");
  } else {
    return null;
  }

  return { minute, hours, days, months };
}

export function describeSchedule(schedule: {
  daysOfWeek: string[] | null;
  hours: number[];
  minute: number;
  isAdvanced: boolean;
  cronExpression: string;
}): string {
  if (!schedule.isAdvanced && schedule.hours.length > 0) {
    const hours = schedule.hours.length >= 24 ? "every" : schedule.hours;
    return describeParts(schedule.minute, hours, schedule.daysOfWeek);
  }

  const parsed = parseSimpleCron(schedule.cronExpression);
  if (parsed) return describeParts(parsed.minute, parsed.hours, parsed.days, parsed.months);

  return schedule.cronExpression || "—";
}
