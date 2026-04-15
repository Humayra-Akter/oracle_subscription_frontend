import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Eye,
  Users,
  ShieldAlert,
  Activity,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import StatusCard from "../components/StatusCard";
import { usersAnalysisApi } from "../utils/api";

const UTILIZATION_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Underutilized", value: "UNDERUTILIZED" },
  { label: "Optimal", value: "OPTIMAL" },
  { label: "Overutilized", value: "OVERUTILIZED" },
  { label: "Unknown", value: "UNKNOWN" },
];

const ACTIVITY_OPTIONS = ["All", "Active", "Inactive", "Terminated"];

const EMPTY_STATS = {
  total: 0,
  active: 0,
  inactive: 0,
  privileged: 0,
  inactivePrivileged: 0,
  underutilized: 0,
};

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

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

export default function UsersAnalysis() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activityStatus, setActivityStatus] = useState("All");
  const [utilizationStatus, setUtilizationStatus] = useState("All");
  const [privilegedOnly, setPrivilegedOnly] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();

    const loadUsers = async () => {
      setLoading(true);
      setPageError("");

      try {
        const data = await usersAnalysisApi.list(
          {
            search: debouncedSearchTerm,
            activityStatus,
            utilizationStatus,
            privilegedOnly,
          },
          controller.signal,
        );

        const normalizedItems = (data.items || []).map(normalizeUser);
        setUsers(normalizedItems);
        setStats({ ...EMPTY_STATS, ...(data.stats || {}) });

        if (selectedUserId) {
          const stillExists = normalizedItems.some(
            (item) => item.id === selectedUserId,
          );

          if (!stillExists) {
            setSelectedUserId(null);
            setSelectedUser(null);
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setPageError(error.message || "Failed to load users analysis.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => controller.abort();
  }, [
    debouncedSearchTerm,
    activityStatus,
    utilizationStatus,
    privilegedOnly,
    selectedUserId,
  ]);

  useEffect(() => {
    if (!selectedUserId) return;

    const controller = new AbortController();

    const loadUserDetail = async () => {
      setDetailsLoading(true);
      setPageError("");

      try {
        const data = await usersAnalysisApi.getById(
          selectedUserId,
          controller.signal,
        );
        setSelectedUser(normalizeUser(data));
      } catch (error) {
        if (error.name !== "AbortError") {
          setPageError(error.message || "Failed to load user details.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setDetailsLoading(false);
        }
      }
    };

    loadUserDetail();

    return () => controller.abort();
  }, [selectedUserId]);

  const visibleCount = useMemo(() => users.length, [users]);

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setActivityStatus("All");
    setUtilizationStatus("All");
    setPrivilegedOnly(false);
  };

  return (
    <AppLayout
      title="Users Analysis"
      subtitle="Review user activity, utilization, assigned roles, and privileged access risk from one workspace."
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

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-black">Filter Users</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Search by name, email, employee ID, department, or job title.
              Narrow results by activity, utilization, or privileged access.
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
                placeholder="Search users"
                className="w-full bg-transparent text-sm text-black outline-none placeholder:text-neutral-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Activity Status
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
              <Filter size={18} className="text-neutral-500" />
              <select
                value={activityStatus}
                onChange={(e) => setActivityStatus(e.target.value)}
                className="w-full bg-transparent text-sm text-black outline-none"
              >
                {ACTIVITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Utilization
            </label>
            <select
              value={utilizationStatus}
              onChange={(e) => setUtilizationStatus(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black outline-none"
            >
              {UTILIZATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Privileged Access
            </label>
            <label className="flex h-[50px] items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-black">
              <input
                type="checkbox"
                checked={privilegedOnly}
                onChange={(e) => setPrivilegedOnly(e.target.checked)}
              />
              Show privileged users only
            </label>
          </div>
        </div>
      </div>

      {pageError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-black">Users</h2>
              <p className="mt-2 text-sm text-neutral-600">
                View user activity, utilization, role exposure, and likely
                access risk.
              </p>
            </div>

            <div className="text-sm text-neutral-500">
              {visibleCount} result{visibleCount !== 1 ? "s" : ""}
            </div>
          </div>

          {loading ? (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
              No users found.
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {users.map((item) => (
                <UserCard
                  key={item.id}
                  item={item}
                  onView={() => {
                    setSelectedUserId(item.id);
                    setSelectedUser(item);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-black">User Detail</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Select a user to inspect last activity, role exposure, and
            utilization.
          </p>

          {detailsLoading ? (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
              Loading user details...
            </div>
          ) : selectedUser ? (
            <div className="mt-5 space-y-4">
              <DetailCard label="Full Name" value={selectedUser.fullName} />
              <DetailCard label="Email" value={selectedUser.email} />
              <DetailCard label="Employee ID" value={selectedUser.employeeId} />
              <DetailCard label="Department" value={selectedUser.department} />
              <DetailCard label="Job Title" value={selectedUser.jobTitle} />
              <DetailCard
                label="Employment Status"
                value={selectedUser.employmentStatus}
              />
              <DetailCard
                label="Activity Status"
                value={selectedUser.activityStatus}
              />
              <DetailCard
                label="Last Activity"
                value={formatDateTime(selectedUser.lastActivityAt)}
              />
              <DetailCard
                label="Days Since Last Activity"
                value={
                  selectedUser.daysSinceLastActivity === null
                    ? "-"
                    : String(selectedUser.daysSinceLastActivity)
                }
              />
              <DetailCard
                label="Transaction Count"
                value={selectedUser.transactionCount.toLocaleString()}
              />
              <DetailCard
                label="Utilization Status"
                value={selectedUser.utilizationStatus}
              />
              <DetailCard label="License" value={selectedUser.licenseName} />
              <DetailCard
                label="Monthly Cost"
                value={`$${selectedUser.monthlyCost.toFixed(2)}`}
              />
              <DetailCard
                label="Privileged Access"
                value={selectedUser.isPrivilegedUser ? "Yes" : "No"}
              />
              <DetailCard
                label="Assigned Roles"
                value={
                  selectedUser.assignedRoles.length
                    ? selectedUser.assignedRoles.join(", ")
                    : "No active roles"
                }
              />

              <div className="rounded-xl border border-neutral-200 bg-white p-4">
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
          ) : (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
              No user selected yet.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function UserCard({ item, onView }) {
  const tone = getUserTone(item);

  return (
    <div className={`rounded-xl border p-5 ${tone.wrapper}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${tone.iconBox}`}
          >
            <Users size={20} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-black">
                {item.fullName}
              </h3>
              <ActivityBadge status={item.activityStatus} />
              {item.isPrivilegedUser && <PrivilegeBadge />}
            </div>

            <p className="mt-1 text-sm text-neutral-600">{item.email}</p>

            <div className="mt-3 grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
              <p>
                <span className="font-medium text-black">Department:</span>{" "}
                {item.department}
              </p>
              <p>
                <span className="font-medium text-black">Job Title:</span>{" "}
                {item.jobTitle}
              </p>
              <p>
                <span className="font-medium text-black">Transactions:</span>{" "}
                {item.transactionCount.toLocaleString()}
              </p>
              <p>
                <span className="font-medium text-black">Utilization:</span>{" "}
                {item.utilizationStatus}
              </p>
            </div>

            <p className={`mt-3 text-sm ${tone.message}`}>
              {item.lastActivityAt
                ? `Last activity: ${formatDateTime(item.lastActivityAt)}`
                : "No activity date available."}
            </p>

            {item.assignedRoles.length > 0 && (
              <p className="mt-2 text-sm text-neutral-600">
                Roles: {item.assignedRoles.join(", ")}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-neutral-50"
        >
          <Eye size={14} />
          View
        </button>
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
      <p className="mt-2 break-words text-sm text-black">{value}</p>
    </div>
  );
}

function ActivityBadge({ status }) {
  const map = {
    Active: "border-green-200 bg-green-50 text-green-700",
    Inactive: "border-yellow-200 bg-yellow-50 text-yellow-700",
    Terminated: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
        map[status] || "border-neutral-200 bg-neutral-50 text-neutral-700"
      }`}
    >
      <Activity size={14} />
      {status}
    </span>
  );
}

function PrivilegeBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
      <ShieldAlert size={14} />
      Privileged
    </span>
  );
}

function getUserTone(item) {
  if (item.isPrivilegedUser && item.activityStatus !== "Active") {
    return {
      wrapper: "border-red-200 bg-red-50",
      iconBox: "border-red-200 bg-white text-red-700",
      message: "text-red-700",
    };
  }

  if (item.activityStatus === "Inactive") {
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
