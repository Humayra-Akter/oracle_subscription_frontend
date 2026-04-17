import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Eye,
  ChevronDown,
  DollarSign,
  ShieldAlert,
  Activity,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  BarChart3,
  PieChart as PieChartIcon,
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
import StatusPill from "../components/StatusPill";
import DataTableShell from "../components/DataTableShell";
import TablePagination from "../components/TablePagination";
import DetailModal from "../components/DetailModal";
import {
  DetailSection,
  DetailGrid,
  DetailItem,
} from "../components/DetailSection";
import { usersAnalysisApi } from "../utils/api";

const PAGE_SIZE = 10;

const CHART_COLORS = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#10b981",
  "Inactive license": "#ef4444",
  "Low utilization": "#f59e0b",
  "Full reclaim candidate": "#10b981",
  "Rightsize candidate": "#0ea5e9",
  "Review required": "#94a3b8",
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(toNumber(value));

const formatCompact = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value));

const getFirst = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};

const normalizeRisk = (value) => {
  const v = String(value || "").toLowerCase();

  if (v.includes("high") || v.includes("critical")) return "High";
  if (v.includes("low")) return "Low";
  return "Medium";
};

const getRiskType = (risk) => {
  if (risk === "High") return "error";
  if (risk === "Medium") return "warning";
  return "success";
};

const normalizeRow = (item, index) => {
  const licenseCost = toNumber(
    getFirst(
      item.licenseCost,
      item.cost,
      item.assignedCost,
      item.subscriptionCost,
      item.annualCost,
      0,
    ),
  );

  const potentialSavingsRaw = getFirst(
    item.potentialSavings,
    item.savings,
    item.wastedCost,
    item.avoidableCost,
    item.recoverableSpend,
    null,
  );

  const inactiveDays = getFirst(
    item.lastActivityDays,
    item.daysSinceLastActivity,
    item.inactiveDays,
    item.lastTransactionDays,
    null,
  );

  const usageScore = getFirst(
    item.usageScore,
    item.utilizationScore,
    item.activityScore,
    item.engagementScore,
    null,
  );

  const potentialSavings =
    potentialSavingsRaw !== null
      ? toNumber(potentialSavingsRaw)
      : inactiveDays >= 90
        ? licenseCost
        : usageScore !== null && toNumber(usageScore) <= 25
          ? licenseCost * 0.7
          : usageScore !== null && toNumber(usageScore) <= 50
            ? licenseCost * 0.4
            : licenseCost * 0.2;

  let opportunityType = "Review required";
  if (inactiveDays !== null && toNumber(inactiveDays) >= 90) {
    opportunityType = "Inactive license";
  } else if (usageScore !== null && toNumber(usageScore) <= 25) {
    opportunityType = "Low utilization";
  } else if (potentialSavings >= licenseCost && licenseCost > 0) {
    opportunityType = "Full reclaim candidate";
  } else if (potentialSavings > 0) {
    opportunityType = "Rightsize candidate";
  }

  return {
    id: getFirst(
      item.id,
      item._id,
      item.userId,
      item.employeeId,
      `row-${index}`,
    ),
    raw: item,
    userName: getFirst(
      item.userName,
      item.name,
      item.employeeName,
      item.fullName,
      item.email,
      "Unknown User",
    ),
    serviceName: getFirst(
      item.serviceName,
      item.service,
      item.productName,
      item.module,
      item.subscriptionName,
      "Unknown Service",
    ),
    department: getFirst(
      item.department,
      item.departmentName,
      item.businessUnit,
      item.orgUnit,
      item.team,
      "Unassigned",
    ),
    licenseCost,
    potentialSavings,
    risk: normalizeRisk(
      getFirst(item.risk, item.riskLevel, item.priority, item.status, "Medium"),
    ),
    inactiveDays: inactiveDays !== null ? toNumber(inactiveDays) : null,
    usageScore: usageScore !== null ? toNumber(usageScore) : null,
    opportunityType,
  };
};

const deriveStatsFromRows = (rows) => {
  const potentialSavings = rows.reduce(
    (sum, row) => sum + toNumber(row.potentialSavings),
    0,
  );

  const totalCost = rows.reduce(
    (sum, row) => sum + toNumber(row.licenseCost),
    0,
  );

  const inactiveUsers = rows.filter(
    (row) => row.inactiveDays !== null && row.inactiveDays >= 90,
  ).length;

  const highRiskServices = new Set(
    rows.filter((row) => row.risk === "High").map((row) => row.serviceName),
  ).size;

  const byDepartment = rows.reduce((acc, row) => {
    acc[row.department] = (acc[row.department] || 0) + row.potentialSavings;
    return acc;
  }, {});

  const mostAffectedDepartment =
    Object.entries(byDepartment).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  return {
    potentialSavings,
    totalCost,
    inactiveUsers,
    highRiskServices,
    mostAffectedDepartment,
  };
};

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

