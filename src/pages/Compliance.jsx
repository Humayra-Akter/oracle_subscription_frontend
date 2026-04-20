import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  ShieldAlert,
  UserRound,
  BriefcaseBusiness,
  RefreshCw,
  Download,
  ChevronDown,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  X,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
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
import { complianceApi } from "../utils/api";

const PAGE_SIZE = 10;

const EMPTY_STATS = {
  totalFlags: 0,
  criticalFlags: 0,
  highFlags: 0,
  inactivePrivilegedUsers: 0,
  terminatedActiveAccounts: 0,
  orphanAssignments: 0,
  topRiskDepartment: "-",
  topFlaggedRole: "-",
  mostCommonException: "-",
};

const SEVERITY_COLORS = {
  Critical: "#ef4444",
  High: "#f59e0b",
  Medium: "#0ea5e9",
  Low: "#10b981",
};

function normalizeCompliance(item) {
  return {
    id: item?.id ?? "",
    membershipId: item?.membershipId ?? "",
    userId: item?.userId ?? "",
    roleId: item?.roleId ?? "",
    fullName: item?.fullName ?? "-",
    email: item?.email ?? "-",
    employeeId: item?.employeeId ?? "-",
    department: item?.department ?? "-",
    jobTitle: item?.jobTitle ?? "-",
    employmentStatus: item?.employmentStatus ?? "-",
    lastActivityAt: item?.lastActivityAt ?? null,
    inactiveDays:
      item?.inactiveDays === null || item?.inactiveDays === undefined
        ? null
        : Number(item?.inactiveDays),
    transactionCount: Number(item?.transactionCount ?? 0),
    utilizationStatus: item?.utilizationStatus ?? "UNKNOWN",
    licenseName: item?.licenseName ?? "-",
    monthlyCost: Number(item?.monthlyCost ?? 0),
    roleName: item?.roleName ?? "-",
    roleCode: item?.roleCode ?? "-",
    roleRiskLevel: item?.roleRiskLevel ?? "LOW",
    isPrivileged: Boolean(item?.isPrivileged),
    isAdminRole: Boolean(item?.isAdminRole),
    assignedAt: item?.assignedAt ?? null,
    source: item?.source ?? "-",
    exceptionType: item?.exceptionType ?? "-",
    severity: item?.severity ?? "Low",
    reason: item?.reason ?? "-",
  };
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getSeverityTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical") return "error";
  if (v === "high") return "warning";
  if (v === "medium") return "info";
  return "neutral";
}

function getEmploymentTone(value) {
  const v = String(value || "").toUpperCase();
  if (v === "TERMINATED") return "error";
  if (v === "INACTIVE") return "warning";
  return "success";
}

