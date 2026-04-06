import { useEffect, useState } from "react";
import { authApi } from "../utils/api";

export default function Dashboard() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await authApi.getMe();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Checking session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-3 text-slate-300">
            Welcome, {user?.name || "Admin"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Email: {user?.email || "-"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Role: {user?.role || "-"}
          </p>

          <button
            onClick={handleLogout}
            className="mt-8 rounded-xl bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-400"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
