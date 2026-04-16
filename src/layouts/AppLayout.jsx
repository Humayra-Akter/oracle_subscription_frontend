import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { ShieldCheck } from "lucide-react";

export default function AppLayout({ title, subtitle, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-neutral-200 bg-indigo-500/10 px-6 py-4 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-700">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm italic text-neutral-600">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-indigo-800 text-white">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-md font-medium text-indigo-800">
                {user?.name || "System Admin"}
              </p>
              <p className="truncate text-xs text-black">
                {user?.email || "admin@example.com"}
              </p>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
