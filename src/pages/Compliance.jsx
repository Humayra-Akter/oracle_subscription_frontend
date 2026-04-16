import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  ShieldAlert,
  UserRound,
  BriefcaseBusiness,
  RefreshCw,
  Download,
  ChevronDown,
  Shield,
  Activity,
  AlertTriangle,
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
import { complianceApi } from "../utils/api";

const PAGE_SIZE = 10;

const EMPTY_STATS = {
  totalFlags: 0,
  criticalFlags: 0,
  highFlags: 0,
  inactivePrivilegedUsers: 0,
  terminatedActiveAccounts: 0,
  orphanAssignments: 0,
  topRiskDepartment: "-",
  topFlaggedRole: "-",
  mostCommonException: "-",
};

function normalizeCompliance(item) {
  return {
    id: item?.id ?? "",
    membershipId: item?.membershipId ?? "",
    userId: item?.userId ?? "",
    roleId: item?.roleId ?? "",
    fullName: item?.fullName ?? "-",
    email: item?.email ?? "-",
    employeeId: item?.employeeId ?? "-",
    department: item?.department ?? "-",
    jobTitle: item?.jobTitle ?? "-",
    employmentStatus: item?.employmentStatus ?? "-",
    lastActivityAt: item?.lastActivityAt ?? null,
    inactiveDays:
      item?.inactiveDays === null || item?.inactiveDays === undefined
        ? null
        : Number(item?.inactiveDays),
    transactionCount: Number(item?.transactionCount ?? 0),
    utilizationStatus: item?.utilizationStatus ?? "UNKNOWN",
    licenseName: item?.licenseName ?? "-",
    monthlyCost: Number(item?.monthlyCost ?? 0),
    roleName: item?.roleName ?? "-",
    roleCode: item?.roleCode ?? "-",
    roleRiskLevel: item?.roleRiskLevel ?? "LOW",
    isPrivileged: Boolean(item?.isPrivileged),
    isAdminRole: Boolean(item?.isAdminRole),
    assignedAt: item?.assignedAt ?? null,
    source: item?.source ?? "-",
    exceptionType: item?.exceptionType ?? "-",
    severity: item?.severity ?? "Low",
    reason: item?.reason ?? "-",
  };
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getSeverityTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical") return "error";
  if (v === "high") return "warning";
  if (v === "medium") return "info";
  return "neutral";
}

function getEmploymentTone(value) {
  const v = String(value || "").toUpperCase();
  if (v === "TERMINATED") return "error";
  if (v === "INACTIVE") return "warning";
  return "success";
}

function getRiskTone(value) {
  const v = String(value || "").toUpperCase();
  if (v === "CRITICAL") return "error";
  if (v === "HIGH") return "warning";
  if (v === "MEDIUM") return "info";
  return "neutral";
}

