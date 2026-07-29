"use client";

import { useRef, useState } from "react";
import { PAKISTAN_PATHS } from "@/lib/pakistan_paths";
import { PK_CITIES, proj } from "@/lib/pakistan_cities";

export type HeatMapRow = {
  city: string;
  date: string | null;
  tmean: number | null;
  tmin: number | null;
  tmax: number | null;
};

type Props = {
  rows: HeatMapRow[];
  height?: number;
};

// Pakistan summer/winter range — covers the full envelope (Skardu winters to Sibi summers)
const TEMP_MIN = 0;
const TEMP_MAX = 45;

function tempToColor(t: number): string {
  const clamped = Math.max(TEMP_MIN, Math.min(TEMP_MAX, t));
  const pct = (clamped - TEMP_MIN) / (TEMP_MAX - TEMP_MIN);
  // hue: 240 (blue) at cold → 0 (red) at hot
  const hue = 240 - pct * 240;
  return `hsl(${hue}, 85%, 55%)`;
}

export function PakistanHeatMap({ rows, height = 520 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ city: string; x: number; y: number } | null>(null);

  const byCity = new Map(rows.map((r) => [r.city, r]));

  // Mid-band of legend ticks
  const ticks = [0, 10, 20, 30, 40];

  return (
    <div ref={wrapRef} className="relative w-full" style={{ minHeight: height }}>
      <svg viewBox="0 0 1000 959" className="w-full h-auto block" role="img" aria-label="Pakistan temperature heat map">
        <defs>
          <linearGradient id="pkMapFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(50,80,120,0.18)" />
            <stop offset="100%" stopColor="rgba(20,30,55,0.10)" />
          </linearGradient>
        </defs>
        {/* Province outlines */}
        <g>
          {PAKISTAN_PATHS.map((p) => (
            <path
              key={p.id}
              d={p.d}
              fill="url(#pkMapFill)"
              stroke="rgba(120,170,255,0.35)"
              strokeWidth="0.8"
            />
          ))}
        </g>

        {/* City dots, colored by predicted mean */}
        <g>
          {PK_CITIES.map((c) => {
            const row = byCity.get(c.name);
            const t = row?.tmean ?? null;
            const { x, y } = proj(c.lat, c.lon);
            const color = t != null ? tempToColor(t) : "rgba(255,255,255,0.2)";
            const r = c.size ? c.size + 4 : 8;
            return (
              <g
                key={c.name}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover({ city: c.name, x, y })}
                onMouseLeave={() => setHover(null)}
              >
                <circle cx={x} cy={y} r={r + 4} fill={color} opacity="0.25" />
                <circle cx={x} cy={y} r={r} fill={color} stroke="#04070d" strokeWidth="1.5" />
                {t != null && (
                  <text
                    x={x}
                    y={y - r - 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="white"
                    style={{ paintOrder: "stroke", stroke: "#04070d", strokeWidth: 3, strokeLinejoin: "round" }}
                  >
                    {t.toFixed(0)}°
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hover && (() => {
        const row = byCity.get(hover.city);
        if (!row) return null;
        const wrap = wrapRef.current;
        if (!wrap) return null;
        // Convert SVG coord → percentage of container
        const leftPct = (hover.x / 1000) * 100;
        const topPct = (hover.y / 959) * 100;
        const alignRight = leftPct > 70;
        return (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-[#0a0f1aee] backdrop-blur px-3 py-2 text-[11px] shadow-xl"
            style={{
              left: alignRight ? undefined : `calc(${leftPct}% + 14px)`,
              right: alignRight ? `calc(${100 - leftPct}% + 14px)` : undefined,
              top: `calc(${topPct}% - 24px)`,
              minWidth: 150,
            }}
          >
            <div className="font-semibold mb-1">{row.city}</div>
            {row.date && <div className="text-[10px] text-[var(--muted)] mb-1.5">{row.date}</div>}
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-[var(--muted)]">Low</span>
              <span className="ml-auto font-semibold tabular-nums">
                {row.tmin != null ? `${row.tmin.toFixed(1)}°C` : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[var(--muted)]">Mean</span>
              <span className="ml-auto font-semibold tabular-nums">
                {row.tmean != null ? `${row.tmean.toFixed(1)}°C` : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[var(--muted)]">High</span>
              <span className="ml-auto font-semibold tabular-nums">
                {row.tmax != null ? `${row.tmax.toFixed(1)}°C` : "—"}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3 text-[11px] text-[var(--muted)]">
        <span className="shrink-0">Predicted mean (°C):</span>
        <div className="relative h-3 flex-1 rounded-full overflow-hidden" style={{
          background: `linear-gradient(to right, ${tempToColor(0)}, ${tempToColor(10)}, ${tempToColor(20)}, ${tempToColor(30)}, ${tempToColor(40)}, ${tempToColor(45)})`,
        }} />
        <div className="shrink-0 flex items-center gap-3 tabular-nums">
          {ticks.map((t) => (
            <span key={t}>{t}°</span>
          ))}
        </div>
      </div>
    </div>
  );
}
