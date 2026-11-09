import { CheckCircle2, Clock3, Pencil, Plus, Settings, TriangleAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import { timeControlItemsApi, timeControlOccurrencesApi, timeControlPartiesApi } from "../../api/client";
import { useTimeControlData } from "../../api/useTimeControlData";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { StatCard } from "../dashboard/StatCard";
import type { Module, TimeControlItem } from "../../types";
import { resolveEntityIcon } from "../../constants/entityIcons";
import { OCCURRENCE_STATUS_META, RELATIONSHIP_LABEL, formatTime } from "./timecontrol/timeControlLabels";
import { describeSchedule } from "../../constants/frequencyPresets";
import { NewHealthItemModal } from "./timecontrol/NewHealthItemModal";
import { EditHealthItemModal } from "./timecontrol/EditHealthItemModal";
import { ModuleSettingsModal } from "./settings/ModuleSettingsModal";
import "./TimeControlPage.css";

export function TimeControlPage({ module }: { module: Module }) {
  const { parties, items, types, occurrences, loading, error, refetch } = useTimeControlData(module.id);
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimeControlItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<TimeControlItem | null>(null);

  const counts = useMemo(
    () => ({
      pending: occurrences.filter((o) => o.status === "Pending").length,
      done: occurrences.filter((o) => o.status === "Done").length,
      missed: occurrences.filter((o) => o.status === "Missed").length,
    }),
    [occurrences],
  );

  async function handleMarkDone(id: string) {
    await timeControlOccurrencesApi.updateStatus(module.id, id, "Done");
    refetch();
  }

  async function handleToggleItemStatus(item: TimeControlItem) {
    await timeControlItemsApi.updateStatus(module.id, item.id, item.status === "Active" ? "Paused" : "Active");
    refetch();
  }

  async function handleRemoveItem(id: string) {
    await timeControlItemsApi.remove(module.id, id);
    refetch();
  }

  async function handleRemoveParty(id: string) {
    await timeControlPartiesApi.remove(module.id, id);
    refetch();
  }

  return (
    <div className="health">
      <header className="health__header">
        <div>
          <h1>{module.name}</h1>
          <p>Remédios, água e academia — para você ou sua família.</p>
        </div>
        <div className="module-header__actions">
          <button type="button" className="btn btn--outline" onClick={() => setSettingsOpen(true)}>
            <Settings size={15} strokeWidth={2} />
            Configurar
          </button>
          <button type="button" className="btn btn--health" onClick={() => setNewItemOpen(true)}>
            <Plus size={15} strokeWidth={2.4} />
            Novo item
          </button>
        </div>
      </header>

      <section className="health__stats">
        <StatCard icon={Clock3} tone="health" label="Pendentes hoje" value={counts.pending} />
        <StatCard icon={CheckCircle2} tone="success" label="Feitos hoje" value={counts.done} />
        <StatCard icon={TriangleAlert} tone="danger" label="Perdidos" value={counts.missed} />
      </section>

      {parties.length > 0 && (
        <div className="health__persons">
          {parties.map((p) => (
            <span key={p.id} className="health__person-chip">
              {p.name} <span className="health__person-relationship">({RELATIONSHIP_LABEL[p.relationship]})</span>
              <button type="button" aria-label="Remover pessoa" onClick={() => handleRemoveParty(p.id)}>
                <X size={11} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <p className="health__hint">Carregando…</p>
      ) : error ? (
        <p className="health__hint health__hint--error">{error}</p>
      ) : (
        <>
          <section className="health__section">
            <h2>Hoje</h2>
            {occurrences.length === 0 ? (
              <p className="health__hint">Nenhuma ocorrência hoje.</p>
            ) : (
              <table className="health-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Tipo</th>
                    <th>Pessoa</th>
                    <th>Horário</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {occurrences.map((occurrence) => {
                    const TypeIcon = resolveEntityIcon(occurrence.typeIcon);
                    const status = OCCURRENCE_STATUS_META[occurrence.status];
                    return (
                      <tr key={occurrence.id}>
                        <td className="health-table__title">{occurrence.timeControlItemTitle}</td>
                        <td>
                          <span className="health-table__type">
                            <TypeIcon size={14} strokeWidth={2} />
                            {occurrence.typeName}
                          </span>
                        </td>
                        <td>{occurrence.timeControlPartyName}</td>
                        <td>{formatTime(occurrence.scheduledAt)}</td>
                        <td>
                          <span className={`health-table__status health-table__status--${status.tone}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>
                          {occurrence.status === "Pending" && (
                            <button
                              type="button"
                              className="health-table__mark-done"
                              onClick={() => handleMarkDone(occurrence.id)}
                            >
                              Marcar como feito
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section className="health__section">
            <h2>Itens cadastrados</h2>
            {items.length === 0 ? (
              <p className="health__hint">Nenhum item cadastrado ainda.</p>
            ) : (
              <table className="health-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Pessoa</th>
                    <th>Recorrência</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const TypeIcon = resolveEntityIcon(item.typeIcon);
                    return (
                      <tr key={item.id}>
                        <td className="health-table__title">
                          <div className="health-table__title-inner">
                            {item.title}
                            {item.dosage && <span className="health-table__dosage">{item.dosage}</span>}
                          </div>
                        </td>
                        <td>
                          <span className="health-table__type">
                            <TypeIcon size={14} strokeWidth={2} />
                            {item.typeName}
                          </span>
                        </td>
                        <td>{item.timeControlPartyName}</td>
                        <td>{describeSchedule(item)}</td>
                        <td>
                          <button
                            type="button"
                            className={
                              "health-table__item-status" +
                              (item.status === "Active" ? " health-table__item-status--active" : "")
                            }
                            onClick={() => handleToggleItemStatus(item)}
                          >
                            {item.status === "Active" ? "Ativo" : "Pausado"}
                          </button>
                        </td>
                        <td>
                          <div className="health-table__actions">
                            <button type="button" aria-label="Editar" onClick={() => setEditingItem(item)}>
                              <Pencil size={14} strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              aria-label="Excluir"
                              className="danger"
                              onClick={() => setDeletingItem(item)}
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
          </section>
        </>
      )}

      {newItemOpen && (
        <NewHealthItemModal
          moduleId={module.id}
          parties={parties}
          types={types}
          onClose={() => setNewItemOpen(false)}
          onCreated={() => {
            setNewItemOpen(false);
            refetch();
          }}
        />
      )}

      {editingItem && (
        <EditHealthItemModal
          moduleId={module.id}
          item={editingItem}
          parties={parties}
          types={types}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            refetch();
          }}
        />
      )}

      {deletingItem && (
        <ConfirmDialog
          title="Excluir item"
          message={`Tem certeza que deseja excluir "${deletingItem.title}"? Essa ação não pode ser desfeita.`}
          onCancel={() => setDeletingItem(null)}
          onConfirm={async () => {
            await handleRemoveItem(deletingItem.id);
            setDeletingItem(null);
          }}
        />
      )}
      {settingsOpen && (
        <ModuleSettingsModal
          module={module}
          onClose={() => {
            setSettingsOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