export default function CostOptimization() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [sortBy, setSortBy] = useState("savings_desc");
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);

  const showToast = (type, title, description = "") => {
    setToast({ type, title, description });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await usersAnalysisApi.list({}, controller.signal);
        const items = Array.isArray(response?.items) ? response.items : [];
        const normalized = items.map(normalizeRow);

        setRows(normalized);
        setStats(response?.stats || {});
      } catch (err) {
        if (err.name !== "AbortError") {
          const message =
            err.message || "Failed to load cost optimization data.";
          setError(message);
          showToast("error", "Could not load cost optimization data", message);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await usersAnalysisApi.list({});
      const items = Array.isArray(response?.items) ? response.items : [];
      const normalized = items.map(normalizeRow);

      setRows(normalized);
      setStats(response?.stats || {});
      showToast(
        "success",
        "Cost data refreshed",
        "The optimization view has been updated with latest backend data.",
      );
    } catch (err) {
      const message = err.message || "Failed to refresh cost data.";
      setError(message);
      showToast("error", "Refresh failed", message);
    } finally {
      setRefreshing(false);
    }
  };

  const processedRows = useMemo(() => {
    let next = [...rows];

    const q = search.trim().toLowerCase();

    if (q) {
      next = next.filter(
        (row) =>
          row.userName.toLowerCase().includes(q) ||
          row.serviceName.toLowerCase().includes(q) ||
          row.department.toLowerCase().includes(q) ||
          row.opportunityType.toLowerCase().includes(q),
      );
    }

    if (riskFilter !== "All") {
      next = next.filter((row) => row.risk === riskFilter);
    }

    if (sortBy === "savings_desc") {
      next.sort((a, b) => b.potentialSavings - a.potentialSavings);
    } else if (sortBy === "cost_desc") {
      next.sort((a, b) => b.licenseCost - a.licenseCost);
    } else if (sortBy === "inactive_desc") {
      next.sort((a, b) => (b.inactiveDays || -1) - (a.inactiveDays || -1));
    } else if (sortBy === "service_asc") {
      next.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
    } else if (sortBy === "risk_desc") {
      const order = { High: 3, Medium: 2, Low: 1 };
      next.sort((a, b) => order[b.risk] - order[a.risk]);
    }

    return next;
  }, [rows, search, riskFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, riskFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / PAGE_SIZE));
  const paginatedRows = processedRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const derived = useMemo(() => deriveStatsFromRows(rows), [rows]);

  const potentialSavings = toNumber(
    getFirst(
      stats.totalPotentialSavings,
      stats.potentialSavings,
      stats.recoverableSpend,
      derived.potentialSavings,
    ),
  );

  const totalCost = toNumber(
    getFirst(
      stats.totalAssignedCost,
      stats.totalCost,
      stats.subscriptionCost,
      derived.totalCost,
    ),
  );

  const inactiveUsers = toNumber(
    getFirst(
      stats.inactiveCandidates,
      stats.inactiveUsers,
      stats.reviewAccounts,
      derived.inactiveUsers,
    ),
  );

  const highRiskServices = toNumber(
    getFirst(
      stats.highRiskServices,
      stats.highRiskCount,
      stats.criticalServices,
      derived.highRiskServices,
    ),
  );

  const mostAffectedDepartment = getFirst(
    stats.mostAffectedDepartment,
    stats.topDepartment,
    derived.mostAffectedDepartment,
    "-",
  );

  const topRecord = [...rows].sort(
    (a, b) => b.potentialSavings - a.potentialSavings,
  )[0];

  const opportunityMixData = useMemo(() => {
    const grouped = rows.reduce((acc, row) => {
      acc[row.opportunityType] = (acc[row.opportunityType] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
        fill: CHART_COLORS[name] || "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const departmentSavingsData = useMemo(() => {
    const grouped = rows.reduce((acc, row) => {
      const key = row.department || "Unassigned";
      acc[key] = (acc[key] || 0) + row.potentialSavings;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name: name.length > 18 ? `${name.slice(0, 15).trim()}...` : name,
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [rows]);

  const riskMixData = useMemo(() => {
    const grouped = rows.reduce(
      (acc, row) => {
        acc[row.risk] = (acc[row.risk] || 0) + 1;
        return acc;
      },
      { High: 0, Medium: 0, Low: 0 },
    );

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
        fill: CHART_COLORS[name] || "#94a3b8",
      }))
      .filter((item) => item.value > 0);
  }, [rows]);

  const toolbar = (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px]">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-brand-200 focus-within:ring-2 focus-within:ring-brand-100">
        <Search size={18} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user, service, department, or opportunity"
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="relative">
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="h-[52px] w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
        >
          <option value="All">Risk: All</option>
          <option value="High">Risk: High</option>
          <option value="Medium">Risk: Medium</option>
          <option value="Low">Risk: Low</option>
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-[52px] w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
        >
          <option value="savings_desc">Sort: Highest savings</option>
          <option value="cost_desc">Sort: Highest cost</option>
          <option value="inactive_desc">Sort: Most inactive</option>
          <option value="risk_desc">Sort: Highest risk</option>
          <option value="service_asc">Sort: Service A-Z</option>
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </div>
  );

  return (
    <AppLayout
      title="Cost Optimization"
      subtitle="Prioritize reclaim, rightsize, and renewal actions using live subscription analysis."
    >
      <div className="space-y-4">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <section className="rounded-xl border border-slate-200 flex items-end bg-gradient-to-r from-brand-50 via-white to-white px-6 py-4 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase text-brand-700">
              <ShieldCheck size={14} />
              Cost Optimization
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-indigo-800">
              Surface reclaim opportunities, waste signals, and renewal actions
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This view uses only live backend-returned records to prioritize
              subscription savings, identify inactive cost load, and guide
              right-sizing actions.
            </p>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <StatusCard
            title="Potential Savings"
            value={formatCurrency(potentialSavings)}
            subtitle="Recoverable subscription spend"
            status="success"
            meta="Backend-derived"
          />
          <StatusCard
            title="Assigned Cost Base"
            value={formatCurrency(totalCost)}
            subtitle="Analyzed license cost footprint"
            status="default"
            meta="Current visible dataset"
          />
          <StatusCard
            title="Inactive Candidates"
            value={formatCompact(inactiveUsers)}
            subtitle="Users likely needing reclaim"
            status="warning"
            meta="Review cluster"
          />
          <StatusCard
            title="High Risk Services"
            value={formatCompact(highRiskServices)}
            subtitle="Services with elevated leakage"
            status="error"
            meta="Highest priority"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}

        <div className="grid gap-2 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionCard
            title="Department Savings Heatmap"
            subtitle="Top departments by current savings potential"
            icon={<BarChart3 className="h-7 w-7 text-indigo-700" />}
          >
            <div className="space-y-2">
              <div className="h-80">
                {departmentSavingsData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentSavingsData}
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
                        formatter={(value) => formatCurrency(value)}
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
                    No department savings data available
                  </div>
                )}
              </div>

              {departmentSavingsData.length ? (
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      What this shows
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      This chart ranks departments by the total savings
                      opportunity found in the current visible dataset. Higher
                      bars indicate departments where reclaim, rightsize, or
                      inactive-license review may deliver the strongest
                      financial impact first.
                    </p>
                  </div>

                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                      Top Department
                    </p>
                    <p className="mt-2 text-base font-bold text-indigo-800">
                      {departmentSavingsData[0]?.name || "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatCurrency(departmentSavingsData[0]?.value || 0)}{" "}
                      potential savings
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <div className="grid gap-3">
            <SectionCard
              title="Opportunity Mix"
              subtitle="Current distribution of savings opportunity types"
              icon={<PieChartIcon className="h-7 w-7 text-indigo-700" />}
            >
              <div className="grid gap-2 lg:grid-cols-[0.8fr_1fr] lg:items-center">
                <div className="h-44">
                  {opportunityMixData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={opportunityMixData}
                          innerRadius={54}
                          outerRadius={78}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          stroke="none"
                        >
                          {opportunityMixData.map((entry) => (
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
                      No opportunity data available
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {opportunityMixData.map((item) => {
                    const total = opportunityMixData.reduce(
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
                          {share}% of visible cost opportunities
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
              title="Optimization Signals"
              subtitle="Quick backend-driven decision markers"
              icon={<TrendingUp className="h-7 w-7 text-indigo-700" />}
            >
              <div className="grid gap-1 sm:grid-cols-3">
                <SignalBox
                  label="Most Affected Department"
                  value={mostAffectedDepartment}
                  tone="indigo"
                />
                <SignalBox
                  label="Top Savings Driver"
                  value={topRecord ? topRecord.serviceName : "-"}
                  tone="emerald"
                />
                <SignalBox
                  label="Largest Opportunity"
                  value={topRecord ? topRecord.opportunityType : "-"}
                  tone="amber"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Risk Distribution"
              subtitle="Live risk concentration across current visible records"
              icon={<ShieldAlert className="h-7 w-7 text-indigo-700" />}
            >
              <div className="space-y-2">
                {riskMixData.length ? (
                  riskMixData.map((item) => {
                    const total = riskMixData.reduce(
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
                          {share}% of visible records
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
                  })
                ) : (
                  <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                    No risk data available
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>

        <div>
          <DataTableShell
            title="Ranked Cost Opportunities"
            subtitle="A table-first operating view of savings candidates, inactive users, and right-sizing opportunities."
            rightActions={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
            }
            toolbar={toolbar}
            footer={
              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={processedRows.length}
                pageSize={PAGE_SIZE}
                onPageChange={(nextPage) => {
                  if (nextPage < 1 || nextPage > totalPages) return;
                  setPage(nextPage);
                }}
              />
            }
          >
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-center text-slate-500">
                      User / Service
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-center text-slate-500">
                      Department
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-center text-slate-500">
                      Opportunity
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-center text-slate-500">
                      License Cost
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-center text-slate-500">
                      Potential Savings
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-center text-slate-500">
                      Last Activity
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-center text-slate-500">
                      Risk
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-center text-slate-500">
                      Detail
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  ) : processedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-sm text-slate-500"
                      >
                        No matching records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-950">
                              {row.userName}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {row.serviceName}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {row.department}
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {row.opportunityType}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {row.usageScore !== null
                                ? `Usage score ${row.usageScore}`
                                : "Limited usage data"}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-center text-slate-900">
                          {formatCurrency(row.licenseCost)}
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-center text-slate-950">
                          {formatCurrency(row.potentialSavings)}
                        </td>

                        <td className="px-6 py-4 text-center text-sm text-slate-700">
                          {row.inactiveDays !== null
                            ? `${row.inactiveDays}d`
                            : "-"}
                        </td>

                        <td className="px-6 py-4">
                          <StatusPill
                            value={row.risk}
                            type={getRiskType(row.risk)}
                            size="sm"
                            dot
                          />
                        </td>

                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedRow(row)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:shadow-md"
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

        <DetailModal
          open={!!selectedRow}
          title={selectedRow?.serviceName || "Record Detail"}
          subtitle={
            selectedRow
              ? `${selectedRow.userName} • ${selectedRow.department}`
              : ""
          }
          onClose={() => setSelectedRow(null)}
          width="max-w-5xl"
        >
          {selectedRow ? (
            <div className="space-y-6">
              <DetailSection
                title="Financial Summary"
                description="Core cost and savings indicators for this record."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem
                    label="License Cost"
                    value={formatCurrency(selectedRow.licenseCost)}
                    emphasis
                  />
                  <DetailItem
                    label="Potential Savings"
                    value={formatCurrency(selectedRow.potentialSavings)}
                    emphasis
                  />
                  <DetailItem
                    label="Risk"
                    value={
                      <StatusPill
                        value={selectedRow.risk}
                        type={getRiskType(selectedRow.risk)}
                      />
                    }
                  />
                  <DetailItem
                    label="Opportunity"
                    value={selectedRow.opportunityType}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection
                title="User and Service Context"
                description="Business assignment and usage context."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem label="User" value={selectedRow.userName} />
                  <DetailItem label="Service" value={selectedRow.serviceName} />
                  <DetailItem
                    label="Department"
                    value={selectedRow.department}
                  />
                  <DetailItem
                    label="Last Activity"
                    value={
                      selectedRow.inactiveDays !== null
                        ? `${selectedRow.inactiveDays} days`
                        : "-"
                    }
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection
                title="Usage Assessment"
                description="Usage-based view used for optimization recommendation."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  <DetailItem
                    label="Usage Score"
                    value={
                      selectedRow.usageScore !== null
                        ? selectedRow.usageScore
                        : "-"
                    }
                  />
                  <DetailItem
                    label="Recommendation"
                    value={selectedRow.opportunityType}
                    emphasis
                  />
                  <DetailItem
                    label="Review Priority"
                    value={
                      <StatusPill
                        value={selectedRow.risk}
                        type={getRiskType(selectedRow.risk)}
                      />
                    }
                  />
                </DetailGrid>
              </DetailSection>
            </div>
          ) : null}
        </DetailModal>
      </div>
    </AppLayout>
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
  };

  const t = toneMap[tone] || toneMap.indigo;

  return (
    <div className={`rounded-xl border px-4 py-2 shadow-sm ${t.wrap}`}>
      <p
        className={`text-[11px] font-semibold uppercase tracking-wide ${t.title}`}
      >
        {label}
      </p>
      <p className={`mt-2 text-base font-bold ${t.value}`}>{value}</p>
    </div>
  );
}
