import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { User, UserRole } from "@/types/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Candidates from "@/pages/Candidates";
import ResumeUpload from "@/pages/ResumeUpload";
import HiringIntelligence from "@/pages/HiringIntelligence";
import PerformanceAgent from "@/pages/PerformanceAgent";
import AttritionAgent from "@/pages/AttritionAgent";
import CareerAgent from "@/pages/CareerAgent";
import WorkforceAnalytics from "@/pages/WorkforceAnalytics";
import Explainability from "@/pages/Explainability";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && user && !roles.includes(user.role)) {
    // If user is a 'user' role, redirect to upload as their default dashboard
    if (user.role === 'user') return <Navigate to="/upload" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<AppLayout />}>
                {/* HR & Admin Routes */}
                <Route path="/" element={
                  <ProtectedRoute roles={['admin', 'hr', 'manager', 'recruiter']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/candidates" element={
                  <ProtectedRoute roles={['admin', 'hr', 'manager', 'recruiter']}>
                    <Candidates />
                  </ProtectedRoute>
                } />

                {/* Shared Routes */}
                <Route path="/upload" element={<ResumeUpload />} />

                {/* AI Agents (HR Only) */}
                <Route path="/agents/hiring-intelligence" element={
                  <ProtectedRoute roles={['admin', 'hr', 'manager', 'recruiter']}>
                    <HiringIntelligence />
                  </ProtectedRoute>
                } />
                <Route path="/agents/performance" element={
                  <ProtectedRoute roles={['admin', 'hr', 'manager', 'recruiter']}>
                    <PerformanceAgent />
                  </ProtectedRoute>
                } />
                <Route path="/agents/attrition" element={
                  <ProtectedRoute roles={['admin', 'hr', 'manager', 'recruiter']}>
                    <AttritionAgent />
                  </ProtectedRoute>
                } />
                <Route path="/agents/career" element={
                  <ProtectedRoute roles={['admin', 'hr', 'manager', 'recruiter']}>
                    <CareerAgent />
                  </ProtectedRoute>
                } />
                <Route path="/agents/workforce-analytics" element={
                  <ProtectedRoute roles={['admin', 'hr', 'manager', 'recruiter']}>
                    <WorkforceAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/agents/explainability" element={
                  <ProtectedRoute roles={['admin', 'hr', 'manager', 'recruiter']}>
                    <Explainability />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute roles={['admin', 'hr', 'manager', 'recruiter']}>
                    <Reports />
                  </ProtectedRoute>
                } />

                {/* Shared Settings */}
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
