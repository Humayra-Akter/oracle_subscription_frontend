import { useEffect, useMemo, useState } from "react";
import { Search, Eye } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import StatusCard from "../components/StatusCard";
import TablePagination from "../components/TablePagination";
import DataModal from "../components/DataModal";
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
        : Number(item.daysSinceLastActivity),
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

function StatusChip({ text, tone = "default" }) {
  const tones = {
    default: "bg-neutral-50 border-neutral-200 text-neutral-700",
    success: "bg-green-50 border-green-200 text-green-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
    danger: "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {text}
    </span>
  );
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

  const totalPages = Math.ceil(users.length / PAGE_SIZE) || 1;

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [users, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  return (
    <AppLayout
      title="Users Analysis"
      subtitle="Review user activity, utilization, assigned roles, and privileged access in a structured operational grid."
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
          subtitle="Highest risk"
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
          <div className="grid gap-4 xl:grid-cols-[1fr_180px_180px_220px]">
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3">
              <Search size={18} className="text-neutral-500" />
              <input
                type="text"
                placeholder="Search name, email, employee ID, department"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <select
              value={activityStatus}
              onChange={(e) => {
                setActivityStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm"
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
              className="rounded-xl border border-neutral-200 px-4 py-3 text-sm"
            >
              <option value="All">All Utilization</option>
              <option value="UNDERUTILIZED">Underutilized</option>
              <option value="OPTIMAL">Optimal</option>
              <option value="OVERUTILIZED">Overutilized</option>
              <option value="UNKNOWN">Unknown</option>
            </select>

            <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={privilegedOnly}
                onChange={(e) => {
                  setPrivilegedOnly(e.target.checked);
                  setPage(1);
                }}
              />
              Privileged users only
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-6 py-4 font-medium text-neutral-600">Name</th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Email
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Department
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Activity
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Utilization
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Privileged
                </th>
                <th className="px-6 py-4 font-medium text-neutral-600">
                  Roles
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
                    colSpan="8"
                    className="px-6 py-10 text-center text-neutral-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-10 text-center text-neutral-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100">
                    <td className="px-6 py-4 font-medium text-black">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4 text-neutral-700">{user.email}</td>
                    <td className="px-6 py-4 text-neutral-700">
                      {user.department}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip
                        text={user.activityStatus}
                        tone={
                          user.activityStatus === "Active"
                            ? "success"
                            : user.activityStatus === "Inactive"
                              ? "warning"
                              : "danger"
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {user.utilizationStatus}
                    </td>
                    <td className="px-6 py-4">
                      {user.isPrivilegedUser ? (
                        <StatusChip text="Yes" tone="danger" />
                      ) : (
                        <StatusChip text="No" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-700">
                      {user.assignedRoles.length
                        ? user.assignedRoles.join(", ")
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium"
                      >
                        <Eye size={14} />
                        View
                      </button>
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
          totalItems={users.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      <DataModal
        open={!!selectedUser}
        title="User Details"
        onClose={() => setSelectedUser(null)}
      >
        {selectedUser && (
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Full Name" value={selectedUser.fullName} />
            <DetailItem label="Email" value={selectedUser.email} />
            <DetailItem label="Employee ID" value={selectedUser.employeeId} />
            <DetailItem label="Department" value={selectedUser.department} />
            <DetailItem label="Job Title" value={selectedUser.jobTitle} />
            <DetailItem
              label="Employment Status"
              value={selectedUser.employmentStatus}
            />
            <DetailItem
              label="Activity Status"
              value={selectedUser.activityStatus}
            />
            <DetailItem
              label="Last Activity"
              value={formatDateTime(selectedUser.lastActivityAt)}
            />
            <DetailItem
              label="Days Since Last Activity"
              value={
                selectedUser.daysSinceLastActivity === null
                  ? "-"
                  : String(selectedUser.daysSinceLastActivity)
              }
            />
            <DetailItem
              label="Transaction Count"
              value={selectedUser.transactionCount}
            />
            <DetailItem
              label="Utilization Status"
              value={selectedUser.utilizationStatus}
            />
            <DetailItem label="License" value={selectedUser.licenseName} />
            <DetailItem
              label="Monthly Cost"
              value={`$${selectedUser.monthlyCost.toFixed(2)}`}
            />
            <DetailItem
              label="Privileged Access"
              value={selectedUser.isPrivilegedUser ? "Yes" : "No"}
            />
            <div className="md:col-span-2">
              <DetailItem
                label="Assigned Roles"
                value={
                  selectedUser.assignedRoles.length
                    ? selectedUser.assignedRoles.join(", ")
                    : "No active roles"
                }
              />
            </div>

            <div className="md:col-span-2 rounded-xl border border-neutral-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Role Risk Detail
              </p>

              <div className="mt-3 space-y-3">
                {selectedUser.roleDetails.length ? (
                  selectedUser.roleDetails.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                    >
                      <p className="text-sm font-medium text-black">
                        {role.roleName}
                      </p>
                      <p className="mt-1 text-xs text-neutral-600">
                        Risk: {role.riskLevel} · Privileged:{" "}
                        {role.isPrivileged ? "Yes" : "No"} · Admin:{" "}
                        {role.isAdminRole ? "Yes" : "No"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600">
                    No active roles found.
                  </p>
                )}
              </div>
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
