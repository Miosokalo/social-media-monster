"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/studio", label: "Creation Studio" },
  { href: "/calendar", label: "Kalender" },
  { href: "/analytics", label: "Analytics" },
  { href: "/inbox", label: "Inbox" },
  { href: "/settings", label: "Einstellungen" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-zinc-800 bg-zinc-900/50 md:w-52 md:border-b-0 md:border-r">
        <div className="flex h-14 items-center border-b border-zinc-800 px-4 text-sm font-medium text-zinc-300">
          SMM
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto px-2 py-3 md:flex-col md:overflow-visible">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden flex-col gap-2 p-3 md:flex">
          <div className="flex flex-col gap-1 text-xs text-zinc-600">
            <Link href="/impressum" className="hover:text-zinc-400">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-zinc-400">
              Datenschutz
            </Link>
            <a
              href="/api/audit-logs/export"
              className="hover:text-zinc-400"
            >
              Audit-Log (CSV)
            </a>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-md border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-800"
          >
            Abmelden
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
