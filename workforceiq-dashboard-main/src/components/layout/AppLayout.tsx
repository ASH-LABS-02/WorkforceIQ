import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { User } from '@/types/auth';
import { Sidebar } from './Sidebar';
import { Loader2 } from 'lucide-react';

export function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-[260px] transition-all duration-200 p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
