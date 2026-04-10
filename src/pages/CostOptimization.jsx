import {
  Search,
  Filter,
  Download,
  TrendingDown,
  CircleDollarSign,
  ArrowRight,
  BadgeDollarSign,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import StatusCard from "../components/StatusCard";

const topOpportunities = [
  {
    title: "Inactive licensed users",
    description:
      "128 users have assigned subscriptions but no recent activity in the last 90 days.",
    impact: "$18,240",
    action: "Review licenses",
    priority: "High",
  },
  {
    title: "Underutilized premium services",
    description:
      "Several users are assigned high-cost services with very low transaction volume.",
    impact: "$12,870",
    action: "Downgrade plans",
    priority: "High",
  },
  {
    title: "Duplicate role-service assignment",
    description:
      "Overlapping service assignments are increasing cost without added value.",
    impact: "$7,460",
    action: "Merge assignments",
    priority: "Medium",
  },
  {
    title: "Unmatched HR vs active access",
    description:
      "Some billable accounts cannot be matched against HR master data.",
    impact: "$4,920",
    action: "Validate ownership",
    priority: "Medium",
  },
];

const impactedItems = [
  {
    name: "Oracle Procurement Cloud",
    department: "Supply Chain",
    users: 34,
    wastedCost: "$8,420",
    status: "High",
  },
  {
    name: "Oracle Financials",
    department: "Finance",
    users: 21,
    wastedCost: "$6,110",
    status: "Medium",
  },
  {
    name: "Oracle HCM",
    department: "HR",
    users: 17,
    wastedCost: "$4,560",
    status: "Medium",
  },
  {
    name: "Oracle Project Management",
    department: "Operations",
    users: 11,
    wastedCost: "$3,180",
    status: "Low",
  },
];

const priorityStyles = {
  High: "border-red-200 bg-red-50 text-red-700",
  Medium: "border-yellow-200 bg-yellow-50 text-yellow-700",
  Low: "border-neutral-200 bg-neutral-50 text-neutral-700",
};

const riskStyles = {
  High: "text-red-600",
  Medium: "text-yellow-700",
  Low: "text-emerald-600",
};

export default function CostOptimization() {
  return (
    <AppLayout
      title="Cost Optimization"
      subtitle="Track waste, savings opportunities, and subscription cost leakage across Oracle services."
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            title="Potential Savings"
            value="$43,490"
            subtitle="Estimated recoverable spend"
            status="success"
          />
          <StatusCard
            title="Inactive License Cost"
            value="$18,240"
            subtitle="Largest waste segment"
            status="error"
          />
          <StatusCard
            title="Underutilized Spend"
            value="$12,870"
            subtitle="Low usage premium subscriptions"
            status="warning"
          />
          <StatusCard
            title="Renewal Review"
            value="17 Services"
            subtitle="Need action before renewal"
            status="processing"
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-black">Cost Filters</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Search services, departments, or savings opportunities and
                refine the analysis view.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
                <Search size={18} className="text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search cost items"
                  className="w-full bg-transparent text-sm text-black outline-none placeholder:text-neutral-400"
                />
              </div>

              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-50">
                <Filter size={16} />
                Filters
              </button>

              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-50">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black">
                  Top Savings Opportunities
                </h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Highest-value actions to reduce subscription waste.
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
                <BadgeDollarSign size={18} className="text-black" />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {topOpportunities.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-black">
                        <TrendingDown size={20} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-black">
                            {item.title}
                          </h3>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${priorityStyles[item.priority]}`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-neutral-600">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-[150px] flex-col gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          Estimated Impact
                        </p>
                        <p className="mt-1 text-xl font-semibold text-black">
                          {item.impact}
                        </p>
                      </div>

                      <button className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-50">
                        {item.action}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-black">
                <CircleDollarSign size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-black">Summary</h2>
                <p className="text-sm text-neutral-600">
                  Key optimization signals
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Largest Waste Area
                </p>
                <p className="mt-2 text-lg font-semibold text-black">
                  Inactive Licenses
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Most Affected Department
                </p>
                <p className="mt-2 text-lg font-semibold text-black">
                  Supply Chain
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Accounts Needing Review
                </p>
                <p className="mt-2 text-lg font-semibold text-black">
                  63 Accounts
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Projected Monthly Reduction
                </p>
                <p className="mt-2 text-lg font-semibold text-black">$9,200</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-black">
                Service Cost Impact
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Services contributing the most to avoidable spend.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">Department</th>
                  <th className="pb-3 font-medium">Affected Users</th>
                  <th className="pb-3 font-medium">Wasted Cost</th>
                  <th className="pb-3 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {impactedItems.map((item) => (
                  <tr
                    key={item.name}
                    className="border-b border-neutral-100 last:border-b-0"
                  >
                    <td className="py-4 font-medium text-black">{item.name}</td>
                    <td className="py-4 text-neutral-600">{item.department}</td>
                    <td className="py-4 text-neutral-600">{item.users}</td>
                    <td className="py-4 font-medium text-black">
                      {item.wastedCost}
                    </td>
                    <td
                      className={`py-4 font-medium ${riskStyles[item.status]}`}
                    >
                      {item.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
