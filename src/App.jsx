import { Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadCenter from "./pages/UploadCenter";
import ImportsHistory from "./pages/ImportsHistory";
import UsersAnalysis from "./pages/UsersAnalysis";
import CostOptimization from "./pages/CostOptimization";
import Compliance from "./pages/Compliance";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload-center" element={<UploadCenter />} />
        <Route path="/imports-history" element={<ImportsHistory />} />
        <Route path="/users-analysis" element={<UsersAnalysis />} />
        <Route path="/cost-optimization" element={<CostOptimization />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}
