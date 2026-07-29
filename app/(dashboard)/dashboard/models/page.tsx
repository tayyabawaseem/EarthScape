"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "../../../_components/topbar";
import { LineChart, Donut } from "../../../_components/charts";
import { jsonFetch, relativeTime } from "../../../_components/fetcher";
import { Dropdown } from "../../../_components/Dropdown";
import {
  IconSparkles,
  IconCheck,
  IconRefresh,
  IconAlert,
} from "../../../_components/icons";

type Metrics = {
  name?: string;
  n?: number;
  rmse: number;
  mae: number;
  mape: number;
  r2: number;
  within_1c?: number;
  within_2c?: number;
  within_3c?: number;
  within_5c?: number;
  test_window_months?: number;
};

type Info = {
  model: string;
  algorithm: string;
  task: string;
  dataset: string;
  status: string;
  trained_at: string;
  training_points: number;
  test_points: number;
  training_start: string;
  training_end: string;
  n_cities: number;
  n_features: number;
  metrics: Metrics;
  top_features?: { name: string; importance: number }[];
};

type CityEntry = { name: string; rows: number; metrics: Metrics | null };
type History = { city: string; dates: string[]; values: (number | null)[] };
type Backtest = { city: string; dates: string[]; predicted: number[]; actual: number[] };
type Forecast = {
  city: string;
  horizon_days: number;
  dates: string[];
  values: number[];
  tmin?: number[];
  tmax?: number[];
};

type PredictPayload = {
  ok: true;
  info: Info;
  cities: { cities: CityEntry[] };
  history?: History;
  backtest?: Backtest;
  forecast?: Forecast;
};

