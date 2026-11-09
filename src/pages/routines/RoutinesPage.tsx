import { Pause, Pencil, Play, Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { routinesApi } from "../../api/client";
import { useModules } from "../../api/useModules";
import { useRoutines } from "../../api/useRoutines";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { describeSchedule } from "../../constants/frequencyPresets";
import type { Routine } from "../../types";
import { formatDateTime, STATUS_LABEL } from "./routineLabels";
import { RoutineModal } from "./RoutineModal";
import "./RoutinesPage.css";

export function RoutinesPage() {
  const { routines, loading, error, refetch } = useRoutines();
  const { modules } = useModules();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Routine | null>(null);
  const [deleting, setDeleting] = useState<Routine | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(message: string) {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 6000);
  }

  async function toggleStatus(routine: Routine) {
    await routinesApi.updateStatus(routine.id, routine.status === "Active" ? "Paused" : "Active");
    refetch();
  }

  async function triggerNow(routine: Routine) {
    try {
      await routinesApi.triggerNow(routine.id);
      showFeedback(`"${routine.title}" solicitada — o scheduler executa em até 30s.`);
      refetch();
    } catch {
      showFeedback("Não foi possível solicitar. A API está rodando?");
    }
  }

  return (
    <div className="routines">
      <header className="routines__header">
        <div>
          <h1>Rotinas</h1>
          <p>Agendamentos que o scheduler executa para lembrar você do que importa em cada módulo.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
          <Plus size={15} strokeWidth={2.4} />
          Nova rotina
        </button>
      </header>

      {feedback && <p className="routines__feedback">{feedback}</p>}

      <section className="routines__section">
        {loading ? (
          <p className="routines__empty">Carregando rotinas…</p>
        ) : error ? (
          <p className="routines__empty">{error}</p>
        ) : routines.length === 0 ? (
          <p className="routines__empty">Nenhuma rotina ainda. Crie a primeira em “Nova rotina”.</p>
        ) : (
          <div className="routines__table-wrap">
            <table className="routine-table">
              <thead>
                <tr>
                  <th>Rotina</th>
                  <th>Módulo</th>
                  <th>Recorrência</th>
                  <th>Próxima execução</th>
                  <th>Última execução</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {routines.map((routine) => {
                  const routineModule = modules.find((m) => m.id === routine.moduleId);
                  return (
                    <tr key={routine.id}>
                      <td className="routine-table__title" data-label="Rotina">
                        {routine.title}
                      </td>
                      <td data-label="Módulo">
                        <span
                          className={
                            "routine-table__module" +
                            (routineModule?.pattern === "TimeControl" ? " routine-table__module--health" : "")
                          }
                        >
                          {routine.moduleName}
                        </span>
                      </td>
                      <td data-label="Recorrência">{describeSchedule(routine)}</td>
                      <td data-label="Próxima">{formatDateTime(routine.nextRunAt)}</td>
                      <td data-label="Última">{formatDateTime(routine.lastExecutedAt)}</td>
                      <td data-label="Status">
                        <button
                          type="button"
                          className={
                            "routine-table__status" +
                            (routine.status === "Active" ? " routine-table__status--active" : "")
                          }
                          onClick={() => toggleStatus(routine)}
                        >
                          {routine.status === "Active" ? (
                            <Pause size={12} strokeWidth={2.4} />
                          ) : (
                            <Play size={12} strokeWidth={2.4} />
                          )}
                          {STATUS_LABEL[routine.status]}
                        </button>
                      </td>
                      <td>
                        <div className="routine-table__actions">
                          <button
                            type="button"
                            aria-label="Executar agora"
                            title="Executar agora"
                            disabled={routine.triggerRequestedAt !== null}
                            onClick={() => triggerNow(routine)}
                          >
                            <Zap size={14} strokeWidth={2} />
                          </button>
                          <button type="button" aria-label="Editar" title="Editar" onClick={() => setEditing(routine)}>
                            <Pencil size={14} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            aria-label="Excluir"
                            title="Excluir"
                            className="danger"
                            onClick={() => setDeleting(routine)}
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {creating && (
        <RoutineModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            refetch();
          }}
        />
      )}

      {editing && (
        <RoutineModal
          routine={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Excluir rotina"
          message={`Tem certeza que deseja excluir "${deleting.title}"? Essa ação não pode ser desfeita.`}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await routinesApi.remove(deleting.id);
            setDeleting(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
