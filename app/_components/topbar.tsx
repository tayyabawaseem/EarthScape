"use client";

import Link from "next/link";
import { IconHelp } from "./icons";

type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export function Topbar({ title, subtitle, actions }: Props) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--background)]/70 backdrop-blur-xl border-b border-white/5">
      <div className="px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0 pl-12 lg:pl-0">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span>EarthScape</span>
            <span>/</span>
            <span className="text-[var(--foreground)]">{title}</span>
          </div>
          <h1 className="mt-0.5 text-xl sm:text-2xl font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--muted)] mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <Link href="/dashboard/support" className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/5 text-[var(--muted)] hover:text-white transition-colors" aria-label="Help">
            <IconHelp width={16} height={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}

