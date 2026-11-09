import { ENTITY_ICONS } from "../../../constants/entityIcons";

export function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  return (
    <div className="field">
      <span className="field__label">Ícone</span>
      <div className="icon-picker" role="radiogroup" aria-label="Ícone">
        {Object.entries(ENTITY_ICONS).map(([name, Icon]) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            aria-label={name}
            className={"icon-picker__option" + (value === name ? " icon-picker__option--selected" : "")}
            onClick={() => onChange(name)}
          >
            <Icon size={16} strokeWidth={2} />
          </button>
        ))}
      </div>
    </div>
  );
}
