import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { modulesApi } from "../../api/client";
import { MODULE_ICONS } from "../../constants/moduleIcons";
import type { ModulePattern } from "../../types";
import "./CreateModule.css";

const PATTERN_OPTIONS: { key: ModulePattern; title: string; description: string }[] = [
  {
    key: "DateControl",
    title: "Controle por Data",
    description: "como o Financeiro: vencimento, sem hora fixa",
  },
  {
    key: "TimeControl",
    title: "Controle por Hora",
    description: "como Vida Saudável: horário recorrente",
  },
  {
    key: "DateTimeControl",
    title: "Controle por Data e Hora",
    description: "como uma Agenda: compromisso num dia e hora específicos",
  },
];

const ICON_OPTIONS = Object.entries(MODULE_ICONS);

export function CreateModule() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0][0]);
  const [pattern, setPattern] = useState<ModulePattern>("DateControl");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const created = await modulesApi.create({ name, icon, pattern });
      navigate(`/modulos/${created.slug}`);
    } catch {
      setError("Não foi possível criar o módulo. A API está rodando?");
      setSubmitting(false);
    }
  }

  return (
    <div className="create-module">
      <header className="create-module__header">
        <h1>Criar módulo</h1>
      </header>

      <form className="create-module__panel" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Nome *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Agenda"
            required
          />
        </label>

        <div>
          <h3 className="create-module__subheading">Ícone</h3>
          <div className="icon-grid">
            {ICON_OPTIONS.map(([key, Icon]) => (
              <button
                type="button"
                key={key}
                className={"icon-option" + (icon === key ? " icon-option--selected" : "")}
                aria-label={key}
                onClick={() => setIcon(key)}
              >
                <Icon size={18} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="create-module__subheading">Padrão</h3>
          <div className="option-cards">
            {PATTERN_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.key}
                className={"option-card" + (pattern === option.key ? " option-card--selected" : "")}
                onClick={() => setPattern(option.key)}
              >
                <span className="option-card__title">{option.title}</span>
                <span className="option-card__description">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="create-module__error">{error}</p>}

        <div className="create-module__actions">
          <button type="button" className="btn btn--outline" onClick={() => navigate("/")}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Criando…" : "Criar módulo"}
          </button>
        </div>
      </form>
    </div>
  );
}
