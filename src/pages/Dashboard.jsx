import { useEffect, useMemo, useState, useCallback } from "react";
import {
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  LayoutDashboard,
  ShieldAlert,
  DollarSign,
  UploadCloud,
  FileSpreadsheet,
  Users,
  Eye,
  Activity,
  Layers3,
  Sparkles,
  Clock3,
  TrendingUp,
  BarChart3,
  ScanSearch,
  Database,
} from "lucide-react";

import {
  ResponsiveContainer,
  Treemap,
  FunnelChart,
  Funnel,
  Tooltip,
  LabelList,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
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
import { dashboardApi } from "../utils/api";

const EMPTY_DASHBOARD = {
  kpis: {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    privilegedUsers: 0,
    complianceFlags: 0,
    totalMonthlyCost: 0,
    potentialSavings: 0,
    totalUploads: 0,
    completedImports: 0,
    failedImports: 0,
    processingImports: 0,
    queuedImports: 0,
  },
  charts: {
    activityMix: [],
    utilizationMix: [],
    uploadStatusMix: [],
    importStatusMix: [],
    departmentRisk: [],
    savingsByDepartment: [],
  },
  highlights: {
    topSavingsUsers: [],
    topFlaggedUsers: [],
  },
  recent: {
    uploads: [],
    imports: [],
  },
};

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "pipeline", label: "Pipeline", icon: UploadCloud },
  { key: "risk", label: "Risk", icon: ShieldAlert },
  { key: "savings", label: "Savings", icon: DollarSign },
];

const CHART_COLORS = [
  "#4f46e5",
  "#6366f1",
  "#7c3aed",
  "#8b5cf6",
  "#a855f7",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatCompact(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatShortDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatusTone(status) {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("completed") ||
    value.includes("active") ||
    value.includes("optimal") ||
    value.includes("success")
  ) {
    return "success";
  }

  if (
    value.includes("failed") ||
    value.includes("critical") ||
    value.includes("high") ||
    value.includes("error")
  ) {
    return "error";
  }

  if (
    value.includes("processing") ||
    value.includes("queued") ||
    value.includes("inactive") ||
    value.includes("underutilized") ||
    value.includes("warning")
  ) {
    return "warning";
  }

  return "neutral";
}

function getShare(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / total) * 100);
}

function buildTimeSeries(items = [], key = "createdAt") {
  const bucket = items.reduce((acc, item) => {
    const label = formatShortDate(
      item[key] || item.createdAt || item.updatedAt,
    );
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(bucket).map(([name, value]) => ({ name, value }));
}

function buildRiskVsSavings(rows = [], savings = []) {
  const savingsMap = new Map(
    (savings || []).map((item) => [item.name, Number(item.value || 0)]),
  );

  return (rows || []).map((row) => {
    const riskyUsers = Number(row.riskyUsers || 0);
    const privilegedUsers = Number(row.privilegedUsers || 0);
    const inactiveUsers = Number(row.inactiveUsers || 0);
    const riskScore = riskyUsers * 4 + privilegedUsers * 2 + inactiveUsers;

    return {
      name: row.name,
      risk: riskScore,
      savings: savingsMap.get(row.name) || 0,
    };
  });
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

function TabButton({ active, icon: Icon, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-indigo-700 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function SectionCard({ title, subtitle, icon, children, rightAction = null }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-indigo-700">{title}</h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-700">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {rightAction}
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full text-indigo-700">
              {icon}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3">{children}</div>
    </section>
  );
}

function MiniMetric({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-800 text-slate-50",
    indigo: "border-indigo-200 bg-indigo-800 text-indigo-50",
    emerald: "border-emerald-200 bg-emerald-800 text-emerald-50",
    amber: "border-amber-200 bg-amber-800 text-amber-50",
    red: "border-red-200 bg-red-800 text-red-50",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-4 ${tones[tone] || tones.slate}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function KPIBand({ items = [] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatusCard
          key={item.title}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          status={item.status}
          meta={item.meta}
        />
      ))}
    </div>
  );
}

function FocusCard({ title, value, text, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-100",
    indigo: "border-indigo-200 bg-indigo-100",
    emerald: "border-emerald-200 bg-emerald-100",
    amber: "border-amber-200 bg-amber-100",
    red: "border-red-200 bg-red-100",
  };

  return (
    <div className={`rounded-xl border p-3 ${tones[tone] || tones.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-700">{text}</div>
        </div>
        <div className="text-xl font-bold text-indigo-800">{value}</div>
      </div>
    </div>
  );
}

function ProgressLane({ label, value, share, colorClass, helper }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{helper}</p>
        </div>
        <p className="text-xl font-bold text-slate-950">{value}</p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${share}%` }}
        />
      </div>
    </div>
  );
}

function EmptyChart({ text = "No data available." }) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
      {text}
    </div>
  );
}

