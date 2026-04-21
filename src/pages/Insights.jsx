import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldAlert,
  Users,
  DollarSign,
  DatabaseZap,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import AppLayout from "../layouts/AppLayout";
import StatusCard from "../components/StatusCard";
import DetailModal from "../components/DetailModal";
import {
  DetailGrid,
  DetailItem,
  DetailSection,
} from "../components/DetailSection";
import StatusPill from "../components/StatusPill";

import {
  usersAnalysisApi,
  complianceApi,
  importHistoryApi,
  reportsApi,
} from "../utils/api";

const EMPTY = {
  users: { items: [], stats: {} },
  compliance: { items: [], stats: {} },
  imports: { items: [], stats: {} },
  reports: {
    summary: {},
    reportOptions: [],
    preview: { flaggedUsers: [], savings: [], compliance: [] },
  },
};

const CHART_COLORS = {
  Active: "#10b981",
  Inactive: "#f59e0b",
  Terminated: "#ef4444",
  Critical: "#ef4444",
  High: "#f59e0b",
  Medium: "#0ea5e9",
  Low: "#10b981",
  Completed: "#10b981",
  Processing: "#f59e0b",
  Queued: "#fbbf24",
  Failed: "#ef4444",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function normalizeUser(item) {
  return {
    id: item?.id ?? "",
    fullName: item?.fullName ?? "-",
    department: item?.department ?? "Unassigned",
    activityStatus: item?.activityStatus ?? "-",
    isPrivilegedUser: Boolean(item?.isPrivilegedUser),
    riskyRoleCount: Number(item?.riskyRoleCount ?? 0),
    monthlyCost: Number(item?.monthlyCost ?? 0),
  };
}

function normalizeCompliance(item) {
  return {
    id: item?.id ?? "",
    department: item?.department ?? "Unassigned",
    exceptionType: item?.exceptionType ?? "-",
    severity: item?.severity ?? "Low",
    isPrivileged: Boolean(item?.isPrivileged),
    inactiveDays:
      item?.inactiveDays === null || item?.inactiveDays === undefined
        ? null
        : Number(item?.inactiveDays),
  };
}

function normalizeImport(item) {
  const raw = String(item?.status || "").trim();
  const statusMap = {
    COMPLETED: "Completed",
    PROCESSING: "Processing",
    FAILED: "Failed",
    QUEUED: "Queued",
    PENDING: "Queued",
    Completed: "Completed",
    Processing: "Processing",
    Failed: "Failed",
    Queued: "Queued",
  };

  return {
    id: item?.id ?? "",
    reportType: item?.reportType ?? "Unknown",
    rowsProcessed: Number(item?.rowsProcessed ?? 0),
    status: statusMap[raw] || "Queued",
    duplicate: Boolean(item?.duplicate),
  };
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

function SignalBox({ label, value, tone = "indigo" }) {
  const toneMap = {
    indigo: {
      wrap: "border-indigo-200 bg-indigo-50/80",
      title: "text-indigo-700",
      value: "text-indigo-800",
    },
    emerald: {
      wrap: "border-emerald-200 bg-emerald-50/80",
      title: "text-emerald-700",
      value: "text-emerald-800",
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
    <div className={`rounded-xl border px-4 py-2 shadow-sm ${t.wrap}`}>
      <p
        className={`text-[11px] font-semibold uppercase tracking-wide ${t.title}`}
      >
        {label}
      </p>
      <p className={`mt-1 text-base font-bold ${t.value}`}>{value}</p>
    </div>
  );
}

export default function Insights() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedInsight, setSelectedInsight] = useState(null);

  const showToast = (type, title, description = "") => {
    setToast({ type, title, description });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadInsights = useCallback(
    async ({ isRefresh = false, signal } = {}) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setPageError("");

      try {
        const [usersRes, complianceRes, importsRes, reportsRes] =
          await Promise.all([
            usersAnalysisApi.list({}, signal),
            complianceApi.list({}, signal),
            importHistoryApi.list({}, signal),
            reportsApi.dashboard(signal),
          ]);

        setData({
          users: {
            items: (usersRes?.items || []).map(normalizeUser),
            stats: usersRes?.stats || {},
          },
          compliance: {
            items: (complianceRes?.items || []).map(normalizeCompliance),
            stats: complianceRes?.stats || {},
          },
          imports: {
            items: (importsRes?.items || []).map(normalizeImport),
            stats: importsRes?.stats || {},
          },
          reports: {
            summary: reportsRes?.summary || {},
            reportOptions: reportsRes?.reportOptions || [],
            preview: {
              flaggedUsers: reportsRes?.preview?.flaggedUsers || [],
              savings: reportsRes?.preview?.savings || [],
              compliance: reportsRes?.preview?.compliance || [],
            },
          },
        });

        if (isRefresh) {
          showToast(
            "success",
            "Insights refreshed",
            "Cross-module signals have been updated from live backend data.",
          );
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        const message = error.message || "Failed to load insights.";
        setPageError(message);
        showToast("error", "Load failed", message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadInsights({ signal: controller.signal });
    return () => controller.abort();
  }, [loadInsights]);

  const users = data.users.items;
  const compliance = data.compliance.items;
  const imports = data.imports.items;
  const reportOptions = data.reports.reportOptions;

  const totalMonthlyCost = users.reduce(
    (sum, user) => sum + Number(user.monthlyCost || 0),
    0,
  );
  const privilegedUsers = users.filter((u) => u.isPrivilegedUser).length;
  const riskyUsers = users.filter((u) => u.riskyRoleCount > 0).length;
  const duplicates = imports.filter((i) => i.duplicate).length;

  const activityMixData = useMemo(() => {
    const grouped = users.reduce(
      (acc, item) => {
        const key = item.activityStatus || "Unknown";
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

  const complianceSeverityData = useMemo(() => {
    const grouped = compliance.reduce(
      (acc, item) => {
        const key = item.severity || "Low";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { Critical: 0, High: 0, Medium: 0, Low: 0 },
    );

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
        fill: CHART_COLORS[name] || "#94a3b8",
      }))
      .filter((item) => item.value > 0);
  }, [compliance]);

  const importStatusData = useMemo(() => {
    const grouped = imports.reduce(
      (acc, item) => {
        const key = item.status || "Queued";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { Completed: 0, Processing: 0, Queued: 0, Failed: 0 },
    );

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
        fill: CHART_COLORS[name] || "#94a3b8",
      }))
      .filter((item) => item.value > 0);
  }, [imports]);

  const topRiskDepartments = useMemo(() => {
    const grouped = compliance.reduce((acc, item) => {
      const key = item.department || "Unassigned";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name: name.length > 18 ? `${name.slice(0, 15).trim()}...` : name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [compliance]);

  const insightRows = useMemo(() => {
    return [
      {
        id: "users",
        title: "User Activity Health",
        summary: `${activityMixData[0]?.name || "No"} segment leads current user activity mix`,
        value:
          data.users.stats?.active ??
          activityMixData.find((x) => x.name === "Active")?.value ??
          0,
        status: "success",
        detailType: "users",
      },
      {
        id: "compliance",
        title: "Compliance Pressure",
        summary: `${data.compliance.stats?.criticalFlags || 0} critical exceptions currently visible`,
        value: data.compliance.stats?.totalFlags || compliance.length,
        status: "error",
        detailType: "compliance",
      },
      {
        id: "imports",
        title: "Import Pipeline Stability",
        summary: `${duplicates} duplicate imports identified in current register`,
        value: data.imports.stats?.total || imports.length,
        status: "warning",
        detailType: "imports",
      },
      {
        id: "reports",
        title: "Reporting Coverage",
        summary: `${reportOptions.length} report outputs available for export`,
        value: data.reports.summary?.totalUsers || 0,
        status: "default",
        detailType: "reports",
      },
    ];
  }, [
    activityMixData,
    data,
    compliance.length,
    imports.length,
    duplicates,
    reportOptions.length,
  ]);

  return (
    <AppLayout
      title="Insights"
      subtitle="Cross-module intelligence view for adoption, risk, pipeline stability, and reporting coverage."
    >
      <div className="space-y-4">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <section className="rounded-xl border border-slate-200 flex items-end bg-gradient-to-r from-brand-50 via-white to-white px-6 py-4 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase text-brand-700">
              <ShieldCheck size={14} />
              Insights
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-indigo-800">
              Turn uploads, users, compliance, and reports into one signal layer
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This page aggregates live backend outputs from user analysis,
              compliance, imports, and reporting into one executive view without
              introducing any mock data.
            </p>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="Users in Scope"
            value={data.users.stats?.total || users.length}
            subtitle="Current analyzed user records"
            status="default"
            meta="Live analysis"
          />
          <StatusCard
            title="Compliance Flags"
            value={data.compliance.stats?.totalFlags || compliance.length}
            subtitle="Exceptions across visible records"
            status="error"
            meta="Risk exposure"
          />
          <StatusCard
            title="Monthly Cost"
            value={formatCurrency(totalMonthlyCost)}
            subtitle="Visible assigned cost base"
            status="warning"
            meta="User derived"
          />
          <StatusCard
            title="Available Reports"
            value={reportOptions.length}
            subtitle="Exportable reporting outputs"
            status="success"
            meta="Backend reported"
          />
        </div>

        {pageError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {pageError}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => loadInsights({ isRefresh: true })}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh Insights
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCard
            title="Signal Register"
            subtitle="A compact operational summary across major backend modules"
            icon={<DatabaseZap className="h-7 w-7 text-indigo-700" />}
          >
            <div className="space-y-2">
              {insightRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedInsight(row)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left shadow-sm transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {row.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill
                        value={row.status}
                        type={row.status}
                        size="sm"
                      />
                      <p className="text-lg font-bold text-slate-950">
                        {row.value}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Department Risk Pressure"
            subtitle="Departments with the heaviest current compliance concentration"
            icon={<BarChart3 className="h-7 w-7 text-indigo-700" />}
          >
            <div className="space-y-2">
              <div className="h-66">
                {topRiskDepartments.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topRiskDepartments}
                      layout="vertical"
                      margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
                      barSize={18}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        vertical={false}
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        stroke="#94a3b8"
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value) => [value, "Flags"]}
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#fff",
                          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[0, 10, 10, 0]}
                        fill="#7c3aed"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    No department pressure data available
                  </div>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <SignalBox
                  label="Privileged Users"
                  value={privilegedUsers}
                  tone="amber"
                />
                <SignalBox label="Risky Users" value={riskyUsers} tone="red" />
                <SignalBox
                  label="Duplicate Imports"
                  value={duplicates}
                  tone="indigo"
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-4 grid-cols-3">
          <SectionCard
            title="User Activity Mix"
            subtitle="Visible user activity status"
            icon={<Users className="h-7 w-7 text-indigo-700" />}
          >
            <ChartDonut
              data={activityMixData}
              emptyText="No user activity data available"
            />
          </SectionCard>

          <SectionCard
            title="Compliance Severity Mix"
            subtitle="Visible compliance severity distribution"
            icon={<ShieldAlert className="h-7 w-7 text-indigo-700" />}
          >
            <ChartDonut
              data={complianceSeverityData}
              emptyText="No compliance severity data available"
            />
          </SectionCard>

          <SectionCard
            title="Import Status Mix"
            subtitle="Visible import status distribution"
            icon={<Activity className="h-7 w-7 text-indigo-700" />}
          >
            <ChartDonut
              data={importStatusData}
              emptyText="No import status data available"
            />
          </SectionCard>
        </div>

        <DetailModal
          open={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          title={selectedInsight?.title || "Insight Detail"}
          subtitle={selectedInsight?.summary || ""}
          width="max-w-5xl"
        >
          {selectedInsight ? (
            <div className="space-y-5">
              <DetailSection
                title="Signal Summary"
                description="Context for the selected cross-module insight."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem
                    label="Insight"
                    value={selectedInsight.title}
                    emphasis
                  />
                  <DetailItem label="Value" value={selectedInsight.value} />
                  <DetailItem label="Status" value={selectedInsight.status} />
                  <DetailItem label="Summary" value={selectedInsight.summary} />
                </DetailGrid>
              </DetailSection>

              <DetailSection
                title="Supporting Metrics"
                description="Live supporting values used to interpret the signal."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem
                    label="Users"
                    value={data.users.stats?.total || users.length}
                  />
                  <DetailItem
                    label="Compliance Flags"
                    value={
                      data.compliance.stats?.totalFlags || compliance.length
                    }
                  />
                  <DetailItem
                    label="Imports"
                    value={data.imports.stats?.total || imports.length}
                  />
                  <DetailItem label="Reports" value={reportOptions.length} />
                </DetailGrid>
              </DetailSection>
            </div>
          ) : null}
        </DetailModal>
      </div>
    </AppLayout>
  );
}

function ChartDonut({ data, emptyText }) {
  return (
    <div className="grid gap-2 lg:grid-cols-[0.8fr_1fr] lg:items-center">
      <div className="h-44">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={54}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {data.map((entry) => (
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
            {emptyText}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {data.map((item) => {
          const total = data.reduce((sum, x) => sum + x.value, 0);
          const share = total ? Math.round((item.value / total) * 100) : 0;

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
                {share}% of visible mix
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
  );
}
