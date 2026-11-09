import { X } from "lucide-react";
import { useRef, useState } from "react";
import { timeControlItemsApi, timeControlPartiesApi } from "../../../api/client";
import { ScheduleField, type ScheduleFieldHandle } from "../../../components/schedule/ScheduleField";
import type { IconOption, PartyRelationship, TimeControlParty } from "../../../types";
import { RELATIONSHIP_LABEL } from "./timeControlLabels";
import "../../../components/Modal.css";

const RELATIONSHIP_OPTIONS: PartyRelationship[] = ["Self", "Mother", "Father", "Spouse", "Child", "Other"];

export function NewHealthItemModal({
  moduleId,
  parties,
  types,
  onClose,
  onCreated,
}: {
  moduleId: string;
  parties: TimeControlParty[];
  types: IconOption[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [dosage, setDosage] = useState("");
  const [partyMode, setPartyMode] = useState<"select" | "new">(parties.length ? "select" : "new");
  const [timeControlPartyId, setTimeControlPartyId] = useState(parties[0]?.id ?? "");
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyRelationship, setNewPartyRelationship] = useState<PartyRelationship>("Self");
  const scheduleRef = useRef<ScheduleFieldHandle>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const partyId =
        partyMode === "new"
          ? (await timeControlPartiesApi.create(moduleId, { name: newPartyName, relationship: newPartyRelationship })).id
          : timeControlPartyId;

      await timeControlItemsApi.create(moduleId, {
        title,
        timeControlTypeId: typeId,
        timeControlPartyId: partyId,
        dosage: dosage.trim() || null,
        schedule: scheduleRef.current!.getValue(),
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
          <h2>Novo item de saúde</h2>
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
              placeholder="Ex: Vitamina D"
              required
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Tipo *</span>
              <select value={typeId} onChange={(e) => setTypeId(e.target.value)} required>
                {types.length === 0 && <option value="">Cadastre em Configurar</option>}
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Detalhe / dosagem</span>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Ex: 1 comprimido (opcional)"
              />
            </label>
          </div>

          {partyMode === "select" ? (
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
              <button type="button" className="link-arrow" onClick={() => setPartyMode("new")}>
                + Nova pessoa
              </button>
            </label>
          ) : (
            <div className="field-row">
              <label className="field">
                <span className="field__label">Nome da pessoa *</span>
                <input
                  type="text"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  placeholder="Ex: Mãe"
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Relação *</span>
                <select
                  value={newPartyRelationship}
                  onChange={(e) => setNewPartyRelationship(e.target.value as PartyRelationship)}
                >
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {RELATIONSHIP_LABEL[r]}
                    </option>
                  ))}
                </select>
              </label>
              {parties.length > 0 && (
                <button type="button" className="link-arrow" onClick={() => setPartyMode("select")}>
                  Usar pessoa existente
                </button>
              )}
            </div>
          )}

          <ScheduleField
            ref={scheduleRef}
            initialDaysOfWeek={null}
            initialHours={[8]}
            initialMinute={0}
            initialRawCron=""
            initialIsAdvanced={false}
          />

          {error && <p className="modal-card__error">{error}</p>}
        </div>

        <div className="modal-card__actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--health" disabled={submitting}>
            {submitting ? "Salvando…" : "Criar item"}
          </button>
        </div>
      </form>
    </div>
  );
}
