import { useMemo, useRef, useState } from "react";
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

export default function UploadCenter() {
  const inputRef = useRef(null);

  const [selectedReportType, setSelectedReportType] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem("uploadCenterQueue");
    return saved ? JSON.parse(saved) : [];
  });

  const stats = useMemo(() => {
    return {
      total: queue.length,
      completed: queue.filter((item) => item.status === "Completed").length,
      processing: queue.filter((item) => item.status === "Processing").length,
      failed: queue.filter((item) => item.status === "Failed").length,
    };
  }, [queue]);

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

  const buildQueueItem = (file, reportType) => {
    const now = new Date();
    return {
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      fileName: file.name,
      size: formatFileSize(file.size),
      reportType,
      uploadedAt: now.toLocaleString(),
      status: "Queued",
      progress: 0,
      error: "",
    };
  };

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const newItems = files.map((file) => {
      const error = validateFile(file, selectedReportType);
      const item = buildQueueItem(file, selectedReportType);

      if (error) {
        return {
          ...item,
          status: "Failed",
          progress: 0,
          error,
        };
      }

      return item;
    });

    const nextQueue = [...newItems, ...queue];
    persistQueue(nextQueue);

    newItems.forEach((item) => {
      if (item.status !== "Failed") {
        simulateUpload(item.id);
      }
    });
  };

  const simulateUpload = (id) => {
    let progress = 0;

    updateItem(id, {
      status: "Processing",
      progress: 8,
      error: "",
    });

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 10;

      if (progress >= 100) {
        clearInterval(interval);
        updateItem(id, {
          status: "Completed",
          progress: 100,
          error: "",
        });
        return;
      }

      updateItem(id, {
        status: "Processing",
        progress,
      });
    }, 350);
  };

  const persistQueue = (next) => {
    localStorage.setItem("uploadCenterQueue", JSON.stringify(next));
    setQueue(next);
  };

  const updateItem = (id, patch) => {
    setQueue((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      );
      localStorage.setItem("uploadCenterQueue", JSON.stringify(next));
      return next;
    });
  };

  const removeItem = (id) => {
    setQueue((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem("uploadCenterQueue", JSON.stringify(next));
      return next;
    });
  };

  const clearCompleted = () => {
    setQueue((prev) => {
      const next = prev.filter((item) => item.status !== "Completed");
      localStorage.setItem("uploadCenterQueue", JSON.stringify(next));
      return next;
    });
  };

  const retryItem = (id) => {
    const item = queue.find((entry) => entry.id === id);
    if (!item) return;

    if (!selectedReportType) {
      setSelectedReportType(item.reportType);
    }

    updateItem(id, {
      status: "Queued",
      progress: 0,
      error: "",
    });

    setTimeout(() => {
      simulateUpload(id);
    }, 200);
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
                onClick={() => inputRef.current?.click()}
                className="mt-5 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-neutral-50"
              >
                Choose Files
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

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="text-sm font-semibold text-black">Upload Rules</h3>
              <div className="mt-3 space-y-2 text-sm text-neutral-600">
                <p>• Select the correct report category before uploading.</p>
                <p>• Only CSV, XLSX, and XLS files are accepted.</p>
                <p>
                  • Files should use clean column headers whenever possible.
                </p>
                <p>• Upload one report type per file for clean processing.</p>
              </div>
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

        {queue.length === 0 ? (
          <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
            No files uploaded yet.
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {queue.map((item) => (
              <UploadQueueCard
                key={item.id}
                item={item}
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

function UploadQueueCard({ item, onRetry, onRemove }) {
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
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}

          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50"
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

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
