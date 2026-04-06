import {
  LayoutDashboard,
  UploadCloud,
  History,
  Users,
  BadgeDollarSign,
  ShieldAlert,
  FileText,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Upload Center", path: "/upload-center", icon: UploadCloud },
  { label: "Imports History", path: "/imports-history", icon: History },
  { label: "Users Analysis", path: "/users-analysis", icon: Users },
  {
    label: "Cost Optimization",
    path: "/cost-optimization",
    icon: BadgeDollarSign,
  },
  { label: "Compliance", path: "/compliance", icon: ShieldAlert },
  { label: "Reports", path: "/reports", icon: FileText },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <aside
      className={`relative hidden min-h-screen shrink-0 border-r border-white/10 bg-[rgba(15,23,42,0.82)] backdrop-blur-2xl lg:flex lg:flex-col transition-all duration-300 ${
        collapsed ? "w-24" : "w-72"
      }`}
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)]">
              <ShieldCheck size={22} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[11px] uppercase tracking-[0.24em] text-cyan-200/80">
                  Oracle Platform
                </p>
                <h2 className="truncate text-lg font-semibold text-white">
                  Compliance Suite
                </h2>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

        <div className="px-3 pb-4">
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <ShieldCheck size={18} />
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {user?.name || "System Admin"}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {user?.email || "admin@example.com"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 pb-4">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 ${
                      isActive
                        ? "border border-cyan-400/20 bg-gradient-to-r from-cyan-400/15 to-blue-600/15 text-white shadow-[0_10px_24px_rgba(34,211,238,0.10)]"
                        : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                          isActive
                            ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,0.30)]"
                            : "bg-white/[0.04] text-slate-400 group-hover:text-cyan-300"
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      {!collapsed && (
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {item.label}
                          </span>
                        </div>
                      )}

                      {isActive && !collapsed && (
                        <div className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.7)]" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="px-3 pb-5 pt-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            {!collapsed && (
              <div className="mb-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Environment
                </p>
                <p className="mt-1 text-sm text-white">Admin Workspace</p>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl border border-red-400/10 bg-red-500/10 px-3 py-3 text-red-200 transition hover:border-red-400/20 hover:bg-red-500/15"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                <LogOut size={18} />
              </div>

              {!collapsed && (
                <span className="text-sm font-medium">Logout</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