export default function ModelsPage() {
  const [city, setCity] = useState<string>("");
  const [data, setData] = useState<PredictPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(targetCity?: string) {
    setLoading(true);
    setError(null);
    try {
      const url = targetCity ? `/api/predict?city=${encodeURIComponent(targetCity)}&horizon=7` : "/api/predict";
      const p = await jsonFetch<PredictPayload>(url);
      setData(p);
      // pick a default city on first load
      if (!targetCity && p.cities.cities.length > 0) {
        const defaultCity = p.cities.cities.find((c) => c.name === "Lahore") ?? p.cities.cities[0];
        setCity(defaultCity.name);
        const p2 = await jsonFetch<PredictPayload>(`/api/predict?city=${encodeURIComponent(defaultCity.name)}&horizon=7`);
        setData(p2);
      } else if (targetCity) {
        setCity(targetCity);
      }
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const info = data?.info;
  const cityMetric = useMemo(() => {
    if (!data || !city) return null;
    return data.cities.cities.find((c) => c.name === city)?.metrics ?? null;
  }, [data, city]);

  const within2c = info ? Math.round((info.metrics.within_2c ?? 0) * 100) : 0;
  const r2Pct = info ? Math.round(info.metrics.r2 * 100) : 0;

  return (
    <>
      <Topbar
        title="ML models"
        subtitle="Next-day temperature forecast for Pakistani cities."
        actions={
          <button type="button" onClick={() => load(city)} disabled={loading} className="btn-ghost text-sm disabled:opacity-60">
            <IconRefresh width={14} height={14} /> {loading ? "Loading…" : "Refresh"}
          </button>
        }
      />
      <main className="p-6 lg:p-8 space-y-6">
        {error && (
          <div className="glass p-4 border border-amber-500/30 bg-amber-500/5 text-sm flex items-start gap-3 animate-fade-up">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300 shrink-0">
              <IconAlert width={14} height={14} />
            </span>
            <div>
              <div className="font-semibold text-amber-100">Model service offline</div>
              <div className="text-amber-200/80 text-xs mt-0.5">
                Start it with <code className="text-emerald-300 bg-white/5 px-1 rounded">cd ml && python server.py</code> then click <strong>Refresh</strong>.
                <div className="mt-1 text-[10px] opacity-70 break-all">{error}</div>
              </div>
            </div>
          </div>
        )}

        <section className="grid sm:grid-cols-4 gap-4">
          <div className="glass p-5 animate-fade-up">
            <div className="text-xs text-[var(--muted)]">Status</div>
            <div className="text-2xl font-semibold mt-1 capitalize">{info?.status ?? "—"}</div>
            <span className={`chip ${info?.status === "live" ? "chip-success" : "chip-warning"} mt-2`}>
              {info ? `${info.n_cities} cities` : "—"}
            </span>
          </div>
          <div className="glass p-5 animate-fade-up delay-100">
            <div className="text-xs text-[var(--muted)]">Trained on</div>
            <div className="text-2xl font-semibold mt-1">{info ? `${info.training_points.toLocaleString()} days` : "—"}</div>
            <div className="text-[11px] text-[var(--muted)] mt-1">{info ? `${info.training_start} → ${info.training_end}` : ""}</div>
          </div>
          <div className="glass p-5 animate-fade-up delay-200">
            <div className="text-xs text-[var(--muted)]">Accuracy (±2 °C)</div>
            <div className={`text-2xl font-semibold mt-1 ${info ? "text-emerald-300" : ""}`}>
              {info ? `${within2c}%` : "—"}
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-1">of held-out predictions within 2 °C</div>
          </div>
          <div className="glass p-5 animate-fade-up delay-300">
            <div className="text-xs text-[var(--muted)]">RMSE</div>
            <div className="text-2xl font-semibold mt-1">{info ? `${info.metrics.rmse.toFixed(3)} °C` : "—"}</div>
            <div className="text-[11px] text-[var(--muted)] mt-1">avg prediction error</div>
          </div>
        </section>

        <section className="glass p-6 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold">Pakistani city forecast</h2>
              <p className="text-xs text-[var(--muted)]">Pick a city — the dashboard recomputes the backtest and 7-day forecast live from the model.</p>
            </div>
            <Dropdown
              value={city}
              onChange={(v) => load(v)}
              disabled={!data || loading}
              placeholder="Pick a city"
              options={(data?.cities.cities ?? []).map((c) => ({
                value: c.name,
                label: c.name,
                hint: `${c.rows.toLocaleString()} days`,
              }))}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{city || "—"} — predicted vs. actual</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Actual</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-400" /> Predicted</span>
                </div>
              </div>
              {data?.backtest && data.backtest.actual.length > 0 ? (
                <LineChart
                  data={data.backtest.actual}
                  compareData={data.backtest.predicted}
                  dates={data.backtest.dates}
                  seriesLabel="Actual"
                  compareLabel="Predicted"
                  unit="°C"
                  color="#00d1b2"
                  gradient={["#00d1b2", "#3a8dff"]}
                  compareColor="#a06bff"
                  yLabels={undefined}
                  xLabels={[
                    data.backtest.dates[0],
                    data.backtest.dates[Math.floor(data.backtest.dates.length / 2)],
                    data.backtest.dates.at(-1) ?? "",
                  ]}
                  height={240}
                  fill={false}
                />
              ) : (
                <div className="h-[240px] flex items-center justify-center text-sm text-[var(--muted)]">
                  {loading ? "Loading…" : city ? "Computing backtest…" : "Pick a city to see the backtest."}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="glass p-5">
                <div className="text-xs text-[var(--muted)]">City accuracy (±2 °C)</div>
                <div className="text-3xl font-semibold mt-1 text-emerald-300">
                  {cityMetric ? `${Math.round((cityMetric.within_2c ?? 0) * 100)}%` : "—"}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="rounded-lg bg-white/5 p-2">
                    <div className="text-[var(--muted)] text-[10px]">RMSE</div>
                    <div className="font-semibold">{cityMetric ? `${cityMetric.rmse.toFixed(2)} °C` : "—"}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <div className="text-[var(--muted)] text-[10px]">MAE</div>
                    <div className="font-semibold">{cityMetric ? `${cityMetric.mae.toFixed(2)} °C` : "—"}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <div className="text-[var(--muted)] text-[10px]">R²</div>
                    <div className="font-semibold">{cityMetric ? cityMetric.r2.toFixed(3) : "—"}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <div className="text-[var(--muted)] text-[10px]">MAPE</div>
                    <div className="font-semibold">{cityMetric ? `${cityMetric.mape.toFixed(1)}%` : "—"}</div>
                  </div>
                </div>
              </div>
              <div className="glass p-5">
                <div className="text-xs text-[var(--muted)]">Within tolerance</div>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex justify-between"><span className="text-[var(--muted)]">±1 °C</span><span className="font-semibold">{cityMetric ? `${Math.round((cityMetric.within_1c ?? 0) * 100)}%` : "—"}</span></li>
                  <li className="flex justify-between"><span className="text-[var(--muted)]">±2 °C</span><span className="font-semibold text-emerald-300">{cityMetric ? `${Math.round((cityMetric.within_2c ?? 0) * 100)}%` : "—"}</span></li>
                  <li className="flex justify-between"><span className="text-[var(--muted)]">±3 °C</span><span className="font-semibold">{cityMetric ? `${Math.round((cityMetric.within_3c ?? 0) * 100)}%` : "—"}</span></li>
                  <li className="flex justify-between"><span className="text-[var(--muted)]">±5 °C</span><span className="font-semibold">{cityMetric ? `${Math.round((cityMetric.within_5c ?? 0) * 100)}%` : "—"}</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="glass p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">7-day forecast — {city || "—"}</h2>
              <p className="text-xs text-[var(--muted)]">Recursive forecast: model predicts day t+1 then feeds it back to predict t+2, ..., t+7.</p>
            </div>
            {info && <span className="chip chip-info">{info.algorithm}</span>}
          </div>
          {data?.forecast && data.forecast.values.length > 0 ? (
            <>
              <LineChart
                data={data.forecast.values}
                compareData={data.forecast.tmax}
                extraData={data.forecast.tmin}
                dates={data.forecast.dates}
                seriesLabel="Mean"
                compareLabel="High"
                extraLabel="Low"
                unit="°C"
                gradient={["#ff5577", "#ffb547"]}
                color="#ff5577"
                compareColor="#fb7185"
                extraColor="#60a5fa"
                yLabels={undefined}
                xLabels={[data.forecast.dates[0], data.forecast.dates[Math.floor(data.forecast.dates.length / 2)], data.forecast.dates.at(-1) ?? ""]}
                height={200}
                fill={false}
              />
              {data.forecast.tmin && data.forecast.tmax && (
                <div className="mt-2 flex items-center justify-end gap-4 text-[11px] text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400" /> Low (tmin)</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /> Mean</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#fb7185" }} /> High (tmax)</span>
                </div>
              )}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                      <th className="text-left py-2 px-3 font-semibold">Date</th>
                      <th className="text-right py-2 px-3 font-semibold text-blue-300">Low (°C)</th>
                      <th className="text-right py-2 px-3 font-semibold text-rose-300">Mean (°C)</th>
                      <th className="text-right py-2 px-3 font-semibold" style={{ color: "#fda4af" }}>High (°C)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.forecast!.dates.map((d, i) => (
                      <tr key={d} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                        <td className="py-2 px-3 font-mono text-xs">{d}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-blue-300">
                          {data.forecast!.tmin && data.forecast!.tmin[i] != null ? data.forecast!.tmin[i].toFixed(1) : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold tabular-nums text-rose-300">{data.forecast!.values[i].toFixed(1)}</td>
                        <td className="py-2 px-3 text-right tabular-nums" style={{ color: "#fda4af" }}>
                          {data.forecast!.tmax && data.forecast!.tmax[i] != null ? data.forecast!.tmax[i].toFixed(1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-[var(--muted)]">
              {loading ? "Computing forecast…" : city ? "—" : "Pick a city above."}
            </div>
          )}
        </section>

        {info?.top_features && info.top_features.length > 0 && (
          <section className="glass p-6 animate-fade-up">
            <h2 className="text-lg font-semibold">Top feature importances</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">What the model relies on most.</p>
            <ul className="mt-4 space-y-2 text-sm">
              {info.top_features.slice(0, 10).map((f, i) => (
                <li key={f.name} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-mono">{f.name}</span>
                    <span className="text-[var(--muted)]">{(f.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-blue-400" style={{ width: `${Math.min(100, f.importance * 100 * 5)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

      </main>
    </>
  );
}
