import { X } from "lucide-react";
import { useState } from "react";
import { dateControlEntriesApi } from "../../../api/client";
import type { DateControlEntry, DateControlEntryScope, DateControlParty } from "../../../types";
import { SCOPE_LABEL } from "./dateControlLabels";
import { EntryAttachments } from "./EntryAttachments";
import "../../../components/Modal.css";

export function EditEntryModal({
  moduleId,
  entry,
  parties,
  onClose,
  onSaved,
  onAttachmentsChanged,
}: {
  moduleId: string;
  entry: DateControlEntry;
  parties: DateControlParty[];
  onClose: () => void;
  onSaved: () => void;
  onAttachmentsChanged: () => void;
}) {
  const [dateControlPartyId, setDateControlPartyId] = useState(entry.dateControlPartyId);
  const [amount, setAmount] = useState(String(entry.amount));
  const [dueDate, setDueDate] = useState(entry.dueDate);
  const [scope, setScope] = useState<DateControlEntryScope>(entry.scope);
  const [notes, setNotes] = useState(entry.notes ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await dateControlEntriesApi.update(moduleId, entry.id, {
        scope,
        notes: notes.trim() || null,
        dateControlPartyId,
        amount: Number(amount),
        dueDate,
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
      <form
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-card__header">
          <h2>Editar {entry.dateControlSourceDescription}</h2>
          <button type="button" className="modal-card__close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="modal-card__body">
          <label className="field">
            <span className="field__label">Tipo de despesa *</span>
            <select value={scope} onChange={(e) => setScope(e.target.value as DateControlEntryScope)}>
              {(Object.keys(SCOPE_LABEL) as DateControlEntryScope[]).map((key) => (
                <option key={key} value={key}>
                  {SCOPE_LABEL[key]}
                </option>
              ))}
            </select>
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Valor (R$) *</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Vencimento *</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Centro de custo *</span>
            <select
              value={dateControlPartyId}
              onChange={(e) => setDateControlPartyId(e.target.value)}
              required
            >
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Observação</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={4000}
              rows={5}
              placeholder="Ex: detalhamento do valor, chave PIX, contato de quem cobrou…"
            />
          </label>

          <EntryAttachments moduleId={moduleId} entryId={entry.id} onChanged={onAttachmentsChanged} />

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
