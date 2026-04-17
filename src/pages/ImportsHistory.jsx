import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  RefreshCw,
  Trash2,
  DatabaseZap,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
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
import { importHistoryApi } from "../utils/api";

const REPORT_TYPES = [
  "All",
  "SaaS Service Usage Metrics Drill Through Report",
  "All Roles Report",
  "User Role Membership Report",
  "Inactive Users Report",
  "User Last Transaction Report",
  "Oracle Subscribed Services Price List",
  "Products and Services Global Price List",
  "HR Master Data",
];

const PAGE_SIZE = 10;

function normalizeStatus(status) {
  const value = String(status || "").trim();
  const map = {
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
  return map[value] || "Queued";
}

function normalizeImportRecord(item) {
  return {
    id: item?.id || "",
    importCode: item?.importCode || "",
    fileName: item?.fileName || "-",
    reportType: item?.reportType || "-",
    createdAt: item?.createdAt || null,
    status: normalizeStatus(item?.status),
    fileSizeLabel: item?.fileSizeLabel || "-",
    rowsProcessed: Number(item?.rowsProcessed || 0),
    importedBy: item?.importedBy || "-",
    message: item?.message || "-",
    duplicate: Boolean(item?.duplicate),
  };
}

function formatDateTime(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatShortDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getStatusTone(status) {
  if (status === "Completed") return "success";
  if (status === "Processing" || status === "Queued") return "warning";
  if (status === "Failed") return "error";
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

export default function ImportsHistory() {
  const [imports, setImports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
    queued: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selectedRow, setSelectedRow] = useState(null);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionBusyId, setActionBusyId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, title, description = "") => {
    setToast({ type, title, description });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadImports = async () => {
    setLoading(true);
    setPageError("");

    try {
      const result = await importHistoryApi.list({
        search: searchTerm,
        status: statusFilter,
        reportType: typeFilter,
        date: dateFilter,
      });

      setImports((result.items || []).map(normalizeImportRecord));
      setStats({
        total: 0,
        completed: 0,
        processing: 0,
        failed: 0,
        queued: 0,
        ...(result.stats || {}),
      });
    } catch (error) {
      const message = error.message || "Failed to load import history.";
      setPageError(message);
      showToast("error", "Could not load import history", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImports();
  }, [searchTerm, statusFilter, typeFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(imports.length / PAGE_SIZE));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return imports.slice(start, start + PAGE_SIZE);
  }, [imports, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const duplicateCount = useMemo(
    () => imports.filter((item) => item.duplicate).length,
    [imports],
  );

  const totalRowsProcessed = useMemo(
    () =>
      imports.reduce((sum, item) => sum + Number(item.rowsProcessed || 0), 0),
    [imports],
  );

  const timelineData = useMemo(() => {
    const grouped = imports.reduce((acc, item) => {
      const key = formatShortDate(item.createdAt);
      if (!acc[key]) {
        acc[key] = {
          date: key,
          imports: 0,
        };
      }
      acc[key].imports += 1;
      return acc;
    }, {});

    return Object.values(grouped).slice(-7);
  }, [imports]);

  const reportRanking = useMemo(() => {
    const grouped = imports.reduce((acc, item) => {
      acc[item.reportType] = (acc[item.reportType] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [imports]);

 const statusSummary = useMemo(() => {
   const total =
     stats.completed + stats.processing + stats.queued + stats.failed || 1;

   return [
     {
       label: "Completed",
       value: stats.completed,
       percent: Math.round((stats.completed / total) * 100),
       bar: "bg-emerald-500",
       dot: "bg-emerald-500",
       text: "text-emerald-700",
       bg: "bg-emerald-50",
       border: "border-emerald-200",
     },
     {
       label: "Processing",
       value: stats.processing,
       percent: Math.round((stats.processing / total) * 100),
       bar: "bg-amber-500",
       dot: "bg-amber-500",
       text: "text-amber-700",
       bg: "bg-amber-50",
       border: "border-amber-200",
     },
     {
       label: "Queued",
       value: stats.queued,
       percent: Math.round((stats.queued / total) * 100),
       bar: "bg-amber-400",
       dot: "bg-amber-400",
       text: "text-amber-700",
       bg: "bg-amber-50",
       border: "border-amber-200",
     },
     {
       label: "Failed",
       value: stats.failed,
       percent: Math.round((stats.failed / total) * 100),
       bar: "bg-red-500",
       dot: "bg-red-500",
       text: "text-red-700",
       bg: "bg-red-50",
       border: "border-red-200",
     },
   ];
 }, [stats]);

  const handleReprocess = async (id) => {
    try {
      setActionBusyId(id);
      setPageError("");
      await importHistoryApi.reprocess(id);
      await loadImports();
      showToast(
        "success",
        "Reprocess started",
        "The selected import is being reprocessed.",
      );
    } catch (error) {
      const message = error.message || "Failed to reprocess import.";
      setPageError(message);
      showToast("error", "Reprocess failed", message);
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionBusyId(id);
      setPageError("");
      await importHistoryApi.remove(id);
      await loadImports();
      if (selectedRow?.id === id) setSelectedRow(null);
      showToast(
        "success",
        "Import deleted",
        "The selected import record has been removed.",
      );
    } catch (error) {
      const message = error.message || "Failed to delete import.";
      setPageError(message);
      showToast("error", "Delete failed", message);
    } finally {
      setActionBusyId(null);
    }
  };

  const toolbar = (
    <div className="grid gap-3 2xl:grid-cols-[1.2fr_220px_220px_180px]">
      <div className="flex h-9 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-brand-200 focus-within:ring-2 focus-within:ring-brand-100">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search file, import code, report type"
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
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
        >
          <option value="All">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Processing">Processing</option>
          <option value="Queued">Queued</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      <select
        value={typeFilter}
        onChange={(e) => {
          setTypeFilter(e.target.value);
          setPage(1);
        }}
        className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
      >
        {REPORT_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={dateFilter}
        onChange={(e) => {
          setDateFilter(e.target.value);
          setPage(1);
        }}
        className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );

  const footer = (
    <TablePagination
      page={page}
      totalPages={totalPages}
      totalItems={imports.length}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );

  return (
    <AppLayout
      title="Imports History"
      subtitle="Premium review surface for import results, processing health, duplicate detection, and operator actions."
    >
      <div className="space-y-4">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <section className="rounded-xl border border-slate-200 flex items-end bg-gradient-to-r from-brand-50 via-white to-white px-6 py-4 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase text-brand-700">
              <ShieldCheck size={14} />
              Imports History
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-indigo-800">
              Review import outcomes, processing health, and operator actions
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Monitor processed imports, detect duplicates, review failures, and
              keep the import pipeline consistent for audit and operational
              analysis.
            </p>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="Total Imports"
            value={stats.total}
            subtitle="All records in the register"
            status="default"
            meta={`${imports.length} visible`}
          />
          <StatusCard
            title="Completed"
            value={stats.completed}
            subtitle="Processed successfully"
            status="success"
            meta={`${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% of total`}
          />
          <StatusCard
            title="Processing"
            value={stats.processing + stats.queued}
            subtitle="Queued or active processing"
            status="processing"
            meta="Requires monitoring"
          />
          <StatusCard
            title="Failed"
            value={stats.failed}
            subtitle="Requires operator review"
            status="error"
            meta={stats.failed ? "Immediate review" : "No exceptions"}
          />
        </div>

        {pageError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {pageError}
          </div>
        ) : null}

        <div className="grid gap-2 grid-cols-[1fr_0.6fr_0.6fr]">
          <SectionCard
            title="Import Activity Timeline"
            subtitle="Recent import volume across visible records"
            icon={<Activity className="h-7 w-7 text-indigo-700" />}
          >
            <div className="space-y-2">
              <div className="h-[240px]">
                {timelineData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={timelineData}
                      margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="importsAreaFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#7c3aed"
                            stopOpacity={0.22}
                          />
                          <stop
                            offset="95%"
                            stopColor="#7c3aed"
                            stopOpacity={0.03}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        vertical={false}
                      />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis allowDecimals={false} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#fff",
                          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="imports"
                        stroke="#7c3aed"
                        strokeWidth={3}
                        fill="url(#importsAreaFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    No timeline data available
                  </div>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-[.9fr_0.8fr_1fr]">
                <div className="rounded-xl border border-slate-200 bg-indigo-50/80 px-4 py-2 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                    Total Rows
                  </p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-indigo-800">
                    {totalRowsProcessed}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Rows processed across visible imports
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-rose-50/80 px-4 py-2 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                    Duplicate Imports
                  </p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-rose-800">
                    {duplicateCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Records marked as duplicate
                  </p>
                </div>

                <div
                  className={`rounded-xl border px-4 py-2 shadow-sm ${
                    stats.failed === 0
                      ? "border-emerald-200 bg-emerald-50/80"
                      : "border-amber-200 bg-amber-50/80"
                  }`}
                >
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-wide ${
                      stats.failed === 0 ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    Queue Health
                  </p>

                  <p
                    className={`mt-2 text-xl font-bold tracking-tight ${
                      stats.failed === 0 ? "text-emerald-800" : "text-amber-800"
                    }`}
                  >
                    {stats.failed === 0 ? "Healthy" : "Review Needed"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Based on current failure count
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Status Breakdown"
            subtitle="Progress view of import outcomes"
            icon={<PieChartIcon className="h-7 w-7 text-indigo-700" />}
          >
            <div className="space-y-2">
              {statusSummary.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border px-4 py-2 ${item.bg} ${item.border}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${item.dot}`}
                      />
                      <span className={`text-sm font-semibold ${item.text}`}>
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {item.value}
                    </span>
                  </div>

                  <div className="h-1 overflow-hidden rounded-full bg-white/80">
                    <div
                      className={`h-full rounded-full ${item.bar}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    {item.percent}% of visible imports
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Top Report Types"
            subtitle="Most frequent report categories"
            icon={<BarChart3 className="h-7 w-7 text-indigo-700" />}
          >
            <div className="space-y-3">
              {reportRanking.length ? (
                reportRanking.map((item, index) => {
                  const topValue = reportRanking[0]?.value || 1;
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
                          <p className="text-xs text-slate-500">imports</p>
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
                  No import data yet
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <DataTableShell
          title="Import Register"
          subtitle="Structured processing table with status visibility, reprocess actions, and clean audit review."
          toolbar={toolbar}
          footer={footer}
          rightActions={
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1.5 text-xs font-semibold text-brand-700">
              <DatabaseZap size={14} />
              {imports.length} visible imports
            </div>
          }
        >
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50/90">
              <tr>
                <th className="px-4 py-4 text-xs font-bold uppercase text-slate-500">
                  Import
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase text-slate-500">
                  Report Type
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase text-slate-500">
                  Status
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase text-slate-500">
                  Rows
                </th>
                <th className="px-3 py-4 text-xs font-bold uppercase text-slate-500">
                  Created
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-14 text-center text-sm text-slate-500"
                  >
                    Loading import records...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-14 text-center text-sm text-slate-500"
                  >
                    No import records found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                          <DatabaseZap size={16} className="text-slate-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">
                            {item.importCode}
                          </p>
                          <p className="text-sm text-slate-500">
                            {item.fileName}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-slate-700">
                      {item.reportType}
                    </td>

                    <td className="px-4 py-4">
                      <StatusPill
                        value={item.status}
                        type={getStatusTone(item.status)}
                        dot
                      />
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                      {item.rowsProcessed}
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      {formatDateTime(item.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRow(item)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-brand-50 hover:text-brand-700"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          disabled={actionBusyId === item.id}
                          onClick={() => handleReprocess(item.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
                          title="Reprocess"
                        >
                          <RefreshCw size={15} />
                        </button>

                        <button
                          type="button"
                          disabled={actionBusyId === item.id}
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableShell>

        <DetailModal
          open={!!selectedRow}
          title="Import Details"
          subtitle="Detailed metadata and processing result for the selected import."
          onClose={() => setSelectedRow(null)}
          width="max-w-5xl"
        >
          {selectedRow ? (
            <div className="space-y-5">
              <DetailSection title="Import Summary">
                <DetailGrid>
                  <DetailItem
                    label="Import Code"
                    value={selectedRow.importCode}
                    emphasis
                  />
                  <DetailItem label="File Name" value={selectedRow.fileName} />
                  <DetailItem
                    label="Report Type"
                    value={selectedRow.reportType}
                  />
                  <DetailItem
                    label="Status"
                    value={
                      <StatusPill
                        value={selectedRow.status}
                        type={getStatusTone(selectedRow.status)}
                      />
                    }
                  />
                  <DetailItem
                    label="Created"
                    value={formatDateTime(selectedRow.createdAt)}
                  />
                  <DetailItem
                    label="Imported By"
                    value={selectedRow.importedBy}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection title="Processing Metrics">
                <DetailGrid>
                  <DetailItem
                    label="Rows Processed"
                    value={selectedRow.rowsProcessed}
                  />
                  <DetailItem
                    label="File Size"
                    value={selectedRow.fileSizeLabel}
                  />
                  <DetailItem
                    label="Duplicate"
                    value={
                      <StatusPill
                        value={selectedRow.duplicate ? "Yes" : "No"}
                        type={selectedRow.duplicate ? "warning" : "neutral"}
                      />
                    }
                  />
                  <DetailItem
                    label="Message"
                    value={selectedRow.message}
                    fullWidth
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
