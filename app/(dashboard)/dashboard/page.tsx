"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Topbar } from "../../_components/topbar";
import { jsonFetch, relativeTime } from "../../_components/fetcher";
import { PakistanHeatMap, type HeatMapRow } from "../../_components/PakistanHeatMap";
import {
  IconThermometer,
  IconBrain,
  IconActivity,
  IconArrowRight,
  IconRefresh,
  IconAlert,
  IconCheck,
  IconHelp,
  IconUsers,
  IconChart,
} from "../../_components/icons";

type MyTicketsResp = { openCount: number };
type Me = { id: string; email: string; name: string; role: "admin" | "analyst" };

type ModelInfo = {
  model: string;
  algorithm: string;
  status: string;
  n_cities: number;
  trained_at: string;
  training_points: number;
  training_start: string;
  training_end: string;
  metrics: {
    rmse: number;
    r2: number;
    within_2c: number;
    within_3c: number;
  };
};

type CityForecast = {
  city: string;
  values: number[];
  dates: string[];
  tmin?: number[];
  tmax?: number[];
};

const FEATURED_CITIES = ["Karachi", "Lahore", "Islamabad", "Quetta", "Peshawar"];

export default function OverviewPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [myOpenTickets, setMyOpenTickets] = useState<number | null>(null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [forecasts, setForecasts] = useState<CityForecast[]>([]);
  const [heatRows, setHeatRows] = useState<HeatMapRow[]>([]);
  const [heatLoading, setHeatLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mlOffline, setMlOffline] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const m = await jsonFetch<{ user: Me }>("/api/auth/me");
      setMe(m.user);
    } catch {}
    try {
      const mt = await jsonFetch<MyTicketsResp>("/api/tickets?mine=true");
      setMyOpenTickets(mt.openCount);
    } catch {}

    // ML side — may be offline; degrade gracefully
    try {
      const base = await jsonFetch<{ info: ModelInfo }>("/api/predict");
      setInfo(base.info);
      const all = await Promise.all(
        FEATURED_CITIES.map(async (city) => {
          try {
            const d = await jsonFetch<{ forecast: { dates: string[]; values: number[]; tmin?: number[]; tmax?: number[] } }>(
              `/api/predict?city=${encodeURIComponent(city)}&horizon=1`
            );
            return {
              city,
              values: d.forecast.values,
              dates: d.forecast.dates,
              tmin: d.forecast.tmin,
              tmax: d.forecast.tmax,
            };
          } catch {
            return { city, values: [], dates: [] };
          }
        })
      );
      setForecasts(all);
      setMlOffline(false);
    } catch {
      setInfo(null);
      setForecasts([]);
      setMlOffline(true);
    }
    // Heat map data — separate call, separate loading flag (it takes longer)
    setHeatLoading(true);
    try {
      const h = await jsonFetch<{ cities: HeatMapRow[] }>("/api/predict-all?horizon=1");
      setHeatRows(h.cities ?? []);
    } catch {
      setHeatRows([]);
    }
    setHeatLoading(false);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const isAdmin = me?.role === "admin";
  const accuracy3c = info ? Math.round(info.metrics.within_3c * 100) : 0;
  const accuracy2c = info ? Math.round(info.metrics.within_2c * 100) : 0;

  return (
    <>
      <Topbar
        title="Overview"
        subtitle={me ? `Welcome back, ${me.name.split(" ")[0]} — here's what's happening today.` : ""}
        actions={
          <button type="button" onClick={load} disabled={loading} className="btn-ghost text-sm disabled:opacity-60">
            <IconRefresh width={14} height={14} /> {loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      />
      <main className="p-6 lg:p-8 space-y-6">

        {mlOffline && (
          <div className="glass p-4 border border-amber-500/30 bg-amber-500/5 text-sm flex items-start gap-3 animate-fade-up">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300 shrink-0">
              <IconAlert width={14} height={14} />
            </span>
            <div>
              <div className="font-semibold text-amber-100">Model service offline</div>
              <div className="text-amber-200/80 text-xs mt-0.5">
                Forecast cards below are blank because the Python ML service isn&apos;t running. Start it with{" "}
                <code className="text-emerald-300 bg-white/5 px-1 rounded">cd ml && python server.py</code>{" "}
                then click <strong>Refresh</strong>.
              </div>
            </div>
          </div>
        )}

        {/* TOP STATS — 3 honest, dynamic cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass glass-hover p-5 animate-fade-up">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-blue-400 text-slate-900">
                <IconBrain />
              </span>
              <span className="chip chip-success">live</span>
            </div>
            <div className="mt-4 text-xs text-[var(--muted)]">Cities tracked</div>
            <div className="text-2xl font-semibold">{info?.n_cities ?? "—"}</div>
            <div className="text-[11px] text-[var(--muted)] mt-1">Pakistani weather stations</div>
          </div>

          <div className="glass glass-hover p-5 animate-fade-up delay-100">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 text-slate-900">
                <IconActivity />
              </span>
              <span className="chip chip-success">±3 °C</span>
            </div>
            <div className="mt-4 text-xs text-[var(--muted)]">Forecast accuracy</div>
            <div className="text-2xl font-semibold text-emerald-300">
              {info ? `${accuracy3c}%` : "—"}
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-1">of predictions within 3 °C of actual</div>
          </div>

          <div className="glass glass-hover p-5 animate-fade-up delay-200">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-400 text-slate-900">
                <IconHelp />
              </span>
              <span className="chip chip-info">{isAdmin ? "workspace" : "yours"}</span>
            </div>
            <div className="mt-4 text-xs text-[var(--muted)]">
              {isAdmin ? "Open tickets (workspace)" : "Your open tickets"}
            </div>
            <div className="text-2xl font-semibold">
              {myOpenTickets ?? "—"}
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-1">
              {isAdmin ? "across all users" : "ones you opened"}
            </div>
          </div>
        </section>

        {/* TOMORROW'S FORECAST — the headline feature */}
        <section className="glass p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <IconThermometer width={16} height={16} className="text-emerald-300" />
                Tomorrow&apos;s temperature forecast
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Live output from the TempForecast-XGB model for 5 of the 30 tracked cities.
                {info && <> Source: <span className="text-white">{info.algorithm}</span> trained on {info.training_points.toLocaleString()} days of Meteostat history.</>}
              </p>
            </div>
            <Link href="/dashboard/models" className="btn-ghost text-xs">
              All cities <IconArrowRight width={12} height={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {FEATURED_CITIES.map((city, i) => {
              const f = forecasts.find((x) => x.city === city);
              const tmean = f && f.values.length > 0 ? f.values[0] : null;
              const tmin = f && f.tmin && f.tmin.length > 0 ? f.tmin[0] : null;
              const tmax = f && f.tmax && f.tmax.length > 0 ? f.tmax[0] : null;
              const date = f && f.dates.length > 0 ? f.dates[0] : null;
              return (
                <div key={city} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-emerald-400/30 transition-colors animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="text-xs text-[var(--muted)] flex items-center justify-between">
                    <span>{city}</span>
                    {date && <span className="text-[10px]">{date}</span>}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-emerald-300">
                    {tmean != null ? `${tmean.toFixed(1)} °C` : "—"}
                  </div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">predicted mean</div>
                  {(tmin != null || tmax != null) && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] tabular-nums">
                      <span className="inline-flex items-center gap-1 text-blue-300">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                        Low {tmin != null ? `${tmin.toFixed(1)}°` : "—"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-rose-300">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
                        High {tmax != null ? `${tmax.toFixed(1)}°` : "—"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* HEAT MAP — tomorrow's mean across all 30 cities */}
        {!mlOffline && (
          <section className="glass p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <IconChart width={16} height={16} className="text-emerald-300" />
                  Tomorrow&apos;s mean temperature across Pakistan
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Each dot is one of the 30 tracked cities. Colour shows the model&apos;s prediction for the next observed day. Hover any city for low / mean / high.
                </p>
              </div>
              {heatLoading && <span className="chip chip-info">computing…</span>}
            </div>
            {heatRows.length > 0 ? (
              <PakistanHeatMap rows={heatRows} />
            ) : (
              <div className="h-[420px] flex items-center justify-center text-sm text-[var(--muted)]">
                {heatLoading ? "Running forecast for all 30 cities…" : "No data."}
              </div>
            )}
          </section>
        )}

        {/* QUICK LINKS — role-aware */}
        <section className="glass p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Jump to</h2>
              <p className="text-xs text-[var(--muted)]">Common destinations for your role.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { href: "/dashboard/models", icon: IconBrain, label: "ML Models", desc: "Backtest + 7-day forecast per city" },
              { href: "/dashboard/visualizations", icon: IconChart, label: "Visualizations", desc: "Historical temperature charts" },
              ...(isAdmin
                ? [
                    { href: "/dashboard/tickets", icon: IconHelp, label: "Tickets", desc: "Every user's tickets, change status" },
                    { href: "/dashboard/users", icon: IconUsers, label: "Users", desc: "Roles, audit log, invites" },
                  ]
                : [
                    { href: "/dashboard/support", icon: IconHelp, label: "Support", desc: "Open a ticket, send feedback" },
                  ]),
            ].map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-400/30 transition-colors group animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-emerald-300">
                  <link.icon width={14} height={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{link.label}</div>
                  <div className="text-[11px] text-[var(--muted)] truncate">{link.desc}</div>
                </div>
                <IconArrowRight width={14} height={14} className="text-[var(--muted)] group-hover:text-white transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* MODEL SNAPSHOT — what it is, in plain English */}
        <section className="glass p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">About the forecast</h2>
              <p className="text-xs text-[var(--muted)]">
                What the model is, what it predicts, and how accurate it is.
              </p>
            </div>
            {info && <span className="chip chip-success"><IconCheck width={10} height={10} /> {info.status}</span>}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs text-[var(--muted)]">What it predicts</div>
              <div className="text-sm font-medium mt-1">Next-day low, mean, and high temperature (°C) for any of 30 Pakistani cities.</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs text-[var(--muted)]">How it was trained</div>
              <div className="text-sm font-medium mt-1">
                {info ? (
                  <>XGBoost on {info.training_points.toLocaleString()} days of Meteostat history ({info.training_start} &rarr; {info.training_end}).</>
                ) : (
                  "Awaiting model service…"
                )}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs text-[var(--muted)]">How accurate</div>
              <div className="text-sm font-medium mt-1">
                {info ? (
                  <>R² {info.metrics.r2.toFixed(2)} &middot; {accuracy2c}% within ±2 °C &middot; {accuracy3c}% within ±3 °C on held-out year.</>
                ) : (
                  "—"
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-[var(--muted)]">
            Last trained {info ? relativeTime(info.trained_at) : "—"}. Predictions are computed on demand by the Python ML service at <code className="text-emerald-300/80 bg-white/5 px-1 rounded">localhost:8000</code>.
          </div>
        </section>
      </main>
    </>
  );
}
