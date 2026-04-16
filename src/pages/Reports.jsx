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
} from "lucide-react";

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

export default function Reports() {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [page, setPage] = useState(1);

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
    } catch (error) {
      setPageError(error.message || "Failed to load reports page.");
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
    } catch {
      setPreviewRows([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExport = async (reportKey) => {
    try {
      const { blob, fileName } = await reportsApi.exportCsv(reportKey);
      downloadBlob(blob, fileName);
    } catch (error) {
      alert(error.message || "Failed to export report.");
    }
  };

  return (
    <AppLayout
      title="Reports"
      subtitle="Export business-ready summaries, compliance outputs, flagged users, and savings reports from the processed Oracle data."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="Total Users"
            value={data.summary.totalUsers}
            subtitle="Users in processed reporting scope"
          />
          <StatusCard
            title="Compliance Flags"
            value={data.summary.complianceFlags}
            subtitle="Users needing review"
            status="error"
          />
          <StatusCard
            title="Potential Savings"
            value={formatCurrency(data.summary.totalPotentialSavings)}
            subtitle="Estimated optimization opportunity"
            status="warning"
          />
          <StatusCard
            title="Monthly Cost Base"
            value={formatCurrency(data.summary.totalMonthlyCost)}
            subtitle="Assigned subscription spend"
            status="default"
          />
        </div>

        {pageError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {pageError}
          </div>
        ) : null}

        <DataTableShell
          title="Available Reports"
          subtitle="Generate executive summaries and export operational CSV reports for audit, compliance, and savings review."
          rightActions={
            <button
              type="button"
              onClick={() => loadReports({ isRefresh: true })}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-slate-50"
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
            <thead className="border-b border-zinc-200 bg-slate-100">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase text-zinc-500">
                  Report
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase text-zinc-500">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase text-zinc-500">
                  Rows
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase text-zinc-500">
                  Export
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-14 text-center text-sm text-zinc-500"
                  >
                    Loading reports...
                  </td>
                </tr>
              ) : paginatedReportOptions.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-14 text-center text-sm text-zinc-500"
                  >
                    No reports available.
                  </td>
                </tr>
              ) : (
                paginatedReportOptions.map((report) => (
                  <tr
                    key={report.key}
                    className="border-b border-zinc-100 transition hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-slate-50 text-zinc-700">
                          {getReportIcon(report.key)}
                        </div>
                        <div className="flex gap-2">
                          <p className="font-semibold text-zinc-950">
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

                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {report.description}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-center text-zinc-900">
                      {report.rowCount}
                    </td>

                    <td className="px-6 py-4 flex justify-center items-center">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openPreview(report)}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-3 py-1 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-slate-50"
                        >
                          <Eye size={15} />
                          Preview
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExport(report.key)}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-900 bg-slate-900 px-3 py-1 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-950">{row.fullName}</p>
                  <p className="text-sm text-zinc-500">{row.email}</p>
                  <p className="mt-1 text-xs text-zinc-500">{row.reasons}</p>
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-950">{row.fullName}</p>
                  <p className="text-sm text-zinc-500">{row.licenseName}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {row.opportunityType}
                  </p>
                </div>
                <p className="text-sm font-bold text-zinc-900">
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
                  <div className="rounded-xl border border-zinc-200 bg-slate-50 px-4 py-10 text-center text-sm text-zinc-500">
                    Loading report preview...
                  </div>
                ) : previewRows.length === 0 ? (
                  <div className="rounded-xl border border-zinc-200 bg-slate-50 px-4 py-10 text-center text-sm text-zinc-500">
                    No preview rows available.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                    <table className="min-w-full text-left">
                      <thead className="border-b border-zinc-200 bg-slate-50">
                        <tr>
                          {Object.keys(previewRows[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-3 text-xs font-bold uppercase text-zinc-500"
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
                            className="border-b border-zinc-100 last:border-b-0"
                          >
                            {Object.keys(previewRows[0]).map((key) => (
                              <td
                                key={key}
                                className="px-4 py-3 text-sm text-zinc-700"
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
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-900 bg-slate-900 px-2 py-1 text-sm font-semibold text-white transition hover:bg-black"
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
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-zinc-500">{title}</p>
        </div>
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-slate-50 text-zinc-700">
          {icon}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-slate-50 px-4 py-8 text-center text-sm text-zinc-500">
            {emptyText}
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={index}
              className="rounded-xl border border-zinc-200 bg-slate-50 px-4 py-4"
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
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase text-zinc-500">
          {label}
        </span>
        <span className="text-zinc-700">{icon}</span>
      </div>
      <p className="mt-4 text-xl font-bold text-zinc-950">{value}</p>
    </div>
  );
}
