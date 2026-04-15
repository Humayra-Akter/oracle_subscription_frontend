import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  RotateCcw,
  Trash2,
  Search,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import StatusCard from "../components/StatusCard";
import TablePagination from "../components/TablePagination";
import DataModal from "../components/DataModal";
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

function normalizeQueueItem(item) {
  return {
    id: item.id,
    fileName: item.fileName,
    storedName: item.storedName,
    fileType: item.fileType,
    reportType: item.reportType,
    uploadedAt: item.uploadedAt
      ? new Date(item.uploadedAt).toLocaleString()
      : "-",
    status: normalizeStatus(item.status),
    fileSizeBytes: item.fileSizeBytes || 0,
    sizeLabel: formatFileSize(item.fileSizeBytes || 0),
    uploadedBy: item.uploadedBy || "-",
    error: item.error || "",
    latestImportHistory: item.latestImportHistory || null,
  };
}

function StatusBadge({ status }) {
  const styles = {
    Queued: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Processing: "bg-blue-50 text-blue-700 border-blue-200",
    Completed: "bg-green-50 text-green-700 border-green-200",
    Failed: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] || "bg-neutral-50 text-neutral-700 border-neutral-200"
      }`}
    >
      {status}
    </span>
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
      const matchesSearch =
        !searchTerm ||
        item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reportType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesReport =
        reportFilter === "All" || item.reportType === reportFilter;

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesReport && matchesStatus;
    });
  }, [queue, searchTerm, reportFilter, statusFilter]);

  const totalPages = Math.ceil(filteredQueue.length / PAGE_SIZE) || 1;

  const paginatedQueue = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredQueue.slice(start, start + PAGE_SIZE);
  }, [filteredQueue, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
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

  return (
    <AppLayout
      title="Upload Center"
      subtitle="Upload Oracle source reports, validate formats, and manage the import queue in a structured table view."
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

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="grid gap-4 xl:grid-cols-[1fr_220px_220px_auto]">
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Report Type for Upload
            </label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm"
            >
              <option value="">Select report type</option>
              {REPORT_TYPES.filter((x) => x !== "All").map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-medium text-black">
              Upload File
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFiles(e.target.files)}
                className="block w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              <Upload size={16} />
              {uploading ? "Uploading..." : "Choose Files"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          Accepted formats: CSV, XLSX, XLS. Maximum size: {MAX_FILE_SIZE_MB} MB.
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-6">
          <div className="grid gap-4 xl:grid-cols-[1fr_240px_180px]">
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3">
              <Search size={18} className="text-neutral-500" />
              <input
                type="text"
                placeholder="Search by file name, report type, uploaded by"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <select
              value={reportFilter}
              onChange={(e) => {
                setReportFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm"
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
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Queued">Queued</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-6 py-4 font-medium text-neutral-600">File</th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Report Type
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">Size</th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Uploaded By
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Uploaded At
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Status
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-neutral-500"
                  >
                    Loading upload queue...
                  </td>
                </tr>
              ) : paginatedQueue.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-neutral-500"
                  >
                    No files found.
                  </td>
                </tr>
              ) : (
                paginatedQueue.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                          <FileSpreadsheet size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-black">
                            {item.fileName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {item.fileType}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-neutral-700">
                      {item.reportType}
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {item.sizeLabel}
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {item.uploadedBy}
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {item.uploadedAt}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRow(item)}
                          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium"
                        >
                          <Eye size={14} />
                          View
                        </button>

                        {item.status === "Failed" && (
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => handleRetry(item.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium"
                          >
                            <RotateCcw size={14} />
                            Retry
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredQueue.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      <DataModal
        open={!!selectedRow}
        title="Upload Details"
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow && (
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="File Name" value={selectedRow.fileName} />
            <DetailItem label="Stored Name" value={selectedRow.storedName} />
            <DetailItem label="Report Type" value={selectedRow.reportType} />
            <DetailItem label="File Type" value={selectedRow.fileType} />
            <DetailItem label="Size" value={selectedRow.sizeLabel} />
            <DetailItem label="Uploaded By" value={selectedRow.uploadedBy} />
            <DetailItem label="Uploaded At" value={selectedRow.uploadedAt} />
            <DetailItem label="Status" value={selectedRow.status} />
            <div className="md:col-span-2">
              <DetailItem label="Error" value={selectedRow.error || "-"} />
            </div>
          </div>
        )}
      </DataModal>
    </AppLayout>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm text-black">{value}</p>
    </div>
  );
}
