import { X } from "lucide-react";
import { useState } from "react";
import { dateTimeControlEntriesApi } from "../../../api/client";
import type { DateTimeControlEntry } from "../../../types";
import { toDatetimeLocalValue } from "./dateTimeControlLabels";
import "../../../components/Modal.css";

export function EditScheduleEntryModal({
  moduleId,
  entry,
  onClose,
  onSaved,
}: {
  moduleId: string;
  entry: DateTimeControlEntry;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(entry.title);
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocalValue(entry.scheduledAt));
  const [durationMinutes, setDurationMinutes] = useState(
    entry.durationMinutes != null ? String(entry.durationMinutes) : "",
  );
  const [notes, setNotes] = useState(entry.notes ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await dateTimeControlEntriesApi.update(moduleId, entry.id, {
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        notes: notes || null,
      });
      onSaved();
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
          <h2>Editar compromisso</h2>
          <button type="button" className="modal-card__close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="modal-card__body">
          <label className="field">
            <span className="field__label">Título *</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
            {submitting ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
