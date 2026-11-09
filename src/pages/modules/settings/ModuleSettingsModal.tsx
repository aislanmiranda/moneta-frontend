import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  dateControlCategoriesApi,
  dateControlPartiesApi,
  timeControlPartiesApi,
  timeControlTypesApi,
} from "../../../api/client";
import { resolveEntityIcon } from "../../../constants/entityIcons";
import type { DateControlParty, IconOption, Module, PartyRelationship, TimeControlParty } from "../../../types";
import { RELATIONSHIP_LABEL } from "../timecontrol/timeControlLabels";
import { EditableList } from "./EditableList";
import { IconPicker } from "./IconPicker";
import "../../../components/Modal.css";
import "./ModuleSettings.css";

type PartyDraft = { name: string; relationship: PartyRelationship };
type IconDraft = { name: string; icon: string };

const RELATIONSHIPS = Object.keys(RELATIONSHIP_LABEL) as PartyRelationship[];

interface Tab {
  key: string;
  label: string;
}

/** Per-pattern wiring: which two lists this module type has, and their API clients/wording. */
function configFor(module: Module) {
  if (module.pattern === "DateControl") {
    return {
      tabs: [
        { key: "parties", label: "Centros de custo" },
        { key: "options", label: "Categorias" },
      ] as Tab[],
      partiesApi: dateControlPartiesApi,
      optionsApi: dateControlCategoriesApi,
      partyUsage: (n: number) => `${n} lançamento${n > 1 ? "s" : ""}`,
      optionUsage: (n: number) => `${n} conta${n > 1 ? "s" : ""}`,
    };
  }
  return {
    tabs: [
      { key: "parties", label: "Pessoas" },
      { key: "options", label: "Tipos" },
    ] as Tab[],
    partiesApi: timeControlPartiesApi,
    optionsApi: timeControlTypesApi,
    partyUsage: (n: number) => `${n} ite${n > 1 ? "ns" : "m"}`,
    optionUsage: (n: number) => `${n} ite${n > 1 ? "ns" : "m"}`,
  };
}

export function ModuleSettingsModal({ module, onClose }: { module: Module; onClose: () => void }) {
  const config = configFor(module);
  const [tab, setTab] = useState(config.tabs[0].key);
  const [parties, setParties] = useState<(DateControlParty | TimeControlParty)[]>([]);
  const [options, setOptions] = useState<IconOption[]>([]);

  const reload = useCallback(async () => {
    const [p, o] = await Promise.all([config.partiesApi.list(module.id), config.optionsApi.list(module.id)]);
    setParties(p);
    setOptions(o);
    // config is derived from module.pattern, which never changes for a mounted modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.id]);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card module-settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal-card__header">
          <h2>Configurar {module.name}</h2>
          <button type="button" className="modal-card__close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <nav className="module-settings__tabs">
          {config.tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={"module-settings__tab" + (t.key === tab ? " module-settings__tab--active" : "")}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="modal-card__body">
          {tab === "parties" ? (
            // Distinct keys: both tabs render EditableList in the same spot, and without them React
            // would carry one list's draft/editing state over to the other.
            <EditableList<DateControlParty | TimeControlParty, PartyDraft>
              key="parties"
              items={parties}
              emptyDraft={{ name: "", relationship: "Other" }}
              toDraft={(p) => ({ name: p.name, relationship: p.relationship })}
              usageLabel={config.partyUsage}
              renderLabel={(p) => (
                <>
                  {p.name} <span className="editable-list__muted">· {RELATIONSHIP_LABEL[p.relationship]}</span>
                </>
              )}
              renderFields={(draft, setDraft) => (
                <label className="field">
                  <span className="field__label">Relação</span>
                  <select
                    value={draft.relationship}
                    onChange={(e) => setDraft({ ...draft, relationship: e.target.value as PartyRelationship })}
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>
                        {RELATIONSHIP_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              onCreate={async (draft) => {
                await config.partiesApi.create(module.id, draft);
                await reload();
              }}
              onUpdate={async (id, draft) => {
                await config.partiesApi.update(module.id, id, draft);
                await reload();
              }}
              onRemove={async (id) => {
                await config.partiesApi.remove(module.id, id);
                await reload();
              }}
            />
          ) : (
            <EditableList<IconOption, IconDraft>
              key="options"
              items={options}
              emptyDraft={{ name: "", icon: "MoreHorizontal" }}
              toDraft={(o) => ({ name: o.name, icon: o.icon })}
              usageLabel={config.optionUsage}
              renderLabel={(o) => {
                const Icon = resolveEntityIcon(o.icon);
                return (
                  <span className="editable-list__with-icon">
                    <Icon size={15} strokeWidth={2} />
                    {o.name}
                  </span>
                );
              }}
              renderFields={(draft, setDraft) => (
                <IconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
              )}
              onCreate={async (draft) => {
                await config.optionsApi.create(module.id, draft);
                await reload();
              }}
              onUpdate={async (id, draft) => {
                await config.optionsApi.update(module.id, id, draft);
                await reload();
              }}
              onRemove={async (id) => {
                await config.optionsApi.remove(module.id, id);
                await reload();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
