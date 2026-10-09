import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Requires login
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
};

// Requires admin role
export const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

// Redirect if already logged in
export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-krunch-black flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full border-2 border-krunch-red border-t-transparent animate-spin" />
      <p className="text-krunch-gray font-body text-sm">Loading...</p>
    </div>
  </div>
);
