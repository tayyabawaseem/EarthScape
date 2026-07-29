"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconMail, IconLock, IconArrowRight, IconShield } from "../../../_components/icons";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-[var(--muted)]">Loading…</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("admin@earthscape.io");
  const [password, setPassword] = useState("Climate2026!");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign in failed");
        setSubmitting(false);
        return;
      }
      if (data.user?.role !== "admin") {
        setError("That account is not an administrator. Use /login instead.");
        setSubmitting(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="inline-flex items-center gap-2 chip chip-warning">
        <IconShield width={12} height={12} /> Administrator access
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Admin sign in</h1>
      <p className="mt-2 text-[var(--muted)]">
        Restricted area. Only accounts with the admin role can sign in here.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-xs font-medium text-[var(--muted)]">Admin email</label>
          <div className="relative mt-1.5">
            <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" width={16} height={16} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-12"
              placeholder="admin@example.com"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--muted)]">Password</label>
          <div className="relative mt-1.5">
            <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" width={16} height={16} />
            <input
              type={showPass ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-12 pr-16"
              placeholder="Enter password"
            />
            <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-white">
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm px-3 py-2 animate-fade-in">
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-60">
          {submitting ? "Signing in…" : "Sign in as administrator"} <IconArrowRight />
        </button>
      </form>
    </div>
  );
}
