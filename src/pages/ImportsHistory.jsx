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

const SAMPLE_IMPORTS = [
  {
    id: "IMP-1008",
    fileName: "usage_metrics_march.xlsx",
    reportType: "SaaS Service Usage Metrics Drill Through Report",
    uploadedAt: "2026-04-07T09:45:00",
    status: "Completed",
    fileSize: "2.4 MB",
    rowsProcessed: 2481,
    importedBy: "Admin",
    message: "Import completed successfully.",
    duplicate: false,
  },
  {
    id: "IMP-1007",
    fileName: "role_membership_q1.xlsx",
    reportType: "User Role Membership Report",
    uploadedAt: "2026-04-06T16:10:00",
    status: "Failed",
    fileSize: "1.1 MB",
    rowsProcessed: 0,
    importedBy: "Admin",
    message: "Column mismatch in role identifier field.",
    duplicate: false,
  },
  {
    id: "IMP-1006",
    fileName: "inactive_users_april.csv",
    reportType: "Inactive Users Report",
    uploadedAt: "2026-04-06T12:35:00",
    status: "Completed",
    fileSize: "640 KB",
    rowsProcessed: 412,
    importedBy: "Admin",
    message: "Import completed with 3 unmatched rows.",
    duplicate: false,
  },
  {
    id: "IMP-1005",
    fileName: "last_transaction_april.xlsx",
    reportType: "User Last Transaction Report",
    uploadedAt: "2026-04-05T10:20:00",
    status: "Processing",
    fileSize: "980 KB",
    rowsProcessed: 780,
    importedBy: "Admin",
    message: "Parsing and normalizing records.",
    duplicate: false,
  },
  {
    id: "IMP-1004",
    fileName: "all_roles_master.xlsx",
    reportType: "All Roles Report",
    uploadedAt: "2026-04-04T15:05:00",
    status: "Completed",
    fileSize: "1.8 MB",
    rowsProcessed: 1390,
    importedBy: "Admin",
    message: "Import completed successfully.",
    duplicate: true,
  },
  {
    id: "IMP-1003",
    fileName: "hr_master_april.csv",
    reportType: "HR Master Data",
    uploadedAt: "2026-04-03T11:50:00",
    status: "Queued",
    fileSize: "3.2 MB",
    rowsProcessed: 0,
    importedBy: "Admin",
    message: "Waiting for processing.",
    duplicate: false,
  },
];

export default function ImportsHistory() {
  const [imports, setImports] = useState(() => {
    const saved = localStorage.getItem("importsHistoryData");
    return saved ? JSON.parse(saved) : SAMPLE_IMPORTS;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    localStorage.setItem("importsHistoryData", JSON.stringify(imports));
  }, [imports]);

  useEffect(() => {
    const interval = setInterval(() => {
      setImports((prev) =>
        prev.map((item) => {
          if (item.status === "Processing") {
            const nextRows =
              item.rowsProcessed + Math.floor(Math.random() * 180 + 80);
            const completed = nextRows >= 1500;

            return {
              ...item,
              rowsProcessed: completed ? 1500 : nextRows,
              status: completed ? "Completed" : "Processing",
              message: completed
                ? "Import completed successfully."
                : "Parsing and normalizing records.",
            };
          }

          if (item.status === "Queued") {
            return {
              ...item,
              status: "Processing",
              rowsProcessed: 120,
              message: "Processing started.",
            };
          }

          return item;
        }),
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const filteredImports = useMemo(() => {
    return imports.filter((item) => {
      const matchesSearch =
        item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reportType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesType =
        typeFilter === "All" || item.reportType === typeFilter;

      const matchesDate =
        !dateFilter ||
        new Date(item.uploadedAt).toISOString().slice(0, 10) === dateFilter;

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [imports, searchTerm, statusFilter, typeFilter, dateFilter]);

  const stats = useMemo(() => {
    return {
      total: imports.length,
      completed: imports.filter((item) => item.status === "Completed").length,
      processing: imports.filter((item) => item.status === "Processing").length,
      failed: imports.filter((item) => item.status === "Failed").length,
    };
  }, [imports]);

  const handleDelete = (id) => {
    setImports((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleReprocess = (id) => {
    setImports((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Processing",
              rowsProcessed: 0,
              message: "Reprocessing started.",
            }
          : item,
      ),
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
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
              Search by file name, import ID, or report type. Narrow results by
              status, report category, or upload date.
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-black">
                Import Records
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Review import history in a cleaner card layout.
              </p>
            </div>

            <div className="text-sm text-neutral-500">
              {filteredImports.length} result
              {filteredImports.length !== 1 ? "s" : ""}
            </div>
          </div>

          {filteredImports.length === 0 ? (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
              No import records found.
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {filteredImports.map((item) => (
                <ImportRecordCard
                  key={item.id}
                  item={item}
                  onView={() => setSelectedItem(item)}
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

          {selectedItem ? (
            <div className="mt-5 space-y-4">
              <DetailCard label="File Name" value={selectedItem.fileName} />
              <DetailCard label="Import ID" value={selectedItem.id} />
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
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-50"
                >
                  <RefreshCw size={16} />
                  Reprocess
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedItem.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-50"
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

function ImportRecordCard({ item, onView, onReprocess, onDelete }) {
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
                <span className="font-medium text-black">Import ID:</span>{" "}
                {item.id}
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
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50"
            >
              <RefreshCw size={14} />
              Reprocess
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50"
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
      <p className="mt-2 text-sm text-black">{value}</p>
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
  const date = new Date(dateString);
  return date.toLocaleString();
}
