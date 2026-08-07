import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageSkeleton } from '../components/ui/Skeleton';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
