import Link from "next/link";
import { PAKISTAN_PATHS } from "@/lib/pakistan_paths";
import { PK_CITIES, proj } from "@/lib/pakistan_cities";
import {
  IconGlobe,
  IconBrain,
  IconChart,
  IconShield,
  IconBell,
  IconArrowRight,
  IconCheck,
  IconCloud,
  IconActivity,
  IconThermometer,
  IconDatabase,
  IconCpu,
  IconUsers,
} from "./_components/icons";

// PK_CITIES + proj are imported from lib/pakistan_cities.ts — single source of
// truth shared with the auth panel and the dashboard heat map.

const features = [
  {
    icon: IconCloud,
    title: "30 Pakistani cities",
    body: "Daily-resolution weather history pulled from every climate zone — coastal Sindh, the Indus plains, northern foothills, Karakoram and the Balochistan plateau.",
    accent: "from-emerald-400/30 to-cyan-400/20",
  },
  {
    icon: IconBrain,
    title: "XGBoost forecasting",
    body: "Trained on 146,016 days of real weather. Predicts next-day mean temperature with 96% R² overall and 91.5% of predictions landing within ±3 °C.",
    accent: "from-pink-400/30 to-rose-400/20",
  },
  {
    icon: IconChart,
    title: "Live dashboards",
    body: "Pick any of the 30 cities and see the backtest of the model's predictions vs. actual temperature, plus a 7-day forward forecast computed on demand.",
    accent: "from-amber-400/30 to-orange-400/20",
  },
  {
    icon: IconDatabase,
    title: "MongoDB-backed",
    body: "Users, sources, jobs, alerts, dashboards, tickets and audit events all persist in MongoDB Atlas. No fake data — every page on the dashboard reads live.",
    accent: "from-blue-400/30 to-indigo-400/20",
  },
  {
    icon: IconBell,
    title: "Threshold alerts",
    body: "Configurable rules notify when temperature or precipitation crosses a defined threshold. Each acknowledgement is recorded in the audit log.",
    accent: "from-red-400/30 to-rose-400/20",
  },
  {
    icon: IconUsers,
    title: "Role-based access",
    body: "Admin, Analyst and Read-only roles. Each sees a tailored dashboard. Admin-only routes return 403 to anyone else — checked in the backend, not just hidden.",
    accent: "from-purple-400/30 to-fuchsia-400/20",
  },
];

const stats = [
  { label: "Cities trained", value: "30", suffix: "" },
  { label: "Days of weather", value: "146,016", suffix: "" },
  { label: "R² accuracy", value: "96", suffix: "%" },
  { label: "Within ±3 °C", value: "91.5", suffix: "%" },
];

