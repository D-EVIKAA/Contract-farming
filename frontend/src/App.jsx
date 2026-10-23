import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./context/ToastContext";
import { LanguageProvider } from "./context/LanguageContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FarmMarketplace from "./pages/marketplace/FarmMarketplace";
import FarmProgressCenter from "./pages/progress/FarmProgressCenter";
import SmartInsights from "./pages/insights/SmartInsights";
import DisputeCenter from "./pages/disputes/DisputeCenter";
import ActivityCenter from "./pages/activity/ActivityCenter";
import ProfilePage from "./pages/profile/ProfilePage";

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/farmer"
            element={
              <ProtectedRoute allowedRoles={["farmer"]}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer"
            element={
              <ProtectedRoute allowedRoles={["buyer"]}>
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/marketplace"
            element={
              <ProtectedRoute allowedRoles={["farmer", "buyer", "admin"]}>
                <FarmMarketplace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <ProtectedRoute allowedRoles={["farmer", "buyer", "admin"]}>
                <FarmProgressCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/insights"
            element={
              <ProtectedRoute allowedRoles={["farmer", "buyer", "admin"]}>
                <SmartInsights />
              </ProtectedRoute>
            }
          />

          <Route
            path="/disputes"
            element={
              <ProtectedRoute allowedRoles={["farmer", "buyer", "admin"]}>
                <DisputeCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/activity"
            element={
              <ProtectedRoute allowedRoles={["farmer", "buyer", "admin"]}>
                <ActivityCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["farmer", "buyer", "admin"]}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