export default function Compliance() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);

  const [searchTerm, setSearchTerm] = useState("");
  const [severity, setSeverity] = useState("All");
  const [exceptionType, setExceptionType] = useState("All");
  const [sortBy, setSortBy] = useState("severity_desc");
  const [privilegedOnly, setPrivilegedOnly] = useState(false);
  const [adminOnly, setAdminOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");

  const loadCompliance = async ({ isRefresh = false } = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setPageError("");

    try {
      const data = await complianceApi.list({
        search: searchTerm,
        severity,
        exceptionType,
        sortBy,
        privilegedOnly,
        adminOnly,
      });

      setRecords((data.items || []).map(normalizeCompliance));
      setStats({ ...EMPTY_STATS, ...(data.stats || {}) });
    } catch (error) {
      setPageError(error.message || "Failed to load compliance page.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCompliance();
  }, [searchTerm, severity, exceptionType, sortBy, privilegedOnly, adminOnly]);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return records.slice(start, start + PAGE_SIZE);
  }, [records, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const toolbar = (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_180px_220px_180px]">
      <div className="flex h-12 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 shadow-sm">
        <Search size={18} className="text-zinc-400" />
        <input
          type="text"
          placeholder="Search user, department, role, exception"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
        />
      </div>

      <div className="relative">
        <select
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value);
            setPage(1);
          }}
          className="h-12 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 pr-10 text-sm text-zinc-700 shadow-sm outline-none"
        >
          <option value="All">All Severity</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
        />
      </div>

      <div className="relative">
        <select
          value={exceptionType}
          onChange={(e) => {
            setExceptionType(e.target.value);
            setPage(1);
          }}
          className="h-12 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 pr-10 text-sm text-zinc-700 shadow-sm outline-none"
        >
          <option value="All">All Exceptions</option>
          <option value="Inactive privileged user">
            Inactive privileged user
          </option>
          <option value="Terminated user with active access">
            Terminated active access
          </option>
          <option value="Terminated user with active privileged access">
            Terminated privileged access
          </option>
          <option value="Unused admin role">Unused admin role</option>
          <option value="High-risk role assignment">
            High-risk role assignment
          </option>
          <option value="Orphan role assignment">Orphan role assignment</option>
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
        />
      </div>

      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          className="h-12 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 pr-10 text-sm text-zinc-700 shadow-sm outline-none"
        >
          <option value="severity_desc">Sort: Highest severity</option>
          <option value="inactive_desc">Sort: Most inactive</option>
          <option value="cost_desc">Sort: Highest cost</option>
          <option value="name_asc">Sort: Name A-Z</option>
          <option value="role_asc">Sort: Role A-Z</option>
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
        />
      </div>

      <label className="flex h-12 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm">
        <input
          type="checkbox"
          checked={privilegedOnly}
          onChange={(e) => {
            setPrivilegedOnly(e.target.checked);
            setPage(1);
          }}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Privileged only
      </label>

      <label className="flex h-12 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm">
        <input
          type="checkbox"
          checked={adminOnly}
          onChange={(e) => {
            setAdminOnly(e.target.checked);
            setPage(1);
          }}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Admin roles only
      </label>
    </div>
  );

  const footer = (
    <TablePagination
      page={page}
      totalPages={totalPages}
      totalItems={records.length}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );

  return (
    <AppLayout
      title="Compliance"
      subtitle="Review high-risk role assignments, inactive privileged users, terminated access exposure, and orphan exceptions in one operational page."
    >
      <div className="space-y-6">
        <div className="grid gap-6 grid-cols-4">
          <StatusCard
            title="Total Flags"
            value={stats.totalFlags}
            subtitle="Visible compliance exceptions"
          />
          <StatusCard
            title="Critical Flags"
            value={stats.criticalFlags}
            subtitle="Highest priority items"
            status="error"
          />
          <StatusCard
            title="Inactive Privileged"
            value={stats.inactivePrivilegedUsers}
            subtitle="Dormant but sensitive access"
            status="warning"
          />
          <StatusCard
            title="Terminated Access"
            value={stats.terminatedActiveAccounts}
            subtitle="Requires urgent cleanup"
            status="error"
          />
        </div>

        {pageError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {pageError}
          </div>
        ) : null}

        <DataTableShell
          title="Compliance Exception Register"
          subtitle="Table-first operating view for user exposure, risky access, and role cleanup decisions."
          toolbar={toolbar}
          footer={footer}
          rightActions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => loadCompliance({ isRefresh: true })}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          }
        >
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-center text-zinc-500">
                    User
                  </th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-center text-zinc-500">
                    Department
                  </th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-center text-zinc-500">
                    Employment
                  </th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-center text-zinc-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-center text-zinc-500">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-center text-zinc-500">
                    Exception
                  </th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-center text-zinc-500">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-center text-zinc-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-14 text-center text-sm text-zinc-500"
                    >
                      Loading compliance records...
                    </td>
                  </tr>
                ) : paginatedRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-14 text-center text-sm text-zinc-500"
                    >
                      No compliance records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-zinc-100 transition hover:bg-zinc-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm">
                            <UserRound size={15} className="text-zinc-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-950">
                              {record.fullName}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {record.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-zinc-800">
                            {record.department}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {record.jobTitle}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill
                          value={record.employmentStatus}
                          type={getEmploymentTone(record.employmentStatus)}
                          dot
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm">
                            <BriefcaseBusiness
                              size={15}
                              className="text-zinc-700"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">
                              {record.roleName}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {record.roleCode}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill
                          value={record.severity}
                          type={getSeverityTone(record.severity)}
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-zinc-900">
                            {record.exceptionType}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                            {record.reason}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-zinc-700 text-center">
                        {record.inactiveDays !== null
                          ? `${record.inactiveDays} days`
                          : "-"}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DataTableShell>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard
            icon={<ShieldAlert size={18} />}
            title="Top Risk Department"
            value={stats.topRiskDepartment}
            subtitle="Highest concentration of compliance flags"
          />
          <SummaryCard
            icon={<Shield size={18} />}
            title="Top Flagged Role"
            value={stats.topFlaggedRole}
            subtitle="Most frequently flagged role assignment"
          />
          <SummaryCard
            icon={<AlertTriangle size={18} />}
            title="Most Common Exception"
            value={stats.mostCommonException}
            subtitle="Most repeated risk pattern"
          />
        </div>

        <DetailModal
          open={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={selectedRecord?.exceptionType || "Compliance Detail"}
          subtitle={
            selectedRecord
              ? `${selectedRecord.fullName} • ${selectedRecord.roleName}`
              : ""
          }
          width="max-w-6xl"
        >
          {selectedRecord ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-4">
                <MiniKpi
                  icon={<ShieldAlert size={16} className="text-red-600" />}
                  label="Severity"
                  value={selectedRecord.severity}
                  danger
                />
                <MiniKpi
                  icon={<Activity size={16} className="text-zinc-700" />}
                  label="Inactive Days"
                  value={
                    selectedRecord.inactiveDays !== null
                      ? selectedRecord.inactiveDays
                      : "-"
                  }
                />
                <MiniKpi
                  icon={
                    <BriefcaseBusiness size={16} className="text-zinc-700" />
                  }
                  label="Role Risk"
                  value={selectedRecord.roleRiskLevel}
                />
                <MiniKpi
                  icon={<Shield size={16} className="text-zinc-700" />}
                  label="Monthly Cost"
                  value={formatCurrency(selectedRecord.monthlyCost)}
                />
              </div>

              <DetailSection
                title="Identity"
                description="Core employee and account identity context."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem
                    label="Full Name"
                    value={selectedRecord.fullName}
                    emphasis
                  />
                  <DetailItem label="Email" value={selectedRecord.email} />
                  <DetailItem
                    label="Employee ID"
                    value={selectedRecord.employeeId}
                  />
                  <DetailItem
                    label="Department"
                    value={selectedRecord.department}
                  />
                  <DetailItem
                    label="Job Title"
                    value={selectedRecord.jobTitle}
                  />
                  <DetailItem
                    label="Employment Status"
                    value={
                      <StatusPill
                        value={selectedRecord.employmentStatus}
                        type={getEmploymentTone(
                          selectedRecord.employmentStatus,
                        )}
                      />
                    }
                  />
                  <DetailItem
                    label="License"
                    value={selectedRecord.licenseName}
                  />
                  <DetailItem
                    label="Transaction Count"
                    value={selectedRecord.transactionCount}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection
                title="Role & Assignment"
                description="Assigned role metadata and access attributes."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem
                    label="Role Name"
                    value={selectedRecord.roleName}
                    emphasis
                  />
                  <DetailItem
                    label="Role Code"
                    value={selectedRecord.roleCode}
                  />
                  <DetailItem
                    label="Role Risk"
                    value={
                      <StatusPill
                        value={selectedRecord.roleRiskLevel}
                        type={getRiskTone(selectedRecord.roleRiskLevel)}
                      />
                    }
                  />
                  <DetailItem
                    label="Privileged"
                    value={
                      <StatusPill
                        value={selectedRecord.isPrivileged ? "Yes" : "No"}
                        type={selectedRecord.isPrivileged ? "error" : "neutral"}
                      />
                    }
                  />
                  <DetailItem
                    label="Admin Role"
                    value={
                      <StatusPill
                        value={
                          selectedRecord.isAdminRole ? "Admin" : "Standard"
                        }
                        type={selectedRecord.isAdminRole ? "info" : "neutral"}
                      />
                    }
                  />
                  <DetailItem
                    label="Assigned At"
                    value={formatDateTime(selectedRecord.assignedAt)}
                  />
                  <DetailItem
                    label="Assignment Source"
                    value={selectedRecord.source}
                  />
                </DetailGrid>
              </DetailSection>

              <DetailSection
                title="Exception Detail"
                description="Why this row was flagged and what should be reviewed."
              >
                <DetailGrid cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  <DetailItem
                    label="Exception Type"
                    value={selectedRecord.exceptionType}
                    emphasis
                  />
                  <DetailItem
                    label="Severity"
                    value={
                      <StatusPill
                        value={selectedRecord.severity}
                        type={getSeverityTone(selectedRecord.severity)}
                      />
                    }
                  />
                  <DetailItem
                    label="Inactive Days"
                    value={
                      selectedRecord.inactiveDays !== null
                        ? `${selectedRecord.inactiveDays} days`
                        : "-"
                    }
                  />
                </DetailGrid>

                <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase text-zinc-500">
                    Reason Summary
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    {selectedRecord.reason}
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-4">
                  <p className="text-xs font-bold uppercase text-zinc-500">
                    Suggested Action
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    Review the role assignment, confirm the employee lifecycle
                    state, and remove or downgrade access if it is no longer
                    justified.
                  </p>
                </div>
              </DetailSection>
            </div>
          ) : null}
        </DetailModal>
      </div>
    </AppLayout>
  );
}

function SummaryCard({ icon, title, value, subtitle }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold uppercase text-zinc-500">{title}</p>
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-xl font-bold text-zinc-950">{value}</p>
      <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
    </div>
  );
}

function MiniKpi({ icon, label, value, danger = false }) {
  return (
    <div
      className={[
        "rounded-xl border px-5 py-4 shadow-md",
        danger ? "border-red-200 bg-red-50" : "border-zinc-200 bg-white",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <span
          className={[
            "text-xs font-semibold uppercase",
            danger ? "text-red-600" : "text-zinc-700",
          ].join(" ")}
        >
          {label}
        </span>
        {icon}
      </div>

      <p
        className={[
          "mt-4 text-2xl font-bold",
          danger ? "text-red-950" : "text-zinc-950",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}
