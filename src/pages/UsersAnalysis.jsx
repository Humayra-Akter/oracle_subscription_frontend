import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  Shield,
  UserRound,
  Activity,
  BriefcaseBusiness,
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
import { usersAnalysisApi } from "../utils/api";

const PAGE_SIZE = 10;

const EMPTY_STATS = {
  total: 0,
  active: 0,
  inactive: 0,
  privileged: 0,
  inactivePrivileged: 0,
  underutilized: 0,
};

function normalizeUser(item) {
  return {
    id: item?.id ?? "",
    employeeId: item?.employeeId ?? "-",
    fullName: item?.fullName ?? "-",
    email: item?.email ?? "-",
    department: item?.department ?? "-",
    jobTitle: item?.jobTitle ?? "-",
    employmentStatus: item?.employmentStatus ?? "-",
    activityStatus: item?.activityStatus ?? "-",
    lastActivityAt: item?.lastActivityAt ?? null,
    daysSinceLastActivity:
      item?.daysSinceLastActivity === null ||
      item?.daysSinceLastActivity === undefined
        ? null
        : Number(item?.daysSinceLastActivity),
    transactionCount: Number(item?.transactionCount ?? 0),
    utilizationStatus: item?.utilizationStatus ?? "UNKNOWN",
    licenseName: item?.licenseName ?? "-",
    monthlyCost: Number(item?.monthlyCost ?? 0),
    isPrivilegedUser: Boolean(item?.isPrivilegedUser),
    riskyRoleCount: Number(item?.riskyRoleCount ?? 0),
    assignedRoles: Array.isArray(item?.assignedRoles) ? item.assignedRoles : [],
    roleDetails: Array.isArray(item?.roleDetails) ? item.roleDetails : [],
  };
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getActivityTone(status) {
  if (status === "Active") return "success";
  if (status === "Inactive") return "warning";
  if (status === "Terminated") return "error";
  return "neutral";
}

function getUtilizationTone(status) {
  if (status === "OPTIMAL") return "success";
  if (status === "UNDERUTILIZED") return "warning";
  if (status === "OVERUTILIZED") return "info";
  return "neutral";
}

export default function UsersAnalysis() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);

  const [searchTerm, setSearchTerm] = useState("");
  const [activityStatus, setActivityStatus] = useState("All");
  const [utilizationStatus, setUtilizationStatus] = useState("All");
  const [privilegedOnly, setPrivilegedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setPageError("");

    try {
      const data = await usersAnalysisApi.list({
        search: searchTerm,
        activityStatus,
        utilizationStatus,
        privilegedOnly,
      });

      setUsers((data.items || []).map(normalizeUser));
      setStats({ ...EMPTY_STATS, ...(data.stats || {}) });
    } catch (error) {
      setPageError(error.message || "Failed to load users analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchTerm, activityStatus, utilizationStatus, privilegedOnly]);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [users, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const toolbar = (
    <div className="grid gap-3 2xl:grid-cols-[1.2fr_180px_180px_240px]">
      <div className="flex h-12 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 shadow-sm">
        <Search size={18} className="text-zinc-400" />
        <input
          type="text"
          placeholder="Search user, email, employee ID, department"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
        />
      </div>

      <select
        value={activityStatus}
        onChange={(e) => {
          setActivityStatus(e.target.value);
          setPage(1);
        }}
        className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 shadow-sm outline-none"
      >
        <option value="All">All Activity</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Terminated">Terminated</option>
      </select>

      <select
        value={utilizationStatus}
        onChange={(e) => {
          setUtilizationStatus(e.target.value);
          setPage(1);
        }}
        className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-700 shadow-sm outline-none"
      >
        <option value="All">All Utilization</option>
        <option value="UNDERUTILIZED">Underutilized</option>
        <option value="OPTIMAL">Optimal</option>
        <option value="OVERUTILIZED">Overutilized</option>
        <option value="UNKNOWN">Unknown</option>
      </select>

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
        Privileged users only
      </label>
    </div>
  );

  const footer = (
    <TablePagination
      page={page}
      totalPages={totalPages}
      totalItems={users.length}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  );

  return (
    <AppLayout
      title="Users Analysis"
      subtitle="Review activity patterns, utilization quality, access exposure, and privileged role concentration in one executive-grade view."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          title="Total Users"
          value={stats.total}
          subtitle="Visible records"
        />
        <StatusCard
          title="Active Users"
          value={stats.active}
          subtitle="Recently active"
          status="success"
        />
        <StatusCard
          title="Inactive Users"
          value={stats.inactive}
          subtitle="Needs review"
          status="warning"
        />
        <StatusCard
          title="Inactive Privileged"
          value={stats.inactivePrivileged}
          subtitle="Highest risk cluster"
          status="error"
        />
      </div>

      {pageError ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
          {pageError}
        </div>
      ) : null}

      <div className="mt-6">
        <DataTableShell
          title="User Exposure Register"
          subtitle="Business-grade operational table for identity, activity, utilization, and privilege review."
          toolbar={toolbar}
          footer={footer}
        >
          <table className="min-w-full">
            <thead className="border-b border-zinc-200 bg-zinc-100">
              <tr>
                <th className="px-6 py-2 text-xs font-bold uppercase text-center text-zinc-500">
                  Identity
                </th>
                <th className="px-6 py-2 text-xs font-bold uppercase text-center text-zinc-500">
                  Department
                </th>
                <th className="px-6 py-2 text-xs font-bold uppercase text-center text-zinc-500">
                  Activity
                </th>
                <th className="px-6 py-2 text-xs font-bold uppercase text-center text-zinc-500">
                  Utilization
                </th>
                <th className="px-6 py-2 text-xs font-bold uppercase text-center text-zinc-500">
                  Privileged
                </th>
                <th className="px-6 py-2 text-xs font-bold uppercase text-center text-zinc-500">
                  Risky Roles
                </th>
                <th className="px-6 py-2 text-xs font-bold uppercase text-center text-zinc-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-14 text-center text-sm text-zinc-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-14 text-center text-sm text-zinc-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-zinc-100 transition hover:bg-zinc-50/80"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm">
                          <UserRound size={15} className="text-zinc-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-950">
                            {user.fullName}
                          </p>
                          <p className="text-sm text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-zinc-800">
                          {user.department}
                        </p>
                        <p className="text-sm text-zinc-500">{user.jobTitle}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusPill
                        value={user.activityStatus}
                        type={getActivityTone(user.activityStatus)}
                        dot
                      />
                    </td>

                    <td className="px-6 py-4">
                      <StatusPill
                        value={user.utilizationStatus}
                        type={getUtilizationTone(user.utilizationStatus)}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <StatusPill
                        value={
                          user.isPrivilegedUser ? "Privileged" : "Standard"
                        }
                        type={user.isPrivilegedUser ? "error" : "neutral"}
                      />
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-zinc-800 text-center">
                      {user.riskyRoleCount}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-1 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
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
        </DataTableShell>
      </div>

      <DetailModal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Profile & Access Risk"
        subtitle="Detailed identity, usage, access, and role exposure for the selected record."
        width="max-w-6xl"
      >
        {selectedUser ? (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-[24px] border border-zinc-200 bg-zinc-950 p-5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    Activity
                  </span>
                  <Activity size={16} className="text-zinc-300" />
                </div>
                <div className="mt-4">
                  <StatusPill
                    value={selectedUser.activityStatus}
                    type="dark"
                    size="sm"
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    Roles
                  </span>
                  <BriefcaseBusiness size={16} className="text-zinc-500" />
                </div>
                <p className="mt-4 text-3xl font-bold text-zinc-950">
                  {selectedUser.assignedRoles?.length || 0}
                </p>
              </div>

              <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-400">
                    Risky Roles
                  </span>
                  <Shield size={16} className="text-red-500" />
                </div>
                <p className="mt-4 text-3xl font-bold text-red-950">
                  {selectedUser.riskyRoleCount}
                </p>
              </div>

              <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Monthly Cost
                </div>
                <p className="mt-4 text-3xl font-bold text-zinc-950">
                  ${selectedUser.monthlyCost.toFixed(2)}
                </p>
              </div>
            </div>

            <DetailSection title="Identity">
              <DetailGrid>
                <DetailItem
                  label="Full Name"
                  value={selectedUser.fullName}
                  emphasis
                />
                <DetailItem label="Email" value={selectedUser.email} />
                <DetailItem
                  label="Employee ID"
                  value={selectedUser.employeeId}
                />
                <DetailItem
                  label="Department"
                  value={selectedUser.department}
                />
                <DetailItem label="Job Title" value={selectedUser.jobTitle} />
                <DetailItem
                  label="Employment Status"
                  value={selectedUser.employmentStatus}
                />
              </DetailGrid>
            </DetailSection>

            <DetailSection title="Activity & Usage">
              <DetailGrid>
                <DetailItem
                  label="Activity Status"
                  value={
                    <StatusPill
                      value={selectedUser.activityStatus}
                      type={getActivityTone(selectedUser.activityStatus)}
                    />
                  }
                />
                <DetailItem
                  label="Last Activity"
                  value={formatDateTime(selectedUser.lastActivityAt)}
                />
                <DetailItem
                  label="Days Since Last Activity"
                  value={selectedUser.daysSinceLastActivity ?? "-"}
                />
                <DetailItem
                  label="Transaction Count"
                  value={selectedUser.transactionCount}
                />
                <DetailItem
                  label="Utilization Status"
                  value={
                    <StatusPill
                      value={selectedUser.utilizationStatus}
                      type={getUtilizationTone(selectedUser.utilizationStatus)}
                    />
                  }
                />
                <DetailItem label="License" value={selectedUser.licenseName} />
              </DetailGrid>
            </DetailSection>

            <DetailSection title="Risk & Access">
              <DetailGrid>
                <DetailItem
                  label="Privileged Access"
                  value={
                    <StatusPill
                      value={selectedUser.isPrivilegedUser ? "Yes" : "No"}
                      type={selectedUser.isPrivilegedUser ? "error" : "neutral"}
                    />
                  }
                />
                <DetailItem
                  label="Risky Role Count"
                  value={selectedUser.riskyRoleCount}
                />
                <DetailItem
                  label="Assigned Roles"
                  value={selectedUser.assignedRoles?.length || 0}
                />
              </DetailGrid>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-200 px-3 py-4">
                  <h4 className="text-sm font-bold uppercase   text-zinc-500">
                    Assigned Roles
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-zinc-50/90">
                      <tr>
                        <th className="px-3 py-2 text-xs font-bold uppercase   text-zinc-500">
                          Role Name
                        </th>
                        <th className="px-3 py-2 text-xs font-bold uppercase   text-zinc-500">
                          Risk
                        </th>
                        <th className="px-3 py-2 text-xs font-bold uppercase   text-zinc-500">
                          Privileged
                        </th>
                        <th className="px-3 py-2 text-xs font-bold uppercase   text-zinc-500">
                          Admin
                        </th>
                        <th className="px-3 py-2 text-xs font-bold uppercase   text-zinc-500">
                          Assigned At
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedUser.roleDetails?.length ? (
                        selectedUser.roleDetails.map((role) => (
                          <tr
                            key={role.id}
                            className="border-t border-zinc-100"
                          >
                            <td className="px-3 py-4 font-medium text-zinc-900">
                              {role.roleName}
                            </td>
                            <td className="px-3 py-4 text-zinc-700">
                              {role.riskLevel}
                            </td>
                            <td className="px-3 py-4">
                              <StatusPill
                                value={role.isPrivileged ? "Yes" : "No"}
                                type={role.isPrivileged ? "error" : "neutral"}
                                size="sm"
                              />
                            </td>
                            <td className="px-3 py-4">
                              <StatusPill
                                value={role.isAdminRole ? "Admin" : "Standard"}
                                type={role.isAdminRole ? "info" : "neutral"}
                                size="sm"
                              />
                            </td>
                            <td className="px-3 py-4 text-zinc-700">
                              {role.assignedAt || "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-3 py-10 text-center text-sm text-zinc-500"
                          >
                            No active roles found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </DetailSection>
          </div>
        ) : null}
      </DetailModal>
    </AppLayout>
  );
}
