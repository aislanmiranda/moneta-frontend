import { forwardRef, useImperativeHandle, useState } from "react";
import type { ScheduleInput } from "../../api/client";
import { DAY_LABELS, DAY_ORDER, FREQUENCY_PRESETS, describeSchedule } from "../../constants/frequencyPresets";
import {
  CronVisualBuilder,
  DEFAULT_VISUAL_STATE,
  composeCronVisual,
  parseCronToVisual,
  type CronVisualState,
} from "./CronVisualBuilder";
import "./ScheduleField.css";

export interface ScheduleFieldHandle {
  getValue: () => ScheduleInput;
}

function buildCron(daysOfWeek: string[] | null, hours: number[], minute: number): string {
  if (hours.length === 0) return "";
  const hoursField = [...new Set(hours)].sort((a, b) => a - b).join(",");
  if (!daysOfWeek || daysOfWeek.length === 0) {
    return `0 ${minute} ${hoursField} * * ?`;
  }
  return `0 ${minute} ${hoursField} ? * ${daysOfWeek.join(",")}`;
}

export const ScheduleField = forwardRef<
  ScheduleFieldHandle,
  {
    initialDaysOfWeek: string[] | null;
    initialHours: number[];
    initialMinute: number;
    initialRawCron: string;
    initialIsAdvanced: boolean;
  }
