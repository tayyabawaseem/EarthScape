"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../../_components/topbar";
import { LineChart } from "../../../_components/charts";
import { jsonFetch, relativeTime } from "../../../_components/fetcher";
import { Dropdown } from "../../../_components/Dropdown";
import {
  IconThermometer,
  IconChart,
  IconAlert,
  IconRefresh,
} from "../../../_components/icons";

type CityEntry = { name: string; rows: number };
type History = { city: string; dates: string[]; values: (number | null)[] };
type Backtest = { city: string; dates: string[]; predicted: number[]; actual: number[] };
type ModelInfo = {
  model: string;
  algorithm: string;
  training_start: string;
  training_end: string;
  metrics: { rmse: number; r2: number; within_2c: number; within_3c: number };
};
type Payload = {
  ok: true;
  info: ModelInfo;
  cities: { cities: CityEntry[] };
  history?: History;
  backtest?: Backtest;
};

const DEFAULT_CITY = "Lahore";

export default function VisualizationsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [city, setCity] = useState<string>(DEFAULT_CITY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(targetCity?: string) {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/predict?city=${encodeURIComponent(targetCity ?? city)}&horizon=1`;
      const p = await jsonFetch<Payload>(url);
      setData(p);
      if (targetCity) setCity(targetCity);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const history = data?.history;
  const backtest = data?.backtest;
  const info = data?.info;

  // For the "all cities" averages strip — show latest observed temp per city
  const cityList = data?.cities.cities ?? [];

  return (
    <>
      <Topbar
        title="Visualizations"
        subtitle="Historical temperature charts and model accuracy, per Pakistani city."
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
              <div className="font-semibold text-amber-100">Charts can&apos;t load</div>
              <div className="text-amber-200/80 text-xs mt-0.5">
                The ML service isn&apos;t running. Start it with{" "}
                <code className="text-emerald-300 bg-white/5 px-1 rounded">cd ml && python server.py</code> then click <strong>Refresh</strong>.
              </div>
            </div>
          </div>
        )}

        {/* City picker — relative + z-30 so the dropdown popup paints above the following sections' stacking contexts */}
        <section className="glass p-6 animate-fade-up relative z-30">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <IconChart width={16} height={16} className="text-emerald-300" />
                Pick a city
              </h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                All charts below switch to the selected city. Data is real daily weather pulled from Meteostat weather-station archives.
              </p>
            </div>
            <Dropdown
              value={city}
              onChange={(v) => load(v)}
              disabled={!data || loading}
              placeholder="Pick a city"
              options={cityList.map((c) => ({
                value: c.name,
                label: c.name,
                hint: `${c.rows.toLocaleString()} days`,
              }))}
            />
          </div>
        </section>

        {/* CHART 1 — observed temperature history */}
        <section className="glass p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <IconThermometer width={16} height={16} className="text-rose-300" />
                {city} &mdash; last 180 days of observed temperature
              </h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Source: Meteostat daily weather-station data for {city}. Each point is the observed daily mean temperature in °C.
              </p>
            </div>
          </div>
          {history && history.values.length > 0 ? (
            <>
              {(() => {
                const pairs = history.values
                  .map((v, i) => ({ v, d: history.dates[i] }))
                  .filter((p): p is { v: number; d: string } => p.v != null);
                const vals = pairs.map((p) => p.v);
                const ds = pairs.map((p) => p.d);
                return (
                  <LineChart
                    data={vals}
                    dates={ds}
                    seriesLabel="Observed"
                    unit="°C"
                    gradient={["#00d1b2", "#3a8dff"]}
                    color="#00d1b2"
                    yLabels={undefined}
                    xLabels={[ds[0], ds[Math.floor(ds.length / 2)], ds.at(-1) ?? ""]}
                    height={220}
                  />
                );
              })()}
              <p className="mt-3 text-[11px] text-[var(--muted)] italic">
                What to look for: seasonal swings, recent cold snaps or heat waves, and how steady the day-to-day variation is. Hover the line to see the temperature on any day.
              </p>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-[var(--muted)]">
              {loading ? "Loading…" : "No data for this city."}
            </div>
          )}
        </section>

        {/* CHART 2 — model backtest */}
        <section className="glass p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <IconChart width={16} height={16} className="text-emerald-300" />
                {city} &mdash; model predictions vs. reality (last 60 days)
              </h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Source: the TempForecast-XGB model was asked to predict each of these last 60 days. We compare its prediction (purple) to what actually happened (green).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Actual</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-400" /> Predicted</span>
            </div>
          </div>
          {backtest && backtest.actual.length > 0 ? (
            <>
              <LineChart
                data={backtest.actual}
                compareData={backtest.predicted}
                dates={backtest.dates}
                seriesLabel="Actual"
                compareLabel="Predicted"
                unit="°C"
                color="#00d1b2"
                gradient={["#00d1b2", "#3a8dff"]}
                compareColor="#a06bff"
                yLabels={undefined}
                xLabels={[
                  backtest.dates[0],
                  backtest.dates[Math.floor(backtest.dates.length / 2)],
                  backtest.dates.at(-1) ?? "",
                ]}
                height={240}
                fill={false}
              />
              <p className="mt-3 text-[11px] text-[var(--muted)] italic">
                What to look for: where the two lines hug each other (model is doing well) vs. where they diverge (model missed). Hover any point to see actual and predicted side-by-side.
              </p>
            </>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-[var(--muted)]">
              {loading ? "Loading…" : "—"}
            </div>
          )}
        </section>

        {/* MODEL HEALTH PANEL */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="glass p-5 animate-fade-up">
            <div className="text-xs text-[var(--muted)]">Model</div>
            <div className="text-lg font-semibold mt-1">{info?.model ?? "—"}</div>
            <div className="text-[11px] text-[var(--muted)] mt-1">{info?.algorithm ?? ""}</div>
          </div>
          <div className="glass p-5 animate-fade-up delay-100">
            <div className="text-xs text-[var(--muted)]">Training window</div>
            <div className="text-lg font-semibold mt-1">{info ? `${info.training_start} → ${info.training_end}` : "—"}</div>
            <div className="text-[11px] text-[var(--muted)] mt-1">all 30 cities</div>
          </div>
          <div className="glass p-5 animate-fade-up delay-200">
            <div className="text-xs text-[var(--muted)]">Held-out accuracy</div>
            <div className="text-lg font-semibold mt-1 text-emerald-300">
              {info ? `${Math.round(info.metrics.within_3c * 100)}% within ±3 °C` : "—"}
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-1">
              {info ? `RMSE ${info.metrics.rmse} °C · R² ${info.metrics.r2}` : ""}
            </div>
          </div>
        </section>

        <section className="glass p-5 text-xs text-[var(--muted)] animate-fade-up">
          <strong className="text-white">How to read these charts:</strong>{" "}
          The first chart shows what actually happened in {city} over the last 180 days. The second chart asks the model
          &ldquo;if you were predicting each of these days, what would you have said?&rdquo; and overlays the answer on the truth.
          The closer the two lines on the second chart, the more accurate the model is for {city} specifically.
          Switch cities at the top to compare.
        </section>
      </main>
    </>
  );
}
