import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps a route so it's only accessible to logged-in users.
// Pass `allowedRoles` (array) to further restrict it to specific roles,
// mirroring the backend's authorizeRoles() middleware.
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
