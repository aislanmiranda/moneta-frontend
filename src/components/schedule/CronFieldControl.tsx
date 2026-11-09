export type CronFieldMode = "any" | "specific" | "range" | "step";

export interface CronFieldValue {
  mode: CronFieldMode;
  specific: string[];
  rangeFrom: string;
  rangeTo: string;
  step: number;
}

export const ANY_FIELD: CronFieldValue = { mode: "any", specific: [], rangeFrom: "", rangeTo: "", step: 1 };

export interface NumericDomain {
  kind: "numeric";
  min: number;
  max: number;
}

export interface NamedDomain {
  kind: "named";
  options: { value: string; label: string }[];
}

export type CronDomain = NumericDomain | NamedDomain;

export function composeCronField(v: CronFieldValue): string {
  switch (v.mode) {
    case "any":
      return "*";
    case "specific":
      return v.specific.length ? v.specific.join(",") : "*";
    case "range":
      return v.rangeFrom && v.rangeTo ? `${v.rangeFrom}-${v.rangeTo}` : "*";
    case "step":
      return `*/${v.step || 1}`;
  }
}

// Parses one cron field (any, a comma list, a range, or a step like every-N) into a
// CronFieldValue, or null if the syntax is something this builder doesn't model (combined
// range+step, "L", "#", etc.) — caller should fall back to raw text editing in that case.
export function parseCronField(raw: string): CronFieldValue | null {
  if (raw === "*") return { ...ANY_FIELD };

  const stepMatch = raw.match(/^\*\/(\d+)$/);
  if (stepMatch) return { mode: "step", specific: [], rangeFrom: "", rangeTo: "", step: Number(stepMatch[1]) };

  const rangeMatch = raw.match(/^([A-Za-z0-9]+)-([A-Za-z0-9]+)$/);
  if (rangeMatch) return { mode: "range", specific: [], rangeFrom: rangeMatch[1], rangeTo: rangeMatch[2], step: 1 };

  if (/^[A-Za-z0-9]+(,[A-Za-z0-9]+)*$/.test(raw)) {
    return { mode: "specific", specific: raw.split(","), rangeFrom: "", rangeTo: "", step: 1 };
  }

  return null;
}

export function CronFieldControl({
  label,
  domain,
  value,
  onChange,
}: {
  label: string;
  domain: CronDomain;
  value: CronFieldValue;
  onChange: (v: CronFieldValue) => void;
}) {
  const maxStep = domain.kind === "numeric" ? domain.max : 59;

  return (
    <div className="cron-field">
      <div className="cron-field__header">
        <span className="field__label">{label}</span>
        <select value={value.mode} onChange={(e) => onChange({ ...value, mode: e.target.value as CronFieldMode })}>
          <option value="any">Qualquer</option>
          <option value="specific">Específico</option>
          <option value="range">Intervalo</option>
          <option value="step">A cada N</option>
        </select>
      </div>

      {value.mode === "specific" &&
        (domain.kind === "named" ? (
          <div className="cron-field__chips">
            {domain.options.map((o) => (
              <button
                type="button"
                key={o.value}
                className={"schedule-field__day" + (value.specific.includes(o.value) ? " schedule-field__day--selected" : "")}
                onClick={() =>
                  onChange({
                    ...value,
                    specific: value.specific.includes(o.value)
                      ? value.specific.filter((v) => v !== o.value)
                      : [...value.specific, o.value],
                  })
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            placeholder={`ex: ${domain.min},${domain.min + 1}`}
            value={value.specific.join(",")}
            onChange={(e) =>
              onChange({
                ...value,
                specific: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        ))}

      {value.mode === "range" &&
        (domain.kind === "named" ? (
          <div className="cron-field__range">
            <select value={value.rangeFrom} onChange={(e) => onChange({ ...value, rangeFrom: e.target.value })}>
              {domain.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span>até</span>
            <select value={value.rangeTo} onChange={(e) => onChange({ ...value, rangeTo: e.target.value })}>
              {domain.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="cron-field__range">
            <input
              type="number"
              min={domain.min}
              max={domain.max}
              value={value.rangeFrom}
              onChange={(e) => onChange({ ...value, rangeFrom: e.target.value })}
            />
            <span>até</span>
            <input
              type="number"
              min={domain.min}
              max={domain.max}
              value={value.rangeTo}
              onChange={(e) => onChange({ ...value, rangeTo: e.target.value })}
            />
          </div>
        ))}

      {value.mode === "step" && (
        <div className="cron-field__step">
          <span>a cada</span>
          <input
            type="number"
            min={1}
            max={maxStep}
            value={value.step}
            onChange={(e) => onChange({ ...value, step: Number(e.target.value) })}
          />
        </div>
      )}
    </div>
  );
}
