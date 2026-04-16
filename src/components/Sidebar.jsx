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
      className={`hidden min-h-screen shrink-0 border-r border-neutral-800 bg-black lg:flex lg:flex-col transition-all duration-300 ${
        collapsed ? "w-24" : "w-72"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white text-black">
              <ShieldCheck size={22} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-[0.24em] text-white/45">
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

        <div className="px-3 pb-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white text-black">
                <ShieldCheck size={18} />
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {user?.name || "System Admin"}
                  </p>
                  <p className="truncate text-xs text-white/45">
                    {user?.email || "admin@example.com"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 pb-2">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-1 transition-all duration-200 ${
                      isActive
                        ? "border border-white bg-white text-black"
                        : "border border-transparent text-white/70 hover:bg-white/8 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                          isActive
                            ? "border-black/10 bg-black text-white"
                            : "border-white/10 bg-white/5 text-white/70 group-hover:text-white"
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
                        <div className="h-2.5 w-2.5 rounded-full bg-black" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="px-3 pb-5 pt-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:bg-white/10"
          >
            <div className="flex h-5 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black text-white">
              <LogOut size={18} />
            </div>

            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
