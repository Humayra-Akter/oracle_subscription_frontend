import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  ShieldAlert,
  DollarSign,
  Users,
  BarChart3,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
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
import { reportsApi } from "../utils/api";

const PAGE_SIZE = 5;

const EMPTY_DATA = {
  summary: {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    complianceFlags: 0,
    totalMonthlyCost: 0,
    totalPotentialSavings: 0,
    topSavingsUser: "-",
    topRiskDepartment: "-",
  },
  reportOptions: [],
  preview: {
    flaggedUsers: [],
    savings: [],
  },
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function getReportTone(key) {
  if (key === "compliance" || key === "flagged-users") return "error";
  if (key === "savings") return "warning";
  return "default";
}

function getReportIcon(key) {
  if (key === "compliance") return <ShieldAlert size={18} />;
  if (key === "flagged-users") return <Users size={18} />;
  if (key === "savings") return <DollarSign size={18} />;
  return <BarChart3 size={18} />;
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

export default function Reports() {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);

  const showToast = (type, title, description = "") => {
    setToast({ type, title, description });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadReports = async ({ isRefresh = false } = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setPageError("");

    try {
      const response = await reportsApi.dashboard();
      setData({
        summary: response.summary || EMPTY_DATA.summary,
        reportOptions: response.reportOptions || [],
        preview: response.preview || EMPTY_DATA.preview,
      });

      if (isRefresh) {
        showToast(
          "success",
          "Reports refreshed",
          "The reporting dashboard has been updated with latest backend data.",
        );
      }
    } catch (error) {
      const message = error.message || "Failed to load reports page.";
      setPageError(message);
      showToast("error", "Load failed", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const paginatedReportOptions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (data.reportOptions || []).slice(start, start + PAGE_SIZE);
  }, [data.reportOptions, page]);

  const totalPages = Math.max(
    1,
    Math.ceil((data.reportOptions || []).length / PAGE_SIZE),
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const openPreview = async (report) => {
    setSelectedReport(report);
    setPreviewLoading(true);

    try {
      const response = await reportsApi.preview(report.key);
      setPreviewRows(Array.isArray(response.rows) ? response.rows : []);
    } catch (error) {
      setPreviewRows([]);
      showToast(
        "error",
        "Preview unavailable",
        error.message || "Failed to load report preview.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExport = async (reportKey) => {
    try {
      const { blob, fileName } = await reportsApi.exportCsv(reportKey);
      downloadBlob(blob, fileName);
      showToast(
        "success",
        "Export started",
        `${fileName || "CSV file"} has been downloaded.`,
      );
    } catch (error) {
      showToast(
        "error",
        "Export failed",
        error.message || "Failed to export report.",
      );
    }
  };

  const reportMixData = useMemo(() => {
    return (data.reportOptions || []).map((report) => ({
      name: report.title,
      shortName:
        report.title.length > 20
          ? `${report.title.slice(0, 17).trim()}...`
          : report.title,
      value: Number(report.rowCount || 0),
      fill:
        report.key === "compliance" || report.key === "flagged-users"
          ? "#ef4444"
          : report.key === "savings"
            ? "#f59e0b"
            : "#7c3aed",
    }));
  }, [data.reportOptions]);

  const previewBreakdownData = useMemo(() => {
    return [
      {
        name: "Flagged Users",
        value: (data.preview.flaggedUsers || []).length,
        fill: "#ef4444",
      },
      {
        name: "Savings Preview",
        value: (data.preview.savings || []).length,
        fill: "#10b981",
      },
    ].filter((item) => item.value > 0);
  }, [data.preview]);

  const reportOverviewData = useMemo(() => {
    return [
      {
        label: "Active Users",
        value: Number(data.summary.activeUsers || 0),
        fill: "#10b981",
      },
      {
        label: "Inactive Users",
        value: Number(data.summary.inactiveUsers || 0),
        fill: "#f59e0b",
      },
      {
        label: "Compliance Flags",
        value: Number(data.summary.complianceFlags || 0),
        fill: "#ef4444",
      },
    ];
  }, [data.summary]);

  return (
    <AppLayout
      title="Reports"
      subtitle="Export business-ready summaries, compliance outputs, flagged users, and savings reports from the processed Oracle data."
    >
      <div className="space-y-4">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <section className="rounded-xl border border-slate-200 flex items-end bg-gradient-to-r from-brand-50 via-white to-white px-6 py-4 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase text-brand-700">
              <ShieldCheck size={14} />
              Reports
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-indigo-800">
              Generate export-ready reports and monitor reporting coverage
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This reporting workspace uses live backend data to summarize user
              coverage, compliance load, savings opportunity, and exportable
              report availability.
            </p>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="Total Users"
            value={data.summary.totalUsers}
            subtitle="Users in processed reporting scope"
            status="default"
            meta="Reporting dataset"
          />
          <StatusCard
            title="Compliance Flags"
            value={data.summary.complianceFlags}
            subtitle="Users needing review"
            status="error"
            meta="Exception driven"
          />
          <StatusCard
            title="Potential Savings"
            value={formatCurrency(data.summary.totalPotentialSavings)}
            subtitle="Estimated optimization opportunity"
            status="warning"
            meta="Backend-derived"
          />
          <StatusCard
            title="Monthly Cost Base"
            value={formatCurrency(data.summary.totalMonthlyCost)}
            subtitle="Assigned subscription spend"
            status="default"
            meta="Current processed data"
          />
        </div>

        {pageError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {pageError}
          </div>
        ) : null}

        <div className="mt-5 grid gap-2 xl:grid-cols-[1.05fr_1fr_0.6fr]">
          <SectionCard
            title="Report Volume by Dataset"
            subtitle="Available report outputs ranked by current row count"
            icon={<BarChart3 className="h-7 w-7 text-indigo-700" />}
          >
            <div className="space-y-2">
              <div className="h-66">
                {reportMixData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportMixData}
                      margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
                      barGap={8}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        vertical={false}
                      />
                      <XAxis dataKey="shortName" stroke="#94a3b8" />
                      <YAxis allowDecimals={false} stroke="#94a3b8" />
                      <Tooltip
                        formatter={(value) => [value, "Rows"]}
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#fff",
                          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                        {reportMixData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    No report volume data available
                  </div>
                )}
              </div>

              {reportMixData.length ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                    What this shows
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    This chart compares available exports by current row count
                    in the live reporting dataset. Larger bars indicate reports
                    with broader reporting coverage or higher operational
                    relevance.
                  </p>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <div className="grid gap-4">
            <SectionCard
              title="Preview Coverage"
              subtitle="Distribution of currently available preview data"
              icon={<PieChartIcon className="h-7 w-7 text-indigo-700" />}
            >
              <div className="grid gap-2 lg:grid-cols-[0.8fr_1fr] lg:items-center">
                <div className="h-44">
                  {previewBreakdownData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={previewBreakdownData}
                          innerRadius={54}
                          outerRadius={78}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          stroke="none"
                        >
                          {previewBreakdownData.map((entry) => (
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
                      No preview data available
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {previewBreakdownData.map((item) => {
                    const total = previewBreakdownData.reduce(
                      (sum, x) => sum + x.value,
                      0,
                    );
                    const share = total
                      ? Math.round((item.value / total) * 100)
                      : 0;

                    return (
                      <div
                        key={item.name}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
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
                          {share}% of live preview rows
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
              title="Reporting Signals"
              subtitle="Quick summary of current reporting priorities"
              icon={<TrendingUp className="h-7 w-7 text-indigo-700" />}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <SignalBox
                  label="Top Savings User"
                  value={data.summary.topSavingsUser || "-"}
                  tone="emerald"
                />
                <SignalBox
                  label="Top Risk Department"
                  value={data.summary.topRiskDepartment || "-"}
                  tone="red"
                />
                <SignalBox
                  label="Inactive Users"
                  value={data.summary.inactiveUsers || 0}
                  tone="amber"
                />
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Current Reporting Overview"
            subtitle="Live comparative view of users and flags in reporting scope"
            icon={<FileSpreadsheet className="h-7 w-7 text-indigo-700" />}
          >
            <div className="space-y-3">
              {reportOverviewData.map((item) => {
                const total = reportOverviewData.reduce(
                  (sum, x) => sum + x.value,
                  0,
                );
                const share = total
                  ? Math.round((item.value / total) * 100)
                  : 0;

                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-sm font-semibold text-slate-800">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {item.value}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {share}% of visible reporting mix
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
          </SectionCard>
        </div>

          <DataTableShell
            title="Available Reports"
            subtitle="Generate executive summaries and export operational CSV reports for audit, compliance, and savings review."
            rightActions={
              <button
                type="button"
                onClick={() => loadReports({ isRefresh: true })}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            }
            footer={
              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={(data.reportOptions || []).length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            }
          >
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50/90">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase text-slate-500">
                    Report
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase text-slate-500">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase text-slate-500">
                    Rows
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase text-slate-500">
                    Export
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-14 text-center text-sm text-slate-500"
                    >
                      Loading reports...
                    </td>
                  </tr>
                ) : paginatedReportOptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-14 text-center text-sm text-slate-500"
                    >
                      No reports available.
                    </td>
                  </tr>
                ) : (
                  paginatedReportOptions.map((report) => (
                    <tr
                      key={report.key}
                      className="border-b border-slate-100 transition hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                            {getReportIcon(report.key)}
                          </div>
                          <div className="flex gap-2">
                            <p className="font-semibold text-slate-950">
                              {report.title}
                            </p>
                            <div className="capitalize">
                              <StatusPill
                                value={report.key}
                                type={getReportTone(report.key)}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {report.description}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-center text-slate-900">
                        {report.rowCount}
                      </td>

                      <td className="px-6 py-4 flex justify-center items-center">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openPreview(report)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                          >
                            <Eye size={15} />
                            Preview
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExport(report.key)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-900 bg-indigo-900 px-3 py-1 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                          >
                            <Download size={15} />
                            Export CSV
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTableShell>


        <div className="grid gap-4 xl:grid-cols-2">
          <PreviewPanel
            title="Top Flagged Users"
            icon={<ShieldAlert size={16} />}
            rows={data.preview.flaggedUsers || []}
            emptyText="No flagged users available."
            renderRow={(row) => (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-950">{row.fullName}</p>
                  <p className="text-sm text-slate-500">{row.email}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.reasons}</p>
                </div>
                <StatusPill value={row.department} type="neutral" size="sm" />
              </div>
            )}
          />

          <PreviewPanel
            title="Top Savings Opportunities"
            icon={<DollarSign size={16} />}
            rows={data.preview.savings || []}
            emptyText="No savings opportunities available."
            renderRow={(row) => (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-950">{row.fullName}</p>
                  <p className="text-sm text-slate-500">{row.licenseName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.opportunityType}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(row.potentialSavings)}
                </p>
              </div>
            )}
          />
        </div>

        <DetailModal
          open={!!selectedReport}
          onClose={() => {
            setSelectedReport(null);
            setPreviewRows([]);
          }}
          title={selectedReport?.title || "Report Preview"}
          subtitle={selectedReport?.description || ""}
          width="max-w-6xl"
        >
          {selectedReport ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-4">
                <SummaryMiniCard
                  label="Report Type"
                  value={selectedReport.key}
                  icon={<FileSpreadsheet size={16} />}
                />
                <SummaryMiniCard
                  label="Rows"
                  value={selectedReport.rowCount}
                  icon={<BarChart3 size={16} />}
                />
                <SummaryMiniCard
                  label="Top Savings User"
                  value={data.summary.topSavingsUser}
                  icon={<DollarSign size={16} />}
                />
                <SummaryMiniCard
                  label="Top Risk Dept"
                  value={data.summary.topRiskDepartment}
                  icon={<ShieldAlert size={16} />}
                />
              </div>

              <DetailSection
                title="Report Preview"
                description="This is a limited preview of the exportable dataset."
              >
                {previewLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    Loading report preview...
                  </div>
                ) : previewRows.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    No preview rows available.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          {Object.keys(previewRows[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-3 text-xs font-bold uppercase text-slate-500"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.slice(0, 10).map((row, index) => (
                          <tr
                            key={index}
                            className="border-b border-slate-100 last:border-b-0"
                          >
                            {Object.keys(previewRows[0]).map((key) => (
                              <td
                                key={key}
                                className="px-4 py-3 text-sm text-slate-700"
                              >
                                {String(row[key] ?? "-")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DetailSection>

              <DetailSection
                title="Export Action"
                description="Download the full CSV file for reporting, audit, or analysis."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  <DetailItem
                    label="Report Name"
                    value={selectedReport.title}
                    emphasis
                  />
                  <DetailItem
                    label="Rows Available"
                    value={selectedReport.rowCount}
                  />
                  <DetailItem label="Format" value="CSV" />
                </DetailGrid>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => handleExport(selectedReport.key)}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-700 bg-slate-900 px-2 py-1 text-sm font-semibold text-white transition hover:bg-indigo-500"
                  >
                    <Download size={16} />
                    Export Full CSV
                  </button>
                </div>
              </DetailSection>
            </div>
          ) : null}
        </DetailModal>
      </div>
    </AppLayout>
  );
}

function PreviewPanel({ title, icon, rows, emptyText, renderRow }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-1 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold uppercase text-slate-500">{title}</p>
        </div>
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
          {icon}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {emptyText}
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2"
            >
              {renderRow(row)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SummaryMiniCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase text-slate-500">
          {label}
        </span>
        <span className="text-slate-700">{icon}</span>
      </div>
      <p className="mt-4 text-xl font-bold text-slate-950">{value}</p>
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
