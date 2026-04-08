import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function AppLayout({ title, subtitle, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-neutral-200 bg-white px-6 py-5">
          <h1 className="text-2xl font-semibold text-black">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
          )}
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
