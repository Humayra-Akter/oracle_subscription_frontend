import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function AppLayout({ children, title, subtitle }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="flex min-h-screen">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-cyan-500/18 blur-3xl" />
            <div className="absolute right-[-120px] top-[18%] h-96 w-96 rounded-full bg-blue-600/18 blur-3xl" />
            <div className="absolute bottom-[-140px] left-[28%] h-80 w-80 rounded-full bg-indigo-500/16 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
          </div>

          <div className="relative z-10 min-h-screen px-6 py-6 lg:px-8">
            <header className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                {title || "Dashboard"}
              </h1>
              {subtitle && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {subtitle}
                </p>
              )}
            </header>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
