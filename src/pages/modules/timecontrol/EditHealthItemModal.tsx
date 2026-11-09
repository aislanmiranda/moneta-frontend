import { X } from "lucide-react";
import { useRef, useState } from "react";
import { timeControlItemsApi } from "../../../api/client";
import { ScheduleField, type ScheduleFieldHandle } from "../../../components/schedule/ScheduleField";
import type { IconOption, TimeControlItem, TimeControlParty } from "../../../types";
import { RELATIONSHIP_LABEL } from "./timeControlLabels";
import "../../../components/Modal.css";

export function EditHealthItemModal({
  moduleId,
  item,
  parties,
  types,
  onClose,
  onSaved,
}: {
  moduleId: string;
  item: TimeControlItem;
  parties: TimeControlParty[];
  types: IconOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [typeId, setTypeId] = useState(item.timeControlTypeId);
  const [dosage, setDosage] = useState(item.dosage ?? "");
  const [timeControlPartyId, setTimeControlPartyId] = useState(item.timeControlPartyId);
  const scheduleRef = useRef<ScheduleFieldHandle>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await timeControlItemsApi.update(moduleId, item.id, {
        title,
        timeControlTypeId: typeId,
        timeControlPartyId,
        dosage: dosage.trim() || null,
        schedule: scheduleRef.current!.getValue(),
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
          <h2>Editar item de saúde</h2>
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
              <span className="field__label">Tipo *</span>
              <select value={typeId} onChange={(e) => setTypeId(e.target.value)} required>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Detalhe / dosagem</span>
              <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Opcional" />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Pessoa *</span>
              <select
                value={timeControlPartyId}
                onChange={(e) => setTimeControlPartyId(e.target.value)}
                required
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({RELATIONSHIP_LABEL[p.relationship]})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ScheduleField
            ref={scheduleRef}
            initialDaysOfWeek={item.daysOfWeek}
            initialHours={item.hours}
            initialMinute={item.minute}
            initialRawCron={item.isAdvanced ? item.cronExpression : ""}
            initialIsAdvanced={item.isAdvanced}
          />

          {error && <p className="modal-card__error">{error}</p>}
        </div>

        <div className="modal-card__actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--health" disabled={submitting}>
            {submitting ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
