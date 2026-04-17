import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router";
import { ToastProvider } from "./lib/toast";
import { useAuthStore } from "./store/authStore";

// Auth
import UserSelectPage from "./pages/auth/UserSelectPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

// Passenger
import PassengerDashboard from "./pages/passenger/PassengerDashboard";
import RequestRidePage from "./pages/passenger/RequestRidePage";
import PassengerWalletPage from "./pages/passenger/WalletPage";
import ActivityPage from "./pages/passenger/ActivityPage";
import PassengerStatsPage from "./pages/passenger/StatsPage";
import ProfilePage from "./pages/passenger/ProfilePage";

// Driver
import DriverDashboard from "./pages/driver/DriverDashboard";
import FindPassengersPage from "./pages/driver/FindPassengersPage";
import DocumentsPage from "./pages/driver/DocumentsPage";
import DriverWalletPage from "./pages/driver/DriverWalletPage";
import DriverStatsPage from "./pages/driver/DriverStatsPage";

// Admin
import AdminPanel from "./pages/admin/AdminPanel";

// ── Auth guards ───────────────────────────────────────────────────────────────

function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RedirectIfAuthed() {
  const { user } = useAuthStore();
  if (!user) return <UserSelectPage />;
  if (user.role === "DRIVER") return <Navigate to="/driver" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  return <Navigate to="/passenger" replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Root */}
          <Route path="/" element={<RedirectIfAuthed />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Passenger */}
          <Route path="/passenger" element={<RequireAuth role="PASSENGER"><PassengerDashboard /></RequireAuth>} />
          <Route path="/passenger/request" element={<RequireAuth role="PASSENGER"><RequestRidePage /></RequireAuth>} />
          <Route path="/passenger/wallet" element={<RequireAuth role="PASSENGER"><PassengerWalletPage /></RequireAuth>} />
          <Route path="/passenger/activity" element={<RequireAuth role="PASSENGER"><ActivityPage /></RequireAuth>} />
          <Route path="/passenger/stats" element={<RequireAuth role="PASSENGER"><PassengerStatsPage /></RequireAuth>} />
          <Route path="/passenger/profile" element={<RequireAuth role="PASSENGER"><ProfilePage /></RequireAuth>} />

          {/* Driver */}
          <Route path="/driver" element={<RequireAuth role="DRIVER"><DriverDashboard /></RequireAuth>} />
          <Route path="/driver/find" element={<RequireAuth role="DRIVER"><FindPassengersPage /></RequireAuth>} />
          <Route path="/driver/documents" element={<RequireAuth role="DRIVER"><DocumentsPage /></RequireAuth>} />
          <Route path="/driver/wallet" element={<RequireAuth role="DRIVER"><DriverWalletPage /></RequireAuth>} />
          <Route path="/driver/stats" element={<RequireAuth role="DRIVER"><DriverStatsPage /></RequireAuth>} />
          <Route path="/driver/activity" element={<RequireAuth role="DRIVER"><ActivityPage /></RequireAuth>} />
          <Route path="/driver/profile" element={<RequireAuth role="DRIVER"><ProfilePage /></RequireAuth>} />

          {/* Admin */}
          <Route path="/admin" element={<RequireAuth role="ADMIN"><AdminPanel /></RequireAuth>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
