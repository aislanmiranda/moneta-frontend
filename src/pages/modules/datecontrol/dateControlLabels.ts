import type {
  DateControlEntry,
  DateControlEntryScope,
  DateControlEntryStatus,
} from "../../../types";

export const STATUS_META: Record<DateControlEntryStatus, { label: string; tone: string }> = {
  Pending: { label: "Pendente", tone: "warning" },
  Paid: { label: "Paga", tone: "success" },
  Overdue: { label: "Vencida", tone: "danger" },
};

export function describeRepetition(entry: DateControlEntry): string {
  const total =
    entry.installmentsCount && entry.installmentsCount > 1
      ? entry.installmentsCount
      : entry.recurrenceType === "ForecastDays" || entry.recurrenceType === "ForecastMonths"
        ? entry.recurrenceCount
        : null;

  if (entry.occurrenceNumber && total) {
    return `${entry.occurrenceNumber}/${total}`;
  }
  if (entry.recurrenceType === "Indeterminate") {
    return entry.occurrenceNumber ? `Indeterminado (${entry.occurrenceNumber}ª)` : "Indeterminado";
  }
  return "Única";
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export const SCOPE_LABEL: Record<DateControlEntryScope, string> = {
  Personal: "Pessoal",
  Work: "Trabalho",
};
