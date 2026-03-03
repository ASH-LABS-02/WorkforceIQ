import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Brain, TrendingUp, AlertTriangle,
  Target, BarChart3, Eye, FileText, Settings, LogOut, ChevronLeft,
  ChevronRight, Upload, Zap
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'hr', 'manager', 'recruiter'] },
  { to: '/candidates', icon: Users, label: 'Candidates', roles: ['admin', 'hr', 'manager', 'recruiter'] },
  { to: '/upload', icon: Upload, label: 'Resume Upload', roles: ['admin', 'hr', 'manager', 'recruiter', 'user'] },
  { type: 'divider' as const, label: 'AI Agents', roles: ['admin', 'hr', 'manager', 'recruiter'] },
  { to: '/agents/hiring-intelligence', icon: Brain, label: 'Hiring Intelligence', roles: ['admin', 'hr', 'manager', 'recruiter'] },
  { to: '/agents/performance', icon: TrendingUp, label: 'Performance', roles: ['admin', 'hr', 'manager', 'recruiter'] },
  { to: '/agents/attrition', icon: AlertTriangle, label: 'Attrition', roles: ['admin', 'hr', 'manager', 'recruiter'] },
  { to: '/agents/career', icon: Target, label: 'Career Path', roles: ['admin', 'hr', 'manager', 'recruiter'] },
  { to: '/agents/workforce-analytics', icon: BarChart3, label: 'Analytics', roles: ['admin', 'hr', 'manager', 'recruiter'] },
  { to: '/agents/explainability', icon: Eye, label: 'Explainability', roles: ['admin', 'hr', 'manager', 'recruiter'] },
  { type: 'divider' as const, label: 'System', roles: ['admin', 'hr', 'manager', 'recruiter'] },
  { to: '/reports', icon: FileText, label: 'Reports', roles: ['admin', 'hr', 'manager', 'recruiter'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'hr', 'manager', 'recruiter', 'user'] },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40 scrollbar-dark overflow-y-auto overflow-x-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-lg text-foreground whitespace-nowrap"
            >
              Workforce<span className="text-gradient">IQ</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems
          .filter(item => !item.roles || (user && item.roles.includes(user.role as any)))
          .map((item, i) => {
            if ('type' in item && item.type === 'divider') {
              return !collapsed ? (
                <div key={i} className="px-3 pt-4 pb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ) : <div key={i} className="h-px bg-sidebar-border my-3 mx-2" />;
            }
            if (!('to' in item)) return null;
            const Icon = (item as any).icon;
            return (
              <NavLink
                key={(item as any).to}
                to={(item as any).to}
                end={(item as any).to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 group',
                    isActive
                      ? 'bg-primary/15 text-primary glow-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {(item as any).label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
      </nav>

      {/* User & Collapse */}
      <div className="border-t border-sidebar-border p-3 space-y-2 shrink-0">
        {!collapsed && user && (
          <div className="px-2 py-2">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.role}</p>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive rounded-md hover:bg-muted/50 transition-colors flex-1"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
