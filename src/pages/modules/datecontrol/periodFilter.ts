import type { DateControlEntry } from "../../../types";

const MONTH_NAMES = [
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

export interface PeriodGroup {
  year: number;
  months: { value: string; label: string }[];
}

/** Groups the years/months that actually have launches, newest first, for the period filter. */
export function buildPeriodGroups(entries: DateControlEntry[]): PeriodGroup[] {
  const byYear = new Map<number, Set<number>>();

  for (const entry of entries) {
    const [yearStr, monthStr] = entry.dueDate.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!byYear.has(year)) byYear.set(year, new Set());
    byYear.get(year)!.add(month);
  }

  return Array.from(byYear.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, months]) => ({
      year,
      months: Array.from(months)
        .sort((a, b) => b - a)
        .map((month) => ({
          value: `${year}-${String(month).padStart(2, "0")}`,
          label: MONTH_NAMES[month - 1],
        })),
    }));
}
