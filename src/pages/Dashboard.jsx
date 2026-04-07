import AppLayout from "../layouts/AppLayout";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Monitor Oracle subscription activity, cost leakage, compliance exceptions, and reporting insights from one workspace."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Licensed Users" value="1,248" change="+4.2%" />
        <StatCard title="Inactive Users" value="187" change="-2.1%" />
        <StatCard title="Potential Savings" value="$42,800" change="+8.7%" />
        <StatCard title="Compliance Flags" value="29" change="+3 new" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-black">Overview</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Welcome, {user?.name || "Admin"}. This area can hold charts, recent
            imports, trend summaries, and license intelligence widgets.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-black">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            <QuickButton label="Upload Oracle Report" />
            <QuickButton label="Review Compliance Flags" />
            <QuickButton label="Export Savings Report" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, change }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <p className="text-sm text-neutral-500">{title}</p>
      <h3 className="mt-3 text-3xl font-semibold text-black">{value}</h3>
      <p className="mt-2 text-sm text-neutral-600">{change}</p>
    </div>
  );
}

function QuickButton({ label }) {
  return (
    <button className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm font-medium text-black transition hover:bg-neutral-50">
      {label}
    </button>
  );
}
