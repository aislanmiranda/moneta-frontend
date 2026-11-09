import type { RoutineStatus } from "../../types";

export const STATUS_LABEL: Record<RoutineStatus, string> = {
  Active: "Ativa",
  Paused: "Pausada",
};

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}
