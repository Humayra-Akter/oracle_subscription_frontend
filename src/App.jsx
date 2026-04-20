import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import UploadCenter from "./pages/UploadCenter";
import ImportsHistory from "./pages/ImportsHistory";
import UsersAnalysis from "./pages/UsersAnalysis";
import CostOptimization from "./pages/CostOptimization";
import Compliance from "./pages/Compliance";
import Reports from "./pages/Reports";
import Insights from "./pages/Insights";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload-center"
        element={
          <ProtectedRoute>
            <UploadCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/imports-history"
        element={
          <ProtectedRoute>
            <ImportsHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users-analysis"
        element={
          <ProtectedRoute>
            <UsersAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cost-optimization"
        element={
          <ProtectedRoute>
            <CostOptimization />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compliance"
        element={
          <ProtectedRoute>
            <Compliance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <Insights />
          </ProtectedRoute>
        }
      />
     
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
