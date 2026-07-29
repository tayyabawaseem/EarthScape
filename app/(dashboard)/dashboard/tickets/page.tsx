"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../../_components/topbar";
import { jsonFetch, relativeTime } from "../../../_components/fetcher";
import { IconAlert, IconCheck, IconRefresh, IconHelp } from "../../../_components/icons";

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

const statusChip: Record<string, string> = {
  open: "chip-warning",
  "in-progress": "chip-info",
  resolved: "chip-success",
};

const priorityChip: Record<string, string> = {
  high: "chip-danger",
  medium: "chip-warning",
  low: "",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "in-progress" | "resolved">("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await jsonFetch<{ tickets: Ticket[] }>("/api/tickets");
      setTickets(d.tickets);
      setForbidden(false);
    } catch (e) {
      if ((e as Error).message.includes("Forbidden")) setForbidden(true);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: Ticket["status"]) {
    setSavingId(id);
    try {
      await jsonFetch("/api/tickets", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      setTickets((ts) =>
        ts.map((t) => (t._id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t))
      );
    } catch (err) {
      alert((err as Error).message);
    }
    setSavingId(null);
  }

  async function updatePriority(id: string, priority: Ticket["priority"]) {
    setSavingId(id);
    try {
      await jsonFetch("/api/tickets", {
        method: "PATCH",
        body: JSON.stringify({ id, priority }),
      });
      setTickets((ts) =>
        ts.map((t) => (t._id === id ? { ...t, priority, updatedAt: new Date().toISOString() } : t))
      );
    } catch (err) {
      alert((err as Error).message);
    }
    setSavingId(null);
  }

  const visible = tickets.filter((t) => filter === "all" || t.status === filter);
  const counts = {
    open: tickets.filter((t) => t.status === "open").length,
    "in-progress": tickets.filter((t) => t.status === "in-progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <>
      <Topbar
        title="Tickets"
        subtitle="Every ticket opened by users across the workspace."
        actions={
          <button type="button" onClick={load} disabled={loading} className="btn-ghost text-sm disabled:opacity-60">
            <IconRefresh width={14} height={14} /> {loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      />
      <main className="p-6 lg:p-8 space-y-6">
        {forbidden && (
          <div className="glass p-4 border border-amber-500/30 text-amber-200 text-sm">
            Admin-only. Sign in as <code className="text-emerald-300 bg-white/5 px-1 rounded">admin@earthscape.io</code>.
          </div>
        )}

        <section className="grid grid-cols-3 gap-4">
          {([
            { l: "Open", v: counts.open, k: "open" as const, c: "chip-warning", icon: IconAlert },
            { l: "In progress", v: counts["in-progress"], k: "in-progress" as const, c: "chip-info", icon: IconHelp },
            { l: "Resolved", v: counts.resolved, k: "resolved" as const, c: "chip-success", icon: IconCheck },
          ]).map((k) => (
            <button
              key={k.l}
              type="button"
              onClick={() => setFilter(filter === k.k ? "all" : k.k)}
              className={`glass glass-hover p-5 animate-fade-up text-left ${
                filter === k.k ? "border border-[var(--primary)]/40" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-blue-400/10">
                  <k.icon />
                </span>
                <span className={`chip ${k.c}`}>{k.l.toLowerCase()}</span>
              </div>
              <div className="mt-4 text-xs text-[var(--muted)]">{k.l} tickets</div>
              <div className="text-2xl font-semibold">{k.v}</div>
              <div className="text-[11px] text-[var(--muted)] mt-1">
                {filter === k.k ? "click to clear filter" : "click to filter"}
              </div>
            </button>
          ))}
        </section>

        <section className="glass p-6 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-semibold">
                {filter === "all" ? "All tickets" : `Tickets — ${filter}`}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {visible.length} of {tickets.length} shown. Change status / priority inline.
              </p>
            </div>
          </div>
          {loading && tickets.length === 0 ? (
            <div className="text-sm text-[var(--muted)] py-12 text-center">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="text-sm text-[var(--muted)] py-12 text-center">No tickets match this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    <th className="text-left py-2 px-3 font-semibold">ID</th>
                    <th className="text-left py-2 px-3 font-semibold">Subject</th>
                    <th className="text-left py-2 px-3 font-semibold">Category</th>
                    <th className="text-left py-2 px-3 font-semibold">Opened by</th>
                    <th className="text-left py-2 px-3 font-semibold">Priority</th>
                    <th className="text-left py-2 px-3 font-semibold">Status</th>
                    <th className="text-right py-2 px-3 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((t, i) => (
                    <tr
                      key={t._id}
                      className="border-t border-white/5 hover:bg-white/[0.03] transition-colors animate-fade-up"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="py-3 px-3 font-mono text-xs text-[var(--muted)]">{t.ticketId}</td>
                      <td className="py-3 px-3 font-medium">{t.subject}</td>
                      <td className="py-3 px-3 text-[var(--muted)]">{t.category}</td>
                      <td className="py-3 px-3 text-[var(--muted)]">{t.createdBy}</td>
                      <td className="py-3 px-3">
                        <select
                          value={t.priority}
                          onChange={(e) => updatePriority(t._id, e.target.value as Ticket["priority"])}
                          disabled={savingId === t._id}
                          className={`bg-white/5 border rounded-md px-2 py-1 text-xs disabled:opacity-50 ${
                            priorityChip[t.priority] === "chip-danger"
                              ? "border-rose-500/40 text-rose-300"
                              : priorityChip[t.priority] === "chip-warning"
                              ? "border-amber-500/40 text-amber-300"
                              : "border-white/10"
                          }`}
                        >
                          <option value="high">high</option>
                          <option value="medium">medium</option>
                          <option value="low">low</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={t.status}
                          onChange={(e) => updateStatus(t._id, e.target.value as Ticket["status"])}
                          disabled={savingId === t._id}
                          className={`bg-white/5 border rounded-md px-2 py-1 text-xs disabled:opacity-50 ${
                            t.status === "resolved"
                              ? "border-emerald-500/40 text-emerald-300"
                              : t.status === "in-progress"
                              ? "border-blue-500/40 text-blue-300"
                              : "border-amber-500/40 text-amber-300"
                          }`}
                        >
                          <option value="open">open</option>
                          <option value="in-progress">in-progress</option>
                          <option value="resolved">resolved</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right text-[var(--muted)]">{relativeTime(t.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
