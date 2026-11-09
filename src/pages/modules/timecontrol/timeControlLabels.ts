import type { PartyRelationship, TimeControlOccurrenceStatus } from "../../../types";

export const OCCURRENCE_STATUS_META: Record<TimeControlOccurrenceStatus, { label: string; tone: string }> = {
  Pending: { label: "Pendente", tone: "warning" },
  Done: { label: "Feito", tone: "success" },
  Missed: { label: "Perdido", tone: "danger" },
};

export const RELATIONSHIP_LABEL: Record<PartyRelationship, string> = {
  Self: "Eu",
  Father: "Pai",
  Mother: "Mãe",
  Spouse: "Cônjuge",
  Child: "Filho(a)",
  Other: "Outro",
};

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
