"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Library, BarChart3, Menu, Users, LogOut, Building2 } from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/app/auth/logout/actions";

const APPS = [
  { id: "today", label: "Today", href: "/", icon: LayoutDashboard },
  { id: "accounts", label: "Clients", href: "/accounts", icon: Building2 },
  { id: "deals", label: "Deals", href: "/deals", icon: Briefcase },
  { id: "portfolio", label: "Portfolio", href: "/portfolio", icon: BarChart3 },
  { id: "vault", label: "Docs", href: "/proof", icon: Library },
  { id: "team", label: "Team", href: "/team", icon: Users },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
