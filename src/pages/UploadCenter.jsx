import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  RotateCcw,
  Trash2,
  Search,
  Eye,
  FileSpreadsheet,
  Inbox,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
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
import { fileApi } from "../utils/api";

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

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const MAX_FILE_SIZE_MB = 15;
const PAGE_SIZE = 10;

const CHART_COLORS = {
  Completed: "#10b981",
  Processing: "#7c3aed",
  Queued: "#a78bfa",
  Failed: "#ef4444",
};

function normalizeStatus(status) {
  const map = {
    PENDING: "Queued",
    PROCESSING: "Processing",
    COMPLETED: "Completed",
    FAILED: "Failed",
    Queued: "Queued",
    Processing: "Processing",
    Completed: "Completed",
    Failed: "Failed",
  };

  return map[String(status || "").trim()] || "Queued";
}

function formatFileSize(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getStatusTone(status) {
  if (status === "Completed") return "success";
  if (status === "Processing" || status === "Queued") return "warning";
  if (status === "Failed") return "error";
  return "neutral";
}

function normalizeQueueItem(item) {
  return {
    id: item.id,
    fileName: item.fileName,
    storedName: item.storedName,
    fileType: item.fileType,
    reportType: item.reportType,
    uploadedAt: item.uploadedAt || null,
    status: normalizeStatus(item.status),
    fileSizeBytes: item.fileSizeBytes || 0,
    sizeLabel: formatFileSize(item.fileSizeBytes || 0),
    uploadedBy: item.uploadedBy || "-",
    error: item.error || "",
    latestImportHistory: item.latestImportHistory || null,
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
      <div className="border-b border-slate-200 bg-indigo-50 px-5 py-4">
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
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function UploadCenter() {
  const inputRef = useRef(null);

  const [selectedReportType, setSelectedReportType] = useState("");
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [reportFilter, setReportFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [selectedRow, setSelectedRow] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, title, description = "") => {
    setToast({ type, title, description });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => {
    return {
      total: queue.length,
      completed: queue.filter((item) => item.status === "Completed").length,
      processing: queue.filter(
        (item) => item.status === "Processing" || item.status === "Queued",
      ).length,
      failed: queue.filter((item) => item.status === "Failed").length,
    };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const q = searchTerm.toLowerCase();

      const matchesSearch =
        !q ||
        item.fileName.toLowerCase().includes(q) ||
        item.reportType.toLowerCase().includes(q) ||
        item.uploadedBy.toLowerCase().includes(q);

      const matchesReport =
        reportFilter === "All" || item.reportType === reportFilter;

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesReport && matchesStatus;
    });
  }, [queue, searchTerm, reportFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQueue.length / PAGE_SIZE));

  const paginatedQueue = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredQueue.slice(start, start + PAGE_SIZE);
  }, [filteredQueue, page]);

  const queueHealthData = useMemo(() => {
    return [
      {
        name: "Completed",
        value: stats.completed,
        fill: CHART_COLORS.Completed,
      },
      {
        name: "In Progress",
        value: stats.processing,
        fill: CHART_COLORS.Processing,
      },
      { name: "Failed", value: stats.failed, fill: CHART_COLORS.Failed },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const reportDistributionData = useMemo(() => {
    const grouped = queue.reduce((acc, item) => {
      const key = item.reportType;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name: name.length > 22 ? `${name.slice(0, 19).trim()}...` : name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [queue]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const loadQueue = async () => {
    setLoading(true);
    setPageError("");

    try {
      const data = await fileApi.list();
      setQueue((data || []).map(normalizeQueueItem));
    } catch (error) {
      const message = error.message || "Failed to load upload queue.";
      setPageError(message);
      showToast("error", "Could not load upload queue", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const getExtension = (name) => {
    const index = name.lastIndexOf(".");
    return index >= 0 ? name.slice(index).toLowerCase() : "";
  };

  const validateFile = (file, reportType) => {
    if (!reportType) return "Please select a report category before uploading.";

    const extension = getExtension(file.name);
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return "Only CSV, XLSX, and XLS files are allowed.";
    }

    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File size must be under ${MAX_FILE_SIZE_MB} MB.`;
    }

    return null;
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setPageError("");
    setUploading(true);

    try {
      for (const file of files) {
        const error = validateFile(file, selectedReportType);
        if (error) throw new Error(`${file.name}: ${error}`);

        await fileApi.upload({
          file,
          reportType: selectedReportType,
        });
      }

      await loadQueue();
      if (inputRef.current) inputRef.current.value = "";
      showToast(
        "success",
        `${files.length} file${files.length > 1 ? "s" : ""} uploaded`,
        "The queue has been refreshed successfully.",
      );
    } catch (error) {
      const message = error.message || "Upload failed.";
      setPageError(message);
      showToast("error", "Upload failed", message);
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = async (id) => {
    try {
      setBusyId(id);
      setPageError("");
      await fileApi.retry(id);
      await loadQueue();
      showToast(
        "success",
        "Retry started",
        "The selected file is being reprocessed.",
      );
    } catch (error) {
      const message = error.message || "Failed to retry file.";
      setPageError(message);
      showToast("error", "Retry failed", message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setBusyId(id);
      setPageError("");
      await fileApi.remove(id);
      await loadQueue();
      if (selectedRow?.id === id) setSelectedRow(null);
      showToast(
        "success",
        "File deleted",
        "The selected file has been removed.",
      );
    } catch (error) {
      const message = error.message || "Failed to remove file.";
      setPageError(message);
      showToast("error", "Delete failed", message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    await handleFiles(e.dataTransfer.files);
  };

  const toolbar = (
    <div className="grid gap-3 2xl:grid-cols-[1.2fr_240px_180px]">
      <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-brand-200 focus-within:ring-2 focus-within:ring-brand-100">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search file name, report type, or uploaded by"
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
          value={reportFilter}
          onChange={(e) => {
            setReportFilter(e.target.value);
            setPage(1);
          }}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
        >
          {REPORT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}
        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
      >
        <option value="All">All Statuses</option>
        <option value="Queued">Queued</option>
        <option value="Processing">Processing</option>
        <option value="Completed">Completed</option>
        <option value="Failed">Failed</option>
      </select>
    </div>
  );

  const footer = (
    <TablePagination
      page={page}
      totalPages={totalPages}
      totalItems={filteredQueue.length}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );

  return (
    <AppLayout
      title="Upload Center"
      subtitle="Premium intake console for Oracle source reports, upload validation, file pipeline status, and operator control."
    >
      <div className="space-y-4">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <section className="rounded-xl border border-slate-200 flex items-end bg-gradient-to-r from-brand-50 via-white to-white px-6 py-4 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase text-brand-700">
              <ShieldCheck size={14} />
              Upload Center
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-indigo-800">
              Manage import-ready files for compliance and optimization analysis
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Upload source files, review ingestion progress, and keep the
              operational queue healthy. Each upload is validated and tracked
              through its processing lifecycle for auditability.
            </p>
          </div>
        </section>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="Total Files"
            value={stats.total}
            subtitle="Files present in the upload queue"
            status="default"
            meta={`${filteredQueue.length} visible`}
          />
          <StatusCard
            title="Completed"
            value={stats.completed}
            subtitle="Successfully processed files"
            status="success"
            meta={`${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% of total`}
          />
          <StatusCard
            title="In Progress"
            value={stats.processing}
            subtitle="Queued or processing files"
            status="processing"
            meta="Requires monitoring"
          />
          <StatusCard
            title="Failed"
            value={stats.failed}
            subtitle="Files requiring attention"
            status="error"
            meta={stats.failed ? "Immediate review" : "No exceptions"}
          />
        </div>

        {pageError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            {pageError}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.95fr]">
          <div className="space-y-2">
            <SectionCard
              title="Upload Files"
              subtitle="Choose the report category first, then upload one or more files."
              icon={<Upload className="h-7 w-7 text-indigo-700" />}
            >
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Report Category
                  </label>
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-200 focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">Select report type</option>
                    {REPORT_TYPES.filter((x) => x !== "All").map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`rounded-[24px] border-2 border-dashed p-6 text-center transition-all ${
                    dragActive
                      ? "border-indigo-300 bg-indigo-50/70"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
                    <Inbox size={28} />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    Drag and drop files here
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Upload CSV or Excel source files used in license, role,
                    activity, and HR-based analysis.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                      .csv
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                      .xlsx
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                      .xls
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                      Max {MAX_FILE_SIZE_MB} MB
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Upload size={16} />
                      {uploading ? "Uploading..." : "Select Files"}
                    </button>

                    <button
                      type="button"
                      onClick={loadQueue}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RotateCcw size={16} />
                      Refresh Queue
                    </button>
                  </div>

                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Supported Types
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      CSV, XLSX, XLS
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Max Size
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {MAX_FILE_SIZE_MB} MB per file
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Validation
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      Category and extension checks
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Queue Health"
              subtitle="Processing distribution across the upload pipeline"
              icon={<PieChartIcon className="h-7 w-7 text-indigo-700" />}
            >
              <div className="grid gap-4 lg:grid-cols-[0.7fr_1.1fr] lg:items-center">
                <div className="h-44">
                  {queueHealthData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={queueHealthData}
                          innerRadius={58}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          stroke="none"
                        >
                          {queueHealthData.map((entry) => (
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
                      No data available
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {queueHealthData.map((item) => {
                    const total = queueHealthData.reduce(
                      (sum, x) => sum + x.value,
                      0,
                    );
                    const share = total
                      ? Math.round((item.value / total) * 100)
                      : 0;

                    return (
                      <div
                        key={item.name}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-1"
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

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{share}% of visible queue</span>
                          <span>
                            {item.name === "Completed"
                              ? "Successfully processed"
                              : item.name === "In Progress"
                                ? "Queued or running"
                                : "Needs intervention"}
                          </span>
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
          </div>
          <div>
            <SectionCard
              title="Report Distribution"
              subtitle="Top report types currently present in the queue"
              icon={<BarChart3 className="h-7 w-7 text-indigo-700" />}
            >
              <div className="space-y-4">
                <div className="h-[260px]">
                  {reportDistributionData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportDistributionData}
                        layout="vertical"
                        margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
                        barSize={16}
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
                      No uploaded data yet
                    </div>
                  )}
                </div>

                {reportDistributionData.length ? (
                  <div className="grid gap-3">
                    {reportDistributionData.map((item, index) => {
                      const total = reportDistributionData.reduce(
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
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {index + 1}. {item.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {share}% of top visible report distribution
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900">
                                {item.value}
                              </p>
                              <p className="text-xs text-slate-500">files</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </div>
        </div>

        <DataTableShell
          title="Upload Queue"
          subtitle="Track incoming files, current processing status, and source metadata."
          toolbar={toolbar}
          footer={footer}
          rightActions={
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1.5 text-xs font-semibold text-brand-700">
              <FileSpreadsheet size={14} />
              {filteredQueue.length} visible of {queue.length} files
            </div>
          }
        >
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50/90">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                  File
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                  Report Type
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                  Size
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                  Uploaded By
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                  Uploaded At
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-14 text-center text-sm text-slate-500"
                  >
                    Loading upload queue...
                  </td>
                </tr>
              ) : paginatedQueue.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-14 text-center text-sm text-slate-500"
                  >
                    No files found.
                  </td>
                </tr>
              ) : (
                paginatedQueue.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                          <FileSpreadsheet
                            size={16}
                            className="text-slate-700"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">
                            {item.fileName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {item.fileType}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-slate-700">
                      {item.reportType}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                      {item.sizeLabel}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {item.uploadedBy}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDateTime(item.uploadedAt)}
                    </td>

                    <td className="px-4 py-4">
                      <StatusPill
                        value={item.status}
                        type={getStatusTone(item.status)}
                        dot
                      />
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

                        {item.status === "Failed" ? (
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => handleRetry(item.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
                            title="Retry"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          disabled={busyId === item.id}
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
          onClose={() => setSelectedRow(null)}
          title="Upload Details"
          subtitle="Source file metadata and upload pipeline status."
          width="max-w-5xl"
        >
          {selectedRow ? (
            <div className="space-y-5">
              <DetailSection title="File Metadata">
                <DetailGrid>
                  <DetailItem
                    label="File Name"
                    value={selectedRow.fileName}
                    emphasis
                  />
                  <DetailItem
                    label="Stored Name"
                    value={selectedRow.storedName}
                  />
                  <DetailItem
                    label="Report Type"
                    value={selectedRow.reportType}
                  />
                  <DetailItem label="File Type" value={selectedRow.fileType} />
                  <DetailItem label="Size" value={selectedRow.sizeLabel} />
                  <DetailItem
                    label="Uploaded By"
                    value={selectedRow.uploadedBy}
                  />
                  <DetailItem
                    label="Uploaded At"
                    value={formatDateTime(selectedRow.uploadedAt)}
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
                    label="Error"
                    value={selectedRow.error || "No error message"}
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
