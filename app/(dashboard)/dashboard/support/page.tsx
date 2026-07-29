"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../../_components/topbar";
import { jsonFetch, relativeTime } from "../../../_components/fetcher";
import {
  IconHelp,
  IconMail,
  IconArrowRight,
  IconPlus,
  IconCheck,
  IconAlert,
  IconSparkles,
} from "../../../_components/icons";

type Me = { id: string; email: string; name: string; role: "admin" | "analyst" };

type Ticket = {
  _id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved";
  createdBy: string;
  updatedAt: string;
};

const statusChip: Record<string, string> = { open: "chip-warning", "in-progress": "chip-info", resolved: "chip-success" };
const priorityChip: Record<string, string> = { high: "chip-danger", medium: "chip-warning", low: "" };

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the model actually predict?",
    a: "Just one thing: the next day's mean temperature (in °C) for any of the 30 trained Pakistani cities. It does not predict rain, humidity, wind, or sunshine — only temperature.",
  },
  {
    q: "Which cities are covered?",
    a: "30 cities across every climate zone of Pakistan — coastal (Karachi, Gwadar, Pasni), Sindh interior (Hyderabad, Sukkur, Larkana, Nawabshah), southern Punjab (Multan, Bahawalpur, Rahim Yar Khan), the Indus plains (Lahore, Faisalabad, Gujranwala, Sialkot, Sargodha, Sheikhupura, Jhang), northern foothills (Islamabad, Rawalpindi, Peshawar, Mardan, Abbottabad), northern mountains (Murree, Gilgit, Skardu, Muzaffarabad), and Balochistan plateau (Quetta, Khuzdar, Zhob, Sibi).",
  },
  {
    q: "How accurate is the model?",
    a: "On a held-out year of unseen data: R² 0.96, RMSE 1.77 °C, and 91.5% of predictions landed within ±3 °C of the actual temperature. For coastal cities like Karachi, accuracy within ±2 °C reaches 94%.",
  },
  {
    q: "What does R² 0.96 mean?",
    a: "R² is a goodness-of-fit score from 0 to 1. 0.96 means the model explains 96% of the variation in real temperatures. Anything above 0.9 is considered very strong for weather data.",
  },
  {
    q: "Where does the training data come from?",
    a: "The open Meteostat archive. We pulled daily history (mean, min, max temperature and precipitation) for 30 stations from 1990 to today — about 146,000 day-rows in total.",
  },
  {
    q: "How is the forecast computed?",
    a: "The Python ML service loads an XGBoost model trained on lag features (yesterday's temp, last week's average, day of year, etc.). For multi-day forecasts the model predicts day +1, then re-uses its own prediction as input to predict day +2, and so on (recursive forecasting).",
  },
  {
    q: "Why is the forecast capped at 30 days?",
    a: "Recursive prediction errors compound. Beyond ~30 days, temperature is too chaotic to predict from past temperatures alone — the forecast converges to a seasonal average and stops being useful.",
  },
  {
    q: "Where do the weather alerts come from?",
    a: "The alerts collection in MongoDB. Currently they're seeded examples for demonstration — there is no background worker yet that watches the forecast and creates new alerts when a threshold is crossed. Adding that auto-alert worker is the next backend milestone.",
  },
  {
    q: "What can I do as an analyst?",
    a: "Pick any of the 30 cities on the ML Models page, see the model's backtest and 7-day forecast, open historical-temperature charts on the Visualizations page, open tickets here when something looks wrong, edit your profile in Settings. You cannot acknowledge alerts, invite users, or manage workspace settings — those are admin-only.",
  },
  {
    q: "How do I report a bug or suggest a feature?",
    a: "Use the Submit feedback form below — it goes straight into the feedback collection in MongoDB. For something that needs investigation, open a New ticket at the top right instead.",
  },
];

