import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ApiError } from "../../../api/client";

interface ListItem {
  id: string;
  name: string;
  usageCount: number;
}

/**
 * Add / rename / delete for one of a module's lookup lists (centros de custo, categorias, pessoas,
 * tipos). Each list only differs in its extra field (relationship or icon), supplied through
 * `renderFields`; errors from the API (duplicate name, still in use) are shown inline.
 */
export function EditableList<T extends ListItem, D extends { name: string }>({
  items,
  emptyDraft,
  toDraft,
  renderFields,
  renderLabel,
  usageLabel,
  onCreate,
  onUpdate,
  onRemove,
}: {
  items: T[];
  emptyDraft: D;
  toDraft: (item: T) => D;
  renderFields: (draft: D, setDraft: (draft: D) => void) => ReactNode;
  renderLabel: (item: T) => ReactNode;
  /** e.g. (n) => `${n} lançamento(s)` */
  usageLabel: (count: number) => string;
  onCreate: (draft: D) => Promise<void>;
  onUpdate: (id: string, draft: D) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [newDraft, setNewDraft] = useState<D>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<D>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setError(err instanceof ApiError && err.status === 400 ? err.message : "Não foi possível salvar.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (await run(() => onCreate(newDraft))) setNewDraft(emptyDraft);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId && (await run(() => onUpdate(editingId, editDraft)))) setEditingId(null);
  }

  return (
    <div className="editable-list">
      <form className="editable-list__form" onSubmit={handleCreate}>
        <label className="field editable-list__name">
          <span className="field__label">Nome</span>
          <input
            type="text"
            value={newDraft.name}
            onChange={(e) => setNewDraft({ ...newDraft, name: e.target.value })}
            maxLength={100}
            required
          />
        </label>
        {renderFields(newDraft, setNewDraft)}
        <button type="submit" className="btn btn--primary editable-list__add" disabled={busy}>
          <Plus size={14} strokeWidth={2.4} />
          Adicionar
        </button>
      </form>

      {error && <p className="editable-list__error">{error}</p>}

      {items.length === 0 ? (
        <p className="editable-list__empty">Nada cadastrado ainda.</p>
      ) : (
        <ul className="editable-list__items">
          {items.map((item) =>
            item.id === editingId ? (
              <li key={item.id} className="editable-list__item editable-list__item--editing">
                <form className="editable-list__form" onSubmit={handleUpdate}>
                  <label className="field editable-list__name">
                    <span className="field__label">Nome</span>
                    <input
                      type="text"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                      maxLength={100}
                      required
                      autoFocus
                    />
                  </label>
                  {renderFields(editDraft, setEditDraft)}
                  <div className="editable-list__edit-actions">
                    <button type="submit" className="editable-list__icon-btn" aria-label="Salvar" disabled={busy}>
                      <Check size={15} strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      className="editable-list__icon-btn"
                      aria-label="Cancelar"
                      onClick={() => setEditingId(null)}
                    >
                      <X size={15} strokeWidth={2.4} />
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={item.id} className="editable-list__item">
                <span className="editable-list__label">{renderLabel(item)}</span>
                <span className="editable-list__usage">
                  {item.usageCount > 0 ? `Em uso: ${usageLabel(item.usageCount)}` : "Sem uso"}
                </span>
                <button
                  type="button"
                  className="editable-list__icon-btn"
                  aria-label={`Editar ${item.name}`}
                  onClick={() => {
                    setError(null);
                    setEditingId(item.id);
                    setEditDraft(toDraft(item));
                  }}
                >
                  <Pencil size={14} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="editable-list__icon-btn editable-list__icon-btn--danger"
                  aria-label={`Excluir ${item.name}`}
                  title={item.usageCount > 0 ? "Em uso — não pode ser excluído" : "Excluir"}
                  disabled={busy || item.usageCount > 0}
                  onClick={() => run(() => onRemove(item.id))}
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
