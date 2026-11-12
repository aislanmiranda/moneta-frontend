import { CheckCircle2, Clock3, MessageSquareText, Paperclip, Pencil, Plus, Receipt, Settings, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { dateControlEntriesApi } from "../../api/client";
import { useDateControlData } from "../../api/useDateControlData";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { resolveEntityIcon } from "../../constants/entityIcons";
import { FilterTabs } from "../../components/FilterTabs";
import { SearchInput } from "../../components/SearchInput";
import type { DateControlEntry, DateControlEntryScope, Module } from "../../types";
import { StatCard } from "../dashboard/StatCard";
import {
  SCOPE_LABEL,
  STATUS_META,
  describeRepetition,
  formatCurrency,
  formatDate,
} from "./datecontrol/dateControlLabels";
import { NewEntryModal } from "./datecontrol/NewEntryModal";
import { EditEntryModal } from "./datecontrol/EditEntryModal";
import { buildPeriodGroups } from "./datecontrol/periodFilter";
import { ModuleSettingsModal } from "./settings/ModuleSettingsModal";
import "./DateControlPage.css";

type FilterKey = "todas" | "pendentes" | "pagas" | "vencidas";

const FILTER_TO_STATUS = {
  pendentes: "Pending",
  pagas: "Paid",
  vencidas: "Overdue",
} as const;

export function DateControlPage({ module }: { module: Module }) {
  const { parties, categories, entries: allEntries, loading, error, refetch } = useDateControlData(module.id);
  const [scope, setScope] = useState<DateControlEntryScope | "all">("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("todas");
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DateControlEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<DateControlEntry | null>(null);
  const [unpayingEntry, setUnpayingEntry] = useState<DateControlEntry | null>(null);

  // Scope narrows everything below (stats, tabs, table) — "Pessoal" vs "Trabalho" are two views
  // of the same module, not two modules.
  const entries = useMemo(
    () => (scope === "all" ? allEntries : allEntries.filter((e) => e.scope === scope)),
    [allEntries, scope],
  );

  const periodGroups = useMemo(() => buildPeriodGroups(entries), [entries]);

  const counts = useMemo(
    () => ({
      todas: entries.length,
      pendentes: entries.filter((e) => e.status === "Pending").length,
      pagas: entries.filter((e) => e.status === "Paid").length,
      vencidas: entries.filter((e) => e.status === "Overdue").length,
    }),
    [entries],
  );

  const totals = useMemo(
    () => ({
      pendentes: entries.filter((e) => e.status === "Pending").reduce((s, e) => s + e.amount, 0),
      pagas: entries.filter((e) => e.status === "Paid").reduce((s, e) => s + e.amount, 0),
      vencidas: entries.filter((e) => e.status === "Overdue").reduce((s, e) => s + e.amount, 0),
    }),
    [entries],
  );

  // Total do período filtrado: soma todos os lançamentos do mês, qualquer status (paga, vencida ou pendente).
  const periodEntries = useMemo(
    () => entries.filter((e) => period === "all" || e.dueDate.startsWith(period)),
    [entries, period],
  );
  const periodTotal = useMemo(() => periodEntries.reduce((s, e) => s + e.amount, 0), [periodEntries]);

  const filtered = entries
    .filter((e) => filter === "todas" || e.status === FILTER_TO_STATUS[filter])
    .filter((e) => period === "all" || e.dueDate.startsWith(period))
    .filter((e) => e.dateControlSourceDescription.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  async function handleMarkAsPaid(id: string) {
    await dateControlEntriesApi.updateStatus(module.id, id, "Paid");
    refetch();
  }

  // Sent as "Pending"; the backend turns it into Overdue when the due date has passed.
  async function handleUnmarkPaid(id: string) {
    await dateControlEntriesApi.updateStatus(module.id, id, "Pending");
    refetch();
  }

  async function handleRemove(id: string) {
    await dateControlEntriesApi.remove(module.id, id);
    refetch();
  }

  return (
    <div className="finance">
      <header className="finance__header">
        <div>
          <h1>{module.name}</h1>
          <p>Controle suas despesas pessoais e de trabalho em um só lugar.</p>
        </div>
        <div className="module-header__actions">
          <button type="button" className="btn btn--outline" onClick={() => setSettingsOpen(true)}>
            <Settings size={15} strokeWidth={2} />
            Configurar
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} strokeWidth={2.4} />
            Novo lançamento
          </button>
        </div>
      </header>


      <section className="finance__stats">
        <StatCard icon={Receipt} tone="accent" label="Total de lançamentos" value={counts.todas} suffix={formatCurrency(periodTotal)} />
        <StatCard
          icon={Clock3}
          tone="info"
          label="Pendentes"
          value={counts.pendentes}
          suffix={formatCurrency(totals.pendentes)}
        />
        <StatCard
          icon={CheckCircle2}
          tone="success"
          label="Pagas"
          value={counts.pagas}
          suffix={formatCurrency(totals.pagas)}
        />
        <StatCard
          icon={TriangleAlert}
          tone="danger"
          label="Vencidas"
          value={counts.vencidas}
          suffix={formatCurrency(totals.vencidas)}
        />
      </section>

      <div className="finance__toolbar">
        <div className="finance__toolbar-filters">
          <div className="field finance__period">
            <select
              aria-label="Filtrar por tipo de despesa"
              value={scope}
              onChange={(e) => setScope(e.target.value as DateControlEntryScope | "all")}
            >
              <option value="all">Pessoal e trabalho</option>
              <option value="Personal">{SCOPE_LABEL.Personal}</option>
              <option value="Work">{SCOPE_LABEL.Work}</option>
            </select>
          </div>
          <FilterTabs
            tabs={[
              { key: "todas", label: "Todas", count: counts.todas },
              { key: "pendentes", label: "Pendentes", count: counts.pendentes },
              { key: "pagas", label: "Pagas", count: counts.pagas },
              { key: "vencidas", label: "Vencidas", count: counts.vencidas },
            ]}
            active={filter}
            onChange={(key) => setFilter(key as FilterKey)}
          />
          {periodGroups.length > 0 && (
            <div className="field finance__period">
              <select
                aria-label="Filtrar por período"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="all">Todos os períodos</option>
                {periodGroups.map((group) => (
                  <optgroup key={group.year} label={String(group.year)}>
                    {group.months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
        </div>
        <SearchInput placeholder="Buscar conta..." value={query} onChange={setQuery} />
      </div>

      {loading ? (
        <p className="finance__hint">Carregando lançamentos…</p>
      ) : error ? (
        <p className="finance__hint finance__hint--error">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="finance__hint">Nenhum lançamento encontrado.</p>
      ) : (
        <div className="finance__table-wrap">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Repetição</th>
              <th>Centro de custo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => {
              const CategoryIcon = resolveEntityIcon(entry.categoryIcon);
              const status = STATUS_META[entry.status];
              return (
                <tr key={entry.id}>
                  <td className="finance-table__title">
                    <div className="finance-table__title-inner">
                      <span className="finance-table__title-text">{entry.dateControlSourceDescription}</span>
                      {entry.scope === "Work" && <span className="finance-table__forecast">{SCOPE_LABEL.Work}</span>}
                      {(entry.recurrenceType === "ForecastDays" || entry.recurrenceType === "ForecastMonths") && (
                        <span className="finance-table__forecast">Previsto</span>
                      )}
                      {entry.notes && (
                        <span className="finance-table__indicator" title={entry.notes}>
                          <MessageSquareText size={13} strokeWidth={2} />
                        </span>
                      )}
                      {entry.attachmentsCount > 0 && (
                        <span
                          className="finance-table__indicator"
                          title={`${entry.attachmentsCount} comprovante(s) anexado(s)`}
                        >
                          <Paperclip size={13} strokeWidth={2} />
                          {entry.attachmentsCount > 1 && entry.attachmentsCount}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="finance-table__category">
                      <CategoryIcon size={14} strokeWidth={2} />
                      {entry.categoryName}
                    </span>
                  </td>
                  <td>{formatCurrency(entry.amount)}</td>
                  <td>{formatDate(entry.dueDate)}</td>
                  <td title={describeRepetition(entry)}>{describeRepetition(entry)}</td>
                  <td title={entry.dateControlPartyName}>{entry.dateControlPartyName}</td>
                  <td>
                    <span className={`finance-table__status finance-table__status--${status.tone}`}>
                      {status.label}
                    </span>
                  </td>
                  <td>
                    <div className="finance-table__actions">
                      <span className="finance-table__mark-slot">
                        {entry.status !== "Paid" ? (
                          <button type="button" onClick={() => handleMarkAsPaid(entry.id)}>
                            Marcar como paga
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="finance-table__unmark"
                            title="Desmarcar pagamento"
                            onClick={() => setUnpayingEntry(entry)}
                          >
                            Desmarcar
                          </button>
                        )}
                      </span>
                      <span className="finance-table__icon-group">
                        <button
                          type="button"
                          className="finance-table__icon-btn"
                          aria-label="Editar"
                          title="Editar, observação e comprovantes"
                          onClick={() => setEditingEntry(entry)}
                        >
                          <Pencil size={14} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="finance-table__remove"
                          aria-label="Excluir"
                          onClick={() => setDeletingEntry(entry)}
                        >
                          ×
                        </button>
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      {modalOpen && (
        <NewEntryModal
          moduleId={module.id}
          parties={parties}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            refetch();
          }}
        />
      )}

      {editingEntry && (
        <EditEntryModal
          moduleId={module.id}
          entry={editingEntry}
          parties={parties}
          onClose={() => setEditingEntry(null)}
          onSaved={() => {
            setEditingEntry(null);
            refetch();
          }}
          onAttachmentsChanged={refetch}
        />
      )}

      {unpayingEntry && (
        <ConfirmDialog
          title="Desmarcar pagamento"
          confirmLabel="Desmarcar"
          message={
            `"${unpayingEntry.dateControlSourceDescription}" volta a ficar em aberto.` +
            (unpayingEntry.recurrenceType === "Indeterminate"
              ? " O lançamento do mês seguinte, criado por esse pagamento, também será removido se ainda não tiver sido alterado."
              : "")
          }
          onCancel={() => setUnpayingEntry(null)}
          onConfirm={async () => {
            await handleUnmarkPaid(unpayingEntry.id);
            setUnpayingEntry(null);
          }}
        />
      )}

      {deletingEntry && (
        <ConfirmDialog
          title="Excluir lançamento"
          message={`Tem certeza que deseja excluir "${deletingEntry.dateControlSourceDescription}"? Essa ação não pode ser desfeita.`}
          onCancel={() => setDeletingEntry(null)}
          onConfirm={async () => {
            await handleRemove(deletingEntry.id);
            setDeletingEntry(null);
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
