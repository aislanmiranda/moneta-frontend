import { DAY_ORDER, DAY_LABELS } from "../../constants/frequencyPresets";
import {
  ANY_FIELD,
  CronFieldControl,
  composeCronField,
  parseCronField,
  type CronDomain,
  type CronFieldValue,
} from "./CronFieldControl";

export interface CronVisualState {
  minute: CronFieldValue;
  hour: CronFieldValue;
  dayDriver: "dayOfWeek" | "dayOfMonth";
  dayOfWeek: CronFieldValue;
  dayOfMonth: CronFieldValue;
  month: CronFieldValue;
}

export const DEFAULT_VISUAL_STATE: CronVisualState = {
  minute: { mode: "specific", specific: ["0"], rangeFrom: "", rangeTo: "", step: 1 },
  hour: { mode: "specific", specific: ["8"], rangeFrom: "", rangeTo: "", step: 1 },
  dayDriver: "dayOfWeek",
  dayOfWeek: { ...ANY_FIELD },
  dayOfMonth: { ...ANY_FIELD },
  month: { ...ANY_FIELD },
};

const MINUTE_DOMAIN: CronDomain = { kind: "numeric", min: 0, max: 59 };
const HOUR_DOMAIN: CronDomain = { kind: "numeric", min: 0, max: 23 };
const DAY_OF_MONTH_DOMAIN: CronDomain = { kind: "numeric", min: 1, max: 31 };
const DAY_OF_WEEK_DOMAIN: CronDomain = {
  kind: "named",
  options: DAY_ORDER.map((d) => ({ value: d, label: DAY_LABELS[d] })),
};
const MONTH_OPTIONS = [
  ["1", "Jan"], ["2", "Fev"], ["3", "Mar"], ["4", "Abr"], ["5", "Mai"], ["6", "Jun"],
  ["7", "Jul"], ["8", "Ago"], ["9", "Set"], ["10", "Out"], ["11", "Nov"], ["12", "Dez"],
] as const;
const MONTH_DOMAIN: CronDomain = { kind: "named", options: MONTH_OPTIONS.map(([value, label]) => ({ value, label })) };

export function composeCronVisual(state: CronVisualState): string {
  const minute = composeCronField(state.minute);
  const hour = composeCronField(state.hour);
  const month = composeCronField(state.month);

  const driverValue = composeCronField(state.dayDriver === "dayOfMonth" ? state.dayOfMonth : state.dayOfWeek);

  // No real day constraint either way ("*") → standard Quartz "every day" idiom
  // (dayOfMonth="*", dayOfWeek="?"), regardless of which tab was selected. Only when the
  // driver actually constrains something does it get the value and the other field "?" —
  // exactly one of the two may be "?", so "*" can never land in both at once.
  const dayOfMonth = driverValue === "*" || state.dayDriver === "dayOfMonth" ? driverValue : "?";
  const dayOfWeek = driverValue === "*" ? "?" : state.dayDriver === "dayOfWeek" ? driverValue : "?";

  return `0 ${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

/** Decomposes a 6-field cron into visual-builder state, or null if it uses syntax this builder
 * doesn't model (e.g. "1-5/2", "L", "#") — caller should fall back to raw text editing. */
export function parseCronToVisual(cron: string): CronVisualState | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 6) return null;
  const [sec, minRaw, hourRaw, domRaw, monthRaw, dowRaw] = parts;
  if (sec !== "0") return null;
  if ((domRaw === "?") === (dowRaw === "?")) return null; // exactly one must be "?"

  const minute = parseCronField(minRaw);
  const hour = parseCronField(hourRaw);
  const month = parseCronField(monthRaw);
  if (!minute || !hour || !month) return null;

  if (dowRaw === "?") {
    // "Every day" idiom (dayOfMonth="*") reads more naturally as "day of week: any" than
    // "day of month: any" — matches how Simples mode and CronBuilder represent it.
    if (domRaw === "*") {
      return { minute, hour, month, dayDriver: "dayOfWeek", dayOfWeek: { ...ANY_FIELD }, dayOfMonth: { ...ANY_FIELD } };
    }
    const dayOfMonth = parseCronField(domRaw);
    if (!dayOfMonth) return null;
    return { minute, hour, month, dayDriver: "dayOfMonth", dayOfMonth, dayOfWeek: { ...ANY_FIELD } };
  }

  const dayOfWeek = parseCronField(dowRaw);
  if (!dayOfWeek) return null;
  return { minute, hour, month, dayDriver: "dayOfWeek", dayOfWeek, dayOfMonth: { ...ANY_FIELD } };
}

export function CronVisualBuilder({
  value,
  onChange,
}: {
  value: CronVisualState;
  onChange: (v: CronVisualState) => void;
}) {
  return (
    <div className="cron-visual-builder">
      <div className="cron-visual-builder__row">
        <CronFieldControl
          label="Minuto"
          domain={MINUTE_DOMAIN}
          value={value.minute}
          onChange={(minute) => onChange({ ...value, minute })}
        />
        <CronFieldControl
          label="Hora"
          domain={HOUR_DOMAIN}
          value={value.hour}
          onChange={(hour) => onChange({ ...value, hour })}
        />
      </div>

      <div className="cron-visual-builder__day-driver">
        <span className="field__label">Repetir por</span>
        <div className="schedule-field__tabs">
          <button
            type="button"
            className={"schedule-field__tab" + (value.dayDriver === "dayOfWeek" ? " schedule-field__tab--active" : "")}
            onClick={() => onChange({ ...value, dayDriver: "dayOfWeek" })}
          >
            Dia da semana
          </button>
          <button
            type="button"
            className={"schedule-field__tab" + (value.dayDriver === "dayOfMonth" ? " schedule-field__tab--active" : "")}
            onClick={() => onChange({ ...value, dayDriver: "dayOfMonth" })}
          >
            Dia do mês
          </button>
        </div>
      </div>

      {value.dayDriver === "dayOfWeek" ? (
        <CronFieldControl
          label="Dia da semana"
          domain={DAY_OF_WEEK_DOMAIN}
          value={value.dayOfWeek}
          onChange={(dayOfWeek) => onChange({ ...value, dayOfWeek })}
        />
      ) : (
        <CronFieldControl
          label="Dia do mês"
          domain={DAY_OF_MONTH_DOMAIN}
          value={value.dayOfMonth}
          onChange={(dayOfMonth) => onChange({ ...value, dayOfMonth })}
        />
      )}

      <CronFieldControl
        label="Mês"
        domain={MONTH_DOMAIN}
        value={value.month}
        onChange={(month) => onChange({ ...value, month })}
      />
    </div>
  );
}
