import { NavLink } from "react-router-dom";

const menuItems = [
  { path: "/", label: "🏠 Dashboard" },
  { path: "/upload-center", label: "⬆️ Upload Center" },
  { path: "/imports-history", label: "🕘 Imports History" },
  { path: "/users-analysis", label: "👥 Users Analysis" },
  { path: "/cost-optimization", label: "💰 Cost Optimization" },
  { path: "/compliance", label: "🛡️ Compliance" },
  { path: "/reports", label: "📄 Reports" },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: "250px",
        background: "#081225",
        color: "#fff",
        padding: "24px 16px",
      }}
    >
      <h2 style={{ marginBottom: "24px", fontSize: "20px" }}>SUBSCRIPTFLOW</h2>

      <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              textDecoration: "none",
              color: "#fff",
              padding: "12px 14px",
              borderRadius: "10px",
              background: isActive ? "#1d4ed8" : "transparent",
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
