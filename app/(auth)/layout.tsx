import Link from "next/link";
import { PAKISTAN_PATHS } from "@/lib/pakistan_paths";
import { IconGlobe } from "../_components/icons";

const cities = [
  { name: "Karachi", lat: 24.86, lon: 67.0 },
  { name: "Lahore", lat: 31.55, lon: 74.34 },
  { name: "Islamabad", lat: 33.68, lon: 73.05 },
  { name: "Faisalabad", lat: 31.45, lon: 73.14 },
  { name: "Multan", lat: 30.16, lon: 71.52 },
  { name: "Quetta", lat: 30.18, lon: 66.98 },
  { name: "Peshawar", lat: 34.02, lon: 71.52 },
  { name: "Hyderabad", lat: 25.4, lon: 68.36 },
  { name: "Gilgit", lat: 35.92, lon: 74.31 },
  { name: "Gwadar", lat: 25.13, lon: 62.32 },
];

const proj = (lat: number, lon: number) => ({
  x: 56.08 * lon - 3366.4,
  y: -0.336 * lat * lat - 44.78 * lat + 2164.92,
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
            <IconGlobe className="text-slate-900" />
          </span>
          <span className="font-semibold tracking-tight text-lg">
            Earth<span className="text-gradient">Scape</span>
          </span>
        </Link>
      </header>
      <main className="flex-1 grid lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <div className="hidden lg:flex relative overflow-hidden items-center justify-center px-6 py-10">
          <div className="absolute inset-0 grid-bg" aria-hidden />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden />
          <div className="relative max-w-md text-center animate-fade-up">
            <div className="relative mx-auto h-72 aspect-[1000/959]">
              <svg
                viewBox="0 0 1000 959"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="auth-mapGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00d1b2" stopOpacity="0.30" />
                    <stop offset="60%" stopColor="#3a8dff" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#a06bff" stopOpacity="0.10" />
                  </linearGradient>
                  <radialGradient id="auth-dotGlow">
                    <stop offset="0%" stopColor="#00d1b2" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#00d1b2" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {PAKISTAN_PATHS.map((p) => (
                  <path
                    key={p.id}
                    d={p.d}
                    fill="url(#auth-mapGrad)"
                    stroke="rgba(0, 209, 178, 0.55)"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                ))}
                {cities.map((c, i) => {
                  const p = proj(c.lat, c.lon);
                  return (
                    <g key={c.name}>
                      <circle cx={p.x} cy={p.y} r="22" fill="url(#auth-dotGlow)">
                        <animate
                          attributeName="r"
                          values="18;28;18"
                          dur={`${2 + (i % 3) * 0.4}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle cx={p.x} cy={p.y} r="6" fill="#00d1b2" stroke="#04070d" strokeWidth="2" />
                    </g>
                  );
                })}
              </svg>
            </div>
            <h2 className="mt-8 text-2xl font-semibold tracking-tight">
              Pakistan weather,<br />
              <span className="text-gradient">city by city.</span>
            </h2>
            <p className="mt-3 text-[var(--muted)] text-sm">
              Sign in to see next-day forecasts for every major Pakistani city.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { v: "30", l: "cities" },
                { v: "146K", l: "days trained" },
                { v: "96%", l: "R² accuracy" },
              ].map((m, i) => (
                <div key={m.l} className="glass p-3 text-xs animate-fade-up" style={{ animationDelay: `${i * 100 + 200}ms` }}>
                  <div className="font-semibold text-sm">{m.v}</div>
                  <div className="text-[var(--muted)]">{m.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
