"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../../_components/topbar";
import { jsonFetch, relativeTime } from "../../../_components/fetcher";
import { Modal } from "../../../_components/Modal";
import {
  IconUsers,
  IconUser,
  IconShield,
  IconChart,
  IconPlus,
  IconSearch,
  IconCheck,
  IconMail,
  IconLock,
  IconArrowRight,
} from "../../../_components/icons";

type User = {
  _id: string;
  email: string;
  name: string;
  role: "admin" | "analyst";
  lastActiveAt?: string;
  createdAt: string;
};

type AuditEventItem = {
  _id: string;
  actorName: string;
  action: string;
  target?: string;
  createdAt: string;
};

const roleCards = [
  {
    name: "Administrator",
    role: "admin" as const,
    icon: IconShield,
    desc: "Full read/write, manages users, tickets and audit log.",
    perms: ["Manage users", "View all tickets", "View audit log", "Edit any setting"],
    color: "from-rose-400 to-orange-400",
  },
  {
    name: "Analyst",
    role: "analyst" as const,
    icon: IconChart,
    desc: "Read climate data, build dashboards, raise tickets.",
    perms: ["Read forecasts", "Build dashboards", "Open tickets", "Edit own profile"],
    color: "from-emerald-400 to-blue-400",
  },
];

const avatarColors = [
  "from-emerald-400 to-blue-500",
  "from-rose-400 to-orange-400",
  "from-purple-400 to-fuchsia-400",
  "from-amber-400 to-rose-400",
  "from-blue-400 to-indigo-400",
  "from-cyan-400 to-teal-400",
  "from-slate-400 to-slate-500",
];

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ admin: 0, analyst: 0 });
  const [audit, setAudit] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // Add-user modal state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [u, a] = await Promise.all([
        jsonFetch<{ users: User[]; counts: typeof counts }>("/api/users"),
        jsonFetch<{ events: AuditEventItem[] }>("/api/audit-events?limit=10"),
      ]);
      setUsers(u.users);
      setCounts(u.counts);
      setAudit(a.events);
      setForbidden(false);
    } catch (e) {
      if ((e as Error).message.includes("Forbidden")) setForbidden(true);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const adminCount = users.filter((u) => u.role === "admin").length;

  function openAddModal() {
    setAddName("");
    setAddEmail("");
    setAddPassword("");
    setAddError(null);
    setAddOpen(true);
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      await jsonFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: addName.trim(),
          email: addEmail.trim().toLowerCase(),
          password: addPassword,
          role: "analyst",
        }),
      });
      setAddOpen(false);
      await load();
    } catch (e) {
      setAddError((e as Error).message);
    }
    setAdding(false);
  }

  async function changeRole(u: User, newRole: User["role"]) {
    if (newRole === u.role) return;
    if (newRole === "admin" && adminCount >= 1) {
      alert("Only one administrator is allowed. Demote the current admin first.");
      return;
    }
    if (u.role === "admin" && adminCount <= 1) {
      alert("Cannot demote the only administrator.");
      return;
    }
    try {
      await jsonFetch("/api/users", {
        method: "PATCH",
        body: JSON.stringify({ id: u._id, role: newRole }),
      });
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  const filtered = users.filter((p) =>
    [p.name, p.email, p.role].some((v) => v.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <>
      <Topbar
        title="User management"
        subtitle="Two roles, single administrator. The audit log records every change."
        actions={
          <button type="button" onClick={openAddModal} disabled={forbidden} className="btn-primary text-sm disabled:opacity-60">
            <IconPlus width={14} height={14} /> Add user
          </button>
        }
      />
      <main className="p-6 lg:p-8 space-y-6">
        {forbidden && (
          <div className="glass p-4 border border-amber-500/30 text-amber-200 text-sm">
            Admin-only. Sign in as <code className="text-emerald-300 bg-white/5 px-1 rounded">admin@earthscape.io</code>.
          </div>
        )}

        <section className="grid md:grid-cols-2 gap-4">
          {roleCards.map((r, i) => (
            <div key={r.name} className="glass glass-hover p-5 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${r.color} text-slate-900`}>
                  <r.icon />
                </div>
                <span className="chip">{counts[r.role] ?? 0} {counts[r.role] === 1 ? "user" : "users"}</span>
              </div>
              <h3 className="mt-4 font-semibold">{r.name}</h3>
              <p className="text-xs text-[var(--muted)] mt-1">{r.desc}</p>
              <ul className="mt-3 space-y-1.5 text-xs">
                {r.perms.map((p) => (
                  <li key={p} className="flex items-center gap-1.5 text-[var(--muted)]">
                    <IconCheck width={10} height={10} className="text-emerald-300" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="glass p-6 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <IconUsers width={16} height={16} className="text-emerald-300" />
                Team members
              </h2>
              <p className="text-xs text-[var(--muted)]">{filtered.length} of {users.length} shown.</p>
            </div>
            <div className="relative">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" width={14} height={14} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users…"
                className="pl-11 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors w-64"
              />
            </div>
          </div>
          {loading ? (
            <div className="text-sm text-[var(--muted)] py-12 text-center">Loading users…</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-[var(--muted)] py-12 text-center">No users yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    <th className="text-left py-2 px-3 font-semibold">User</th>
                    <th className="text-left py-2 px-3 font-semibold">Role</th>
                    <th className="text-left py-2 px-3 font-semibold">Region</th>
                    <th className="text-right py-2 px-3 font-semibold">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p._id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-slate-900 text-xs font-semibold`}>
                            {p.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-[11px] text-[var(--muted)]">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={p.role}
                          onChange={(e) => changeRole(p, e.target.value as User["role"])}
                          className={`bg-white/5 border rounded-md px-2 py-1 text-xs ${
                            p.role === "admin" ? "border-rose-500/40 text-rose-300" : "border-white/10"
                          }`}
                        >
                          <option value="analyst">analyst</option>
                          <option value="admin">administrator</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-[var(--muted)]">—</td>
                      <td className="py-3 px-3 text-right text-[var(--muted)]">{relativeTime(p.lastActiveAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="glass p-6 animate-fade-up">
          <h2 className="text-lg font-semibold">Recent audit events</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">Live from the audit_events collection.</p>
          {audit.length === 0 ? (
            <div className="text-sm text-[var(--muted)] py-8 text-center">
              {loading ? "Loading audit log…" : "No audit events yet. Make a change and refresh."}
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5 text-sm">
              {audit.map((e, i) => (
                <li key={e._id} className="flex gap-3 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 shrink-0 text-[var(--muted)]"><IconUser width={12} height={12} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold">{e.actorName}</span>{" "}
                      <span className="text-[var(--muted)]">{e.action}</span>
                      {e.target && <span className="text-[var(--muted)]"> &middot; <code className="text-emerald-300/80 bg-white/5 px-1 rounded text-[11px]">{e.target}</code></span>}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">{relativeTime(e.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add user"
        subtitle="New users are created as analysts. They can sign in immediately with the password you set."
      >
        <form onSubmit={submitAdd} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--muted)]">Full name</label>
            <div className="relative mt-1.5">
              <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" width={16} height={16} />
              <input
                type="text"
                required
                minLength={2}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="input pl-12"
                placeholder="e.g. Ahmed Khan"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted)]">Work email</label>
            <div className="relative mt-1.5">
              <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" width={16} height={16} />
              <input
                type="email"
                required
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="input pl-12"
                placeholder="ahmed@earthscape.io"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted)]">Password</label>
            <div className="relative mt-1.5">
              <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" width={16} height={16} />
              <input
                type="text"
                required
                minLength={8}
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                className="input pl-12 font-mono"
                placeholder="At least 8 characters"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--muted)]">
              The user will sign in with this password. Share it securely.
            </p>
          </div>

          {addError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm px-3 py-2 animate-fade-in">
              {addError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="btn-ghost text-sm"
              disabled={adding}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="btn-primary text-sm disabled:opacity-60"
            >
              {adding ? "Creating…" : "Create user"} <IconArrowRight width={14} height={14} />
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