export default function SupportPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [fbType, setFbType] = useState<"bug" | "idea" | "question">("idea");
  const [fbSubject, setFbSubject] = useState("");
  const [fbBody, setFbBody] = useState("");
  const [fbState, setFbState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [fbError, setFbError] = useState<string | null>(null);

  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"high" | "medium" | "low">("medium");
  const [ticketCategory, setTicketCategory] = useState("Models");

  async function load(currentMe?: Me) {
    setLoading(true);
    try {
      const meResp = currentMe ? { user: currentMe } : await jsonFetch<{ user: Me }>("/api/auth/me");
      if (!currentMe) setMe(meResp.user);
      const isAdmin = meResp.user.role === "admin";
      const d = await jsonFetch<{ tickets: Ticket[] }>(`/api/tickets${isAdmin ? "" : "?mine=true"}`);
      setTickets(d.tickets);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const isAdmin = me?.role === "admin";

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    setFbState("sending");
    setFbError(null);
    try {
      await jsonFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ type: fbType, subject: fbSubject, body: fbBody }),
      });
      setFbState("sent");
      setFbSubject("");
      setFbBody("");
      setTimeout(() => setFbState("idle"), 3000);
    } catch (err) {
      setFbState("error");
      setFbError((err as Error).message);
    }
  }

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketSubject.trim()) return;
    try {
      await jsonFetch("/api/tickets", {
        method: "POST",
        body: JSON.stringify({ subject: ticketSubject, category: ticketCategory, priority: ticketPriority }),
      });
      setTicketSubject("");
      setNewTicketOpen(false);
      if (me) await load(me);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <>
      <Topbar
        title="Support &amp; feedback"
        subtitle="Get help, report a bug, or share an idea."
        actions={
          <button type="button" onClick={() => setNewTicketOpen((v) => !v)} className="btn-primary text-sm">
            <IconPlus width={14} height={14} /> New ticket
          </button>
        }
      />
      <main className="p-6 lg:p-8 space-y-6">

        {/* New ticket form */}
        {newTicketOpen && (
          <section className="glass p-6 animate-fade-up">
            <h2 className="text-lg font-semibold">Open a ticket</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              For anything that needs investigation. Saved to MongoDB and appears in your tickets list below.
            </p>
            <form onSubmit={submitTicket} className="mt-4 grid md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-[var(--muted)]">Subject</label>
                <input
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="input mt-1.5"
                  placeholder='e.g. "Lahore forecast looks 2 °C cold vs PMD bulletin"'
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">Priority</label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as "high" | "medium" | "low")}
                  className="input mt-1.5"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="input mt-1.5"
                >
                  <option>Models</option>
                  <option>Visualizations</option>
                  <option>Alerts</option>
                  <option>Account</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end gap-2">
                <button type="button" onClick={() => setNewTicketOpen(false)} className="btn-ghost text-sm">Cancel</button>
                <button type="submit" className="btn-primary text-sm">
                  Create ticket <IconArrowRight width={14} height={14} />
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Help card — single, honest */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="glass glass-hover p-5 animate-fade-up">
            <div className="flex items-start justify-between">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/30 to-indigo-400/20">
                <IconMail />
              </div>
              <span className="chip chip-info">24h SLA</span>
            </div>
            <h3 className="mt-4 font-semibold">Email support</h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              For anything that doesn&apos;t fit a ticket. We reply within one business day.
            </p>
            <a href="mailto:support@earthscape.io" className="mt-4 btn-ghost text-xs w-full justify-center">
              support@earthscape.io <IconArrowRight width={12} height={12} />
            </a>
          </div>

          {/* Submit feedback inline */}
          <div className="glass p-5 animate-fade-up delay-100 md:col-span-2">
            <h3 className="font-semibold flex items-center gap-2">
              <IconSparkles width={14} height={14} className="text-emerald-300" /> Send quick feedback
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              Short bug report, idea, or question. Goes to the feedback collection.
            </p>
            <form onSubmit={submitFeedback} className="mt-3 space-y-3">
              <div className="flex gap-2">
                {(["bug", "idea", "question"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFbType(t)}
                    className={`flex-1 px-2 py-2 text-xs rounded-lg border capitalize transition ${
                      fbType === t ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                value={fbSubject}
                onChange={(e) => setFbSubject(e.target.value)}
                className="input"
                placeholder="One-line summary"
                required
                minLength={3}
              />
              <textarea
                value={fbBody}
                onChange={(e) => setFbBody(e.target.value)}
                className="input min-h-[80px] resize-y"
                placeholder="A few sentences of context (optional but helpful)"
                required
                minLength={1}
              />
              {fbState === "sent" && <div className="text-xs text-emerald-300">Thanks — feedback recorded.</div>}
              {fbState === "error" && <div className="text-xs text-rose-300">{fbError}</div>}
              <button
                type="submit"
                disabled={fbState === "sending"}
                className="btn-primary w-full justify-center disabled:opacity-60"
              >
                {fbState === "sending" ? "Sending…" : "Send feedback"} <IconArrowRight width={14} height={14} />
              </button>
            </form>
          </div>
        </section>

        {/* Tickets table — scoped */}
        <section className="glass p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">
                {isAdmin ? "All tickets" : "Your tickets"}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {isAdmin
                  ? `Every ticket in the workspace, sorted by most recent activity.`
                  : `Only tickets you opened. ${tickets.length} total.`}
              </p>
            </div>
          </div>
          {loading ? (
            <div className="text-sm text-[var(--muted)] py-10 text-center">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="text-sm text-[var(--muted)] py-10 text-center">
              {isAdmin ? "No tickets yet." : "You haven't opened any tickets yet. Click New ticket above when you need to."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    <th className="text-left py-2 px-3 font-semibold">ID</th>
                    <th className="text-left py-2 px-3 font-semibold">Subject</th>
                    <th className="text-left py-2 px-3 font-semibold">Category</th>
                    <th className="text-left py-2 px-3 font-semibold">Priority</th>
                    <th className="text-left py-2 px-3 font-semibold">Status</th>
                    {isAdmin && <th className="text-left py-2 px-3 font-semibold">Opened by</th>}
                    <th className="text-right py-2 px-3 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t, i) => (
                    <tr
                      key={t._id}
                      className="border-t border-white/5 hover:bg-white/[0.03] transition-colors animate-fade-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <td className="py-3 px-3 font-mono text-xs text-[var(--muted)]">{t.ticketId}</td>
                      <td className="py-3 px-3 font-medium">{t.subject}</td>
                      <td className="py-3 px-3 text-[var(--muted)]">{t.category}</td>
                      <td className="py-3 px-3">
                        <span className={`chip ${priorityChip[t.priority]}`}>{t.priority}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`chip ${statusChip[t.status]}`}>
                          {t.status === "resolved" ? (
                            <IconCheck width={10} height={10} />
                          ) : t.status === "open" ? (
                            <IconAlert width={10} height={10} />
                          ) : null}
                          {t.status}
                        </span>
                      </td>
                      {isAdmin && <td className="py-3 px-3 text-[var(--muted)]">{t.createdBy}</td>}
                      <td className="py-3 px-3 text-right text-[var(--muted)]">{relativeTime(t.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* FAQ — Pakistan/weather/model relevant */}
        <section className="glass p-6 animate-fade-up">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <IconHelp width={16} height={16} className="text-emerald-300" />
            Frequently asked
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Honest answers about what the model does, how accurate it is, and what you can do with it.
          </p>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {FAQ.map((item, i) => (
              <details
                key={item.q}
                className="group rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <summary className="cursor-pointer flex items-center justify-between p-4 text-sm font-medium list-none">
                  <span className="pr-3">{item.q}</span>
                  <span className="text-[var(--muted)] group-open:rotate-45 transition-transform shrink-0">+</span>
                </summary>
                <div className="px-4 pb-4 text-sm text-[var(--muted)] leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
