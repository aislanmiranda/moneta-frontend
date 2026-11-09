import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { routinesApi } from "../../api/client";
import { useModules } from "../../api/useModules";
import { ScheduleField, type ScheduleFieldHandle } from "../../components/schedule/ScheduleField";
import type { ReminderRules, Routine } from "../../types";
import "../../components/Modal.css";

/** Creates a routine when `routine` is omitted, edits it otherwise. The module is fixed after
 * creation — it decides the routine's type (and which job runs it) on the backend. */
export function RoutineModal({
  routine,
  onClose,
  onSaved,
}: {
  routine?: Routine;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = routine !== undefined;
  const { modules, loading: modulesLoading } = useModules();
  const [title, setTitle] = useState(routine?.title ?? "");
  const [moduleId, setModuleId] = useState(routine?.moduleId ?? "");
  const rules = routine?.reminderRules;
  const [beforeDueDays, setBeforeDueDays] = useState(
    rules ? (rules.beforeDueDays != null ? String(rules.beforeDueDays) : "") : "1",
  );
  const [beforeDueTime, setBeforeDueTime] = useState(rules?.beforeDueTime ?? "09:00");
  const [onDueDate, setOnDueDate] = useState(rules?.onDueDate ?? true);
  const [afterDueRepeatMinutes, setAfterDueRepeatMinutes] = useState(
    rules?.afterDueRepeatMinutes != null ? String(rules.afterDueRepeatMinutes) : "",
  );
  const scheduleRef = useRef<ScheduleFieldHandle>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!moduleId && modules.length > 0) {
      setModuleId(modules[0].id);
    }
  }, [modules, moduleId]);

  const selectedModule = modules.find((m) => m.id === moduleId);

  function buildReminderRules(): ReminderRules | null {
    if (selectedModule?.pattern !== "DateControl") return null;
    return {
      beforeDueDays: beforeDueDays ? Number(beforeDueDays) : null,
      beforeDueTime: beforeDueDays ? beforeDueTime : null,
      onDueDate,
      afterDueRepeatMinutes: afterDueRepeatMinutes ? Number(afterDueRepeatMinutes) : null,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const schedule = scheduleRef.current!.getValue();
    const reminderRules = buildReminderRules();

    try {
      if (isEditing) {
        await routinesApi.update(routine.id, { title, schedule, reminderRules });
      } else {
        await routinesApi.create({ title, moduleId, schedule, reminderRules });
      }
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
          <h2>{isEditing ? "Editar rotina" : "Nova rotina"}</h2>
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
              placeholder="Ex: Lembrete de contas a pagar"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Módulo {isEditing ? "" : "*"}</span>
            {isEditing ? (
              <input type="text" value={routine.moduleName} disabled readOnly />
            ) : (
              <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} required>
                {modules.length === 0 ? (
                  <option value="" disabled>
                    {modulesLoading ? "Carregando módulos…" : "Nenhum módulo disponível — crie um primeiro"}
                  </option>
                ) : (
                  modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))
                )}
              </select>
            )}
          </label>

          {selectedModule?.pattern === "DateControl" && (
            <>
              <div className="field-row">
                <label className="field">
                  <span className="field__label">Avisar quantos dias antes do vencimento?</span>
                  <input
                    type="number"
                    min="0"
                    value={beforeDueDays}
                    onChange={(e) => setBeforeDueDays(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field__label">A que horas?</span>
                  <input
                    type="time"
                    value={beforeDueTime}
                    onChange={(e) => setBeforeDueTime(e.target.value)}
                    disabled={!beforeDueDays}
                  />
                </label>
              </div>

              <label className="checkbox-row">
                <input type="checkbox" checked={onDueDate} onChange={(e) => setOnDueDate(e.target.checked)} />
                Avisar também no dia do vencimento
              </label>

              <label className="field">
                <span className="field__label">Repetir a cada quantos minutos após o vencimento (até ser paga)?</span>
                <input
                  type="number"
                  min="1"
                  value={afterDueRepeatMinutes}
                  onChange={(e) => setAfterDueRepeatMinutes(e.target.value)}
                  placeholder="Deixe em branco para não repetir"
                />
              </label>
            </>
          )}

          <ScheduleField
            ref={scheduleRef}
            initialDaysOfWeek={routine?.daysOfWeek ?? null}
            initialHours={routine?.hours ?? [8]}
            initialMinute={routine?.minute ?? 0}
            initialRawCron={routine?.isAdvanced ? routine.cronExpression : ""}
            initialIsAdvanced={routine?.isAdvanced ?? false}
          />

          {error && <p className="modal-card__error">{error}</p>}
        </div>

        <div className="modal-card__actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar rotina"}
          </button>
        </div>
      </form>
    </div>
  );
}
