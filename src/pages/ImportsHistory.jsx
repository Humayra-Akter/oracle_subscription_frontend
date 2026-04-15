import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  DatabaseZap,
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

function getStatusTone(status) {
  if (status === "Completed") return "success";
  if (status === "Processing" || status === "Queued") return "warning";
  if (status === "Failed") return "error";
  return "neutral";
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

  const totalPages = Math.max(1, Math.ceil(imports.length / PAGE_SIZE));

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

  const toolbar = (
    <div className="grid gap-3 2xl:grid-cols-[1.2fr_220px_220px_180px]">
      <div className="flex h-12 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 shadow-sm">
        <Search size={18} className="text-zinc-400" />
        <input
          type="text"
          placeholder="Search file, import code, report type"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}
        className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 shadow-sm outline-none"
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
        className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 shadow-sm outline-none"
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
        className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 shadow-sm outline-none"
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
          subtitle="Running jobs"
          status="processing"
        />
        <StatusCard
          title="Failed"
          value={stats.failed}
          subtitle="Requires operator review"
          status="error"
        />
      </div>

      {pageError ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
          {pageError}
        </div>
      ) : null}

      <div className="mt-6">
        <DataTableShell
          title="Import Register"
          subtitle="Structured processing table with status visibility, reprocess actions, and clean audit review."
          toolbar={toolbar}
          footer={footer}
        >
          <table className="min-w-full text-left">
            <thead className="border-b border-zinc-200 bg-zinc-100">
              <tr>
                <th className="px-4 py-4 text-xs font-bold uppercase text-center text-zinc-500">
                  Import
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase text-center text-zinc-500">
                  Report Type
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase text-center text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase text-center text-zinc-500">
                  Rows
                </th>
                <th className="px-3 py-4 text-xs font-bold uppercase text-center text-zinc-500">
                  Created
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase text-center text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-14 text-center text-sm text-zinc-500"
                  >
                    Loading import records...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-14 text-center text-sm text-zinc-500"
                  >
                    No import records found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-100 transition hover:bg-zinc-50/80"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm">
                          <DatabaseZap size={15} className="text-zinc-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-950">
                            {item.importCode}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {item.fileName}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-zinc-700">
                      {item.reportType}
                    </td>

                    <td className="px-4 py-4">
                      <StatusPill
                        value={item.status}
                        type={getStatusTone(item.status)}
                        dot
                      />
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-zinc-800">
                      {item.rowsProcessed}
                    </td>

                    <td className="px-3 py-4 text-sm text-zinc-600">
                      {formatDateTime(item.createdAt)}
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

                        <button
                          type="button"
                          disabled={actionBusyId === item.id}
                          onClick={() => handleReprocess(item.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-1 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
                        >
                          <RefreshCw size={15} />
                          Reprocess
                        </button>

                        <button
                          type="button"
                          disabled={actionBusyId === item.id}
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
    </AppLayout>
  );
}
