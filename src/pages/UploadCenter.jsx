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

  const stats = useMemo(() => {
    return {
      total: queue.length,
      completed: queue.filter((item) => item.status === "Completed").length,
      processing: queue.filter((item) => item.status === "Processing").length,
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
    } catch (error) {
      setPageError(error.message || "Upload failed.");
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
    } catch (error) {
      setPageError(error.message || "Failed to retry file.");
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
    } catch (error) {
      setPageError(error.message || "Failed to remove file.");
    } finally {
      setBusyId(null);
    }
  };

  const toolbar = (
    <div className="grid gap-3 2xl:grid-cols-[1.2fr_240px_180px]">
      <div className="flex h-12 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 shadow-sm">
        <Search size={18} className="text-zinc-400" />
        <input
          type="text"
          placeholder="Search file, report type, uploaded by"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
        />
      </div>

      <select
        value={reportFilter}
        onChange={(e) => {
          setReportFilter(e.target.value);
          setPage(1);
        }}
        className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 shadow-sm outline-none"
      >
        {REPORT_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}
        className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 shadow-sm outline-none"
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
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          title="Total Files"
          value={stats.total}
          subtitle="All uploads"
        />
        <StatusCard
          title="Completed"
          value={stats.completed}
          subtitle="Ready for downstream processing"
          status="success"
        />
        <StatusCard
          title="Processing"
          value={stats.processing}
          subtitle="Pipeline in progress"
          status="processing"
        />
        <StatusCard
          title="Failed"
          value={stats.failed}
          subtitle="Operator attention required"
          status="error"
        />
      </div>

      {pageError ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {pageError}
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-md">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <div className="rounded-xl border border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] p-5 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-md">
                <Inbox size={18} className="text-zinc-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-950">
                  Upload Intake
                </h3>
                <p className="text-sm text-zinc-500">
                  Controlled intake for structured enterprise source files
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-800">
                  Report Type
                </label>
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 shadow-sm outline-none"
                >
                  <option value="">Select report type</option>
                  {REPORT_TYPES.filter((x) => x !== "All").map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-800">
                  File Source
                </label>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="block h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 shadow-sm file:mr-4 file:border-0 file:bg-transparent file:font-semibold"
                />
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-black disabled:opacity-60"
              >
                <Upload size={16} />
                {uploading ? "Uploading..." : "Choose Files"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-950 p-5 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <ShieldCheck size={18} className="text-zinc-200" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Validation Rules</h3>
                <p className="text-sm text-zinc-400">
                  Premium upload gatekeeping for cleaner downstream operations
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Accepted Formats
                </div>
                <p className="mt-2 text-sm font-semibold text-white">
                  CSV, XLSX, XLS
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Max Size
                </div>
                <p className="mt-2 text-sm font-semibold text-white">
                  {MAX_FILE_SIZE_MB} MB
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 sm:col-span-2">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Best Practice
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Select the correct report type before upload so pipeline
                  mapping, validation, and queue operations remain consistent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <DataTableShell
          title="Upload Queue"
          subtitle="Operational table for uploaded files, processing state, and file-level actions."
          toolbar={toolbar}
          footer={footer}
        >
          <table className="min-w-full text-left">
            <thead className="border-b border-zinc-200 bg-zinc-50/90">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase text-zinc-500 text-center">
                  File
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-zinc-500 text-center">
                  Report Type
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-zinc-500 text-center">
                  Size
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-zinc-500 text-center">
                  Uploaded By
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-zinc-500 text-center">
                  Uploaded At
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-zinc-500 text-center">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-zinc-500 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-14 text-center text-sm text-zinc-500"
                  >
                    Loading upload queue...
                  </td>
                </tr>
              ) : paginatedQueue.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-14 text-center text-sm text-zinc-500"
                  >
                    No files found.
                  </td>
                </tr>
              ) : (
                paginatedQueue.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-100 transition hover:bg-zinc-50/80"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm">
                          <FileSpreadsheet
                            size={15}
                            className="text-zinc-700"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-950">
                            {item.fileName}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {item.fileType}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-zinc-700">
                      {item.reportType}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-zinc-800">
                      {item.sizeLabel}
                    </td>

                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {item.uploadedBy}
                    </td>

                    <td className="px-4 py-4 text-sm text-zinc-600">
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRow(item)}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-1 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                        >
                          <Eye size={15} />
                          View
                        </button>

                        {item.status === "Failed" ? (
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => handleRetry(item.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-1 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
                          >
                            <RotateCcw size={15} />
                            Retry
                          </button>
                        ) : null}

                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-2 py-1 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableShell>
      </div>

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
    </AppLayout>
  );
}