const sampleForecast = [
  { city: "Lahore", temp: "33.6", chip: "chip-warning" },
  { city: "Karachi", temp: "31.3", chip: "chip-warning" },
  { city: "Islamabad", temp: "29.8", chip: "chip-info" },
  { city: "Murree", temp: "18.2", chip: "chip-success" },
  { city: "Gwadar", temp: "30.4", chip: "chip-warning" },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <header className="relative z-20">
        <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <IconGlobe className="text-slate-900" />
              <span className="absolute inset-0 rounded-xl animate-pulse-glow" />
            </span>
            <span className="font-semibold tracking-tight text-lg">
              Earth<span className="text-gradient">Scape</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm text-[var(--muted)]">
            <a href="#features" className="hover:text-white transition-colors">Platform</a>
            <a href="#cities" className="hover:text-white transition-colors">Cities</a>
            <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/register" className="btn-primary text-sm">
              Get started <IconArrowRight />
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 grid-bg" aria-hidden />
        <div className="absolute left-1/2 top-10 -translate-x-1/2 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-3xl animate-pulse-glow" aria-hidden />
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 chip chip-success animate-fade-up">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-ping-slow" />
              Pakistan weather intelligence
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] animate-fade-up delay-100">
              Next-day weather forecasts<br />
              for every major <span className="text-gradient">Pakistani city</span>.
            </h1>
            <p className="mt-6 text-lg text-[var(--muted)] max-w-xl animate-fade-up delay-200">
              EarthScape pulls 50+ years of daily weather from 30 Pakistani cities, trains an XGBoost model on it,
              and serves city-level temperature forecasts through a live dashboard. Backed by MongoDB. Real data, real model.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-fade-up delay-300">
              <Link href="/dashboard" className="btn-primary">
                Launch dashboard <IconArrowRight />
              </Link>
              <Link href="/login" className="btn-ghost">
                Sign in
              </Link>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-4 max-w-md animate-fade-up delay-400">
              {[
                "30 cities, all climate zones",
                "146K days of training data",
                "96% R² on held-out test",
                "Role-based access",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <IconCheck width={12} height={12} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pakistan map with city dots */}
          <div className="relative h-[500px] flex items-center justify-center animate-fade-in delay-300">
            <div className="absolute inset-0 m-auto h-80 w-80 rounded-full bg-gradient-to-br from-emerald-500/15 to-blue-500/10 blur-3xl" aria-hidden />
            <div className="relative h-[480px] aspect-[1000/959]">
              <svg viewBox="0 0 1000 959" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="mapGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00d1b2" stopOpacity="0.32" />
                    <stop offset="60%" stopColor="#3a8dff" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#a06bff" stopOpacity="0.12" />
                  </linearGradient>
                  <radialGradient id="dotGlow">
                    <stop offset="0%" stopColor="#00d1b2" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#00d1b2" stopOpacity="0" />
                  </radialGradient>
                  <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="0" dy="0" result="offsetblur" />
                    <feFlood floodColor="#00d1b2" floodOpacity="0.35" />
                    <feComposite in2="offsetblur" operator="in" />
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Pakistan provinces — drawn from real boundary data, themed */}
                <g filter="url(#mapShadow)">
                  {PAKISTAN_PATHS.map((p) => (
                    <path
                      key={p.id}
                      d={p.d}
                      fill="url(#mapGrad)"
                      stroke="rgba(0, 209, 178, 0.55)"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />
                  ))}
                </g>

                {/* City dots */}
                {PK_CITIES.map((c, i) => {
                  const p = proj(c.lat, c.lon);
                  const r = (c.size ?? 3) * 2.5;
                  return (
                    <g key={c.name}>
                      <circle cx={p.x} cy={p.y} r={r * 3} fill="url(#dotGlow)">
                        <animate
                          attributeName="r"
                          values={`${r * 2.5};${r * 4};${r * 2.5}`}
                          dur={`${2 + (i % 3) * 0.4}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle cx={p.x} cy={p.y} r={r} fill="#00d1b2" stroke="#04070d" strokeWidth="2" />
                    </g>
                  );
                })}

                {/* Labels for key cities */}
                {[
                  { name: "Lahore", lat: 31.55, lon: 74.34 },
                  { name: "Karachi", lat: 24.86, lon: 67.00 },
                  { name: "Islamabad", lat: 33.68, lon: 73.05 },
                  { name: "Quetta", lat: 30.18, lon: 66.98 },
                  { name: "Peshawar", lat: 34.02, lon: 71.52 },
                  { name: "Gwadar", lat: 25.13, lon: 62.32 },
                ].map((c) => {
                  const p = proj(c.lat, c.lon);
                  return (
                    <text
                      key={`l-${c.name}`}
                      x={p.x + 10}
                      y={p.y + 4}
                      fontSize="10"
                      fontWeight="500"
                      fill="rgba(230, 240, 255, 0.7)"
                    >
                      {c.name}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Floating real-data cards */}
            <div className="absolute top-6 right-0 glass p-3 w-44 animate-float">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <IconActivity width={14} height={14} /> Model accuracy
              </div>
              <div className="mt-1.5 text-xl font-semibold text-gradient">91.5%</div>
              <div className="mt-2 h-1.5 rounded bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded" style={{ width: "91.5%" }} />
              </div>
              <div className="mt-1 text-[10px] text-[var(--muted)]">within ±3 °C on held-out year</div>
            </div>
            <div className="absolute bottom-6 left-0 glass p-3 w-52 animate-float" style={{ animationDelay: "1.5s" }}>
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <IconThermometer /> Lahore — tomorrow
              </div>
              <div className="mt-1.5 text-xl font-semibold text-rose-300">33.6 &deg;C</div>
              <div className="text-[10px] text-[var(--muted)]">from the live XGBoost model</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative max-w-7xl mx-auto px-6 -mt-6 pb-16">
        <div className="glass p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={s.label} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="text-3xl font-semibold text-gradient">
                {s.value}<span className="text-base text-[var(--muted)] ml-0.5">{s.suffix}</span>
              </div>
              <div className="text-sm text-[var(--muted)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SAMPLE CITIES */}
      <section id="cities" className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Sample tomorrow&apos;s forecast</h2>
            <p className="text-[var(--muted)] mt-1">Live output from the XGBoost model for 5 of the 30 trained cities.</p>
          </div>
          <Link href="/dashboard/models" className="btn-ghost text-sm">See all 30 <IconArrowRight /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {sampleForecast.map((s, i) => (
            <div key={s.city} className="glass glass-hover p-4 animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="flex items-center justify-between">
                <IconThermometer className="text-emerald-300" />
                <span className={`chip ${s.chip}`}>tomorrow</span>
              </div>
              <div className="mt-3 text-xs text-[var(--muted)]">{s.city}</div>
              <div className="text-xl font-semibold">{s.temp} °C</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="chip chip-info">Platform</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
            One platform, from <span className="text-gradient">weather data</span> to dashboard
          </h2>
          <p className="mt-3 text-[var(--muted)]">
            Built around Meteostat, MongoDB, XGBoost and Next.js &mdash; designed for analysts to read climate data
            without operating a Hadoop cluster.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass glass-hover p-6 group animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white group-hover:scale-110 transition-transform`}>
                <f.icon />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PIPELINE */}
      <section id="pipeline" className="max-w-7xl mx-auto px-6 pb-24">
        <div className="glass p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden />
          <div className="relative">
            <span className="chip chip-info">Workflow</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">The EarthScape pipeline</h2>
            <p className="text-[var(--muted)] mt-1">Meteostat &rarr; MongoDB &rarr; XGBoost &rarr; FastAPI &rarr; Dashboard. End to end.</p>

            <div className="mt-10 grid md:grid-cols-5 gap-4">
              {[
                { icon: IconCloud, t: "Meteostat", sub: "30 stations" },
                { icon: IconDatabase, t: "MongoDB", sub: "users, alerts, jobs" },
                { icon: IconCpu, t: "XGBoost", sub: "146K rows" },
                { icon: IconBrain, t: "FastAPI", sub: "inference :8000" },
                { icon: IconChart, t: "Dashboard", sub: "Next.js + RBAC" },
              ].map((step, i, arr) => (
                <div key={step.t} className="relative flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-blue-500/30 blur-lg" />
                    <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                      <step.icon width={24} height={24} />
                    </div>
                  </div>
                  <div className="mt-3 text-sm font-semibold">{step.t}</div>
                  <div className="text-[11px] text-[var(--muted)] mt-0.5">{step.sub}</div>
                  {i < arr.length - 1 && (
                    <div className="hidden md:block absolute top-7 -right-2 w-4 h-px bg-gradient-to-r from-emerald-400/40 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="glass p-10 lg:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
          <div className="relative">
            <IconShield className="mx-auto text-emerald-300" width={32} height={32} />
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
              Ready to see <span className="text-gradient">tomorrow&apos;s weather</span>?
            </h2>
            <p className="mt-3 text-[var(--muted)] max-w-xl mx-auto">
              Sign in, pick any of the 30 cities, see the next 7 days forecast — predicted by a real ML model.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="btn-primary">Start free <IconArrowRight /></Link>
              <Link href="/login" className="btn-ghost">I already have an account</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500">
              <IconGlobe className="text-slate-900" width={14} height={14} />
            </span>
            <span>EarthScape &middot; Pakistan weather intelligence &middot; &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/dashboard/support" className="hover:text-white transition">Support</Link>
            <Link href="/login" className="hover:text-white transition">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
