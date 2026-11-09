import { Check } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { notificationsApi } from "../../api/client";
import { useNotifications } from "../../notifications/NotificationsProvider";
import "./NotificationsPage.css";

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export function NotificationsPage() {
  const { notifications, markAsRead, removeMany, devicePermission, requestDevicePermission } = useNotifications();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const allSelected = notifications.length > 0 && selectedIds.size === notifications.length;

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(notifications.map((n) => n.id)));
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    await notificationsApi.bulkDelete(ids);
    removeMany(ids);
    setSelectedIds(new Set());
    setConfirmingDelete(false);
  }

  return (
    <div className="notifications-page">
      <header className="notifications-page__header">
        <h1>Notificações</h1>
        <p>Histórico completo de lembretes gerados pelas suas rotinas.</p>
      </header>

      {devicePermission !== "granted" && (
        <div className="notifications-page__device">
          {devicePermission === "default" && (
            <>
              <span>Receba os lembretes como notificação neste dispositivo.</span>
              <button type="button" className="btn btn--primary" onClick={requestDevicePermission}>
                Ativar notificações
              </button>
            </>
          )}
          {devicePermission === "denied" && (
            <span>Notificações bloqueadas neste dispositivo — libere nas configurações do navegador.</span>
          )}
          {devicePermission === "unsupported" && (
            <span>
              Este navegador não suporta notificações. No iPhone, adicione o app à tela de início
              (Compartilhar → Adicionar à Tela de Início) e abra por lá.
            </span>
          )}
        </div>
      )}

      {notifications.length === 0 ? (
        <p className="notifications-page__empty">Nenhuma notificação ainda.</p>
      ) : (
        <>
          <div className="notifications-page__toolbar">
            <label className="notifications-page__select-all">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              Selecionar todas
            </label>
            <button
              type="button"
              className="btn btn--danger-outline"
              disabled={selectedIds.size === 0}
              onClick={() => setConfirmingDelete(true)}
            >
              Remover selecionadas{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
          </div>

          <ul className="notifications-page__list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={
                  "notifications-page__item" + (n.readAt ? "" : " notifications-page__item--unread")
                }
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(n.id)}
                  onChange={() => toggleOne(n.id)}
                  aria-label="Selecionar notificação"
                />
                <div className="notifications-page__item-body">
                  <p>{n.message}</p>
                  <span>
                    Entregue em {formatDateTime(n.deliveredAt)}
                    {n.readAt && ` · lida em ${formatDateTime(n.readAt)}`}
                  </span>
                </div>
                {!n.readAt && (
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => markAsRead(n.id)}
                  >
                    <Check size={14} strokeWidth={3} />
                    Marcar como recebida
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="Remover notificações"
          message={`Tem certeza que deseja remover ${selectedIds.size} notificaç${selectedIds.size > 1 ? "ões" : "ão"}? Essa ação não pode ser desfeita.`}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleBulkDelete}
        />
      )}
    </div>
  );
}
