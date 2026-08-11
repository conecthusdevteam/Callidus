import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="grid h-screen place-items-center bg-background" />;
  }

  if (!user) return <Navigate to="/" replace />;

  return <Outlet />;
}
