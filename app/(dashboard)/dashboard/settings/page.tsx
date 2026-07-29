"use client";

import { useEffect, useState } from "react";
import { Topbar } from "../../../_components/topbar";
import { jsonFetch } from "../../../_components/fetcher";
import { IconArrowRight } from "../../../_components/icons";

type Me = {
  _id: string;
  name: string;
  email: string;
  role: string;
  timezone?: string;
  region?: string;
};

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    jsonFetch<{ user: Me }>("/api/settings/me").then((d) => setMe(d.user)).catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setSaving(true);
    setMsg(null);
    try {
      const d = await jsonFetch<{ user: Me }>("/api/settings/me", {
        method: "PATCH",
        body: JSON.stringify({ name: me.name, email: me.email, timezone: me.timezone }),
      });
      setMe(d.user);
      setMsg("Saved.");
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setMsg((err as Error).message);
    }
    setSaving(false);
  }

  return (
    <>
      <Topbar title="Settings" subtitle="Your profile information." />
      <main className="p-6 lg:p-8">
        <section className="glass p-6 animate-fade-up max-w-2xl">
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">How you appear across the workspace.</p>
          <form onSubmit={save}>
            <div className="mt-5 flex items-center gap-5">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-slate-900 text-2xl font-semibold">
                {me?.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() ?? "··"}
              </div>
              <div className="text-xs text-[var(--muted)]">
                <div className="text-white font-semibold text-sm capitalize">{me?.role ?? ""}</div>
                <div>Signed in as <span className="font-mono">{me?.email}</span></div>
              </div>
            </div>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[var(--muted)]">Full name</label>
                <input
                  className="input mt-1.5"
                  value={me?.name ?? ""}
                  onChange={(e) => setMe((m) => (m ? { ...m, name: e.target.value } : m))}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">Work email</label>
                <input
                  className="input mt-1.5"
                  type="email"
                  value={me?.email ?? ""}
                  onChange={(e) => setMe((m) => (m ? { ...m, email: e.target.value } : m))}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">Role</label>
                <input className="input mt-1.5 capitalize" value={me?.role ?? ""} readOnly />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)]">Timezone</label>
                <select
                  className="input mt-1.5"
                  value={me?.timezone ?? "UTC+5"}
                  onChange={(e) => setMe((m) => (m ? { ...m, timezone: e.target.value } : m))}
                >
                  <option>UTC</option>
                  <option>UTC+1</option>
                  <option>UTC+5</option>
                  <option>UTC+5:30</option>
                  <option>UTC+8</option>
                  <option>UTC-5</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              {msg && <span className="text-xs text-emerald-300">{msg}</span>}
              <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-60">
                {saving ? "Saving…" : "Save changes"} <IconArrowRight width={14} height={14} />
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
