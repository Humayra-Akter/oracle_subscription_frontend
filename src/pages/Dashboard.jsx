import AppLayout from "../layouts/AppLayout";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Monitor Oracle subscription activity, cost leakage, compliance exceptions, and reporting insights from one premium workspace."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Licensed Users" value="1,248" change="+4.2%" />
        <StatCard title="Inactive Users" value="187" change="-2.1%" />
        <StatCard title="Potential Savings" value="$42,800" change="+8.7%" />
        <StatCard title="Compliance Flags" value="29" change="+3 new" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">Overview</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Welcome, {user?.name || "Admin"}. This area can hold charts, recent
            imports, trend summaries, and license intelligence widgets.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
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
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="mt-3 text-3xl font-semibold text-white">{value}</h3>
      <p className="mt-2 text-sm text-cyan-300">{change}</p>
    </div>
  );
}

function QuickButton({ label }) {
  return (
    <button className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-left text-sm font-medium text-white transition hover:border-cyan-400/30 hover:bg-slate-800/70">
      {label}
    </button>
  );
}
