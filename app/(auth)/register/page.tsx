"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconMail,
  IconLock,
  IconUser,
  IconArrowRight,
} from "../../_components/icons";

type FormState = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "analyst" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign up failed");
        setSubmitting(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setSubmitting(false);
    }
  }

  const passLen = form.password.length;
  const strength = Math.min(4, Math.floor(passLen / 4));
  const strengthLabel = passLen >= 12 ? "Strong password" : passLen >= 8 ? "OK — could be stronger" : "Too short";

  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-[var(--muted)]">
        Sign up as an analyst — read climate data, build dashboards, set alerts.
      </p>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        <div>
          <label className="text-xs font-medium text-[var(--muted)]">Full name</label>
          <div className="relative mt-1.5">
            <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" width={16} height={16} />
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="input pl-12"
              placeholder="Your name"
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
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
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
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="input pl-12"
              placeholder="At least 8 characters"
            />
          </div>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded ${i <= strength ? "bg-emerald-400" : "bg-white/10"}`}
              />
            ))}
          </div>
          <p className="mt-1 text-[11px] text-emerald-300">{strengthLabel}</p>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm px-3 py-2 animate-fade-in">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full justify-center disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create account"} <IconArrowRight />
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--primary)] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
