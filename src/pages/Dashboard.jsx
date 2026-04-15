import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import StatusCard from "../components/StatusCard";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Monitor Oracle subscription activity, cost leakage, compliance exceptions, and reporting insights from one workspace."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          title="Upload Center"
          value="Live"
          subtitle="Process source reports"
          status="success"
        />
        <StatusCard
          title="Imports History"
          value="Track"
          subtitle="Review results and retries"
          status="processing"
        />
        <StatusCard
          title="Users Analysis"
          value="Ready"
          subtitle="Inspect users and roles"
          status="success"
        />
        <StatusCard
          title="Compliance"
          value="Soon"
          subtitle="Rules engine next"
          status="warning"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-black">Overview</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Welcome, {user?.name || "Admin"}. Your backend is now ready to
            process uploaded Oracle reports, store import history, and build a
            user-level access and activity view from imported data.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <QuickLink
              to="/upload-center"
              title="Upload Reports"
              description="Upload CSV and Excel source files."
            />
            <QuickLink
              to="/imports-history"
              title="Review Import Results"
              description="Check completed, failed, and retried imports."
            />
            <QuickLink
              to="/users-analysis"
              title="Inspect Users"
              description="Review activity, roles, and privileged access."
            />
            <QuickLink
              to="/compliance"
              title="Compliance View"
              description="Reserved for next feature phase."
            />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-black">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            <QuickButton to="/upload-center" label="Upload Oracle Report" />
            <QuickButton to="/imports-history" label="Review Import History" />
            <QuickButton to="/users-analysis" label="Open Users Analysis" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function QuickButton({ to, label }) {
  return (
    <Link
      to={to}
      className="block w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm font-medium text-black transition hover:bg-neutral-50"
    >
      {label}
    </Link>
  );
}

function QuickLink({ to, title, description }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 transition hover:bg-white"
    >
      <h3 className="text-sm font-semibold text-black">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600">{description}</p>
    </Link>
  );
}
