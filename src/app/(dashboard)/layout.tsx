"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/lands", label: "My Lands", icon: "🗺️" },
  { href: "/logs", label: "Daily Logs", icon: "📋" },
  { href: "/soil-tests", label: "Soil Tests", icon: "🧪" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 h-16 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
            }}
          >
            <span className="text-lg">🌱</span>
          </div>
          <span className="font-bold text-lg text-[var(--foreground)]">
            FarmPilot
          </span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isActive
                    ? "rgba(64, 145, 108, 0.15)"
                    : "transparent",
                  color: isActive
                    ? "var(--color-primary-light)"
                    : "var(--text-secondary)",
                  borderLeft: isActive
                    ? "3px solid var(--color-primary-light)"
                    : "3px solid transparent",
                }}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div
          className="px-4 py-4 shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))",
                color: "white",
              }}
            >
              {user?.full_name?.charAt(0).toUpperCase() || "F"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-[var(--foreground)]">
                {user?.full_name || "Farmer"}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {user?.email || ""}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost btn-sm btn-full text-sm"
            id="logout-btn"
            style={{ color: "var(--color-error)" }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header (mobile) */}
        <header
          className="lg:hidden h-14 flex items-center px-4 shrink-0 sticky top-0 z-30"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-ghost btn-sm p-2"
            id="sidebar-toggle"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="ml-3 font-bold text-[var(--foreground)]">
            FarmPilot
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 page-enter">{children}</main>
      </div>
    </div>
  );
}