>(function ScheduleField(
  { initialDaysOfWeek, initialHours, initialMinute, initialRawCron, initialIsAdvanced },
  ref,
) {
  const [mode, setMode] = useState<"simple" | "advanced">(initialIsAdvanced ? "advanced" : "simple");
  const [days, setDays] = useState<string[]>(initialDaysOfWeek ?? []);
  const [hours, setHours] = useState<number[]>(initialHours.length ? initialHours : [8]);
  const [minute, setMinute] = useState(initialMinute);
  const [rawCron, setRawCron] = useState(initialRawCron || buildCron(initialDaysOfWeek, initialHours, initialMinute));

  const [advancedSubMode, setAdvancedSubMode] = useState<"visual" | "texto">(() =>
    parseCronToVisual(rawCron) ? "visual" : "texto",
  );
  const [visualState, setVisualState] = useState<CronVisualState>(
    () => parseCronToVisual(rawCron) ?? DEFAULT_VISUAL_STATE,
  );
  const [parseError, setParseError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    getValue: () =>
      mode === "advanced"
        ? { daysOfWeek: null, hours: [], minute: 0, rawCron: rawCron.trim() }
        : { daysOfWeek: days.length ? days : null, hours, minute, rawCron: null },
  }));

  function toggleDay(day: string) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function updateHour(index: number, value: number) {
    setHours((prev) => prev.map((h, i) => (i === index ? value : h)));
  }

  function addHour() {
    setHours((prev) => [...prev, prev.length ? prev[prev.length - 1] : 8]);
  }

  function removeHour(index: number) {
    setHours((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function applyPreset(preset: (typeof FREQUENCY_PRESETS)[number]) {
    setMode("simple");
    setDays(preset.daysOfWeek ?? []);
    setHours(preset.hours);
    setMinute(preset.minute);
  }

  function switchToAdvanced() {
    const cron = rawCron || buildCron(days.length ? days : null, hours, minute);
    setRawCron(cron);
    const parsed = parseCronToVisual(cron);
    setVisualState(parsed ?? DEFAULT_VISUAL_STATE);
    setAdvancedSubMode(parsed ? "visual" : "texto");
    setMode("advanced");
  }

  function updateVisual(next: CronVisualState) {
    setVisualState(next);
    setRawCron(composeCronVisual(next));
  }

  function switchToVisual() {
    const parsed = parseCronToVisual(rawCron);
    if (!parsed) {
      setParseError("Não foi possível interpretar essa expressão no editor visual — ajuste o texto ou simplifique.");
      return;
    }
    setVisualState(parsed);
    setAdvancedSubMode("visual");
    setParseError(null);
  }

  return (
    <div className="schedule-field">
      <div className="schedule-field__tabs">
        <button
          type="button"
          className={"schedule-field__tab" + (mode === "simple" ? " schedule-field__tab--active" : "")}
          onClick={() => setMode("simple")}
        >
          Simples
        </button>
        <button
          type="button"
          className={"schedule-field__tab" + (mode === "advanced" ? " schedule-field__tab--active" : "")}
          onClick={switchToAdvanced}
        >
          Avançado
        </button>
      </div>

      {mode === "simple" ? (
        <>
          <div className="schedule-field__presets">
            {FREQUENCY_PRESETS.map((p) => (
              <button type="button" key={p.label} className="schedule-field__preset" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          <span className="field__label">Dias</span>
          <div className="schedule-field__days">
            <button
              type="button"
              className={
                "schedule-field__day schedule-field__day-all" +
                (days.length === 0 ? " schedule-field__day--selected" : "")
              }
              onClick={() => setDays([])}
            >
              Todos os dias
            </button>
            <div className="schedule-field__day-grid">
              {DAY_ORDER.map((day) => (
                <button
                  type="button"
                  key={day}
                  className={
                    "schedule-field__day" + (days.includes(day) ? " schedule-field__day--selected" : "")
                  }
                  onClick={() => toggleDay(day)}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>
          </div>

          <div className="schedule-field__hours-row">
            <span className="field__label">Horários</span>
            <label className="schedule-field__minute">
              minuto
              <input
                type="number"
                min={0}
                max={59}
                value={minute}
                onChange={(e) => setMinute(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="schedule-field__hours">
            {hours.map((h, i) => (
              <div className="schedule-field__hour-row" key={i}>
                <select value={h} onChange={(e) => updateHour(i, Number(e.target.value))}>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                {hours.length > 1 && (
                  <button
                    type="button"
                    className="schedule-field__remove-hour"
                    onClick={() => removeHour(i)}
                    aria-label="Remover horário"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="schedule-field__add-hour" onClick={addHour}>
              + Adicionar horário
            </button>
          </div>

          <p className="schedule-field__preview">
            {describeSchedule({
              daysOfWeek: days.length ? days : null,
              hours,
              minute,
              isAdvanced: false,
              cronExpression: "",
            })}
          </p>
        </>
      ) : (
        <>
          <div className="schedule-field__tabs schedule-field__tabs--sub">
            <button
              type="button"
              className={"schedule-field__tab" + (advancedSubMode === "visual" ? " schedule-field__tab--active" : "")}
              onClick={switchToVisual}
            >
              Visual
            </button>
            <button
              type="button"
              className={"schedule-field__tab" + (advancedSubMode === "texto" ? " schedule-field__tab--active" : "")}
              onClick={() => setAdvancedSubMode("texto")}
            >
              Texto
            </button>
          </div>

          {advancedSubMode === "visual" ? (
            <CronVisualBuilder value={visualState} onChange={updateVisual} />
          ) : (
            <>
              <label className="field">
                <span className="field__label">Expressão cron *</span>
                <input
                  type="text"
                  value={rawCron}
                  onChange={(e) => {
                    setRawCron(e.target.value);
                    setParseError(null);
                  }}
                  placeholder="0 0 8 ? * MON,WED,FRI"
                />
              </label>
              {parseError && <p className="schedule-field__hint schedule-field__hint--error">{parseError}</p>}
              <p className="schedule-field__hint">
                Formato de 6 campos: segundo minuto hora dia-do-mês mês dia-da-semana. Ex: toda
                segunda, quarta e sexta às 08:00 → <code>0 0 8 ? * MON,WED,FRI</code>.
              </p>
            </>
          )}

          <p className="schedule-field__preview">
            {describeSchedule({ daysOfWeek: null, hours: [], minute: 0, isAdvanced: true, cronExpression: rawCron })}
            {" — "}
            <code>{rawCron}</code>
          </p>
        </>
      )}
    </div>
  );
});
