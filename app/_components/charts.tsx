"use client";

import { useId, useRef, useState } from "react";

type LineChartProps = {
  data: number[];
  color?: string;
  gradient?: [string, string];
  height?: number;
  fill?: boolean;
  showDots?: boolean;
  showGrid?: boolean;
  yLabels?: string[];
  xLabels?: string[];
  dates?: string[];
  seriesLabel?: string;
  unit?: string;
  compareData?: number[];
  compareColor?: string;
  compareLabel?: string;
  extraData?: number[];
  extraColor?: string;
  extraLabel?: string;
};

export function LineChart({
  data,
  color = "#00d1b2",
  gradient = ["#00d1b2", "#3a8dff"],
  height = 220,
  fill = true,
  showDots = true,
  showGrid = true,
  yLabels,
  xLabels,
  dates,
  seriesLabel = "Value",
  unit = "°C",
  compareData,
  compareColor = "#a06bff",
  compareLabel = "Predicted",
  extraData,
  extraColor = "#60a5fa",
  extraLabel = "Low",
}: LineChartProps) {
  const w = 600;
  const h = height;
  const pad = { t: 16, r: 16, b: 24, l: 32 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const all = [...data, ...(compareData ?? []), ...(extraData ?? [])];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const stepX = innerW / Math.max(data.length - 1, 1);

  const toPoints = (vals: number[]) =>
    vals.map((v, i) => {
      const x = pad.l + i * stepX;
      const y = pad.t + innerH - ((v - min) / range) * innerH;
      return { x, y };
    });

  const points = toPoints(data);
  const cmpPoints = compareData ? toPoints(compareData) : null;
  const extPoints = extraData ? toPoints(extraData) : null;

  const smoothPath = (pts: { x: number; y: number }[]) =>
    pts
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `Q ${prev.x} ${prev.y} ${cx} ${(prev.y + p.y) / 2} T ${p.x} ${p.y}`;
      })
      .join(" ");

  const path = smoothPath(points);
  const cmpPath = cmpPoints ? smoothPath(cmpPoints) : null;
  const extPath = extPoints ? smoothPath(extPoints) : null;
  const fillPath = `${path} L ${pad.l + innerW} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z`;

  const rid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = `lc${rid}`;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * w;
    if (relX < pad.l || relX > pad.l + innerW) {
      setHover(null);
      return;
    }
    const idx = Math.round((relX - pad.l) / stepX);
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const hoverPoint = hover != null ? points[hover] : null;
  const hoverCmp = hover != null && cmpPoints ? cmpPoints[hover] : null;
  const hoverExt = hover != null && extPoints ? extPoints[hover] : null;
  const tipLeftPct = hoverPoint ? (hoverPoint.x / w) * 100 : 0;
  const tipAlignRight = tipLeftPct > 70;

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block" role="img">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradient[0]} stopOpacity="0.35" />
            <stop offset="100%" stopColor={gradient[1]} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`stroke-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>

        {showGrid &&
          [0, 1, 2, 3].map((i) => {
            const y = pad.t + (innerH / 3) * i;
            return (
              <line key={i} x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke="rgba(120,170,255,0.08)" strokeDasharray="2 4" />
            );
          })}

        {yLabels &&
          yLabels.map((lab, i) => {
            const y = pad.t + (innerH / (yLabels.length - 1)) * i;
            return (
              <text key={i} x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill="rgba(125,138,164,0.8)">
                {lab}
              </text>
            );
          })}

        {fill && <path d={fillPath} fill={`url(#grad-${id})`}>
          <animate attributeName="opacity" from="0" to="1" dur="900ms" fill="freeze" />
        </path>}

        <path
          d={path}
          fill="none"
          stroke={`url(#stroke-${id})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2000"
          strokeDashoffset="2000"
          style={{ animation: "drawLine 1400ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        />

        {cmpPath && (
          <path
            d={cmpPath}
            fill="none"
            stroke={compareColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 4"
            opacity="0.9"
          />
        )}

        {extPath && (
          <path
            d={extPath}
            fill="none"
            stroke={extraColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 4"
            opacity="0.9"
          />
        )}

        {showDots &&
          points.map((p, i) =>
            i === points.length - 1 ? (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="8" fill={color} opacity="0.25">
                  <animate attributeName="r" values="6;12;6" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle cx={p.x} cy={p.y} r="3.5" fill={color} stroke="#04070d" strokeWidth="1.5" />
              </g>
            ) : null
          )}

        {hoverPoint && (
          <g pointerEvents="none">
            <line
              x1={hoverPoint.x}
              y1={pad.t}
              x2={hoverPoint.x}
              y2={pad.t + innerH}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={hoverPoint.x} cy={hoverPoint.y} r="5" fill={color} stroke="#04070d" strokeWidth="2" />
            {hoverCmp && (
              <circle cx={hoverCmp.x} cy={hoverCmp.y} r="5" fill={compareColor} stroke="#04070d" strokeWidth="2" />
            )}
            {hoverExt && (
              <circle cx={hoverExt.x} cy={hoverExt.y} r="5" fill={extraColor} stroke="#04070d" strokeWidth="2" />
            )}
          </g>
        )}

        {xLabels &&
          xLabels.map((lab, i) => {
            const x = pad.l + (innerW / (xLabels.length - 1)) * i;
            return (
              <text key={i} x={x} y={h - 6} textAnchor="middle" fontSize="10" fill="rgba(125,138,164,0.8)">
                {lab}
              </text>
            );
          })}
      </svg>

      {hover != null && hoverPoint && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-[#0a0f1aee] backdrop-blur px-3 py-2 text-[11px] shadow-xl"
          style={{
            left: tipAlignRight ? undefined : `calc(${tipLeftPct}% + 12px)`,
            right: tipAlignRight ? `calc(${100 - tipLeftPct}% + 12px)` : undefined,
            top: 8,
            minWidth: 130,
          }}
        >
          {dates && dates[hover] && (
            <div className="text-[10px] text-[var(--muted)] mb-1">{dates[hover]}</div>
          )}
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[var(--muted)]">{seriesLabel}</span>
            <span className="ml-auto font-semibold tabular-nums">
              {data[hover].toFixed(1)}{unit}
            </span>
          </div>
          {compareData && (
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: compareColor }} />
              <span className="text-[var(--muted)]">{compareLabel}</span>
              <span className="ml-auto font-semibold tabular-nums">
                {compareData[hover].toFixed(1)}{unit}
              </span>
            </div>
          )}
          {extraData && (
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: extraColor }} />
              <span className="text-[var(--muted)]">{extraLabel}</span>
              <span className="ml-auto font-semibold tabular-nums">
                {extraData[hover].toFixed(1)}{unit}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type BarChartProps = {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  max?: number;
};

export function BarChart({ data, height = 200, max }: BarChartProps) {
  const top = max ?? Math.max(...data.map((d) => d.value));
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between gap-2 h-full">
        {data.map((d, i) => {
          const pct = (d.value / top) * 100;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group">
              <div className="text-[10px] font-semibold text-[var(--muted)] group-hover:text-white transition-colors">
                {d.value}
              </div>
              <div className="w-full bg-white/[0.03] rounded-md flex-1 flex items-end overflow-hidden">
                <div
                  className="w-full bar"
                  style={{
                    height: `${pct}%`,
                    background: d.color ?? "linear-gradient(180deg, #00d1b2, #3a8dff)",
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              </div>
              <div className="text-[10px] text-[var(--muted)] truncate w-full text-center">{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type DonutProps = {
  value: number;
  size?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  trackColor?: string;
};

export function Donut({
  value,
  size = 140,
  label,
  sublabel,
  color = "url(#donutGrad)",
  trackColor = "rgba(255,255,255,0.06)",
}: DonutProps) {
  const r = (size - 18) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00d1b2" />
            <stop offset="100%" stopColor="#3a8dff" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth="10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)", strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-semibold">{label ?? `${value}%`}</div>
        {sublabel && <div className="text-[11px] text-[var(--muted)]">{sublabel}</div>}
      </div>
    </div>
  );
}

type HeatmapProps = {
  rows: number;
  cols: number;
  data?: number[];
  rowLabels?: string[];
  colLabels?: string[];
};

export function Heatmap({ rows, cols, data, rowLabels, colLabels }: HeatmapProps) {
  const values = data ?? Array.from({ length: rows * cols }, () => Math.random());
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {colLabels && (
          <div className="flex pl-12 mb-1.5">
            {colLabels.map((l) => (
              <div key={l} className="flex-1 text-[10px] text-center text-[var(--muted)] min-w-[28px]">
                {l}
              </div>
            ))}
          </div>
        )}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center mb-1">
            {rowLabels && (
              <div className="w-12 text-[10px] text-[var(--muted)] pr-2 text-right">{rowLabels[r]}</div>
            )}
            <div className="flex flex-1 gap-1">
              {Array.from({ length: cols }).map((_, c) => {
                const v = values[r * cols + c];
                const opacity = 0.15 + v * 0.85;
                const hue = 180 - v * 180;
                return (
                  <div
                    key={c}
                    className="flex-1 aspect-square rounded-md min-w-[16px] hover:scale-110 transition-transform cursor-pointer animate-fade-in"
                    style={{
                      background: `hsla(${hue}, 80%, 55%, ${opacity})`,
                      animationDelay: `${(r * cols + c) * 6}ms`,
                    }}
                    title={`${v.toFixed(2)}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type SparklineProps = { data: number[]; color?: string; height?: number };
export function Sparkline({ data, color = "#00d1b2", height = 32 }: SparklineProps) {
  const w = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const path = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
