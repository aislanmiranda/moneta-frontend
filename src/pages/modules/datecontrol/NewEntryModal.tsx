import { X } from "lucide-react";
import { useState } from "react";
import { dateControlEntriesApi, dateControlSourcesApi } from "../../../api/client";
import type {
  IconOption,
  DateControlEntryScope,
  DateControlParty,
  DateControlRecurrenceType,
} from "../../../types";
import { SCOPE_LABEL } from "./dateControlLabels";
import { PendingAttachments } from "./EntryAttachments";
import "../../../components/Modal.css";

export function NewEntryModal({
  moduleId,
  parties,
  categories,
  onClose,
  onCreated,
}: {
  moduleId: string;
  parties: DateControlParty[];
  categories: IconOption[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(
    () => (categories.find((c) => c.name === "Outro") ?? categories[0])?.id ?? "",
  );

  const [dateControlPartyId, setDateControlPartyId] = useState(parties[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<DateControlRecurrenceType>("None");
  const [recurrenceCount, setRecurrenceCount] = useState("");
  const isForecast = recurrenceType === "ForecastDays" || recurrenceType === "ForecastMonths";
  const [scope, setScope] = useState<DateControlEntryScope>("Personal");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { id: dateControlSourceId } = await dateControlSourcesApi.create(moduleId, {
        description,
        dateControlCategoryId: categoryId,
      });

      const created = await dateControlEntriesApi.create(moduleId, {
        scope,
        notes: notes.trim() || null,
        dateControlSourceId,
        dateControlPartyId,
        amount: Number(amount),
        dueDate,
        installmentsCount: null,
        recurrenceType,
        recurrenceCount: isForecast ? Number(recurrenceCount) : null,
      });

      // The entry exists at this point — an upload failure must not look like the whole save
      // failed (retrying would duplicate the entry), so it's reported separately.
      try {
        for (const file of files) {
          await dateControlEntriesApi.uploadAttachment(moduleId, created.id, file);
        }
      } catch {
        setError("Lançamento salvo, mas um comprovante não foi enviado. Anexe de novo pelo botão de editar.");
        return;
      }

      onCreated();
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
          <h2>Novo lançamento</h2>
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
              <span className="field__label">Descrição *</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Internet residencial"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Categoria *</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                {categories.length === 0 && <option value="">Cadastre em Configurar</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Valor (R$) *</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150,00"
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

          <div className="field-row">
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
              <span className="field__label">Recorrência</span>
              <select
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value as DateControlRecurrenceType)}
              >
                <option value="None">Não recorrente</option>
                <option value="ForecastDays">Previsto em Dias</option>
                <option value="ForecastMonths">Previsto em Meses</option>
                <option value="Indeterminate">Indeterminado</option>
              </select>
            </label>
          </div>

          {isForecast && (
            <label className="field">
              <span className="field__label">
                {recurrenceType === "ForecastDays" ? "Quantos dias? *" : "Quantos meses? *"}
              </span>
              <input
                type="number"
                min="1"
                max="366"
                value={recurrenceCount}
                onChange={(e) => setRecurrenceCount(e.target.value)}
                required
              />
              <span className="field__hint">
                Cria {recurrenceCount || "N"} lançamento(s), um por{" "}
                {recurrenceType === "ForecastDays" ? "dia" : "mês"}, a partir do vencimento.
              </span>
            </label>
          )}

          {recurrenceType === "Indeterminate" && (
            <p className="field__hint">
              Cria só este lançamento. Ao marcar como pago, o do mês seguinte é criado automaticamente.
            </p>
          )}

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

          <PendingAttachments files={files} onChange={setFiles} />

          {error && <p className="modal-card__error">{error}</p>}
        </div>

        <div className="modal-card__actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Salvando…" : "Salvar lançamento"}
          </button>
        </div>
      </form>
    </div>
  );
}
