import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Trash2,
  RefreshCw,
  FileText,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import StatusCard from "../components/StatusCard";
import { fileApi } from "../utils/api";

const REPORT_TYPES = [
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

function normalizeQueueItem(item) {
  return {
    id: item.id,
    fileName: item.fileName,
    size: item.fileSizeBytes ? formatFileSize(item.fileSizeBytes) : "-",
    reportType: item.reportType,
    uploadedAt: item.uploadedAt
      ? new Date(item.uploadedAt).toLocaleString()
      : "-",
    status: normalizeStatus(item.status),
    progress:
      normalizeStatus(item.status) === "Completed"
        ? 100
        : normalizeStatus(item.status) === "Processing"
          ? 60
          : 0,
    error: item.error || "",
  };
}

export default function UploadCenter() {
  const inputRef = useRef(null);

  const [selectedReportType, setSelectedReportType] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const stats = useMemo(() => {
    return {
      total: queue.length,
      completed: queue.filter((item) => item.status === "Completed").length,
      processing: queue.filter((item) => item.status === "Processing").length,
      failed: queue.filter((item) => item.status === "Failed").length,
    };
  }, [queue]);

  const loadQueue = async () => {
    setLoading(true);
    setPageError("");

    try {
      const data = await fileApi.list();
      setQueue((data || []).map(normalizeQueueItem));
    } catch (error) {
      setPageError(error.message || "Failed to load upload queue.");
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
    if (!reportType) {
      return "Please select a report category before uploading.";
    }

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
        if (error) {
          throw new Error(`${file.name}: ${error}`);
        }

        await fileApi.upload({
          file,
          reportType: selectedReportType,
        });
      }

      await loadQueue();

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error) {
      setPageError(error.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeItem = async (id) => {
    try {
      setBusyId(id);
      setPageError("");
      await fileApi.remove(id);
      await loadQueue();
    } catch (error) {
      setPageError(error.message || "Failed to remove file.");
    } finally {
      setBusyId(null);
    }
  };

  const retryItem = async (id) => {
    try {
      setBusyId(id);
      setPageError("");
      await fileApi.retry(id);
      await loadQueue();
    } catch (error) {
      setPageError(error.message || "Failed to retry file.");
    } finally {
      setBusyId(null);
    }
  };

  const clearCompleted = () => {
    setQueue((prev) => prev.filter((item) => item.status !== "Completed"));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <AppLayout
      title="Upload Center"
      subtitle="Upload Oracle source reports, validate file format, and monitor import status from one clean workspace."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          title="Total Files"
          value={stats.total}
          subtitle="All uploads"
        />
        <StatusCard
          title="Completed"
          value={stats.completed}
          subtitle="Ready imports"
          status="success"
        />
        <StatusCard
          title="Processing"
          value={stats.processing}
          subtitle="In progress"
          status="processing"
        />
        <StatusCard
          title="Failed"
          value={stats.failed}
          subtitle="Needs attention"
          status="error"
        />
      </div>

      {pageError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-semibold text-black">Upload Files</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Upload CSV or Excel files, assign the correct report category,
                and send them into the import pipeline.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Report Category
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black outline-none focus:border-neutral-400"
              >
                <option value="">Select report type</option>
                {REPORT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={onDrop}
              className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
                dragActive
                  ? "border-black bg-neutral-50"
                  : "border-neutral-300 bg-white"
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 bg-white">
                <Upload size={24} className="text-black" />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-black">
                Drag and drop files here
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                Accepted formats: CSV, XLSX, XLS
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Maximum file size: {MAX_FILE_SIZE_MB} MB
              </p>

              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="mt-5 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Choose Files"}
              </button>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-black">
            Accepted Report Types
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            These are the main Oracle and pricing inputs expected by the system.
          </p>

          <div className="mt-4 space-y-3">
            {REPORT_TYPES.map((type) => (
              <div
                key={type}
                className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3"
              >
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                  <FileSpreadsheet size={18} className="text-black" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-black">{type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-black">Upload Queue</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Review current uploads, processing progress, validation failures,
              and completed imports.
            </p>
          </div>

          <button
            type="button"
            onClick={clearCompleted}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-50"
          >
            Clear Completed
          </button>
        </div>

        {loading ? (
          <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
            Loading upload queue...
          </div>
        ) : queue.length === 0 ? (
          <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
            No files uploaded yet.
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {queue.map((item) => (
              <UploadQueueCard
                key={item.id}
                item={item}
                busy={busyId === item.id}
                onRetry={() => retryItem(item.id)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function UploadQueueCard({ item, onRetry, onRemove, busy }) {
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

            <p className="mt-1 text-sm text-neutral-600">
              {item.reportType || "Report type not selected"}
            </p>

            <div className="mt-3 grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
              <p>
                <span className="font-medium text-black">Size:</span>{" "}
                {item.size}
              </p>
              <p>
                <span className="font-medium text-black">Uploaded:</span>{" "}
                {item.uploadedAt}
              </p>
            </div>

            {item.error ? (
              <p className={`mt-3 text-sm ${tone.message}`}>{item.error}</p>
            ) : (
              <p className={`mt-3 text-sm ${tone.message}`}>
                {getStatusMessage(item.status)}
              </p>
            )}

            <div className="mt-4 max-w-md">
              <div className="h-2.5 overflow-hidden rounded-full bg-white/70">
                <div
                  className={`h-full rounded-full transition-all ${tone.progress}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-neutral-600">
                {item.progress}% complete
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {item.status === "Failed" && (
            <button
              type="button"
              disabled={busy}
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
              Retry
            </button>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      </div>
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
      progress: "bg-green-600",
    };
  }

  if (status === "Failed") {
    return {
      wrapper: "border-red-200 bg-red-50",
      iconBox: "border-red-200 bg-white text-red-700",
      message: "text-red-700",
      progress: "bg-red-600",
    };
  }

  if (status === "Processing" || status === "Queued") {
    return {
      wrapper: "border-yellow-200 bg-yellow-50",
      iconBox: "border-yellow-200 bg-white text-yellow-700",
      message: "text-yellow-700",
      progress: "bg-yellow-500",
    };
  }

  return {
    wrapper: "border-neutral-200 bg-white",
    iconBox: "border-neutral-200 bg-neutral-50 text-black",
    message: "text-neutral-600",
    progress: "bg-black",
  };
}

function getStatusMessage(status) {
  if (status === "Completed") return "Upload completed successfully.";
  if (status === "Failed") return "Upload failed. Please review and retry.";
  if (status === "Processing") return "File is currently being processed.";
  if (status === "Queued") return "File is waiting for processing.";
  return "Upload status unavailable.";
}
