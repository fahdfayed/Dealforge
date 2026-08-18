"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Compass,
  Wrench,
  FileText,
  ShieldCheck,
  Library,
  BarChart3,
  HeartPulse,
  Inbox,
  Sliders,
  Calculator,
  Handshake,
  ClipboardCheck,
  Users,
  Building2,
  PackageCheck,
} from "lucide-react";

const PRIMARY_NAV = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/deals", label: "Deals", icon: Briefcase },
  { href: "/proof", label: "Proof Vault", icon: Library },
  { href: "/portfolio", label: "Portfolio", icon: BarChart3 },
];

const DEAL_NAV = [
  { segment: "", label: "Deal Twin", icon: Compass },
  { segment: "understand", label: "Understand", icon: Inbox },
  { segment: "health", label: "Health details", icon: HeartPulse },
  { segment: "sources", label: "Sources", icon: FileText },
  { segment: "build-offer", label: "Build offer", icon: Wrench },
  { segment: "solution", label: "Detailed solution", icon: Sliders },
  { segment: "estimate", label: "Detailed estimate", icon: Calculator },
  { segment: "negotiate", label: "Negotiate", icon: Handshake },
  { segment: "commitments", label: "Commitments", icon: ShieldCheck },
  { segment: "submission-check", label: "Submission check", icon: ClipboardCheck },
  { segment: "client-share", label: "Client share", icon: Users },
  { segment: "oracle", label: "Oracle coordination", icon: Building2 },
  { segment: "proposal", label: "Proposal", icon: FileText },
  { segment: "handover", label: "Handover", icon: PackageCheck },
];

export function SidebarNav() {
  const pathname = usePathname();
  const dealMatch = pathname.match(/^\/deals\/([^/]+)(?:\/(.*))?$/);
  const activeDealId = dealMatch && dealMatch[1] !== "new" ? dealMatch[1] : null;

  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-xs font-bold text-white shadow-md">
          <span style={{ color: 'var(--intelloger-orange)' }} className="font-black">D</span>F
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">DealForge</p>
          <p className="text-xs text-slate-500" style={{ color: 'var(--intelloger-navy)' }}>Intelloger Intelligence</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {PRIMARY_NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  style={active ? {
                    backgroundColor: 'var(--intelloger-navy)',
                  } : {}}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {activeDealId && (
          <div className="mt-6">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">This deal</p>
            <ul className="mt-2 space-y-1">
              {DEAL_NAV.map((item) => {
                const href = `/deals/${activeDealId}${item.segment ? `/${item.segment}` : ""}`;
                const active = pathname === href;
                return (
                  <li key={item.segment}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                        active
                          ? "text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      style={active ? {
                        backgroundColor: 'var(--intelloger-navy-light)',
                      } : {}}
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
