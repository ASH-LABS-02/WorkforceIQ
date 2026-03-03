import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Star, Loader2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface PerformanceEmployee {
  name: string;
  dept: string;
  score: number;
  trend: string;
  readiness: string;
  ai_summary: string;
}

interface KPIPoint {
  kpi: string;
  value: number;
}

interface TrendPoint {
  q: string;
  score: number;
}

interface PerformanceData {
  employee: PerformanceEmployee;
  kpi_data: KPIPoint[];
  trend_data: TrendPoint[];
}

export default function PerformanceAgent() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPerformance() {
      try {
        setLoading(true);
        let candidateId = '';
        const saved = localStorage.getItem('wiq_candidates');
        if (saved) {
          const candidates = JSON.parse(saved);
          if (candidates.length > 0) {
            candidateId = candidates[0].candidate_id;
          }
        }

        // If still no ID, try fetching from backend (for HR/Admin who just logged in)
        if (!candidateId) {
          const allCandidates = await api.get<any[]>('/api/candidates');
          if (allCandidates && allCandidates.length > 0) {
            candidateId = allCandidates[0].candidate_id;
            // Also sync to localStorage for other pages
            localStorage.setItem('wiq_candidates', JSON.stringify(allCandidates.slice(0, 10)));
          }
        }

        if (!candidateId) {
          setData(null);
          setLoading(false);
          return;
        }

        const perfData = await api.post<PerformanceData>(`/api/agents/performance/${candidateId}`);
        setData(perfData);
      } catch (err: any) {
        console.error('Performance Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPerformance();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-lg font-medium">Evaluating performance metrics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center">
        <div className="bg-primary/10 p-6 rounded-full">
          <TrendingUp className="h-16 w-16 text-primary" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-2">No Performance Data</h2>
          <p className="text-muted-foreground mb-6">
            Upload a resume to generate full AI performance evaluations and trajectory predictions.
          </p>
          <Link to="/upload">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto"
            >
              <UserPlus className="h-5 w-5" /> Start Upload
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  const { employee: emp, kpi_data, trend_data } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> Performance Agent
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track and analyze employee performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Summary Card */}
        <div className="space-y-4">
          <div className="glass-panel p-6 border-primary bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Active Analysis</p>
                <h2 className="text-lg font-bold text-foreground mt-0.5">{emp.name}</h2>
                <p className="text-sm text-muted-foreground">{emp.dept}</p>
              </div>
              <div className="text-3xl font-bold text-primary">{emp.score}</div>
            </div>

            <div className="space-y-4 mt-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Star className="h-3 w-3" /> Promotion Readiness
                </p>
                <span className={cn(
                  'text-xs px-3 py-1 rounded-full font-bold',
                  emp.readiness === 'Ready' ? 'bg-success/15 text-success' :
                    emp.readiness === 'Not Ready' ? 'bg-destructive/15 text-destructive' :
                      'bg-warning/15 text-warning'
                )}>
                  {emp.readiness}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">AI Summary</p>
                <p className="text-xs text-foreground leading-relaxed italic">"{emp.ai_summary}"</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h4 className="text-sm font-semibold text-foreground mb-4">KPI Breakdown</h4>
            <div className="space-y-4">
              {kpi_data.map((kpi, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">{kpi.kpi}</span>
                    <span className="font-bold text-foreground">{kpi.value}%</span>
                  </div>
                  <div className="w-full h-1 bg-muted rounded-full">
                    <div
                      className="h-1 bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${kpi.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-semibold text-foreground">Performance Trend</h4>
              <div className="flex items-center gap-2">
                < Award className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-accent">Trajectory: {emp.trend.toUpperCase()}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trend_data}>
                <XAxis dataKey="q" stroke="hsl(215 16% 65%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215 16% 65%)" fontSize={12} tickLine={false} axisLine={false} domain={[60, 100]} />
                <Tooltip contentStyle={{ background: 'hsl(217 33% 17%)', border: '1px solid hsl(215 19% 23%)', borderRadius: '8px', color: 'hsl(210 40% 96%)' }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(263 84% 58%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(263 84% 58%)', r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel p-6">
            <h4 className="text-sm font-semibold text-foreground mb-6">Strategic Potential</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={kpi_data}>
                <XAxis dataKey="kpi" stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'hsl(217 33% 17%)', border: '1px solid hsl(215 19% 23%)', borderRadius: '8px', color: 'hsl(210 40% 96%)' }} />
                <Bar dataKey="value" fill="hsl(263 84% 58%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

