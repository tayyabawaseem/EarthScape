"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconGlobe,
  IconDashboard,
  IconBrain,
  IconChart,
  IconUsers,
  IconHelp,
  IconSettings,
  IconLogout,
  IconMenu,
  IconClose,
} from "./icons";

type NavItem = { href: string; label: string; icon: typeof IconDashboard; chip?: string };

type Role = "admin" | "analyst";

type NavItemDef = NavItem & { roles?: Role[] };

const navGroupDefs: { title: string; items: NavItemDef[] }[] = [
  {
    title: "Forecast",
    items: [
      { href: "/dashboard", label: "Overview", icon: IconDashboard },
      { href: "/dashboard/models", label: "ML Models", icon: IconBrain },
      { href: "/dashboard/visualizations", label: "Visualizations", icon: IconChart },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/dashboard/tickets", label: "Tickets", icon: IconHelp, roles: ["admin"] },
      { href: "/dashboard/users", label: "Users", icon: IconUsers, roles: ["admin"] },
      { href: "/dashboard/settings", label: "Settings", icon: IconSettings },
    ],
  },
  {
    title: "Help",
    items: [
      { href: "/dashboard/support", label: "Support", icon: IconHelp, roles: ["analyst"] },
    ],
  },
];

function visibleNav(role: Role | undefined) {
  if (!role) return [] as { title: string; items: NavItem[] }[];
  return navGroupDefs
    .map((g) => ({
      title: g.title,
      items: g.items.filter((i) => !i.roles || i.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0);
}

type Me = { id: string; email: string; name: string; role: Role };

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setMe(d.user))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = me
    ? me.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "··";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-xl glass"
        aria-label="Open menu"
      >
        <IconMenu />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 flex-shrink-0 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col border-r border-white/5 bg-[var(--background-soft)]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 shadow-lg shadow-emerald-500/30 group-hover:rotate-12 transition-transform">
                <IconGlobe className="text-slate-900" />
              </span>
              <span className="font-semibold tracking-tight text-lg">
                Earth<span className="text-gradient">Scape</span>
              </span>
            </Link>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5">
              <IconClose width={16} height={16} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {visibleNav(me?.role).map((g) => (
              <div key={g.title}>
                <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {g.title}
                </div>
                <ul className="space-y-0.5">
                  {g.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link href={item.href} onClick={() => setMobileOpen(false)} className={`nav-link ${active ? "active" : ""}`}>
                          <item.icon width={16} height={16} />
                          <span className="text-sm flex-1">{item.label}</span>
                          {item.chip && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                item.chip === "LIVE"
                                  ? "bg-rose-500/15 text-rose-300"
                                  : "bg-emerald-500/15 text-emerald-300"
                              }`}
                            >
                              {item.chip === "LIVE" && <span className="inline-block h-1 w-1 rounded-full bg-rose-400 mr-1 animate-ping-slow" />}
                              {item.chip}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/5 p-3">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-slate-900 font-semibold text-sm">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[var(--background-soft)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{me?.name ?? "Loading…"}</div>
                <div className="text-[11px] text-[var(--muted)] truncate capitalize">{me?.role ?? ""} &middot; EarthScape</div>
              </div>
              <button type="button" onClick={logout} className="text-[var(--muted)] hover:text-rose-300 transition-colors" aria-label="Sign out">
                <IconLogout width={16} height={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
