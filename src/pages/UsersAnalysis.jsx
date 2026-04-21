import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search,
  Eye,
  Shield,
  UserRound,
  Activity,
  BriefcaseBusiness,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import AppLayout from "../layouts/AppLayout";
import StatusCard from "../components/StatusCard";
import DataTableShell from "../components/DataTableShell";
import TablePagination from "../components/TablePagination";
import DetailModal from "../components/DetailModal";
import {
  DetailGrid,
  DetailItem,
  DetailSection,
} from "../components/DetailSection";
import StatusPill from "../components/StatusPill";
import { usersAnalysisApi } from "../utils/api";

const PAGE_SIZE = 10;

const EMPTY_STATS = {
  total: 0,
  active: 0,
  inactive: 0,
  privileged: 0,
  inactivePrivileged: 0,
  underutilized: 0,
};

const CHART_COLORS = {
  Active: "#10b981",
  Inactive: "#f59e0b",
  Terminated: "#ef4444",
  UNDERUTILIZED: "#f59e0b",
  OPTIMAL: "#10b981",
  OVERUTILIZED: "#0ea5e9",
  UNKNOWN: "#94a3b8",
};

function normalizeUser(item) {
  return {
    id: item?.id ?? "",
    employeeId: item?.employeeId ?? "-",
    fullName: item?.fullName ?? "-",
    email: item?.email ?? "-",
    department: item?.department ?? "-",
    jobTitle: item?.jobTitle ?? "-",
    employmentStatus: item?.employmentStatus ?? "-",
    activityStatus: item?.activityStatus ?? "-",
    lastActivityAt: item?.lastActivityAt ?? null,
    daysSinceLastActivity:
      item?.daysSinceLastActivity === null ||
      item?.daysSinceLastActivity === undefined
        ? null
        : Number(item?.daysSinceLastActivity),
    transactionCount: Number(item?.transactionCount ?? 0),
    utilizationStatus: item?.utilizationStatus ?? "UNKNOWN",
    licenseName: item?.licenseName ?? "-",
    monthlyCost: Number(item?.monthlyCost ?? 0),
    isPrivilegedUser: Boolean(item?.isPrivilegedUser),
    riskyRoleCount: Number(item?.riskyRoleCount ?? 0),
    assignedRoles: Array.isArray(item?.assignedRoles) ? item.assignedRoles : [],
    roleDetails: Array.isArray(item?.roleDetails) ? item.roleDetails : [],
  };
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getActivityTone(status) {
  if (status === "Active") return "success";
  if (status === "Inactive") return "warning";
  if (status === "Terminated") return "error";
  return "neutral";
}

function getUtilizationTone(status) {
  if (status === "OPTIMAL") return "success";
  if (status === "UNDERUTILIZED") return "warning";
  if (status === "OVERUTILIZED") return "info";
  return "neutral";
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  const tone =
    toast.type === "success"
      ? {
          shell: "border-emerald-200 bg-emerald-50 text-emerald-800",
          icon: <CheckCircle2 size={18} className="text-emerald-600" />,
        }
      : {
          shell: "border-red-200 bg-red-50 text-red-800",
          icon: <AlertTriangle size={18} className="text-red-600" />,
        };

  return (
    <div className="fixed right-6 top-6 z-50">
      <div
        className={`flex w-[360px] items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${tone.shell}`}
      >
        <div className="mt-0.5">{tone.icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm opacity-90">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
      <div className="border-b border-slate-200 bg-indigo-50 px-5 py-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-indigo-700">{title}</h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            ) : null}
          </div>
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-700">
            {icon}
          </div>
        </div>
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

export default function UsersAnalysis() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);

  const [searchTerm, setSearchTerm] = useState("");
  const [activityStatus, setActivityStatus] = useState("All");
  const [utilizationStatus, setUtilizationStatus] = useState("All");
  const [privilegedOnly, setPrivilegedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (type, title, description = "") => {
    setToast({ type, title, description });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadUsers = useCallback(
    async (signal) => {
      setLoading(true);
      setPageError("");

      try {
        const data = await usersAnalysisApi.list(
          {
            search: searchTerm,
            activityStatus,
            utilizationStatus,
            privilegedOnly,
          },
          signal,
        );

        setUsers((data.items || []).map(normalizeUser));
        setStats({ ...EMPTY_STATS, ...(data.stats || {}) });
      } catch (error) {
        if (error.name === "AbortError") return;
        const message = error.message || "Failed to load users analysis.";
        setPageError(message);
        showToast("error", "Could not load users analysis", message);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, activityStatus, utilizationStatus, privilegedOnly],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [users, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const totalMonthlyCost = useMemo(
    () => users.reduce((sum, user) => sum + Number(user.monthlyCost || 0), 0),
    [users],
  );

  const privilegedUsersCount = useMemo(
    () => users.filter((user) => user.isPrivilegedUser).length,
    [users],
  );

  const riskyUsersCount = useMemo(
    () => users.filter((user) => user.riskyRoleCount > 0).length,
    [users],
  );

  const activityChartData = useMemo(() => {
    const grouped = users.reduce(
      (acc, user) => {
        const key = user.activityStatus || "Unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { Active: 0, Inactive: 0, Terminated: 0 },
    );

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
        fill: CHART_COLORS[name] || "#94a3b8",
      }))
      .filter((item) => item.value > 0);
  }, [users]);

  const utilizationChartData = useMemo(() => {
    const grouped = users.reduce(
      (acc, user) => {
        const key = user.utilizationStatus || "UNKNOWN";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {
        UNDERUTILIZED: 0,
        OPTIMAL: 0,
        OVERUTILIZED: 0,
        UNKNOWN: 0,
      },
    );

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .filter((item) => item.value > 0);
  }, [users]);

  const departmentRiskData = useMemo(() => {
    const grouped = users.reduce((acc, user) => {
      const key = user.department || "Unknown";
      if (!acc[key]) {
        acc[key] = {
          name: key.length > 18 ? `${key.slice(0, 15).trim()}...` : key,
          riskyUsers: 0,
          privilegedUsers: 0,
        };
      }

      if (user.riskyRoleCount > 0) acc[key].riskyUsers += 1;
      if (user.isPrivilegedUser) acc[key].privilegedUsers += 1;

      return acc;
    }, {});

    return Object.values(grouped)
      .sort(
        (a, b) =>
          b.riskyUsers - a.riskyUsers || b.privilegedUsers - a.privilegedUsers,
      )
      .slice(0, 6);
  }, [users]);

  const handleViewUser = async (user) => {
    try {
      setDetailLoading(true);
      const detail = await usersAnalysisApi.getById(user.id);
      setSelectedUser(normalizeUser(detail));
    } catch (error) {
      const message = error.message || "Failed to load user details.";
      showToast("error", "Could not load user details", message);
      setSelectedUser(normalizeUser(user));
    } finally {
      setDetailLoading(false);
    }
  };

  const toolbar = (
    <div className="grid gap-3 2xl:grid-cols-[1.2fr_180px_180px_240px]">
      <div className="flex h-9 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-brand-200 focus-within:ring-2 focus-within:ring-brand-100">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search user, email, employee ID, department"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="relative">
        <Filter
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <select
          value={activityStatus}
          onChange={(e) => {
            setActivityStatus(e.target.value);
            setPage(1);
          }}
          className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
        >
          <option value="All">All Activity</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Terminated">Terminated</option>
        </select>
      </div>

      <select
        value={utilizationStatus}
        onChange={(e) => {
          setUtilizationStatus(e.target.value);
          setPage(1);
        }}
        className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
      >
        <option value="All">All Utilization</option>
        <option value="UNDERUTILIZED">Underutilized</option>
        <option value="OPTIMAL">Optimal</option>
        <option value="OVERUTILIZED">Overutilized</option>
        <option value="UNKNOWN">Unknown</option>
      </select>

      <label className="flex h-9 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm">
        <input
          type="checkbox"
          checked={privilegedOnly}
          onChange={(e) => {
            setPrivilegedOnly(e.target.checked);
            setPage(1);
          }}
          className="h-4 w-4 rounded border-slate-300"
        />
        Privileged users only
      </label>
    </div>
  );

  const footer = (
    <TablePagination
      page={page}
      totalPages={totalPages}
      totalItems={users.length}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );

  return (
    <AppLayout
      title="Users Analysis"
      subtitle="Review activity patterns, utilization quality, access exposure, and privileged role concentration in one executive-grade view."
    >
      <div className="space-y-4">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <section className="rounded-xl border border-slate-200 flex items-end bg-gradient-to-r from-brand-50 via-white to-white px-6 py-4 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase text-brand-700">
              <ShieldCheck size={14} />
              Users Analysis
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-indigo-800">
              Analyze user activity, utilization quality, and access risk
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review real user activity, privileged exposure, risky role
              concentration, and utilization quality using live backend-driven
              records only.
            </p>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="Total Users"
            value={stats.total}
            subtitle="Visible user records"
            status="default"
            meta={`${users.length} in current result`}
          />
          <StatusCard
            title="Active Users"
            value={stats.active}
            subtitle="Recently active"
            status="success"
            meta={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
          />
          <StatusCard
            title="Inactive Users"
            value={stats.inactive}
            subtitle="Needs review"
            status="warning"
            meta="Warning cluster"
          />
          <StatusCard
            title="Inactive Privileged"
            value={stats.inactivePrivileged}
            subtitle="Highest risk cluster"
            status="error"
            meta={
              stats.inactivePrivileged
                ? "Immediate review"
                : "No exposed cluster"
            }
          />
        </div>

        {pageError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {pageError}
          </div>
        ) : null}

        <div className="grid gap-2 xl:grid-cols-[1.1fr_1fr]">
          <SectionCard
            title="Activity Distribution"
            subtitle="Live backend activity mix from the current result set"
            icon={<PieChartIcon className="h-7 w-7 text-indigo-700" />}
          >
            <div className="grid gap-4 lg:grid-cols-[0.7fr_1.1fr] lg:items-center">
              <div className="h-44">
                {activityChartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityChartData}
                        innerRadius={56}
                        outerRadius={82}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {activityChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#fff",
                          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    No activity data available
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {activityChartData.map((item) => {
                  const total = activityChartData.reduce(
                    (sum, x) => sum + x.value,
                    0,
                  );
                  const share = total
                    ? Math.round((item.value / total) * 100)
                    : 0;

                  return (
                    <div
                      key={item.name}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="text-sm font-semibold text-slate-800">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          {item.value}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                        <span>{share}% of visible users</span>
                        <span>
                          {item.name === "Active"
                            ? "Healthy engagement"
                            : item.name === "Inactive"
                              ? "Needs follow-up"
                              : "Employment risk"}
                        </span>
                      </div>

                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${share}%`,
                            backgroundColor: item.fill,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Operational Snapshot"
            subtitle="Live summary from backend-returned user records"
            icon={<Users className="h-7 w-7 text-indigo-700" />}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                  Privileged Users
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-800">
                  {privilegedUsersCount}
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Current privileged records in result set
                </p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-2 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-800">
                  Risky Users
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-red-800">
                  {riskyUsersCount}
                </p>
                <p className="mt-1 text-sm text-red-800">
                  Users with one or more risky roles
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-2 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                  Monthly Cost
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-amber-800">
                  ${totalMonthlyCost.toFixed(2)}
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Sum of current visible monthly cost
                </p>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-800">
                  Underutilized
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-rose-800">
                  {stats.underutilized}
                </p>
                <p className="mt-1 text-sm text-rose-800">
                  Users flagged as underutilized
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-2 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            title="Department Risk View"
            subtitle="Top departments by risky-role and privileged-user concentration"
            icon={<BarChart3 className="h-7 w-7 text-indigo-700" />}
          >
            <div className="h-72">
              {departmentRiskData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentRiskData}
                    margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
                    barGap={8}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#fff",
                        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                    <Bar
                      dataKey="riskyUsers"
                      radius={[10, 10, 0, 0]}
                      fill="#ef4444"
                    />
                    <Bar
                      dataKey="privilegedUsers"
                      radius={[10, 10, 0, 0]}
                      fill="#f59e0b"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No department risk data available
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Utilization Breakdown"
            subtitle="Live utilization mix from backend-returned users"
            icon={<Activity className="h-7 w-7 text-indigo-700" />}
          >
            <div className="space-y-2">
              {utilizationChartData.length ? (
                utilizationChartData.map((item) => {
                  const total = utilizationChartData.reduce(
                    (sum, x) => sum + x.value,
                    0,
                  );
                  const share = total
                    ? Math.round((item.value / total) * 100)
                    : 0;
                  const fill = CHART_COLORS[item.name] || "#94a3b8";

                  return (
                    <div
                      key={item.name}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: fill }}
                          />
                          <span className="text-sm font-semibold text-slate-800">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          {item.value}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {share}% of visible users
                      </div>

                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${share}%`,
                            backgroundColor: fill,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                  No utilization data available
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <DataTableShell
          title="User Exposure Register"
          subtitle="Business-grade operational table for identity, activity, utilization, and privilege review."
          toolbar={toolbar}
          footer={footer}
          rightActions={
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1 text-xs font-semibold text-brand-700">
              <Users className="h-4 w-4 text-indigo-700" />
              {users.length} visible users
            </div>
          }
        >
          <table className="min-w-full">
            <thead className="border-b border-slate-200 bg-slate-50/90">
              <tr>
                <th className="px-6 py-3 text-xs font-bold uppercase text-center text-slate-500">
                  Identity
                </th>
                <th className="px-6 py-3 text-xs font-bold uppercase text-center text-slate-500">
                  Department
                </th>
                <th className="px-6 py-3 text-xs font-bold uppercase text-center text-slate-500">
                  Activity
                </th>
                <th className="px-6 py-3 text-xs font-bold uppercase text-center text-slate-500">
                  Utilization
                </th>
                <th className="px-6 py-3 text-xs font-bold uppercase text-center text-slate-500">
                  Privileged
                </th>
                <th className="px-6 py-3 text-xs font-bold uppercase text-center text-slate-500">
                  Risky Roles
                </th>
                <th className="px-6 py-3 text-xs font-bold uppercase text-center text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-14 text-center text-sm text-slate-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-14 text-center text-sm text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                          <UserRound size={15} className="text-indigo-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">
                            {user.fullName}
                          </p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">
                          {user.department}
                        </p>
                        <p className="text-sm text-slate-500">
                          {user.jobTitle}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusPill
                        value={user.activityStatus}
                        type={getActivityTone(user.activityStatus)}
                        dot
                      />
                    </td>

                    <td className="px-6 py-4">
                      <StatusPill
                        value={user.utilizationStatus}
                        type={getUtilizationTone(user.utilizationStatus)}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <StatusPill
                        value={
                          user.isPrivilegedUser ? "Privileged" : "Standard"
                        }
                        type={user.isPrivilegedUser ? "error" : "neutral"}
                      />
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-800 text-center">
                      {user.riskyRoleCount}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleViewUser(user)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableShell>

        <DetailModal
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="User Profile & Access Risk"
          subtitle="Detailed identity, usage, access, and role exposure for the selected record."
          width="max-w-6xl"
        >
          {detailLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading user details...
            </div>
          ) : selectedUser ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-700">
                      Activity
                    </span>
                    <Activity size={16} className="text-slate-700" />
                  </div>
                  <div className="mt-4">
                    <StatusPill
                      value={selectedUser.activityStatus}
                      type={getActivityTone(selectedUser.activityStatus)}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-700">
                      Roles
                    </span>
                    <BriefcaseBusiness size={16} className="text-slate-700" />
                  </div>
                  <p className="mt-4 text-3xl font-bold text-slate-950">
                    {selectedUser.assignedRoles?.length || 0}
                  </p>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-red-500">
                      Risky Roles
                    </span>
                    <Shield size={16} className="text-red-500" />
                  </div>
                  <p className="mt-4 text-3xl font-bold text-red-950">
                    {selectedUser.riskyRoleCount}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-md">
                  <div className="text-xs font-semibold uppercase text-slate-700">
                    Monthly Cost
                  </div>
                  <p className="mt-4 text-3xl font-bold text-slate-950">
                    ${selectedUser.monthlyCost.toFixed(2)}
                  </p>
                </div>
              </div>

              <DetailSection title="Identity">
                <DetailGrid>
                  <DetailItem
                    label="Full Name"
                    value={selectedUser.fullName}
                    emphasis
                  />
                  <DetailItem label="Email" value={selectedUser.email} />
                  <DetailItem
                    label="Employee ID"
                    value={selectedUser.employeeId}
                  />
                  <DetailItem
                    label="Department"
                    value={selectedUser.department}
                  />
                  <DetailItem label="Job Title" value={selectedUser.jobTitle} />
                  <DetailItem
                    label="Employment Status"
                    value={selectedUser.employmentStatus}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection title="Activity & Usage">
                <DetailGrid>
                  <DetailItem
                    label="Activity Status"
                    value={
                      <StatusPill
                        value={selectedUser.activityStatus}
                        type={getActivityTone(selectedUser.activityStatus)}
                      />
                    }
                  />
                  <DetailItem
                    label="Last Activity"
                    value={formatDateTime(selectedUser.lastActivityAt)}
                  />
                  <DetailItem
                    label="Days Since Last Activity"
                    value={selectedUser.daysSinceLastActivity ?? "-"}
                  />
                  <DetailItem
                    label="Transaction Count"
                    value={selectedUser.transactionCount}
                  />
                  <DetailItem
                    label="Utilization Status"
                    value={
                      <StatusPill
                        value={selectedUser.utilizationStatus}
                        type={getUtilizationTone(
                          selectedUser.utilizationStatus,
                        )}
                      />
                    }
                  />
                  <DetailItem
                    label="License"
                    value={selectedUser.licenseName}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection title="Risk & Access">
                <DetailGrid>
                  <DetailItem
                    label="Privileged Access"
                    value={
                      <StatusPill
                        value={selectedUser.isPrivilegedUser ? "Yes" : "No"}
                        type={
                          selectedUser.isPrivilegedUser ? "error" : "neutral"
                        }
                      />
                    }
                  />
                  <DetailItem
                    label="Risky Role Count"
                    value={selectedUser.riskyRoleCount}
                  />
                  <DetailItem
                    label="Assigned Roles"
                    value={selectedUser.assignedRoles?.length || 0}
                  />
                </DetailGrid>

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-3 py-4">
                    <h4 className="text-sm font-bold uppercase text-slate-500">
                      Assigned Roles
                    </h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-slate-50/90">
                        <tr>
                          <th className="px-3 py-2 text-xs font-bold uppercase text-slate-500">
                            Role Name
                          </th>
                          <th className="px-3 py-2 text-xs font-bold uppercase text-slate-500">
                            Risk
                          </th>
                          <th className="px-3 py-2 text-xs font-bold uppercase text-slate-500">
                            Privileged
                          </th>
                          <th className="px-3 py-2 text-xs font-bold uppercase text-slate-500">
                            Admin
                          </th>
                          <th className="px-3 py-2 text-xs font-bold uppercase text-slate-500">
                            Assigned At
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedUser.roleDetails?.length ? (
                          selectedUser.roleDetails.map((role) => (
                            <tr
                              key={role.id}
                              className="border-t border-slate-100"
                            >
                              <td className="px-3 py-4 font-medium text-slate-900">
                                {role.roleName}
                              </td>
                              <td className="px-3 py-4 text-slate-700">
                                {role.riskLevel}
                              </td>
                              <td className="px-3 py-4">
                                <StatusPill
                                  value={role.isPrivileged ? "Yes" : "No"}
                                  type={role.isPrivileged ? "error" : "neutral"}
                                  size="sm"
                                />
                              </td>
                              <td className="px-3 py-4">
                                <StatusPill
                                  value={
                                    role.isAdminRole ? "Admin" : "Standard"
                                  }
                                  type={role.isAdminRole ? "info" : "neutral"}
                                  size="sm"
                                />
                              </td>
                              <td className="px-3 py-4 text-slate-700">
                                {formatDateTime(role.assignedAt)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-3 py-10 text-center text-sm text-slate-500"
                            >
                              No active roles found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </DetailSection>
            </div>
          ) : null}
        </DetailModal>
      </div>
    </AppLayout>
  );
}
