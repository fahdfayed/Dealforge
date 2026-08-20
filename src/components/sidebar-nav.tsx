"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Library, BarChart3, Menu, Users, LogOut } from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/app/auth/logout/actions";

const APPS = [
  { id: "today", label: "Today", href: "/", icon: LayoutDashboard },
  { id: "deals", label: "Deals", href: "/deals", icon: Briefcase },
  { id: "portfolio", label: "Portfolio", href: "/portfolio", icon: BarChart3 },
  { id: "vault", label: "Docs", href: "/proof", icon: Library },
  { id: "team", label: "Team", href: "/team", icon: Users },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dealMatch = pathname.match(/^\/deals\/([^/]+)(?:\/(.*))?$/);
  const activeDealId = dealMatch && dealMatch[1] !== "new" ? dealMatch[1] : null;
  const currentSegment = dealMatch && dealMatch[2] ? dealMatch[2].split("/")[0] : "";

  const dealMenuItems = [
    { segment: "", label: "Overview" },
    { segment: "understand", label: "Understand" },
    { segment: "health", label: "Health" },
    { segment: "sources", label: "Sources" },
    { segment: "build-offer", label: "Build Offer" },
    { segment: "solution", label: "Solution" },
    { segment: "estimate", label: "Estimate" },
    { segment: "negotiate", label: "Negotiate" },
    { segment: "commitments", label: "Commitments" },
    { segment: "submission-check", label: "Submission Check" },
    { segment: "actions", label: "Actions" },
    { segment: "client-share", label: "Client Share" },
    { segment: "oracle", label: "Oracle" },
    { segment: "proposal", label: "Proposal" },
    { segment: "handover", label: "Handover" },
  ];

  return (
    <>
      {/* Odoo-style top bar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-white border-b" style={{ borderBottomColor: 'var(--border-color)' }}>
        <div className="flex items-center h-full px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/images/intelloger-logo.svg"
              alt="Intelloger"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            {sidebarOpen && <span className="text-sm font-semibold text-gray-900">Intelloger</span>}
          </Link>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-12 bottom-0 bg-white border-r transition-all duration-200 overflow-y-auto flex flex-col ${
          sidebarOpen ? "w-48" : "w-16"
        }`}
        style={{ borderRightColor: 'var(--border-color)' }}
      >
        <div className="flex-1 overflow-y-auto">
          {/* App switcher */}
          <div className="p-3 border-b" style={{ borderBottomColor: 'var(--border-light)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 px-2">Apps</div>
            <nav className="space-y-1">
              {APPS.map((app) => {
                const active = pathname === app.href || (app.href !== "/" && pathname.startsWith(app.href));
                return (
                  <Link
                    key={app.id}
                    href={app.href}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded text-sm transition-colors ${
                      active
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <app.icon size={18} className="flex-shrink-0" />
                    {sidebarOpen && <span className="truncate">{app.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Deal menu - shown when in a deal context */}
          {activeDealId && sidebarOpen && (
            <div className="p-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 px-2">Menu</div>
              <nav className="space-y-0.5">
                {dealMenuItems.map((item) => (
                  <Link
                    key={item.segment}
                    href={`/deals/${activeDealId}${item.segment ? `/${item.segment}` : ""}`}
                    className={`block px-2 py-1.5 text-sm rounded transition-colors ${
                      currentSegment === item.segment || (item.segment === "" && currentSegment === "")
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Logout button at bottom */}
        <div className="p-3 border-t" style={{ borderTopColor: 'var(--border-light)' }}>
          <form action={logoutAction} className="w-full">
            <button
              type="submit"
              className="flex items-center gap-3 px-2 py-1.5 rounded text-sm transition-colors text-gray-700 hover:bg-gray-50 w-full"
            >
              <LogOut size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">Logout</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* Main content offset */}
      <style jsx>{`
        :global(body) {
          padding-top: 3rem;
        }
        :global(main) {
          margin-left: ${sidebarOpen ? "12rem" : "4rem"};
        }
      `}</style>
    </>
  );
}
