import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CustomerDetail from "./pages/CustomerDetail";
import Matches from "./pages/Matches";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
          path="/customers/:id"
          element={
            <ProtectedRoute>
              <CustomerDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id/matches"
          element={
            <ProtectedRoute>
              <Matches />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
