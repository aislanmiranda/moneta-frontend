import { X } from "lucide-react";
import { useState } from "react";
import { dateTimeControlEntriesApi } from "../../../api/client";
import { toDatetimeLocalValue } from "./dateTimeControlLabels";
import "../../../components/Modal.css";

export function NewScheduleEntryModal({
  moduleId,
  initialDate,
  onClose,
  onCreated,
}: {
  moduleId: string;
  /** ISO datetime to pre-fill "Data e hora" with — set when opened from a calendar day click. */
  initialDate?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(initialDate ? toDatetimeLocalValue(initialDate) : "");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await dateTimeControlEntriesApi.create(moduleId, {
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        notes: notes || null,
      });
      onCreated();
    } catch {
      setError("Não foi possível salvar. Confira os campos e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-card__header">
          <h2>Novo compromisso</h2>
          <button type="button" className="modal-card__close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="modal-card__body">
          <label className="field">
            <span className="field__label">Título *</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião com o time"
              required
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Data e hora *</span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Duração (minutos)</span>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="Ex: 60"
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Notas</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>

          {error && <p className="modal-card__error">{error}</p>}
        </div>

        <div className="modal-card__actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Salvando…" : "Salvar compromisso"}
          </button>
        </div>
      </form>
    </div>
  );
}
