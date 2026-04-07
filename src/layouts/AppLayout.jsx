import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function AppLayout({ children, title, subtitle }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="flex min-h-screen">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <div className="flex-1 bg-white">
          <div className="min-h-screen px-6 py-6 lg:px-8">
            <header className="mb-6 rounded-xl border border-neutral-200 bg-white p-5">
              <h1 className="text-2xl font-semibold tracking-tight text-black">
                {title || "Dashboard"}
              </h1>

              {subtitle && (
                <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                  {subtitle}
                </p>
              )}
            </header>

            <div className="space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
