import { useEffect, useMemo, useState } from "react";
import { Search, Eye, RefreshCw, Trash2 } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import StatusCard from "../components/StatusCard";
import TablePagination from "../components/TablePagination";
import DataModal from "../components/DataModal";
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
      setPageError(error.message || "Failed to load import history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImports();
  }, [searchTerm, statusFilter, typeFilter, dateFilter]);

  const totalPages = Math.ceil(imports.length / PAGE_SIZE) || 1;

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return imports.slice(start, start + PAGE_SIZE);
  }, [imports, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const handleReprocess = async (id) => {
    try {
      setActionBusyId(id);
      await importHistoryApi.reprocess(id);
      await loadImports();
    } catch (error) {
      setPageError(error.message || "Failed to reprocess import.");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionBusyId(id);
      await importHistoryApi.remove(id);
      await loadImports();
      if (selectedRow?.id === id) setSelectedRow(null);
    } catch (error) {
      setPageError(error.message || "Failed to delete import.");
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <AppLayout
      title="Imports History"
      subtitle="Review import results with table controls, search, filters, pagination, and row actions."
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
          subtitle="Processed"
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
          subtitle="Needs review"
          status="error"
        />
      </div>

      {pageError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-6">
          <div className="grid gap-4 xl:grid-cols-[1fr_220px_220px_180px]">
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3">
              <Search size={18} className="text-neutral-500" />
              <input
                type="text"
                placeholder="Search file name, code, report type"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Queued">Queued</option>
              <option value="Failed">Failed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
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

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Import Code
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  File Name
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Report Type
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Status
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">Rows</th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Created
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
                    Loading import records...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-neutral-500"
                  >
                    No import records found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="px-6 py-4 font-medium text-black">
                      {item.importCode}
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {item.fileName}
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {item.reportType}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {item.rowsProcessed}
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {formatDateTime(item.createdAt)}
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

                        <button
                          type="button"
                          disabled={actionBusyId === item.id}
                          onClick={() => handleReprocess(item.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium"
                        >
                          <RefreshCw size={14} />
                          Reprocess
                        </button>

                        <button
                          type="button"
                          disabled={actionBusyId === item.id}
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
          totalItems={imports.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      <DataModal
        open={!!selectedRow}
        title="Import Details"
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow && (
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Import Code" value={selectedRow.importCode} />
            <DetailItem label="File Name" value={selectedRow.fileName} />
            <DetailItem label="Report Type" value={selectedRow.reportType} />
            <DetailItem label="Status" value={selectedRow.status} />
            <DetailItem
              label="Created"
              value={formatDateTime(selectedRow.createdAt)}
            />
            <DetailItem label="File Size" value={selectedRow.fileSizeLabel} />
            <DetailItem
              label="Rows Processed"
              value={selectedRow.rowsProcessed}
            />
            <DetailItem label="Imported By" value={selectedRow.importedBy} />
            <div className="md:col-span-2">
              <DetailItem label="Message" value={selectedRow.message} />
            </div>
            <DetailItem
              label="Duplicate"
              value={selectedRow.duplicate ? "Yes" : "No"}
            />
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
