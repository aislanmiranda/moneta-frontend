import { useEffect, useMemo, useState } from "react";
import { dateControlEntriesApi, type MonthlyDashboard } from "../../../api/client";
import { formatCurrency } from "./dateControlLabels";
import "./FinanceDashboard.css";

type ChartKind = "line" | "bar";
type SeriesKey = "paid" | "pending" | "overdue";

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "paid", label: "Pagas", color: "var(--color-success)" },
  { key: "pending", label: "Pendentes", color: "#f08a24" },
  { key: "overdue", label: "Vencidas", color: "var(--color-danger)" },
];

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Compact axis label in pt-BR: "R$ 0", "R$ 2,5 mil", "R$ 1,2 mi".
const compactBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

function formatAxis(value: number): string {
  if (value === 0) return "R$ 0";
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return compactBRL.format(value);
}

/** Round the max up to a "nice" step so the Y axis gets 4 clean ticks (0, s, 2s, 3s...). */
function niceScale(max: number): { top: number; ticks: number[] } {
  if (max <= 0) return { top: 4, ticks: [0, 1, 2, 3, 4] };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  return { top: step * 4, ticks: [0, 1, 2, 3, 4].map((i) => i * step) };
}

const W = 720;
const H = 300;
const PAD = { top: 16, right: 16, bottom: 28, left: 64 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export function FinanceDashboard({ moduleId }: { moduleId: string }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [kind, setKind] = useState<ChartKind>("line");
  const [data, setData] = useState<MonthlyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    dateControlEntriesApi
      .monthlyDashboard(moduleId, year)
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && setError("Não foi possível carregar o dashboard."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [moduleId, year]);

  const months = data?.months ?? [];
  const isEmpty = months.every((m) => m.paid + m.pending + m.overdue === 0);
  const scale = useMemo(
    () => niceScale(Math.max(0, ...months.flatMap((m) => [m.paid, m.pending, m.overdue]))),
    [months],
  );

  const x = (i: number) => PAD.left + (PLOT_W / 12) * (i + 0.5);
  const y = (v: number) => PAD.top + PLOT_H - (v / scale.top) * PLOT_H;

  const years = Array.from({ length: 6 }, (_, i) => currentYear + 1 - i);
  const activeMonth = active !== null ? months[active] : null;

  return (
    <section className="fin-dash">
      <div className="fin-dash__toolbar">
        <div className="field fin-dash__year">
          <select aria-label="Ano" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y2) => (
              <option key={y2} value={y2}>
                {y2}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-tabs" role="group" aria-label="Tipo de gráfico">
          {(["line", "bar"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              className={"filter-tabs__tab" + (kind === k ? " filter-tabs__tab--active" : "")}
              onClick={() => setKind(k)}
            >
              {k === "line" ? "Linhas" : "Barras"}
            </button>
          ))}
        </div>
      </div>

      <div className="fin-dash__card">
        <h2>Evolução mensal — {year}</h2>
        {loading ? (
          <p className="fin-dash__hint">Carregando dashboard…</p>
        ) : error ? (
          <p className="fin-dash__hint fin-dash__hint--error">{error}</p>
        ) : isEmpty ? (
          <p className="fin-dash__hint">Nenhum lançamento em {year}.</p>
        ) : (
          <>
            <div className="fin-dash__chart">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                role="img"
                aria-label={`Gráfico de ${kind === "line" ? "linhas" : "barras"} com contas pagas, pendentes e vencidas por mês em ${year}`}
                onMouseLeave={() => setActive(null)}
              >
                {scale.ticks.map((t) => (
                  <g key={t}>
                    <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="fin-dash__grid" />
                    <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fin-dash__axis">
                      {formatAxis(t)}
                    </text>
                  </g>
                ))}
                {MONTH_LABELS.map((label, i) => (
                  <text key={label} x={x(i)} y={H - 8} textAnchor="middle" className="fin-dash__axis">
                    {label}
                  </text>
                ))}

                {kind === "line"
                  ? SERIES.map((s) => (
                      <g key={s.key} style={{ color: s.color }}>
                        <polyline
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinejoin="round"
                          points={months.map((m, i) => `${x(i)},${y(m[s.key])}`).join(" ")}
                        />
                        {months.map((m, i) => (
                          <circle key={m.month} cx={x(i)} cy={y(m[s.key])} r={active === i ? 5 : 3.5} fill="currentColor" className="fin-dash__dot" />
                        ))}
                      </g>
                    ))
                  : months.map((m, i) =>
                      SERIES.map((s, j) => {
                        const bw = Math.min(14, PLOT_W / 12 / 4);
                        const bx = x(i) + (j - 1) * (bw + 2) - bw / 2;
                        const h = PLOT_H - (y(m[s.key]) - PAD.top);
                        return (
                          <rect key={`${m.month}-${s.key}`} x={bx} y={y(m[s.key])} width={bw} height={Math.max(h, 0)} rx={2} fill={s.color} opacity={active === null || active === i ? 1 : 0.55} />
                        );
                      }),
                    )}

                {/* hit areas: one column per month, for hover/touch/focus tooltips */}
                {months.map((m, i) => (
                  <rect
                    key={m.month}
                    x={PAD.left + (PLOT_W / 12) * i}
                    y={PAD.top}
                    width={PLOT_W / 12}
                    height={PLOT_H}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${MONTH_LABELS[i]}: pagas ${formatCurrency(m.paid)}, pendentes ${formatCurrency(m.pending)}, vencidas ${formatCurrency(m.overdue)}`}
                    onMouseEnter={() => setActive(i)}
                    onTouchStart={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                  />
                ))}
              </svg>

              {activeMonth && (
                <div
                  className="fin-dash__tooltip"
                  style={{ left: `${(x(active!) / W) * 100}%` }}
                  role="status"
                >
                  <strong>{MONTH_LABELS[active!]} / {year}</strong>
                  {SERIES.map((s) => (
                    <span key={s.key}>
                      <i style={{ background: s.color }} /> {s.label}: {formatCurrency(activeMonth[s.key])}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <ul className="fin-dash__legend">
              {SERIES.map((s) => (
                <li key={s.key}>
                  <i style={{ background: s.color }} /> {s.label}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
