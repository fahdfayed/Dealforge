"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Compass,
  Calculator,
  FileText,
  ShieldCheck,
  Library,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/proof-vault", label: "Proof Vault", icon: Library },
];

const OPPORTUNITY_SUBNAV = [
  { segment: "", label: "Deal Twin", icon: Compass },
  { segment: "discovery", label: "Discovery Architect", icon: Compass },
  { segment: "estimate", label: "Commercial Lab", icon: Calculator },
  { segment: "promises", label: "Promise Ledger", icon: ShieldCheck },
  { segment: "proposals", label: "Proposal Studio", icon: FileText },
];

export function SidebarNav() {
  const pathname = usePathname();
  const oppMatch = pathname.match(/^\/opportunities\/([^/]+)(?:\/(.*))?$/);
  const activeOppId = oppMatch && oppMatch[1] !== "new" ? oppMatch[1] : null;

  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
          DF
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">DealForge</p>
          <p className="text-xs text-slate-400">by Intelloger</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {activeOppId && (
          <div className="mt-6">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              This opportunity
            </p>
            <ul className="mt-2 space-y-1">
              {OPPORTUNITY_SUBNAV.map((item) => {
                const href = `/opportunities/${activeOppId}${item.segment ? `/${item.segment}` : ""}`;
                const active = pathname === href;
                return (
                  <li key={item.segment}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
