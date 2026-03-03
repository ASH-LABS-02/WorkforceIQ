import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, TrendingDown, Loader2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface AttritionRisk {
  id: string;
  name: string;
  dept: string;
  risk: number;
  factors: string[];
  recommendation: string;
}

interface AttritionData {
  employees: AttritionRisk[];
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  summary: string;
}

function getRiskColor(risk: number) {
  if (risk >= 70) return 'text-destructive bg-destructive/15';
  if (risk >= 50) return 'text-warning bg-warning/15';
  return 'text-success bg-success/15';
}

function getRiskBarColor(risk: number) {
  if (risk >= 70) return 'bg-destructive';
  if (risk >= 50) return 'bg-warning';
  return 'bg-success';
}

export default function AttritionAgent() {
  const [data, setData] = useState<AttritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAttrition() {
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

        if (!candidateId) {
          const allCandidates = await api.get<any[]>('/api/candidates');
          if (allCandidates && allCandidates.length > 0) {
            candidateId = allCandidates[0].candidate_id;
            localStorage.setItem('wiq_candidates', JSON.stringify(allCandidates.slice(0, 10)));
          }
        }

        if (!candidateId) {
          setData(null);
          setLoading(false);
          return;
        }

        const attritionData = await api.post<AttritionData>(`/api/agents/attrition/${candidateId}`);
        setData(attritionData);
      } catch (err: any) {
        console.error('Attrition Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAttrition();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-lg font-medium">Analyzing attrition risks...</p>
      </div>
    );
  }

  if (!data || data.employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center">
        <div className="bg-primary/10 p-6 rounded-full">
          <AlertTriangle className="h-16 w-16 text-primary" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-2">No Profiles Found</h2>
          <p className="text-muted-foreground mb-6">
            Upload a resume first to see AI-driven attrition risk predictions for your candidates.
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-warning" /> Attrition Risk Agent
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{data.summary || "Predict and prevent employee turnover"}</p>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-5 text-center">
          <p className="text-3xl font-bold text-destructive">{data.high_risk_count}</p>
          <p className="text-xs text-muted-foreground mt-1">High Risk</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <p className="text-3xl font-bold text-warning">{data.medium_risk_count}</p>
          <p className="text-xs text-muted-foreground mt-1">Medium Risk</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <p className="text-3xl font-bold text-success">{data.low_risk_count}</p>
          <p className="text-xs text-muted-foreground mt-1">Low Risk</p>
        </div>
      </div>

      {/* Risk Table */}
      <div className="space-y-3">
        {data.employees.map((emp, i) => (
          <motion.div
            key={emp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{emp.name}</h3>
                <p className="text-xs text-muted-foreground">{emp.dept}</p>
              </div>
              <span className={cn('px-3 py-1 rounded-full text-xs font-bold', getRiskColor(emp.risk))}>
                {emp.risk}% Risk
              </span>
            </div>

            {/* Risk Bar */}
            <div className="w-full h-2 bg-muted rounded-full mb-3">
              <div className={cn('h-2 rounded-full transition-all', getRiskBarColor(emp.risk))} style={{ width: `${emp.risk}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Contributing Factors</p>
                <ul className="space-y-1">
                  {emp.factors.map((f, j) => (
                    <li key={j} className="text-xs text-foreground flex items-center gap-1.5">
                      <TrendingDown className="h-3 w-3 text-destructive shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Retention Recommendation</p>
                <p className="text-xs text-foreground flex items-start gap-1.5">
                  <Shield className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  {emp.recommendation}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

