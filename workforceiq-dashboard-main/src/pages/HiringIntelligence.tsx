import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronRight, Brain, Shield, TrendingUp, Loader2, RefreshCw, UserCheck, UserX, Clock } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface RadarSkill { skill: string; value: number; }
interface SkillGap { skill: string; current: number; required: number; }

interface CandidateProfile {
  name: string;
  email?: string;
  phone?: string;
  role: string;
  summary: string;
  skills: string[];
  experience_years: number;
  education?: string;
}

interface HiringAnalysis {
  candidate_id: string;
  profile: CandidateProfile;
  fit_score: number;
  hiring_probability: number;
  skill_match: number;
  bias_status: 'clear' | 'review';
  strengths: string[];
  skill_gaps: string[];
  ai_explanation: string;
  radar_data: RadarSkill[];
  skill_gap_chart: SkillGap[];
  recommendation: 'advance' | 'hold' | 'reject';
}

const RECOMMENDATION_COLORS = {
  advance: 'bg-success/15 text-success',
  hold: 'bg-warning/15 text-warning',
  reject: 'bg-destructive/15 text-destructive',
};

const RECOMMENDATION_ICONS = {
  advance: UserCheck,
  hold: Clock,
  reject: UserX,
};

export default function HiringIntelligence() {
  const [candidates, setCandidates] = useState<HiringAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'fit_score' | 'hiring_probability'>('fit_score');

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Try live backend
      const res = await fetch(`${API_BASE}/api/candidates`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data: HiringAnalysis[] = await res.json();
        if (data.length > 0) {
          setCandidates(data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Backend unavailable — fall through to localStorage
    }

    // 2. Fall back to localStorage (cached from uploads)
    const cached = localStorage.getItem('wiq_candidates');
    if (cached) {
      try {
        setCandidates(JSON.parse(cached));
      } catch {
        setCandidates([]);
      }
    } else {
      setCandidates([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const filtered = candidates
    .filter(c =>
      (c.profile?.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (c.profile?.role?.toLowerCase() || '').includes(search.toLowerCase())
    )
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const candidate = candidates.find(c => c.candidate_id === selected);

  const handleAction = (action: string) => {
    if (!candidate) return;
    const messages: Record<string, string> = {
      advance: `✅ ${candidate.profile.name} advanced to interview stage`,
      hold: `⏸ ${candidate.profile.name} placed on hold`,
      reject: `❌ ${candidate.profile.name} rejected`,
    };
    toast.success(messages[action] || 'Action taken');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading candidate analyses…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> Hiring Intelligence
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-powered candidate evaluation · {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} analyzed
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCandidates} className="border-border gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {candidates.length === 0 ? (
        <div className="glass-panel p-16 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium mb-1">No candidates yet</p>
          <p className="text-muted-foreground text-sm">
            Upload a resume on the <strong>Resume Upload</strong> page to get AI-powered analysis here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidate List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search candidates..."
                  className="pl-9 bg-card border-border"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortBy(s => s === 'fit_score' ? 'hiring_probability' : 'fit_score')}
                className="border-border"
                title={`Sorted by ${sortBy === 'fit_score' ? 'Fit Score' : 'Hiring Probability'}`}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground px-1">
              Sorted by: <span className="text-primary">{sortBy === 'fit_score' ? 'Fit Score' : 'Hiring Probability'}</span>
            </p>

            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-dark">
              {filtered.map(c => {
                const RecoIcon = RECOMMENDATION_ICONS[c.recommendation] || Clock;
                return (
                  <motion.button
                    key={c.candidate_id}
                    onClick={() => setSelected(c.candidate_id)}
                    className={cn(
                      'w-full glass-panel p-4 text-left flex items-center justify-between transition-all',
                      selected === c.candidate_id ? 'border-primary glow-primary' : 'hover:border-primary/30'
                    )}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.profile.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.profile.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <RecoIcon className="h-3 w-3" />
                        <span className={cn('text-[10px] font-medium capitalize', RECOMMENDATION_COLORS[c.recommendation])}>
                          {c.recommendation}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{c.fit_score.toFixed(0)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Fit Score</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {candidate ? (
                <motion.div key={candidate.candidate_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Header */}
                  <div className="glass-panel p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-foreground">{candidate.profile.name}</h2>
                        <p className="text-muted-foreground text-sm">{candidate.profile.role}</p>
                        {candidate.profile.email && (
                          <p className="text-xs text-muted-foreground mt-0.5">{candidate.profile.email}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {candidate.profile.experience_years}yr experience
                          {candidate.profile.education && ` · ${candidate.profile.education}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          candidate.bias_status === 'clear' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                        )}>
                          <Shield className="inline h-3 w-3 mr-1" />
                          Bias: {candidate.bias_status === 'clear' ? 'Clear' : 'Needs Review'}
                        </div>
                        <div className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize', RECOMMENDATION_COLORS[candidate.recommendation])}>
                          {candidate.recommendation}
                        </div>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-background rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-primary">{candidate.fit_score.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground mt-1">Fit Score</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-accent">{(candidate.hiring_probability * 100).toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground mt-1">Hiring Probability</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-success">{candidate.skill_match.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground mt-1">Skill Match</p>
                      </div>
                    </div>

                    {/* Charts */}
                    {candidate.radar_data.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Skill Profile</h4>
                          <ResponsiveContainer width="100%" height={220}>
                            <RadarChart data={candidate.radar_data}>
                              <PolarGrid stroke="hsl(215 19% 23%)" />
                              <PolarAngleAxis dataKey="skill" tick={{ fill: 'hsl(215 16% 65%)', fontSize: 11 }} />
                              <Radar dataKey="value" stroke="hsl(263 84% 58%)" fill="hsl(263 84% 58%)" fillOpacity={0.2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Skill Gaps</h4>
                          {candidate.skill_gap_chart.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                              <BarChart data={candidate.skill_gap_chart} layout="vertical">
                                <XAxis type="number" stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="skill" stroke="hsl(215 16% 65%)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                                <Tooltip contentStyle={{ background: 'hsl(217 33% 17%)', border: '1px solid hsl(215 19% 23%)', borderRadius: '8px', color: 'hsl(210 40% 96%)' }} />
                                <Bar dataKey="current" name="Current" fill="hsl(263 84% 58%)" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="required" name="Required" fill="hsl(215 19% 23%)" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No significant skill gaps identified</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Strengths & Gaps */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel p-4">
                      <h4 className="text-sm font-semibold text-success mb-3">✅ Strengths</h4>
                      <ul className="space-y-1.5">
                        {candidate.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-success shrink-0">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="glass-panel p-4">
                      <h4 className="text-sm font-semibold text-warning mb-3">⚠ Development Areas</h4>
                      <ul className="space-y-1.5">
                        {candidate.skill_gaps.map((g, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-warning shrink-0">•</span>
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <div className="glass-panel p-5">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> AI Analysis
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">GPT-4o</span>
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{candidate.ai_explanation}</p>
                  </div>

                  {/* Skills */}
                  {candidate.profile.skills.length > 0 && (
                    <div className="glass-panel p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.profile.skills.map((skill, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button onClick={() => handleAction('advance')} className="gradient-primary text-primary-foreground gap-2">
                      <UserCheck className="h-4 w-4" /> Advance to Interview
                    </Button>
                    <Button variant="outline" onClick={() => handleAction('hold')} className="border-border gap-2">
                      <Clock className="h-4 w-4" /> Hold
                    </Button>
                    <Button variant="outline" onClick={() => handleAction('reject')} className="border-destructive text-destructive hover:bg-destructive/10 gap-2">
                      <UserX className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-panel p-12 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a candidate to view detailed AI analysis</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
