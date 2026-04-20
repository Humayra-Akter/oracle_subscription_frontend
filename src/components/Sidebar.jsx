import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UploadCloud,
  History,
  Users,
  BadgeDollarSign,
  ShieldAlert,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FolderOpen,
  BarChart3,
} from "lucide-react";

function SidebarItem({
  to,
  icon: Icon,
  label,
  collapsed,
  exact = false,
  matchPrefix = false,
  pathname,
}) {
  const isActive = exact
    ? pathname === to
    : matchPrefix
      ? pathname === to || pathname.startsWith(to + "/")
      : pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      end={exact}
      title={collapsed ? label : undefined}
      className={() =>
        [
          "group relative flex items-center gap-2 rounded-xl px-3 py-1 text-sm font-medium transition-all duration-200",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-indigo-500/10 text-indigo-700 ring-1 ring-inset ring-indigo-400/20"
            : "hover:bg-indigo-500/10 hover:text-indigo-700",
        ].join(" ")
      }
    >
      <span
        className={[
          "absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full transition-all duration-200",
          isActive ? "bg-indigo-700" : "bg-indigo-400 opacity-0",
        ].join(" ")}
      />

      <div
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center border transition-all duration-200",
          isActive
            ? "border-indigo-50 rounded-full text-indigo-900"
            : "border-white/5 bg-indigo-500/10 rounded-full text-indigo-900 group-hover:border-indigo-500/10 group-hover:bg-indigo-500/10 group-hover:text-indigo-800",
        ].join(" ")}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>

      {!collapsed ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );
}

export default function ComplianceLayout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("oracle.sidebarCollapsed");
    if (saved === "1") setCollapsed(true);
    if (saved === "0") setCollapsed(false);
  }, []);

  function toggleSidebar() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("oracle.sidebarCollapsed", next ? "1" : "0");
      return next;
    });
  }

  const pageTitle = pathname.startsWith("/upload-center")
    ? "Upload Center"
    : pathname.startsWith("/imports-history")
      ? "Imports History"
      : pathname.startsWith("/users-analysis")
        ? "Users Analysis"
        : pathname.startsWith("/cost-optimization")
          ? "Cost Optimization"
          : pathname.startsWith("/compliance")
            ? "Compliance Monitoring"
            : pathname.startsWith("/reports")
              ? "Reports"
              : "Compliance Dashboard";

  const sidebarW = collapsed ? "w-20" : "w-64";
  const mainPad = collapsed ? "lg:pl-20" : "lg:pl-64";

  return (
    <div className="min-h-screen text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div
            className={[
              "fixed left-0 top-0 h-screen border-r border-white shadow-2xl",
              sidebarW,
              "transition-all duration-200",
            ].join(" ")}
          >
            {/* Brand */}
            <div className="border-b border-white/5 p-4">
              <div className="flex items-start justify-between">
                {!collapsed ? (
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-lg leading-tight text-indigo-700">
                          Compliance Suite
                        </div>
                      </div>
                    </div>
                    <div className="text-xs mt-2 italic font-bold text-slate-500">
                      Oracle Subscription Optimization Platform
                    </div>
                  </div>
                ) : (
                  <div
                    className="grid h-7 w-7 place-items-center rounded-full border border-indigo-400/20 bg-indigo-500/10 text-indigo-800"
                    title="Oracle Compliance Suite"
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={toggleSidebar}
                  className={[
                    "shrink-0 inline-flex items-center justify-center border border-white/10 bg-slate-200 rounded-full text-indigo-700 hover:bg-slate-200 hover:text-black",
                    "transition-all duration-200",
                  ].join(" ")}
                  title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? (
                    <ChevronRight className="h-6 w-6" />
                  ) : (
                    <ChevronLeft className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Menu */}
            <div className="h-[calc(100vh-96px)] overflow-y-auto p-3">
              <nav className="space-y-2">
                {!collapsed ? (
                  <div className="px-2 text-[11px] font-semibold uppercase text-slate-500">
                    Overview
                  </div>
                ) : (
                  <div className="h-2" />
                )}

                <SidebarItem
                  to="/dashboard"
                  icon={LayoutDashboard}
                  label="Dashboard"
                  collapsed={collapsed}
                  exact
                  pathname={pathname}
                />

                {!collapsed ? (
                  <div className="px-2 pt-2 text-[11px] font-semibold uppercase text-slate-500">
                    Data Operations
                  </div>
                ) : (
                  <div className="h-2" />
                )}

                <SidebarItem
                  to="/upload-center"
                  icon={UploadCloud}
                  label="Upload Center"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />
                <SidebarItem
                  to="/imports-history"
                  icon={History}
                  label="Imports History"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />

                {!collapsed ? (
                  <div className="px-2 pt-2 text-[11px] font-semibold uppercase text-slate-500">
                    Analysis
                  </div>
                ) : (
                  <div className="h-2" />
                )}

                <SidebarItem
                  to="/users-analysis"
                  icon={Users}
                  label="Users Analysis"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />
                <SidebarItem
                  to="/cost-optimization"
                  icon={BadgeDollarSign}
                  label="Cost Optimization"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />
                <SidebarItem
                  to="/compliance"
                  icon={ShieldAlert}
                  label="Compliance"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />
                <SidebarItem
                  to="/reports"
                  icon={FileText}
                  label="Reports"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />

                {!collapsed ? (
                  <div className="px-2 pt-2 text-[11px] font-semibold uppercase text-slate-500">
                    Intelligence
                  </div>
                ) : (
                  <div className="h-2" />
                )}

                <SidebarItem
                  to="/insights"
                  icon={BarChart3}
                  label="Insights"
                  collapsed={collapsed}
                  pathname={pathname}
                  matchPrefix
                />

                <hr className="opacity-20 pt-1" />
                {/* Logout */}
                <div>
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      window.location.href = "/";
                    }}
                    className={[
                      "flex w-full items-center gap-2 rounded-xl px-3 py-1",
                      "text-sm font-medium text-slate-800 transition-all",
                      "hover:bg-red-500/10 hover:text-red-700",
                      collapsed ? "justify-center" : "",
                    ].join(" ")}
                    title={collapsed ? "Logout" : undefined}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/5 bg-red-500/10 text-red-700">
                      <LogOut className="h-4.5 w-4.5" />
                    </div>
                    {!collapsed ? <span>Logout</span> : null}
                  </button>
                </div>

                <div className="h-4" />
              </nav>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className={["flex-1", mainPad].join(" ")}>
          <div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
