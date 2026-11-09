import type { DateTimeControlEntryStatus } from "../../../types";

export const STATUS_META: Record<DateTimeControlEntryStatus, { label: string; tone: string }> = {
  Scheduled: { label: "Agendado", tone: "info" },
  Done: { label: "Concluído", tone: "success" },
  Cancelled: { label: "Cancelado", tone: "danger" },
  Missed: { label: "Perdido", tone: "danger" },
};

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Converts an ISO datetime string into the `yyyy-MM-ddTHH:mm` shape expected by
 * `<input type="datetime-local">`, and back. */
export function toDatetimeLocalValue(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
