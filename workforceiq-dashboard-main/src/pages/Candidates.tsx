import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, UserPlus, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface Candidate {
  candidate_id: string;
  profile: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
  };
  fit_score: number;
  recommendation: string;
  uploaded_at?: string;
}

function statusColor(score: number) {
  if (score >= 85) return 'bg-success/15 text-success';
  if (score >= 70) return 'bg-primary/15 text-primary';
  if (score >= 50) return 'bg-warning/15 text-warning';
  return 'bg-destructive/15 text-destructive';
}

function getRecommendationLabel(score: number) {
  if (score >= 85) return 'Shortlisted';
  if (score >= 70) return 'In Review';
  if (score >= 50) return 'Under Consideration';
  return 'Rejected';
}

export default function Candidates() {
  const [search, setSearch] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const data = await api.get<Candidate[]>('/api/candidates');
        // Sort by upload date descending
        const sorted = data.sort((a, b) => {
          const dateA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
          const dateB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
          return dateB - dateA;
        });
        setCandidates(sorted);
      } catch (error) {
        console.error('Failed to fetch candidates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const filtered = candidates.filter(c =>
    (c.profile?.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.profile?.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.profile?.role?.toLowerCase() || '').includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center">
        <div className="bg-primary/10 p-6 rounded-full">
          <Users className="h-16 w-16 text-primary" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-2">No Candidates Yet</h2>
          <p className="text-muted-foreground mb-6">
            You haven't uploaded any resumes yet. Start by uploading a candidate profile to see AI-driven insights.
          </p>
          <Link to="/upload">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto"
            >
              <UserPlus className="h-5 w-5" /> Upload Resume
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Candidates
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and track all {candidates.length} processed candidates</p>
        </div>
        <Link to="/upload">
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="hidden md:flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <UserPlus className="h-4 w-4" /> Add New
          </motion.button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-9 bg-card border-border h-11"
        />
      </div>

      <div className="glass-panel overflow-hidden border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-bold text-muted-foreground px-6 py-4 uppercase tracking-wider">Candidate Name</th>
                <th className="text-left text-xs font-bold text-muted-foreground px-6 py-4 uppercase tracking-wider">Contact Info</th>
                <th className="text-left text-xs font-bold text-muted-foreground px-6 py-4 uppercase tracking-wider">AI Status</th>
                <th className="text-left text-xs font-bold text-muted-foreground px-6 py-4 uppercase tracking-wider">Fit Score</th>
                <th className="text-left text-xs font-bold text-muted-foreground px-6 py-4 uppercase tracking-wider">Processed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((c, i) => {
                const score = c.fit_score || 0;
                return (
                  <motion.tr
                    key={c.candidate_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-primary/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {(c.profile?.name || 'C').charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{c.profile?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-muted-foreground">{c.profile?.email || 'No Email'}</div>
                      <div className="text-[10px] text-muted-foreground/60">{c.profile?.phone || 'No Phone'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold uppercase border', statusColor(score))}>
                        {getRecommendationLabel(score)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-foreground">{score.toFixed(0)}</div>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-primary" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                      {c.uploaded_at ? new Date(c.uploaded_at).toLocaleDateString() : 'Recently'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

