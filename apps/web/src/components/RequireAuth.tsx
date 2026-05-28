import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuthStore();
  if (!hydrated) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuthStore();
  if (!hydrated) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}
