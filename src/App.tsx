import { useEffect, useState } from "react";
import { type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useOutletContext,
} from "react-router-dom";
import AppLayout, { type LayoutContext } from "@/components/layout/AppLayout";
import NetworkStatus from "@/components/pwa/NetworkStatus";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import UsersPage from "@/pages/UsersPage";
import ProductsPage from "@/pages/ProductsPage";
import CashierPage from "@/pages/CashierPage";
import HistoryPage from "@/pages/HistoryPage";

function SuperAdminOnly({ children }: { children: ReactNode }) {
  const { user } = useOutletContext<LayoutContext>();
  return user.role === "super_admin" ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

function AppRoutes() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem("token"));
    window.addEventListener("auth-changed", syncToken);
    return () => window.removeEventListener("auth-changed", syncToken);
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/cashier" replace /> : <Login />}
      />
      <Route element={token ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cashier" element={<CashierPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/product" element={<ProductsPage />} />
        <Route
          path="/users"
          element={
            <SuperAdminOnly>
              <UsersPage />
            </SuperAdminOnly>
          }
        />
      </Route>
      <Route
        path="/"
        element={<Navigate to={token ? "/cashier" : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={token ? "/cashier" : "/login"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NetworkStatus />
      <AppRoutes />
    </BrowserRouter>
  );
}
