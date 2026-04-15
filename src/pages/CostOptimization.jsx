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
  Users,
} from "lucide-react";

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

export default function CostOptimization() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [sortBy, setSortBy] = useState("savings_desc");
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);

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
          setError(err.message || "Failed to load cost optimization data.");
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
    } catch (err) {
      setError(err.message || "Failed to refresh cost data.");
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

  return (
    <AppLayout
      title="Cost Optimization"
      subtitle="Prioritize reclaim, rightsize, and renewal actions using live subscription analysis."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <StatusCard
            title="Potential Savings"
            value={formatCurrency(potentialSavings)}
            subtitle="Recoverable subscription spend"
            status="success"
          />
          <StatusCard
            title="Assigned Cost Base"
            value={formatCurrency(totalCost)}
            subtitle="Analyzed license cost footprint"
            status="default"
          />
          <StatusCard
            title="Inactive Candidates"
            value={formatCompact(inactiveUsers)}
            subtitle="Users likely needing reclaim"
            status="warning"
          />
          <StatusCard
            title="High Risk Services"
            value={formatCompact(highRiskServices)}
            subtitle="Services with elevated leakage"
            status="error"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
          <DataTableShell
            title="Ranked Cost Opportunities"
            subtitle="A table-first operating view of savings candidates, inactive users, and right-sizing opportunities."
            rightActions={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
            }
            toolbar={
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px]">
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <Search size={18} className="text-zinc-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search user, service, department, or opportunity"
                    className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                </div>

                <div className="relative">
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="h-[52px] w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-700 outline-none"
                  >
                    <option value="All">Risk: All</option>
                    <option value="High">Risk: High</option>
                    <option value="Medium">Risk: Medium</option>
                    <option value="Low">Risk: Low</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-[52px] w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-700 outline-none"
                  >
                    <option value="savings_desc">Sort: Highest savings</option>
                    <option value="cost_desc">Sort: Highest cost</option>
                    <option value="inactive_desc">Sort: Most inactive</option>
                    <option value="risk_desc">Sort: Highest risk</option>
                    <option value="service_asc">Sort: Service A-Z</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                </div>
              </div>
            }
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
            <table className="min-w-full text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50/80">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    User / Service
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Department
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Opportunity
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    License Cost
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Potential Savings
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Last Activity
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Risk
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Detail
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="h-10 animate-pulse rounded-xl bg-zinc-100" />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-red-600"
                    >
                      {error}
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-zinc-500"
                    >
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-zinc-100 transition hover:bg-zinc-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="min-w-[240px]">
                          <p className="font-semibold text-zinc-950">
                            {row.userName}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            {row.serviceName}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-zinc-700">
                        {row.department}
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-zinc-900">
                            {row.opportunityType}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {row.usageScore !== null
                              ? `Usage score ${row.usageScore}`
                              : "Limited usage data"}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                        {formatCurrency(row.licenseCost)}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-zinc-950">
                        {formatCurrency(row.potentialSavings)}
                      </td>

                      <td className="px-6 py-4 text-sm text-zinc-700">
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
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
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

          <div className="space-y-4">
            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-950">
                    Optimization Signals
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Quick read from live analysis
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <SummaryBox
                  label="Most Affected Department"
                  value={mostAffectedDepartment}
                />
                <SummaryBox
                  label="Top Savings Driver"
                  value={topRecord ? topRecord.serviceName : "-"}
                />
                <SummaryBox
                  label="Largest Opportunity Type"
                  value={topRecord ? topRecord.opportunityType : "-"}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-950">
                    Recommended Focus
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">Best next action</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm leading-6 text-zinc-700">
                  {topRecord
                    ? `Start with ${topRecord.serviceName} under ${topRecord.department}. It currently shows the strongest recoverable spend signal and should be reviewed first before renewal or reassignment.`
                    : "No recommendation available yet."}
                </p>
              </div>
            </div>
          </div>
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
                  <DetailItem label="Risk" value={selectedRow.risk} />
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
                    value={selectedRow.risk}
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

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-zinc-950">{value}</p>
    </div>
  );
}
