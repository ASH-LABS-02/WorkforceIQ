import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, ArrowRight, Award, BookOpen, Loader2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';

interface SkillGap {
  skill: string;
  current: number;
  target: number;
}

interface RoleMatch {
  role: string;
  match: number;
  timeline: string;
}

interface Certification {
  name: string;
  provider: string;
  relevance: number;
}

interface Milestone {
  phase: string;
  role: string;
  status: string;
}

interface CareerData {
  skill_gaps: SkillGap[];
  role_matches: RoleMatch[];
  certifications: Certification[];
  timeline: Milestone[];
  career_summary: string;
}

export default function CareerAgent() {
  const [data, setData] = useState<CareerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCareer() {
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

        const careerData = await api.post<CareerData>(`/api/agents/career/${candidateId}`);
        setData(careerData);
      } catch (err: any) {
        console.error('Career Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCareer();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-lg font-medium">Mapping career path trajectory...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center">
        <div className="bg-primary/10 p-6 rounded-full">
          <Target className="h-16 w-16 text-primary" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-2">No Career Strategy</h2>
          <p className="text-muted-foreground mb-6">
            Upload a resume to generate AI-driven career roadmaps, skill gap analysis, and role suggestions.
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
          <Target className="h-6 w-6 text-accent" /> Career Path Agent
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{data.career_summary || "AI-driven career planning and skill development"}</p>
      </div>

      {/* Career Roadmap */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">AI-Generated Career Roadmap</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted">
          {data.timeline.map((t, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className={`px-4 py-3 rounded-lg text-center min-w-[140px] border ${t.status === 'active' ? 'gradient-primary text-primary-foreground border-transparent' :
                t.status === 'next' ? 'bg-primary/15 text-primary border-primary/30' :
                  'bg-muted/50 text-muted-foreground border-border'
                }`}>
                <p className="text-[10px] opacity-80 font-bold uppercase">{t.phase}</p>
                <p className="text-sm font-semibold mt-0.5">{t.role}</p>
              </div>
              {i < data.timeline.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Gap */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Strategic Skill Gaps</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.skill_gaps} layout="vertical">
              <XAxis type="number" domain={[0, 100]} stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="skill" stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} width={110} />
              <Tooltip contentStyle={{ background: 'hsl(217 33% 17%)', border: '1px solid hsl(215 19% 23%)', borderRadius: '8px', color: 'hsl(210 40% 96%)' }} />
              <Bar dataKey="current" fill="hsl(263 84% 58%)" radius={[0, 4, 4, 0]} name="Current Level" />
              <Bar dataKey="target" fill="hsl(215 19% 23%)" radius={[0, 4, 4, 0]} name="Target Requirement" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Role Matches */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-accent" /> Recommended Role Matches
          </h3>
          <div className="space-y-3">
            {data.role_matches.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card/50 border border-border/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">{r.role}</p>
                  <span className="text-sm font-bold text-primary">{r.match}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.match}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-1.5 bg-primary rounded-full"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">ESTIMATED TIMELINE: {r.timeline.toUpperCase()}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" /> Upskilling & Certifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.certifications.map((c, i) => (
            <div key={i} className="bg-card/30 border border-border/50 rounded-lg p-4">
              <p className="text-sm font-bold text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{c.provider}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full">
                  <div className="h-1.5 bg-accent rounded-full" style={{ width: `${c.relevance}%` }} />
                </div>
                <span className="text-[10px] text-accent font-bold">{c.relevance}% RELEVANCE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

