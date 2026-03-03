import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCircle, AlertTriangle, Loader2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';

interface FeatureImportance {
  feature: string;
  importance: number;
}

interface FairnessMetric {
  category: string;
  disparity: number;
  status: string;
}

interface ExplainabilityData {
  feature_importance: FeatureImportance[];
  fairness_metrics: FairnessMetric[];
  model_type: string;
  training_data: string;
  accuracy_metrics: string;
  transparency_summary: string;
}

export default function Explainability() {
  const [data, setData] = useState<ExplainabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExplainability() {
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

        const explainData = await api.post<ExplainabilityData>(`/api/agents/explainability/${candidateId}`);
        setData(explainData);
      } catch (err: any) {
        console.error('Explainability Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchExplainability();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-lg font-medium">Auditing AI decision models...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center">
        <div className="bg-primary/10 p-6 rounded-full">
          <Eye className="h-16 w-16 text-primary" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-2">No Model Audits</h2>
          <p className="text-muted-foreground mb-6">
            Upload a resume to see full feature importance weights and algorithmic fairness audits for that candidate.
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
          <Eye className="h-6 w-6 text-primary" /> Model Explainability
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{data.transparency_summary || "Understand AI decisions with full transparency"}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">AI Feature Weight Attribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.feature_importance} layout="vertical">
              <XAxis type="number" stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="feature" stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} width={120} />
              <Tooltip contentStyle={{ background: 'hsl(217 33% 17%)', border: '1px solid hsl(215 19% 23%)', borderRadius: '8px', color: 'hsl(210 40% 96%)' }} />
              <Bar dataKey="importance" fill="hsl(263 84% 58%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Fairness */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Algorithmic Fairness Indicators</h3>
          <div className="space-y-4">
            {data.fairness_metrics.map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-card/30 border border-border/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {m.status === 'pass' ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.category}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-0.5">DISPARITY INDEX: {m.disparity.toFixed(3)}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${m.status === 'pass' ? 'bg-success/15 text-success border border-success/30' : 'bg-warning/15 text-warning border border-warning/30'
                  }`}>
                  {m.status === 'pass' ? 'Compliant' : 'Review Required'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Transparency Report */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Audit Transparency Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card/30 border border-border/50 rounded-lg p-5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Model Architecture</p>
            <p className="text-sm font-medium text-foreground mt-2 leading-relaxed">{data.model_type}</p>
          </div>
          <div className="bg-card/30 border border-border/50 rounded-lg p-5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Training Foundation</p>
            <p className="text-sm font-medium text-foreground mt-2 leading-relaxed">{data.training_data}</p>
          </div>
          <div className="bg-card/30 border border-border/50 rounded-lg p-5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Validation Metrics</p>
            <p className="text-sm font-medium text-foreground mt-2 leading-relaxed">{data.accuracy_metrics}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

