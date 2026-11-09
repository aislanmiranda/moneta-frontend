import { Pencil, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { dateTimeControlEntriesApi } from "../../api/client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import type { DateTimeControlEntry, Module } from "../../types";
import { CalendarView } from "./datetimecontrol/CalendarView";
import { EditScheduleEntryModal } from "./datetimecontrol/EditScheduleEntryModal";
import { NewScheduleEntryModal } from "./datetimecontrol/NewScheduleEntryModal";
import { STATUS_META, formatDateTime } from "./datetimecontrol/dateTimeControlLabels";
import "./DateTimeControlPage.css";

type ViewMode = "list" | "calendar";

export function DateTimeControlPage({ module }: { module: Module }) {
  const [entries, setEntries] = useState<DateTimeControlEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState<string | undefined>(undefined);
  const [editingEntry, setEditingEntry] = useState<DateTimeControlEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<DateTimeControlEntry | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dateTimeControlEntriesApi.list(module.id);
      setEntries(result.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
    } catch {
      setError("Não foi possível carregar os compromissos. A API está rodando?");
    } finally {
      setLoading(false);
    }
  }, [module.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleRemove(id: string) {
    await dateTimeControlEntriesApi.remove(module.id, id);
    refetch();
  }

  return (
    <div className="schedule">
      <header className="schedule__header">
        <div>
          <h1>{module.name}</h1>
          <p>Seus compromissos agendados.</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setNewEntryDate(undefined);
            setModalOpen(true);
          }}
        >
          <Plus size={15} strokeWidth={2.4} />
          Novo compromisso
        </button>
      </header>

      <div className="schedule__view-tabs">
        <button
          type="button"
          className={"schedule__view-tab" + (viewMode === "list" ? " schedule__view-tab--active" : "")}
          onClick={() => setViewMode("list")}
        >
          Lista
        </button>
        <button
          type="button"
          className={"schedule__view-tab" + (viewMode === "calendar" ? " schedule__view-tab--active" : "")}
          onClick={() => setViewMode("calendar")}
        >
          Calendário
        </button>
      </div>

      {loading ? (
        <p className="schedule__hint">Carregando compromissos…</p>
      ) : error ? (
        <p className="schedule__hint schedule__hint--error">{error}</p>
      ) : viewMode === "calendar" ? (
        <CalendarView
          entries={entries}
          onEditEntry={(entry) => setEditingEntry(entry)}
          onCreateOnDate={(date) => {
            const withDefaultHour = new Date(date);
            withDefaultHour.setHours(9, 0, 0, 0);
            setNewEntryDate(withDefaultHour.toISOString());
            setModalOpen(true);
          }}
        />
      ) : entries.length === 0 ? (
        <p className="schedule__hint">Nenhum compromisso cadastrado ainda.</p>
      ) : (
        <table className="schedule-table">
          <colgroup>
            <col style={{ width: "40%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Título</th>
              <th>Data/hora</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const status = STATUS_META[entry.status];
              return (
                <tr key={entry.id}>
                  <td className="schedule-table__title">{entry.title}</td>
                  <td>{formatDateTime(entry.scheduledAt)}</td>
                  <td>
                    <span className={`schedule-table__status schedule-table__status--${status.tone}`}>
                      {status.label}
                    </span>
                  </td>
                  <td>
                    <div className="schedule-table__actions">
                      <button type="button" aria-label="Editar" onClick={() => setEditingEntry(entry)}>
                        <Pencil size={14} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        aria-label="Excluir"
                        className="danger"
                        onClick={() => setDeletingEntry(entry)}
                      >
                        <X size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <NewScheduleEntryModal
          moduleId={module.id}
          initialDate={newEntryDate}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            refetch();
          }}
        />
      )}

      {editingEntry && (
        <EditScheduleEntryModal
          moduleId={module.id}
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={() => {
            setEditingEntry(null);
            refetch();
          }}
        />
      )}

      {deletingEntry && (
        <ConfirmDialog
          title="Excluir compromisso"
          message={`Tem certeza que deseja excluir "${deletingEntry.title}"? Essa ação não pode ser desfeita.`}
          onCancel={() => setDeletingEntry(null)}
          onConfirm={async () => {
            await handleRemove(deletingEntry.id);
            setDeletingEntry(null);
          }}
        />
      )}
    </div>
  );
}
