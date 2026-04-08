import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock3,
  XCircle,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import StatusCard from "../components/StatusCard";
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

const STATUS_OPTIONS = ["All", "Completed", "Processing", "Queued", "Failed"];

const EMPTY_STATS = {
  total: 0,
  completed: 0,
  processing: 0,
  failed: 0,
};

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

  return map[value] || value || "Queued";
}

function normalizeImportRecord(item) {
  return {
    id: item?.id || "",
    importCode: item?.importCode || item?.id || "",
    fileName: item?.fileName || "-",
    reportType: item?.reportType || "-",
    uploadedAt: item?.uploadedAt || null,
    status: normalizeStatus(item?.status),
    fileSize: item?.fileSize || "-",
    rowsProcessed: Number(item?.rowsProcessed || 0),
    importedBy: item?.importedBy || "-",
    message: item?.message || "No message available.",
    duplicate: Boolean(item?.duplicate),
  };
}

export default function ImportsHistory() {
  const [imports, setImports] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const [selectedImportId, setSelectedImportId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");

  const [refreshIndex, setRefreshIndex] = useState(0);
  const [reprocessId, setReprocessId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();

    const loadImports = async () => {
      setLoading(true);
      setPageError("");

      try {
        const result = await importHistoryApi.list(
          {
            search: debouncedSearchTerm,
            status: statusFilter,
            reportType: typeFilter,
            date: dateFilter,
          },
          controller.signal,
        );

        const normalizedItems = (result.items || []).map(normalizeImportRecord);
        setImports(normalizedItems);
        setStats({ ...EMPTY_STATS, ...(result.stats || {}) });

        if (selectedImportId) {
          const stillExists = normalizedItems.some(
            (item) => item.id === selectedImportId,
          );

          if (!stillExists) {
            setSelectedImportId(null);
            setSelectedItem(null);
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setPageError(error.message || "Failed to load import history.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadImports();

    return () => controller.abort();
  }, [
    debouncedSearchTerm,
    statusFilter,
    typeFilter,
    dateFilter,
    refreshIndex,
    selectedImportId,
  ]);

  useEffect(() => {
    if (!selectedImportId) return;

    const controller = new AbortController();

    const loadDetails = async () => {
      setDetailsLoading(true);
      setActionError("");

      try {
        const data = await importHistoryApi.getById(
          selectedImportId,
          controller.signal,
        );
        setSelectedItem(normalizeImportRecord(data));
      } catch (error) {
        if (error.name !== "AbortError") {
          setActionError(error.message || "Failed to load import details.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setDetailsLoading(false);
        }
      }
    };

    loadDetails();

    return () => controller.abort();
  }, [selectedImportId, refreshIndex]);

  const visibleCount = useMemo(() => imports.length, [imports]);

  const handleView = (item) => {
    setSelectedImportId(item.id);
    setSelectedItem(normalizeImportRecord(item));
  };

  const handleDelete = async (id) => {
    try {
      setDeleteId(id);
      setActionError("");

      await importHistoryApi.remove(id);

      if (selectedImportId === id) {
        setSelectedImportId(null);
        setSelectedItem(null);
      }

      setRefreshIndex((prev) => prev + 1);
    } catch (error) {
      setActionError(error.message || "Failed to delete import.");
    } finally {
      setDeleteId(null);
    }
  };

  const handleReprocess = async (id) => {
    try {
      setReprocessId(id);
      setActionError("");

      await importHistoryApi.reprocess(id);
      setRefreshIndex((prev) => prev + 1);

      if (selectedImportId === id) {
        const updated = await importHistoryApi.getById(id);
        setSelectedItem(normalizeImportRecord(updated));
      }
    } catch (error) {
      setActionError(error.message || "Failed to reprocess import.");
    } finally {
      setReprocessId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setStatusFilter("All");
    setTypeFilter("All");
    setDateFilter("");
  };

  return (
    <AppLayout
      title="Imports History"
      subtitle="Review uploaded Oracle report files, filter processing results, reprocess failed imports, and manage import records."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          title="Total Imports"
          value={stats.total}
          subtitle="All records"
        />
        <StatusCard
          title="Completed"
          value={stats.completed}
          subtitle="Processed successfully"
          status="success"
        />
        <StatusCard
          title="Processing"
          value={stats.processing}
          subtitle="Currently running"
          status="processing"
        />
        <StatusCard
          title="Failed"
          value={stats.failed}
          subtitle="Needs review"
          status="error"
        />
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-black">Filter Imports</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Search by file name, import code, or report type. Narrow results
              by status, report category, or upload date.
            </p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-50"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Search
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
              <Search size={18} className="text-neutral-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search imports"
                className="w-full bg-transparent text-sm text-black outline-none placeholder:text-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Status
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
              <Filter size={18} className="text-neutral-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-transparent text-sm text-black outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Report Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black outline-none"
            >
              {REPORT_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Upload Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black outline-none"
            />
          </div>
        </div>
      </div>

      {(pageError || actionError) && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError || actionError}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-black">
                Import Records
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Live data from the backend, aligned with the ImportHistory
                schema.
              </p>
            </div>

            <div className="text-sm text-neutral-500">
              {visibleCount} result{visibleCount !== 1 ? "s" : ""}
            </div>
          </div>

          {loading ? (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
              Loading import records...
            </div>
          ) : imports.length === 0 ? (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
              No import records found.
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {imports.map((item) => (
                <ImportRecordCard
                  key={item.id}
                  item={item}
                  isReprocessing={reprocessId === item.id}
                  isDeleting={deleteId === item.id}
                  onView={() => handleView(item)}
                  onReprocess={() => handleReprocess(item.id)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-black">
            Processing Result
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Select an import card to view full metadata and result details.
          </p>

          {detailsLoading ? (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
              Loading import details...
            </div>
          ) : selectedItem ? (
            <div className="mt-5 space-y-4">
              <DetailCard label="File Name" value={selectedItem.fileName} />
              <DetailCard label="Import Code" value={selectedItem.importCode} />
              <DetailCard label="Database ID" value={selectedItem.id} />
              <DetailCard label="Report Type" value={selectedItem.reportType} />
              <DetailCard
                label="Upload Time"
                value={formatDateTime(selectedItem.uploadedAt)}
              />
              <DetailCard label="Status" value={selectedItem.status} />
              <DetailCard label="File Size" value={selectedItem.fileSize} />
              <DetailCard
                label="Rows Processed"
                value={selectedItem.rowsProcessed.toLocaleString()}
              />
              <DetailCard label="Imported By" value={selectedItem.importedBy} />
              <DetailCard label="Message" value={selectedItem.message} />
              <DetailCard
                label="Duplicate Check"
                value={
                  selectedItem.duplicate
                    ? "Duplicate detected"
                    : "No duplicate detected"
                }
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleReprocess(selectedItem.id)}
                  disabled={reprocessId === selectedItem.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={
                      reprocessId === selectedItem.id ? "animate-spin" : ""
                    }
                  />
                  Reprocess
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedItem.id)}
                  disabled={deleteId === selectedItem.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
              No import selected yet.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ImportRecordCard({
  item,
  onView,
  onReprocess,
  onDelete,
  isReprocessing,
  isDeleting,
}) {
  const tone = getStatusTone(item.status);

  return (
    <div className={`rounded-xl border p-5 ${tone.wrapper}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${tone.iconBox}`}
          >
            <FileText size={20} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-black">
                {item.fileName}
              </h3>
              <StatusBadge status={item.status} />
            </div>

            <p className="mt-1 text-sm text-neutral-600">{item.reportType}</p>

            <div className="mt-3 grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
              <p>
                <span className="font-medium text-black">Import Code:</span>{" "}
                {item.importCode}
              </p>
              <p>
                <span className="font-medium text-black">Uploaded:</span>{" "}
                {formatDateTime(item.uploadedAt)}
              </p>
              <p>
                <span className="font-medium text-black">File Size:</span>{" "}
                {item.fileSize}
              </p>
              <p>
                <span className="font-medium text-black">Rows:</span>{" "}
                {item.rowsProcessed.toLocaleString()}
              </p>
            </div>

            <p className={`mt-3 text-sm ${tone.message}`}>{item.message}</p>

            {item.duplicate && (
              <p className="mt-2 text-sm text-neutral-600">
                Duplicate month detected
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50"
          >
            <Eye size={14} />
            View
          </button>

          {(item.status === "Failed" || item.status === "Completed") && (
            <button
              type="button"
              onClick={onReprocess}
              disabled={isReprocessing}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={isReprocessing ? "animate-spin" : ""}
              />
              Reprocess
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm text-black">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    Queued: {
      icon: <Clock3 size={14} />,
      text: "Queued",
      className: "border-yellow-200 bg-yellow-50 text-yellow-700",
    },
    Processing: {
      icon: <RefreshCw size={14} className="animate-spin" />,
      text: "Processing",
      className: "border-yellow-200 bg-yellow-50 text-yellow-700",
    },
    Completed: {
      icon: <CheckCircle2 size={14} />,
      text: "Completed",
      className: "border-green-200 bg-green-50 text-green-700",
    },
    Failed: {
      icon: <AlertCircle size={14} />,
      text: "Failed",
      className: "border-red-200 bg-red-50 text-red-700",
    },
    Deleted: {
      icon: <XCircle size={14} />,
      text: "Deleted",
      className: "border-neutral-200 bg-neutral-50 text-neutral-700",
    },
  };

  const current = config[status] || config.Queued;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${current.className}`}
    >
      {current.icon}
      {current.text}
    </span>
  );
}

function getStatusTone(status) {
  if (status === "Completed") {
    return {
      wrapper: "border-green-200 bg-green-50",
      iconBox: "border-green-200 bg-white text-green-700",
      message: "text-green-700",
    };
  }

  if (status === "Failed") {
    return {
      wrapper: "border-red-200 bg-red-50",
      iconBox: "border-red-200 bg-white text-red-700",
      message: "text-red-700",
    };
  }

  if (status === "Processing" || status === "Queued") {
    return {
      wrapper: "border-yellow-200 bg-yellow-50",
      iconBox: "border-yellow-200 bg-white text-yellow-700",
      message: "text-yellow-700",
    };
  }

  return {
    wrapper: "border-neutral-200 bg-white",
    iconBox: "border-neutral-200 bg-neutral-50 text-black",
    message: "text-neutral-600",
  };
}

function formatDateTime(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
}
