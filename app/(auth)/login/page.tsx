"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconMail, IconLock, IconArrowRight } from "../../_components/icons";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-[var(--muted)]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("analyst@earthscape.io");
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
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-[var(--muted)]">Sign in to your EarthScape account.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-xs font-medium text-[var(--muted)]">Work email</label>
          <div className="relative mt-1.5">
            <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" width={16} height={16} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-12"
              placeholder="you@example.com"
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

        <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
          Keep me signed in on this device
        </label>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm px-3 py-2 animate-fade-in">
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-60">
          {submitting ? "Signing in…" : "Sign in"} <IconArrowRight />
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--muted)]">
        New to EarthScape?{" "}
        <Link href="/register" className="text-[var(--primary)] hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