function getRiskTone(value) {
  const v = String(value || "").toUpperCase();
  if (v === "CRITICAL") return "error";
  if (v === "HIGH") return "warning";
  if (v === "MEDIUM") return "info";
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
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-indigo-50 px-5 py-2">
        <div className="flex items-start justify-between gap-3">
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

export default function Compliance() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);

  const [searchTerm, setSearchTerm] = useState("");
  const [severity, setSeverity] = useState("All");
  const [exceptionType, setExceptionType] = useState("All");
  const [sortBy, setSortBy] = useState("severity_desc");
  const [privilegedOnly, setPrivilegedOnly] = useState(false);
  const [adminOnly, setAdminOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const loadCompliance = async ({ isRefresh = false } = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setPageError("");

    try {
      const data = await complianceApi.list({
        search: searchTerm,
        severity,
        exceptionType,
        sortBy,
        privilegedOnly,
        adminOnly,
      });

      const normalized = (data.items || []).map(normalizeCompliance);
      setRecords(normalized);
      setStats({ ...EMPTY_STATS, ...(data.stats || {}) });

      if (isRefresh) {
        showToast(
          "success",
          "Compliance data refreshed",
          "The page has been updated using latest backend records.",
        );
      }
    } catch (error) {
      const message = error.message || "Failed to load compliance page.";
      setPageError(message);
      showToast("error", "Load failed", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCompliance();
  }, [searchTerm, severity, exceptionType, sortBy, privilegedOnly, adminOnly]);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return records.slice(start, start + PAGE_SIZE);
  }, [records, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const severityMixData = useMemo(() => {
    const grouped = records.reduce(
      (acc, record) => {
        const key = record.severity || "Low";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { Critical: 0, High: 0, Medium: 0, Low: 0 },
    );

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
        fill: SEVERITY_COLORS[name] || "#94a3b8",
      }))
      .filter((item) => item.value > 0);
  }, [records]);

  const departmentFlagData = useMemo(() => {
    const grouped = records.reduce((acc, record) => {
      const key = record.department || "Unassigned";

      if (!acc[key]) {
        acc[key] = {
          name: key.length > 18 ? `${key.slice(0, 15).trim()}...` : key,
          total: 0,
          critical: 0,
        };
      }

      acc[key].total += 1;
      if (String(record.severity || "").toLowerCase() === "critical") {
        acc[key].critical += 1;
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.total - a.total || b.critical - a.critical)
      .slice(0, 6);
  }, [records]);

  const exceptionPatternData = useMemo(() => {
    const grouped = records.reduce((acc, record) => {
      const key = record.exceptionType || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [records]);

  const privilegedFlagsCount = useMemo(
    () => records.filter((record) => record.isPrivileged).length,
    [records],
  );

  const adminFlagsCount = useMemo(
    () => records.filter((record) => record.isAdminRole).length,
    [records],
  );

  const inactiveReviewCount = useMemo(
    () =>
      records.filter(
        (record) => record.inactiveDays !== null && record.inactiveDays >= 90,
      ).length,
    [records],
  );

  const derivedTopRole = useMemo(() => {
    const grouped = records.reduce((acc, record) => {
      const key = record.roleName || "-";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  }, [records]);

  const topRiskDepartment =
    stats.topRiskDepartment ||
    departmentFlagData[0]?.name ||
    EMPTY_STATS.topRiskDepartment;

  const topFlaggedRole =
    stats.topFlaggedRole || derivedTopRole || EMPTY_STATS.topFlaggedRole;

  const mostCommonException =
    stats.mostCommonException ||
    exceptionPatternData[0]?.name ||
    EMPTY_STATS.mostCommonException;

  const toolbar = (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_180px_220px_180px]">
      <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-brand-200 focus-within:ring-2 focus-within:ring-brand-100">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search user, department, role, exception"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="relative">
        <select
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value);
            setPage(1);
          }}
          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
        >
          <option value="All">All Severity</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      <div className="relative">
        <select
          value={exceptionType}
          onChange={(e) => {
            setExceptionType(e.target.value);
            setPage(1);
          }}
          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
        >
          <option value="All">All Exceptions</option>
          <option value="Inactive privileged user">
            Inactive privileged user
          </option>
          <option value="Terminated user with active access">
            Terminated active access
          </option>
          <option value="Terminated user with active privileged access">
            Terminated privileged access
          </option>
          <option value="Unused admin role">Unused admin role</option>
          <option value="High-risk role assignment">
            High-risk role assignment
          </option>
          <option value="Orphan role assignment">Orphan role assignment</option>
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
        >
          <option value="severity_desc">Sort: Highest severity</option>
          <option value="inactive_desc">Sort: Most inactive</option>
          <option value="cost_desc">Sort: Highest cost</option>
          <option value="name_asc">Sort: Name A-Z</option>
          <option value="role_asc">Sort: Role A-Z</option>
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      <label className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm">
        <input
          type="checkbox"
          checked={privilegedOnly}
          onChange={(e) => {
            setPrivilegedOnly(e.target.checked);
            setPage(1);
          }}
          className="h-4 w-4 rounded border-slate-300"
        />
        Privileged only
      </label>

      <label className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm">
        <input
          type="checkbox"
          checked={adminOnly}
          onChange={(e) => {
            setAdminOnly(e.target.checked);
            setPage(1);
          }}
          className="h-4 w-4 rounded border-slate-300"
        />
        Admin roles only
      </label>
    </div>
  );

  const footer = (
    <TablePagination
      page={page}
      totalPages={totalPages}
      totalItems={records.length}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );

  return (
    <AppLayout
      title="Compliance"
      subtitle="Review high-risk role assignments, inactive privileged users, terminated access exposure, and orphan exceptions in one operational page."
    >
      <div className="space-y-4">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <section className="rounded-xl border border-slate-200 flex items-end bg-gradient-to-r from-brand-50 via-white to-white px-4 py-4 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase text-brand-700">
              <ShieldCheck size={14} />
              Compliance
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-indigo-800">
              Monitor flagged access, policy exceptions, and sensitive exposure
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This page uses live compliance records from the backend to surface
              critical access exceptions, dormant privileged users, terminated
              account exposure, and role cleanup priorities.
            </p>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="Total Flags"
            value={stats.totalFlags}
            subtitle="Visible compliance exceptions"
            status="default"
            meta={`${records.length} in current result`}
          />
          <StatusCard
            title="Critical Flags"
            value={stats.criticalFlags}
            subtitle="Highest priority items"
            status="error"
            meta="Immediate review"
          />
          <StatusCard
            title="Inactive Privileged"
            value={stats.inactivePrivilegedUsers}
            subtitle="Dormant but sensitive access"
            status="warning"
            meta="Warning cluster"
          />
          <StatusCard
            title="Terminated Access"
            value={stats.terminatedActiveAccounts}
            subtitle="Requires urgent cleanup"
            status="error"
            meta="Access removal required"
          />
        </div>

        {pageError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {pageError}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <SectionCard
              title="Department Flag Concentration"
              subtitle="Departments with the highest number of current flags and critical cases"
              icon={<BarChart3 className="h-7 w-7 text-indigo-700" />}
            >
              <div className="space-y-2">
                <div className="h-68">
                  {departmentFlagData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={departmentFlagData}
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
                          dataKey="total"
                          radius={[10, 10, 0, 0]}
                          fill="#7c3aed"
                        />
                        <Bar
                          dataKey="critical"
                          radius={[10, 10, 0, 0]}
                          fill="#ef4444"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No department flag data available
                    </div>
                  )}
                </div>

                {departmentFlagData.length ? (
                  <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                        What this shows
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        This chart compares departments by total flagged records
                        and critical flags within the current visible dataset.
                        Higher bars indicate departments where access review,
                        cleanup, and policy correction should be prioritized
                        first.
                      </p>
                    </div>

                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                        Top Department
                      </p>
                      <p className="mt-2 text-base font-bold text-indigo-800">
                        {topRiskDepartment}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Highest current flag concentration
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </SectionCard>
            <SectionCard
              title="Exposure Snapshot"
              subtitle="Live operational counts derived from visible compliance records"
              icon={<Activity className="h-7 w-7 text-indigo-700" />}
            >
              <div className="grid gap-2 sm:grid-cols-3">
                <SignalBox
                  label="Privileged Flags"
                  value={privilegedFlagsCount}
                  tone="amber"
                />
                <SignalBox
                  label="Admin Flags"
                  value={adminFlagsCount}
                  tone="indigo"
                />
                <SignalBox
                  label="90+ Day Inactive"
                  value={inactiveReviewCount}
                  tone="red"
                />
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard
              title="Severity Mix"
              subtitle="Current flag distribution by severity level"
              icon={<PieChartIcon className="h-7 w-7 text-indigo-700" />}
            >
              <div className="grid gap-2 lg:grid-cols-[0.8fr_1fr] lg:items-center">
                <div className="h-44">
                  {severityMixData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityMixData}
                          innerRadius={54}
                          outerRadius={78}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          stroke="none"
                        >
                          {severityMixData.map((entry) => (
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
                      No severity data available
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {severityMixData.map((item) => {
                    const total = severityMixData.reduce(
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

                        <div className="mt-1 text-xs text-slate-500">
                          {share}% of visible compliance records
                        </div>

                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
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
              title="Exception Pattern Breakdown"
              subtitle="Most repeated exception types in the current visible dataset"
              icon={<AlertTriangle className="h-7 w-7 text-indigo-700" />}
            >
              <div className="space-y-2">
                {exceptionPatternData.length ? (
                  exceptionPatternData.map((item, index) => {
                    const topValue = exceptionPatternData[0]?.value || 1;
                    const width = Math.max(
                      12,
                      Math.round((item.value / topValue) * 100),
                    );

                    return (
                      <div
                        key={item.name}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {index + 1}. {item.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">
                              {item.value}
                            </p>
                            <p className="text-xs text-slate-500">flags</p>
                          </div>
                        </div>

                        <div className="h-1 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-indigo-600"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                    No exception pattern data available
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>

        <div>
          <DataTableShell
            title="Compliance Exception Register"
            subtitle="Table-first operating view for user exposure, risky access, and role cleanup decisions."
            toolbar={toolbar}
            footer={footer}
            rightActions={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadCompliance({ isRefresh: true })}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-indigo-700 px-4 text-sm font-semibold text-white transition hover:bg-indigo-600"
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
            }
          >
            <div>
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50/90">
                  <tr>
                    <th className="px-4 py-2 text-xs font-bold uppercase text-center text-slate-500">
                      User
                    </th>
                    <th className="px-4 py-2 text-xs font-bold uppercase text-center text-slate-500">
                      Department
                    </th>
                    <th className="px-4 py-2 text-xs font-bold uppercase text-center text-slate-500">
                      Employment
                    </th>
                    <th className="px-4 py-2 text-xs font-bold uppercase text-center text-slate-500">
                      Role
                    </th>
                    <th className="px-4 py-2 text-xs font-bold uppercase text-center text-slate-500">
                      Severity
                    </th>
                    <th className="px-4 py-2 text-xs font-bold uppercase text-center text-slate-500">
                      Exception
                    </th>
                    <th className="px-4 py-2 text-xs font-bold uppercase text-center text-slate-500">
                      Last Activity
                    </th>
                    <th className="px-4 py-2 text-xs font-bold uppercase text-center text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-14 text-center text-sm text-slate-500"
                      >
                        Loading compliance records...
                      </td>
                    </tr>
                  ) : paginatedRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-14 text-center text-sm text-slate-500"
                      >
                        No compliance records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 shadow-sm">
                              <UserRound size={15} className="text-slate-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-950">
                                {record.fullName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {record.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div>
                            <p className="text-slate-800 text-sm">
                              {record.department}
                            </p>
                            <p className="text-xs text-slate-500">
                              {record.jobTitle}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <StatusPill
                            value={record.employmentStatus}
                            type={getEmploymentTone(record.employmentStatus)}
                            dot
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 shadow-sm">
                              <BriefcaseBusiness
                                size={15}
                                className="text-slate-700"
                              />
                            </div>
                            <div>
                              <p className="text-sm text-slate-900">
                                {record.roleName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {record.roleCode}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <StatusPill
                            value={record.severity}
                            type={getSeverityTone(record.severity)}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div>
                            <p className="text-slate-900 text-sm">
                              {record.exceptionType}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                              {record.reason}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-700 text-center">
                          {record.inactiveDays !== null
                            ? `${record.inactiveDays} days`
                            : "-"}
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(record)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 shadow-sm transition hover:bg-slate-50"
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
            </div>
          </DataTableShell>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard
            icon={<ShieldAlert size={26} />}
            title="Top Risk Department"
            value={topRiskDepartment}
            subtitle="Highest current flag concentration"
          />
          <SummaryCard
            icon={<Shield size={26} />}
            title="Top Flagged Role"
            value={topFlaggedRole}
            subtitle="Most frequently flagged role assignment"
          />
          <SummaryCard
            icon={<AlertTriangle size={26} />}
            title="Most Common Exception"
            value={mostCommonException}
            subtitle="Most repeated current risk pattern"
          />
        </div>

        <DetailModal
          open={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={selectedRecord?.exceptionType || "Compliance Detail"}
          subtitle={
            selectedRecord
              ? `${selectedRecord.fullName} • ${selectedRecord.roleName}`
              : ""
          }
          width="max-w-5xl"
        >
          {selectedRecord ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-4">
                <MiniKpi
                  icon={<ShieldAlert size={16} className="text-red-600" />}
                  label="Severity"
                  value={selectedRecord.severity}
                  danger
                />
                <MiniKpi
                  icon={<Activity size={16} className="text-slate-700" />}
                  label="Inactive Days"
                  value={
                    selectedRecord.inactiveDays !== null
                      ? selectedRecord.inactiveDays
                      : "-"
                  }
                />
                <MiniKpi
                  icon={
                    <BriefcaseBusiness size={16} className="text-slate-700" />
                  }
                  label="Role Risk"
                  value={selectedRecord.roleRiskLevel}
                />
                <MiniKpi
                  icon={<Shield size={16} className="text-slate-700" />}
                  label="Monthly Cost"
                  value={formatCurrency(selectedRecord.monthlyCost)}
                />
              </div>

              <DetailSection
                title="Identity"
                description="Core employee and account identity context."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem
                    label="Full Name"
                    value={selectedRecord.fullName}
                    emphasis
                  />
                  <DetailItem label="Email" value={selectedRecord.email} />
                  <DetailItem
                    label="Employee ID"
                    value={selectedRecord.employeeId}
                  />
                  <DetailItem
                    label="Department"
                    value={selectedRecord.department}
                  />
                  <DetailItem
                    label="Job Title"
                    value={selectedRecord.jobTitle}
                  />
                  <DetailItem
                    label="Employment Status"
                    value={
                      <StatusPill
                        value={selectedRecord.employmentStatus}
                        type={getEmploymentTone(
                          selectedRecord.employmentStatus,
                        )}
                      />
                    }
                  />
                  <DetailItem
                    label="License"
                    value={selectedRecord.licenseName}
                  />
                  <DetailItem
                    label="Transaction Count"
                    value={selectedRecord.transactionCount}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection
                title="Role & Assignment"
                description="Assigned role metadata and access attributes."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem
                    label="Role Name"
                    value={selectedRecord.roleName}
                    emphasis
                  />
                  <DetailItem
                    label="Role Code"
                    value={selectedRecord.roleCode}
                  />
                  <DetailItem
                    label="Role Risk"
                    value={
                      <StatusPill
                        value={selectedRecord.roleRiskLevel}
                        type={getRiskTone(selectedRecord.roleRiskLevel)}
                      />
                    }
                  />
                  <DetailItem
                    label="Privileged"
                    value={
                      <StatusPill
                        value={selectedRecord.isPrivileged ? "Yes" : "No"}
                        type={selectedRecord.isPrivileged ? "error" : "neutral"}
                      />
                    }
                  />
                  <DetailItem
                    label="Admin Role"
                    value={
                      <StatusPill
                        value={
                          selectedRecord.isAdminRole ? "Admin" : "Standard"
                        }
                        type={selectedRecord.isAdminRole ? "info" : "neutral"}
                      />
                    }
                  />
                  <DetailItem
                    label="Assigned At"
                    value={formatDateTime(selectedRecord.assignedAt)}
                  />
                  <DetailItem
                    label="Assignment Source"
                    value={selectedRecord.source}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection
                title="Exception Detail"
                description="Why this row was flagged and what should be reviewed."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  <DetailItem
                    label="Exception Type"
                    value={selectedRecord.exceptionType}
                    emphasis
                  />
                  <DetailItem
                    label="Severity"
                    value={
                      <StatusPill
                        value={selectedRecord.severity}
                        type={getSeverityTone(selectedRecord.severity)}
                      />
                    }
                  />
                  <DetailItem
                    label="Inactive Days"
                    value={
                      selectedRecord.inactiveDays !== null
                        ? `${selectedRecord.inactiveDays} days`
                        : "-"
                    }
                  />
                </DetailGrid>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Reason Summary
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedRecord.reason}
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Suggested Action
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Review the role assignment, confirm the employee lifecycle
                    state, and remove or downgrade access if it is no longer
                    justified.
                  </p>
                </div>
              </DetailSection>
            </div>
          ) : null}
        </DetailModal>
      </div>
    </AppLayout>
  );
}

function SummaryCard({ icon, title, value, subtitle }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold uppercase text-slate-500">{title}</p>
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-xl font-bold text-indigo-700">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function MiniKpi({ icon, label, value, danger = false }) {
  return (
    <div
      className={[
        "rounded-xl border px-5 py-4 shadow-sm",
        danger ? "border-red-200 bg-red-50" : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <span
          className={[
            "text-xs font-semibold uppercase",
            danger ? "text-red-600" : "text-slate-700",
          ].join(" ")}
        >
          {label}
        </span>
        {icon}
      </div>

      <p
        className={[
          "mt-4 text-2xl font-bold",
          danger ? "text-red-950" : "text-slate-950",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function SignalBox({ label, value, tone = "indigo" }) {
  const toneMap = {
    indigo: {
      wrap: "border-indigo-200 bg-indigo-50/80",
      title: "text-indigo-700",
      value: "text-indigo-800",
    },
    amber: {
      wrap: "border-amber-200 bg-amber-50/80",
      title: "text-amber-700",
      value: "text-amber-800",
    },
    red: {
      wrap: "border-red-200 bg-red-50/80",
      title: "text-red-700",
      value: "text-red-800",
    },
  };

  const t = toneMap[tone] || toneMap.indigo;

  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${t.wrap}`}>
      <p
        className={`text-[11px] font-semibold uppercase tracking-wide ${t.title}`}
      >
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${t.value}`}>{value}</p>
    </div>
  );
}
