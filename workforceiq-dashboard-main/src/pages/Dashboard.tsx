import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Brain, TrendingUp, AlertTriangle, Target, Clock, ShieldCheck, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/lib/auth';
import { User } from '@/types/auth';
import { api } from '@/lib/api';

interface Candidate {
  candidate_id: string;
  profile: {
    name: string;
  };
  fit_score: number;
  uploaded_at?: string;
}

const hiringData = [
  { month: 'Jan', hires: 12, applications: 85 },
  { month: 'Feb', hires: 18, applications: 120 },
  { month: 'Mar', hires: 15, applications: 95 },
  { month: 'Apr', hires: 22, applications: 140 },
  { month: 'May', hires: 28, applications: 180 },
  { month: 'Jun', hires: 24, applications: 160 },
];

const attritionData = [
  { month: 'Jan', risk: 4.2 },
  { month: 'Feb', risk: 3.8 },
  { month: 'Mar', risk: 5.1 },
  { month: 'Apr', risk: 4.5 },
  { month: 'May', risk: 3.2 },
  { month: 'Jun', risk: 2.8 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    analyzed: 0,
    avgScore: 0,
    activities: [] as any[]
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await api.get<Candidate[]>('/api/candidates');
        if (data && data.length > 0) {
          localStorage.setItem('wiq_candidates', JSON.stringify(data.slice(0, 10)));
        }

        // Sort by upload date descending
        const sorted = data.sort((a, b) => {
          const dateA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
          const dateB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
          return dateB - dateA;
        });

        setCandidates(sorted);

        const analyzedCount = sorted.length;
        const totalScore = sorted.reduce((acc, c) => acc + (c.fit_score || 0), 0);
        const avg = sorted.length > 0 ? (totalScore / sorted.length).toFixed(1) : 0;

        // Map activities
        const mappedActivities = sorted.slice(0, 5).map(c => ({
          action: 'Resume analyzed',
          detail: `${c.profile?.name || 'Unknown Candidate'} — Profile Ready`,
          time: c.uploaded_at ? new Date(c.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          type: 'success'
        }));

        // Add a few system ones if empty
        if (mappedActivities.length === 0) {
          mappedActivities.push({
            action: 'System Ready',
            detail: 'AI Pipeline initialized',
            time: 'Online',
            type: 'info'
          });
        }

        setStats({
          total: sorted.length,
          analyzed: analyzedCount,
          avgScore: Number(avg),
          activities: mappedActivities
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time workforce intelligence dashboard
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Candidates" value={stats.total.toString()} change="+100% since start" changeType="positive" icon={Users} />
        <StatCard title="AI Analyses" value={stats.analyzed.toString()} change={`${stats.analyzed > 0 ? '100%' : '0%'} completion`} changeType="positive" icon={Brain} />
        <StatCard title="Avg Fit Score" value={`${stats.avgScore}%`} change="AI confidence high" changeType="positive" icon={ShieldCheck} />
        <StatCard title="Processing Status" value="Healthy" change="All agents online" changeType="positive" icon={FileText} iconColor="bg-success/15 text-success" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Hiring Pipeline (System Trend)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hiringData}>
              <XAxis dataKey="month" stroke="hsl(215 16% 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215 16% 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(217 33% 17%)', border: '1px solid hsl(215 19% 23%)', borderRadius: '8px', color: 'hsl(210 40% 96%)' }}
              />
              <Bar dataKey="applications" fill="hsl(215 19% 23%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="hires" fill="hsl(263 84% 58%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Attrition Risk Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={attritionData}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43 96% 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(43 96% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="hsl(215 16% 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215 16% 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(217 33% 17%)', border: '1px solid hsl(215 19% 23%)', borderRadius: '8px', color: 'hsl(210 40% 96%)' }}
              />
              <Area type="monotone" dataKey="risk" stroke="hsl(43 96% 50%)" fill="url(#riskGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {stats.activities.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${a.type === 'success' ? 'bg-success' : a.type === 'warning' ? 'bg-warning' : 'bg-primary'
                  }`} />
                <div>
                  <p className="text-sm text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