function DistributionBars({ title, items = [], colorClass = "bg-indigo-600" }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        No data available.
      </div>
    );
  }

  const total =
    items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  const maxValue = Math.max(...items.map((item) => Number(item.value || 0)), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-4 text-sm font-bold text-slate-900">{title}</div>

      <div className="space-y-2">
        {items.map((item, index) => {
          const raw = Number(item.value || 0);
          const share = Math.round((raw / total) * 100);
          const width = Math.max(10, Math.round((raw / maxValue) * 100));

          return (
            <div key={`${item.name}-${index}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {share}% of visible mix
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">{raw}</p>
              </div>

              <div className="h-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${colorClass}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankedGraphList({
  rows,
  titleKey = "name",
  valueKey = "value",
  valueFormatter = (v) => v,
  accent = "bg-indigo-600",
  note = null,
  emptyText = "No data available.",
}) {
  if (!rows.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  const maxValue = Math.max(...rows.map((x) => Number(x[valueKey] || 0)), 1);

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const raw = Number(row[valueKey] || 0);
        const width = Math.max(10, Math.round((raw / maxValue) * 100));

        return (
          <div
            key={`${row[titleKey]}-${index}`}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {row[titleKey]}
                </p>
                {note ? (
                  <p className="mt-1 text-xs text-slate-500">{note(row)}</p>
                ) : null}
              </div>
              <p className="text-sm font-bold text-slate-900">
                {valueFormatter(raw)}
              </p>
            </div>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${accent}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricChip({ label, value }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function RiskHeatmap({ rows }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
        No department risk data available.
      </div>
    );
  }

  const enriched = rows
    .map((row) => {
      const risky = Number(row.riskyUsers || 0);
      const privileged = Number(row.privilegedUsers || 0);
      const inactive = Number(row.inactiveUsers || 0);
      const score = risky * 4 + privileged * 2 + inactive;

      return {
        name: row.name || "Unknown",
        risky,
        privileged,
        inactive,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  const maxRisky = Math.max(...enriched.map((r) => r.risky), 1);
  const maxPrivileged = Math.max(...enriched.map((r) => r.privileged), 1);
  const maxInactive = Math.max(...enriched.map((r) => r.inactive), 1);
  const maxScore = Math.max(...enriched.map((r) => r.score), 1);

  const getCellStyle = (value, max, palette) => {
    const intensity = max === 0 ? 0 : value / max;

    if (palette === "red") {
      if (intensity >= 0.8) return "bg-red-600 text-white border-red-700";
      if (intensity >= 0.6) return "bg-red-500 text-white border-red-600";
      if (intensity >= 0.4) return "bg-red-300 text-red-950 border-red-400";
      if (intensity > 0) return "bg-red-100 text-red-800 border-red-200";
      return "bg-slate-50 text-slate-400 border-slate-200";
    }

    if (palette === "violet") {
      if (intensity >= 0.8) return "bg-violet-600 text-white border-violet-700";
      if (intensity >= 0.6) return "bg-violet-500 text-white border-violet-600";
      if (intensity >= 0.4)
        return "bg-violet-300 text-violet-950 border-violet-400";
      if (intensity > 0)
        return "bg-violet-100 text-violet-800 border-violet-200";
      return "bg-slate-50 text-slate-400 border-slate-200";
    }

    if (palette === "amber") {
      if (intensity >= 0.8) return "bg-amber-500 text-white border-amber-600";
      if (intensity >= 0.6)
        return "bg-amber-400 text-slate-950 border-amber-500";
      if (intensity >= 0.4)
        return "bg-amber-300 text-slate-950 border-amber-400";
      if (intensity > 0) return "bg-amber-100 text-amber-900 border-amber-200";
      return "bg-slate-50 text-slate-400 border-slate-200";
    }

    if (palette === "score") {
      if (intensity >= 0.8) return "bg-slate-900 text-white border-slate-950";
      if (intensity >= 0.6) return "bg-slate-700 text-white border-slate-800";
      if (intensity >= 0.4) return "bg-slate-500 text-white border-slate-600";
      if (intensity > 0) return "bg-slate-200 text-slate-900 border-slate-300";
      return "bg-slate-50 text-slate-400 border-slate-200";
    }

    return "bg-slate-50 text-slate-400 border-slate-200";
  };

  const getScoreBadge = (score, max) => {
    const intensity = max === 0 ? 0 : score / max;
    if (intensity >= 0.75) return "Critical";
    if (intensity >= 0.45) return "Medium";
    if (intensity >= 0.2) return "Low";
    return "Minimal";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded bg-red-500" />
          <span>Risky users</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded bg-violet-500" />
          <span>Privileged users</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded bg-amber-400" />
          <span>Inactive users</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded bg-slate-700" />
          <span>Weighted score</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <div>
          <div className="grid grid-cols-[2fr_repeat(4,minmax(110px,1fr))] border-b border-slate-200 bg-slate-50">
            <div className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Department
            </div>
            <div className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
              Risky
            </div>
            <div className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
              Privileged
            </div>
            <div className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
              Inactive
            </div>
            <div className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
              Score
            </div>
          </div>

          {enriched.map((row, index) => (
            <div
              key={`${row.name}-${index}`}
              className="grid grid-cols-[2fr_repeat(4,minmax(110px,1fr))] items-stretch border-b border-slate-100 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {row.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {getScoreBadge(row.score, maxScore)} severity
                  </p>
                </div>
              </div>

              <div className="p-2">
                <div
                  className={`flex h-10 items-center justify-center rounded-xl border text-lg font-bold ${getCellStyle(
                    row.risky,
                    maxRisky,
                    "red",
                  )}`}
                >
                  {row.risky}
                </div>
              </div>

              <div className="p-2">
                <div
                  className={`flex h-10 items-center justify-center rounded-xl border text-lg font-bold ${getCellStyle(
                    row.privileged,
                    maxPrivileged,
                    "violet",
                  )}`}
                >
                  {row.privileged}
                </div>
              </div>

              <div className="p-2">
                <div
                  className={`flex h-10 items-center justify-center rounded-xl border text-lg font-bold ${getCellStyle(
                    row.inactive,
                    maxInactive,
                    "amber",
                  )}`}
                >
                  {row.inactive}
                </div>
              </div>

              <div className="p-2">
                <div
                  className={`flex h-10 items-center justify-center rounded-xl border text-lg font-bold ${getCellStyle(
                    row.score,
                    maxScore,
                    "score",
                  )}`}
                >
                  <span className="text-xl font-bold">{row.score}</span>
                  <span className="mt-1 pl-4 text-[10px] font-semibold uppercase tracking-wide opacity-80">
                    Weighted
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Highest risk score
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">{maxScore}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-red-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
            Max risky users
          </p>
          <p className="mt-1 text-lg font-bold text-red-700">{maxRisky}</p>
        </div>

        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">
            Max privileged users
          </p>
          <p className="mt-1 text-lg font-bold text-violet-700">
            {maxPrivileged}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            Max inactive users
          </p>
          <p className="mt-1 text-lg font-bold text-amber-700">{maxInactive}</p>
        </div>
      </div>
    </div>
  );
}

function PreviewList({ rows, emptyText, renderRow }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
        >
          {renderRow(row)}
        </div>
      ))}
    </div>
  );
}

function SimpleBarChartCard({
  data = [],
  dataKey = "value",
  nameKey = "name",
  valueFormatter = (v) => v,
  barColor = "#4f46e5",
  horizontal = false,
}) {
  if (!data.length) return <EmptyChart />;

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 10, right: 12, left: horizontal ? 20 : 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey={nameKey}
                width={110}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={nameKey}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
            </>
          )}
          <Tooltip
            formatter={(value) => valueFormatter(value)}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              backgroundColor: "#fff",
            }}
          />
          <Bar dataKey={dataKey} radius={[10, 10, 0, 0]} fill={barColor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AreaTrendCard({
  data = [],
  dataKey = "value",
  stroke = "#4f46e5",
  fill = "#c7d2fe",
}) {
  if (!data.length) return <EmptyChart text="No trend data available." />;

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="95%" stopColor={stroke} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              backgroundColor: "#fff",
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={3}
            fill={`url(#grad-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RadialProgressCard({
  title,
  value,
  total,
  color = "#4f46e5",
  helper,
}) {
  const safeTotal = Number(total || 0) || 1;
  const percentage = Math.round((Number(value || 0) / safeTotal) * 100);
  const remaining = Math.max(0, 100 - percentage);

  const data = [
    { name: "Progress", value: percentage, fill: color },
    { name: "Remaining", value: remaining, fill: "#e2e8f0" },
  ];

  return (
    <div className="rounded-xl shadow-md border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-2">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{helper}</p>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="75%"
            outerRadius="90%"
            barSize={12}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={14}
              background={{ fill: "#e2e8f0" }}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              style={{ fontSize: "30px", fontWeight: 700 }}
            >
              {percentage}%
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span>Current progress</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: "#e2e8f0" }}
          />
          <span>Remaining to total</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-500">Value</span>
        <span className="font-bold text-slate-900">{formatCompact(value)}</span>
      </div>
    </div>
  );
}

const TreemapCell = (props) => {
  const { x, y, width, height, name, value, index } = props;
  const fills = [
    "#4f46e5",
    "#6366f1",
    "#7c3aed",
    "#8b5cf6",
    "#a855f7",
    "#4338ca",
  ];

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={16}
        ry={16}
        fill={fills[index % fills.length]}
        stroke="#fff"
        strokeWidth={3}
      />
      {width > 70 && height > 45 ? (
        <>
          <text
            x={x + 10}
            y={y + 22}
            fill="#fff"
            fontSize={14}
            fontWeight={200}
          >
            {name}
          </text>
          <text
            x={x + 10}
            y={y + 40}
            fill="rgba(255,255,255,0.95)"
            fontSize={16}
            fontWeight={200}
          >
            {formatCurrency(value)}
          </text>
        </>
      ) : null}
    </g>
  );
};

function DashboardHeader({ user, refreshing, onRefresh }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-white px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase text-indigo-700">
            <ShieldCheck size={14} />
            Command Center
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Whole-system visibility for imports, compliance, risk, and savings
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Welcome, {user?.name || "Admin"}.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </section>
  );
}

function OverviewTab({ dashboard, onOpenPanel }) {
  const { kpis, charts, highlights, recent } = dashboard;

  const totalImports =
    Number(kpis.completedImports || 0) +
    Number(kpis.processingImports || 0) +
    Number(kpis.queuedImports || 0) +
    Number(kpis.failedImports || 0);

  const totalUsers = Number(kpis.totalUsers || 0) || 1;

  const funnelData = [
    { name: "Uploads", value: Number(kpis.totalUploads || 0), fill: "#6366f1" },
    {
      name: "Queued + Processing",
      value:
        Number(kpis.queuedImports || 0) + Number(kpis.processingImports || 0),
      fill: "#8b5cf6",
    },
    {
      name: "Completed Imports",
      value: Number(kpis.completedImports || 0),
      fill: "#10b981",
    },
    {
      name: "Compliance Flags",
      value: Number(kpis.complianceFlags || 0),
      fill: "#ef4444",
    },
  ].filter((item) => item.value > 0);

  const savingsTreemapData = (charts.savingsByDepartment || []).map((item) => ({
    name: item.name,
    value: Number(item.value || 0),
  }));

  const activityData = (charts.activityMix || []).map((item) => ({
    name: item.name || "Unknown",
    value: Number(item.value || 0),
  }));

  const utilizationData = (charts.utilizationMix || []).map((item) => ({
    name: item.name || "Unknown",
    value: Number(item.value || 0),
  }));

  const riskVsSavings = buildRiskVsSavings(
    charts.departmentRisk || [],
    charts.savingsByDepartment || [],
  )
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 8);

  const uploadsTrend = buildTimeSeries(recent.uploads || []);
  const importsTrend = buildTimeSeries(recent.imports || []);

  return (
    <div className="space-y-6">
      <KPIBand
        items={[
          {
            title: "Users in Scope",
            value: formatCompact(kpis.totalUsers || 0),
            subtitle: "Analyzed user records",
            status: "default",
            meta: `${formatCompact(kpis.activeUsers || 0)} active`,
          },
          {
            title: "Potential Savings",
            value: formatCurrency(kpis.potentialSavings || 0),
            subtitle: "Recoverable subscription spend",
            status: "warning",
            meta: "Optimization signal",
          },
          {
            title: "Compliance Flags",
            value: formatCompact(kpis.complianceFlags || 0),
            subtitle: "Open exception pressure",
            status: "error",
            meta: `${formatCompact(kpis.privilegedUsers || 0)} privileged`,
          },
          {
            title: "Import Success",
            value: formatCompact(kpis.completedImports || 0),
            subtitle: "Completed executions",
            status: "success",
            meta: `${formatCompact(kpis.failedImports || 0)} failed`,
          },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniMetric
          label="Monthly Cost Base"
          value={formatCurrency(kpis.totalMonthlyCost || 0)}
          tone="slate"
        />
        <MiniMetric
          label="Inactive Users"
          value={formatCompact(kpis.inactiveUsers || 0)}
          tone={Number(kpis.inactiveUsers || 0) > 0 ? "amber" : "emerald"}
        />
        <MiniMetric
          label="Queued + Processing"
          value={formatCompact(
            Number(kpis.queuedImports || 0) +
              Number(kpis.processingImports || 0),
          )}
          tone="indigo"
        />
        <MiniMetric
          label="Total Uploads"
          value={formatCompact(kpis.totalUploads || 0)}
          tone="indigo"
        />
      </div>

      <div className="grid gap-4 grid-cols-2">
        <SectionCard
          title="Focus First"
          subtitle="Most important signals right now"
          icon={<Sparkles className="h-5 w-5" />}
        >
          <div className="grid gap-2">
            <FocusCard
              title="Failed imports"
              value={kpis.failedImports || 0}
              tone={Number(kpis.failedImports || 0) > 0 ? "red" : "emerald"}
              text="Imports needing review or retry"
            />
            <FocusCard
              title="Compliance flags"
              value={kpis.complianceFlags || 0}
              tone={Number(kpis.complianceFlags || 0) > 0 ? "amber" : "emerald"}
              text="Visible access/compliance exceptions"
            />
            <FocusCard
              title="Privileged exposure"
              value={kpis.privilegedUsers || 0}
              tone={Number(kpis.privilegedUsers || 0) > 0 ? "indigo" : "slate"}
              text="Privileged users in scope"
            />
            <FocusCard
              title="Potential savings"
              value={formatCurrency(kpis.potentialSavings || 0)}
              tone={
                Number(kpis.potentialSavings || 0) > 0 ? "amber" : "emerald"
              }
              text="Current optimization opportunity"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Process Funnel"
          subtitle="How uploads narrow into processed and flagged outcomes"
          icon={<Layers3 className="h-5 w-5" />}
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="h-72">
              {funnelData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#fff",
                      }}
                    />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList
                        position="right"
                        fill="#334155"
                        stroke="none"
                        dataKey="name"
                      />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart text="No process data available." />
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <RadialProgressCard
          title="Import completion rate"
          value={kpis.completedImports || 0}
          total={totalImports}
          color="#10b981"
          helper="Completed imports as a share of all import records"
        />
        <RadialProgressCard
          title="Active user rate"
          value={kpis.activeUsers || 0}
          total={totalUsers}
          color="#4f46e5"
          helper="Active users as a share of all users in scope"
        />
        <RadialProgressCard
          title="Flag density"
          value={kpis.complianceFlags || 0}
          total={totalUsers}
          color="#ef4444"
          helper="Compliance flags versus total users in scope"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Uploads Trend"
          subtitle="Recent upload flow over time"
          icon={<TrendingUp className="h-5 w-5" />}
        >
          <AreaTrendCard data={uploadsTrend} dataKey="value" stroke="#4f46e5" />
        </SectionCard>

        <SectionCard
          title="Imports Trend"
          subtitle="Recent processed records over time"
          icon={<Clock3 className="h-5 w-5" />}
        >
          <AreaTrendCard data={importsTrend} dataKey="value" stroke="#10b981" />
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Savings Concentration Map"
          subtitle="Treemap showing where optimization value is concentrated"
          icon={<DollarSign className="h-5 w-5" />}
        >
          <div className="rounded-xl border border-slate-200">
            <div className="h-80">
              {savingsTreemapData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={savingsTreemapData}
                    dataKey="value"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    content={<TreemapCell />}
                  />
                </ResponsiveContainer>
              ) : (
                <EmptyChart text="No savings map available." />
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Risk vs Savings"
          subtitle="Departments with both operational exposure and value recovery"
          icon={<ScanSearch className="h-5 w-5" />}
        >
          <SimpleBarChartCard
            data={riskVsSavings}
            dataKey="risk"
            nameKey="name"
            barColor="#ef4444"
            horizontal
          />
        </SectionCard>
      </div>

      <div className="grid gap-3 grid-cols-[1.05fr_0.8fr_.8fr]">
        <div className="space-y-3">
          <SectionCard
            title="Activity Structure"
            subtitle="How user activity states are distributed"
            icon={<Users className="h-5 w-5" />}
          >
            <DistributionBars
              title="User activity mix"
              items={activityData}
              colorClass="bg-emerald-500"
            />
          </SectionCard>

          <SectionCard
            title="Utilization Structure"
            subtitle="How utilization states are distributed"
            icon={<Activity className="h-5 w-5" />}
          >
            <DistributionBars
              title="Utilization mix"
              items={utilizationData}
              colorClass="bg-sky-500"
            />
          </SectionCard>
        </div>

        <SectionCard
          title="Top Savings Candidates"
          subtitle="Highest reclaim or rightsize opportunities"
          icon={<Sparkles className="h-5 w-5" />}
          rightAction={
            <button
              type="button"
              onClick={() => onOpenPanel("savings")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Eye size={14} />
              Explore
            </button>
          }
        >
          <PreviewList
            rows={highlights.topSavingsUsers || []}
            emptyText="No savings candidates available."
            renderRow={(row) => (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{row.fullName}</p>
                  <p className="text-sm text-slate-500">{row.department}</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(row.potentialSavings)}
                </p>
              </div>
            )}
          />
        </SectionCard>

        <SectionCard
          title="Top Flagged Users"
          subtitle="Highest current access and compliance exposure"
          icon={<ShieldAlert className="h-5 w-5" />}
          rightAction={
            <button
              type="button"
              onClick={() => onOpenPanel("flagged")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Eye size={14} />
              Explore
            </button>
          }
        >
          <PreviewList
            rows={highlights.topFlaggedUsers || []}
            emptyText="No flagged users available."
            renderRow={(row) => (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{row.fullName}</p>
                  <p className="text-sm text-slate-500">{row.department}</p>
                </div>
                <StatusPill
                  value={`Score ${row.score}`}
                  type="error"
                  size="sm"
                />
              </div>
            )}
          />
        </SectionCard>
      </div>
    </div>
  );
}

function PipelineTab({ dashboard, onOpenPanel }) {
  const { kpis, charts, recent } = dashboard;

  const uploadStatus = (charts.uploadStatusMix || []).map((item) => ({
    name: item.name || "Unknown",
    value: Number(item.value || 0),
  }));

  const importStatus = (charts.importStatusMix || []).map((item) => ({
    name: item.name || "Unknown",
    value: Number(item.value || 0),
  }));

  const reportTypeRanking = (recent.imports || []).reduce((acc, item) => {
    const key = item.reportType || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const reportTypeRows = Object.entries(reportTypeRanking)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const uploadsTrend = buildTimeSeries(recent.uploads || []);
  const importsTrend = buildTimeSeries(recent.imports || []);

  const totalImports =
    Number(kpis.completedImports || 0) +
    Number(kpis.processingImports || 0) +
    Number(kpis.queuedImports || 0) +
    Number(kpis.failedImports || 0);

  return (
    <div className="space-y-6">
      <KPIBand
        items={[
          {
            title: "Total Uploads",
            value: formatCompact(kpis.totalUploads || 0),
            subtitle: "Files entering the system",
            status: "default",
            meta: "Queue intake",
          },
          {
            title: "Completed Imports",
            value: formatCompact(kpis.completedImports || 0),
            subtitle: "Processed successfully",
            status: "success",
            meta: `${getShare(kpis.completedImports, totalImports)}% completion`,
          },
          {
            title: "Failed Imports",
            value: formatCompact(kpis.failedImports || 0),
            subtitle: "Requires review",
            status: "error",
            meta: `${getShare(kpis.failedImports, totalImports)}% failed`,
          },
          {
            title: "Queued + Processing",
            value: formatCompact(
              Number(kpis.queuedImports || 0) +
                Number(kpis.processingImports || 0),
            ),
            subtitle: "Still moving through pipeline",
            status: "warning",
            meta: "Operational backlog",
          },
        ]}
      />

      <div className="grid gap-4 grid-cols-3">
        <SectionCard
          title="Upload Queue Distribution"
          subtitle="Current upload status structure"
          icon={<UploadCloud className="h-5 w-5" />}
        >
          <SimpleBarChartCard data={uploadStatus} barColor="#4f46e5" />
        </SectionCard>

        <SectionCard
          title="Import Outcome Distribution"
          subtitle="Current import status structure"
          icon={<FileSpreadsheet className="h-5 w-5" />}
        >
          <SimpleBarChartCard data={importStatus} barColor="#8b5cf6" />
        </SectionCard>

        <SectionCard
          title="Report Type Volume"
          subtitle="Which imported report types appear most often"
          icon={<Layers3 className="h-5 w-5" />}
        >
          <div className="h-80">
            {reportTypeRows.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportTypeRows}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fill: "#334155", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 10, 10, 0]}
                    fill="#4f46e5"
                    barSize={24}
                  >
                    <LabelList
                      dataKey="value"
                      position="right"
                      style={{ fill: "#0f172a", fontSize: 12, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                No report type records available.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Upload Trend"
          subtitle="Flow of recent uploads over time"
          icon={<TrendingUp className="h-5 w-5" />}
        >
          <AreaTrendCard data={uploadsTrend} dataKey="value" stroke="#4f46e5" />
        </SectionCard>

        <SectionCard
          title="Import Trend"
          subtitle="Flow of recent imports over time"
          icon={<Database className="h-5 w-5" />}
        >
          <AreaTrendCard data={importsTrend} dataKey="value" stroke="#8b5cf6" />
        </SectionCard>
      </div>

      <div>
        <SectionCard
          title="Recent Imports"
          subtitle="Latest pipeline records"
          icon={<Clock3 className="h-5 w-5" />}
          rightAction={
            <button
              type="button"
              onClick={() => onOpenPanel("imports")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Eye size={14} />
              Explore
            </button>
          }
        >
          {(recent.imports || []).length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(recent.imports || []).map((row, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate capitalize font-semibold text-slate-950">
                        {row.fileName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {row.reportType}
                      </p>
                    </div>

                    <StatusPill
                      value={row.status}
                      type={getStatusTone(row.status)}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-52 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
              No recent imports available.
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function RiskTab({ dashboard, onOpenPanel }) {
  const { kpis, charts, highlights } = dashboard;

  const riskRanking = (charts.departmentRisk || [])
    .map((row) => ({
      name: row.name,
      value:
        Number(row.riskyUsers || 0) * 4 +
        Number(row.privilegedUsers || 0) * 2 +
        Number(row.inactiveUsers || 0),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <KPIBand
        items={[
          {
            title: "Compliance Flags",
            value: formatCompact(kpis.complianceFlags || 0),
            subtitle: "Current exception count",
            status: "error",
            meta: "Needs governance attention",
          },
          {
            title: "Privileged Users",
            value: formatCompact(kpis.privilegedUsers || 0),
            subtitle: "Elevated-access users",
            status: "default",
            meta: "Exposure population",
          },
          {
            title: "Inactive Users",
            value: formatCompact(kpis.inactiveUsers || 0),
            subtitle: "No recent activity",
            status: "warning",
            meta: "Possible waste or risk",
          },
          {
            title: "Active Users",
            value: formatCompact(kpis.activeUsers || 0),
            subtitle: "Current engagement base",
            status: "success",
            meta: "Healthy usage signal",
          },
        ]}
      />

      <SectionCard
        title="Department Risk Heatmap"
        subtitle="Weighted department pressure using risky, privileged, and inactive signals"
        icon={<ShieldAlert className="h-5 w-5" />}
      >
        <RiskHeatmap rows={charts.departmentRisk || []} />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Risk Ranking"
          subtitle="Departments ordered by weighted exposure"
          icon={<BarChart3 className="h-5 w-5" />}
        >
          <SimpleBarChartCard
            data={riskRanking.slice(0, 8)}
            barColor="#ef4444"
            horizontal
          />
        </SectionCard>

        <SectionCard
          title="Top Flagged Users"
          subtitle="Highest current access and compliance exposure"
          icon={<ShieldAlert className="h-5 w-5" />}
          rightAction={
            <button
              type="button"
              onClick={() => onOpenPanel("flagged")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Eye size={14} />
              Explore
            </button>
          }
        >
          <PreviewList
            rows={highlights.topFlaggedUsers || []}
            emptyText="No flagged users available."
            renderRow={(row) => (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{row.fullName}</p>
                  <p className="text-sm text-slate-500">{row.department}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Risky roles: {row.riskyRoleCount} • Privileged:{" "}
                    {row.privilegedRoleCount}
                  </p>
                </div>
                <StatusPill
                  value={`Score ${row.score}`}
                  type="error"
                  size="sm"
                />
              </div>
            )}
          />
        </SectionCard>
      </div>
    </div>
  );
}

function SavingsTab({ dashboard, onOpenPanel }) {
  const { kpis, charts, highlights } = dashboard;

  const savingsTreemapData = (charts.savingsByDepartment || []).map((item) => ({
    name: item.name,
    value: Number(item.value || 0),
  }));

  const savingsRanking = (charts.savingsByDepartment || [])
    .map((item) => ({
      name: item.name,
      value: Number(item.value || 0),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <KPIBand
        items={[
          {
            title: "Potential Savings",
            value: formatCurrency(kpis.potentialSavings || 0),
            subtitle: "Recoverable subscription value",
            status: "warning",
            meta: "Optimization target",
          },
          {
            title: "Monthly Cost Base",
            value: formatCurrency(kpis.totalMonthlyCost || 0),
            subtitle: "Current spend baseline",
            status: "default",
            meta: "Cost coverage in scope",
          },
          {
            title: "Users in Scope",
            value: formatCompact(kpis.totalUsers || 0),
            subtitle: "Analyzed population",
            status: "default",
            meta: "Optimization base",
          },
          {
            title: "Active Users",
            value: formatCompact(kpis.activeUsers || 0),
            subtitle: "Likely retained value",
            status: "success",
            meta: "Healthy utilization",
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Savings Concentration Map"
          subtitle="Treemap showing where optimization value is concentrated"
          icon={<DollarSign className="h-5 w-5" />}
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="h-80">
              {savingsTreemapData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={savingsTreemapData}
                    dataKey="value"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    content={<TreemapCell />}
                  />
                </ResponsiveContainer>
              ) : (
                <EmptyChart text="No savings map available." />
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Department Savings Ranking"
          subtitle="Departments ordered by current optimization concentration"
          icon={<Sparkles className="h-5 w-5" />}
        >
          <SimpleBarChartCard
            data={savingsRanking.slice(0, 8)}
            barColor="#4f46e5"
            horizontal
            valueFormatter={(v) => formatCurrency(v)}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Top Savings Candidates"
        subtitle="Highest reclaim or rightsize opportunities"
        icon={<Sparkles className="h-5 w-5" />}
        rightAction={
          <button
            type="button"
            onClick={() => onOpenPanel("savings")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Eye size={14} />
            Explore
          </button>
        }
      >
        {(highlights.topSavingsUsers || []).length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(highlights.topSavingsUsers || []).map((row, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="truncate font-semibold text-slate-950">
                      {row.fullName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {row.department}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right">
                    <p className="text-sm font-bold text-emerald-800">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Savings
                      </span>{" "}
                      {formatCurrency(row.potentialSavings)}
                    </p>
                  </div>
                </div>

                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {row.reason || "No reason provided"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-52 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
            No savings candidates available.
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function VisualDetailPanel({ type, rows = [] }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-14 text-center text-sm text-slate-500">
        No records available.
      </div>
    );
  }

  if (type === "savings") {
    const chartRows = rows
      .map((row) => ({
        name: row.fullName,
        value: Number(row.potentialSavings || 0),
        department: row.department,
      }))
      .sort((a, b) => b.value - a.value);

    return (
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Savings ranking"
          subtitle="Highest recoverable value by user"
          icon={<TrendingUp className="h-5 w-5" />}
        >
          <SimpleBarChartCard
            data={chartRows.slice(0, 10)}
            barColor="#4f46e5"
            horizontal
            valueFormatter={(v) => formatCurrency(v)}
          />
        </SectionCard>

        <SectionCard
          title="Candidate cards"
          subtitle="Quick visual review"
          icon={<Sparkles className="h-5 w-5" />}
        >
          <PreviewList
            rows={rows.slice(0, 8)}
            emptyText="No savings candidates available."
            renderRow={(row) => (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{row.fullName}</p>
                  <p className="text-sm text-slate-500">{row.department}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.reason}</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(row.potentialSavings)}
                </p>
              </div>
            )}
          />
        </SectionCard>
      </div>
    );
  }

  if (type === "flagged") {
    const chartRows = rows
      .map((row) => ({
        name: row.fullName,
        value: Number(row.score || 0),
        department: row.department,
      }))
      .sort((a, b) => b.value - a.value);

    return (
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Risk ranking"
          subtitle="Highest flagged scores by user"
          icon={<ShieldAlert className="h-5 w-5" />}
        >
          <SimpleBarChartCard
            data={chartRows.slice(0, 10)}
            barColor="#ef4444"
            horizontal
          />
        </SectionCard>

        <SectionCard
          title="Flagged user cards"
          subtitle="Quick visual review"
          icon={<Users className="h-5 w-5" />}
        >
          <PreviewList
            rows={rows.slice(0, 8)}
            emptyText="No flagged users available."
            renderRow={(row) => (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{row.fullName}</p>
                  <p className="text-sm text-slate-500">{row.department}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Risky roles: {row.riskyRoleCount} • Privileged:{" "}
                    {row.privilegedRoleCount}
                  </p>
                </div>
                <StatusPill
                  value={`Score ${row.score}`}
                  type="error"
                  size="sm"
                />
              </div>
            )}
          />
        </SectionCard>
      </div>
    );
  }

  if (type === "imports") {
    const chartRows = rows.reduce((acc, row) => {
      const key = row.status || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const data = Object.entries(chartRows).map(([name, value]) => ({
      name,
      value,
    }));

    return (
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Import status mix"
          subtitle="Visual distribution of current records"
          icon={<FileSpreadsheet className="h-5 w-5" />}
        >
          <SimpleBarChartCard data={data} barColor="#8b5cf6" />
        </SectionCard>

        <SectionCard
          title="Import cards"
          subtitle="Latest records"
          icon={<Clock3 className="h-5 w-5" />}
        >
          <PreviewList
            rows={rows.slice(0, 10)}
            emptyText="No recent imports available."
            renderRow={(row) => (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{row.fileName}</p>
                  <p className="text-sm text-slate-500">{row.reportType}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.rowsProcessed} rows • {formatDateTime(row.createdAt)}
                  </p>
                </div>
                <StatusPill
                  value={row.status}
                  type={getStatusTone(row.status)}
                  size="sm"
                />
              </div>
            )}
          />
        </SectionCard>
      </div>
    );
  }

  if (type === "uploads") {
    const chartRows = rows.reduce((acc, row) => {
      const key = row.status || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const data = Object.entries(chartRows).map(([name, value]) => ({
      name,
      value,
    }));

    return (
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Upload status mix"
          subtitle="Visual distribution of current queue"
          icon={<UploadCloud className="h-5 w-5" />}
        >
          <SimpleBarChartCard data={data} barColor="#4f46e5" />
        </SectionCard>

        <SectionCard
          title="Upload cards"
          subtitle="Latest queued records"
          icon={<Database className="h-5 w-5" />}
        >
          <PreviewList
            rows={rows.slice(0, 10)}
            emptyText="No recent uploads available."
            renderRow={(row) => (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{row.fileName}</p>
                  <p className="text-sm text-slate-500">{row.fileCategory}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(row.createdAt)}
                  </p>
                </div>
                <StatusPill
                  value={row.status}
                  type={getStatusTone(row.status)}
                  size="sm"
                />
              </div>
            )}
          />
        </SectionCard>
      </div>
    );
  }

  return null;
}

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [tab, setTab] = useState("overview");

  const showToast = (type, title, description = "") => {
    setToast({ type, title, description });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadDashboard = useCallback(
    async ({ isRefresh = false, signal } = {}) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setPageError("");

      try {
        const data = await dashboardApi.get(signal);
        setDashboard({ ...EMPTY_DASHBOARD, ...data });

        if (isRefresh) {
          showToast(
            "success",
            "Dashboard refreshed",
            "The command center has been updated with latest backend data.",
          );
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        const message = error.message || "Failed to load dashboard.";
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
    loadDashboard({ signal: controller.signal });
    return () => controller.abort();
  }, [loadDashboard]);

  const panelDetails = useMemo(
    () => ({
      savings: {
        title: "Top Savings Candidates",
        subtitle: "Visual analysis of the strongest savings opportunities.",
        rows: dashboard.highlights.topSavingsUsers || [],
      },
      flagged: {
        title: "Top Flagged Users",
        subtitle: "Visual analysis of the highest-risk users.",
        rows: dashboard.highlights.topFlaggedUsers || [],
      },
      uploads: {
        title: "Recent Uploads",
        subtitle: "Visual analysis of the most recent upload records.",
        rows: dashboard.recent.uploads || [],
      },
      imports: {
        title: "Recent Imports",
        subtitle: "Visual analysis of the most recent import records.",
        rows: dashboard.recent.imports || [],
      },
    }),
    [dashboard],
  );

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Monitor Oracle subscription activity, cost leakage, compliance exceptions, and reporting insights from one workspace."
    >
      <div className="space-y-6">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <DashboardHeader
          user={user}
          refreshing={refreshing}
          onRefresh={() => loadDashboard({ isRefresh: true })}
        />

        {pageError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {pageError}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <TabButton
              key={item.key}
              icon={item.icon}
              active={tab === item.key}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </TabButton>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500">
            Loading dashboard...
          </div>
        ) : (
          <>
            {tab === "overview" ? (
              <OverviewTab
                dashboard={dashboard}
                onOpenPanel={setSelectedPanel}
              />
            ) : null}

            {tab === "pipeline" ? (
              <PipelineTab
                dashboard={dashboard}
                onOpenPanel={setSelectedPanel}
              />
            ) : null}

            {tab === "risk" ? (
              <RiskTab dashboard={dashboard} onOpenPanel={setSelectedPanel} />
            ) : null}

            {tab === "savings" ? (
              <SavingsTab
                dashboard={dashboard}
                onOpenPanel={setSelectedPanel}
              />
            ) : null}
          </>
        )}

        <DetailModal
          open={!!selectedPanel}
          onClose={() => setSelectedPanel(null)}
          title={
            selectedPanel
              ? panelDetails[selectedPanel]?.title
              : "Dashboard Detail"
          }
          subtitle={selectedPanel ? panelDetails[selectedPanel]?.subtitle : ""}
          width="max-w-7xl"
        >
          {selectedPanel ? (
            <div className="space-y-5">
              <DetailSection
                title="Panel Summary"
                description="Expanded visual detail for the selected dashboard panel."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  <DetailItem
                    label="Panel"
                    value={panelDetails[selectedPanel]?.title || "-"}
                    emphasis
                  />
                  <DetailItem
                    label="Rows"
                    value={panelDetails[selectedPanel]?.rows?.length || 0}
                  />
                  <DetailItem
                    label="Scope"
                    value="Live backend dashboard payload"
                  />
                </DetailGrid>
              </DetailSection>

              <VisualDetailPanel
                type={selectedPanel}
                rows={panelDetails[selectedPanel]?.rows || []}
              />
            </div>
          ) : null}
        </DetailModal>
      </div>
    </AppLayout>
  );
}
