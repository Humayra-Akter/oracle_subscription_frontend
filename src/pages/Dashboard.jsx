const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4 text-slate-300">Welcome, {user?.name || "Admin"}</p>
    </div>
  );
};

export default Dashboard;
