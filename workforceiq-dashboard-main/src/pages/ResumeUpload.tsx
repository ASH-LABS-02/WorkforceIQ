import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, CloudUpload, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface UploadedFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  candidateId?: string;
  candidateName?: string;
}

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PIPELINE_STAGES = [
  'File Validation',
  'Resume Parsing',
  'Skill Extraction',
  'Feature Engineering',
  'Hiring Model Evaluation',
  'Bias Check',
  'Explainability Generation',
  'Final Scoring',
];

export default function ResumeUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const [stageStatuses, setStageStatuses] = useState<('pending' | 'processing' | 'complete' | 'error')[]>(
    PIPELINE_STAGES.map(() => 'pending')
  );
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only PDF and DOCX files are accepted';
    if (file.size > MAX_SIZE) return 'File must be under 10MB';
    return null;
  };

  const addFiles = useCallback((newFiles: File[]) => {
    setAnalysisResult(null);
    const validated = newFiles.map(file => {
      const error = validateFile(file);
      return {
        file,
        progress: 0,
        status: error ? 'error' as const : 'pending' as const,
        error: error || undefined,
      };
    });
    setFiles(prev => [...prev, ...validated]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, [addFiles]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Animate upload progress bar (fake 0→90%, real finish at 100%)
  const animateProgress = async (index: number) => {
    for (let p = 0; p <= 90; p += 15) {
      await new Promise(r => setTimeout(r, 120));
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: p } : f));
    }
  };

  // Animate pipeline stages while real API call runs
  const animatePipeline = async (signal: AbortSignal) => {
    setStageStatuses(PIPELINE_STAGES.map(() => 'pending'));
    setActiveStage(0);

    const stageDelay = [400, 500, 400, 450, 600, 400, 500, 350];

    for (let s = 0; s < PIPELINE_STAGES.length; s++) {
      if (signal.aborted) break;
      setActiveStage(s);
      setStageStatuses(prev => prev.map((st, i) => i === s ? 'processing' : st));
      await new Promise(r => setTimeout(r, stageDelay[s]));
      if (signal.aborted) break;
      setStageStatuses(prev => prev.map((st, i) => i === s ? 'complete' : st));
    }
  };

  const uploadFileToBackend = async (fileEntry: UploadedFile, index: number) => {
    const abort = new AbortController();
    abortRef.current = abort;

    // Set uploading state
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'uploading', progress: 0 } : f));

    // Animate progress & pipeline concurrently
    const progressPromise = animateProgress(index);
    const pipelinePromise = animatePipeline(abort.signal);

    // Build form data
    const formData = new FormData();
    formData.append('file', fileEntry.file);

    let candidateName = 'Candidate';

    try {
      const data = await api.upload<any>('/api/candidates/upload', formData, abort.signal);
      candidateName = data.analysis?.profile?.name || 'Candidate';

      // Finish progress bar
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 100, status: 'processing', candidateId: data.analysis?.candidate_id, candidateName } : f));

      // Wait for pipeline animation to finish
      await pipelinePromise;
      await progressPromise;

      // Mark complete
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'complete', progress: 100 } : f));
      setAnalysisResult(data.analysis);

      // Store in localStorage so Agent pages can read the current candidate
      const existing: any[] = JSON.parse(localStorage.getItem('wiq_candidates') || '[]');
      existing.unshift(data.analysis);
      localStorage.setItem('wiq_candidates', JSON.stringify(existing.slice(0, 10))); // Keep last 10

      toast.success(`✅ Resume analyzed — ${candidateName} added to Hiring Intelligence`);
    } catch (err: unknown) {
      abort.abort();
      await progressPromise.catch(() => { });

      const message = err instanceof Error ? err.message : 'Upload failed';
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error', error: message, progress: 0 } : f));
      setStageStatuses(prev => prev.map((st, i) => i === activeStage ? 'error' : st));

      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error(`❌ ${message}`);
      }
    }
  };

  const handleUpload = async () => {
    const pendingFiles = files.map((f, i) => ({ f, i })).filter(({ f }) => f.status === 'pending');
    if (!pendingFiles.length) return;

    for (const { f, i } of pendingFiles) {
      await uploadFileToBackend(f, i);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const isUploading = files.some(f => f.status === 'uploading' || f.status === 'processing');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resume Upload</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload candidate resumes for real-time AI-powered analysis via OpenAI GPT-4o
        </p>
      </div>

      {/* Drop Zone */}
      <motion.div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'glass-panel border-2 border-dashed p-12 text-center cursor-pointer transition-all',
          isDragging ? 'border-primary bg-primary/5 glow-primary' : 'border-border hover:border-primary/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx"
          onChange={e => e.target.files && addFiles(Array.from(e.target.files))}
          className="hidden"
        />
        <CloudUpload className={cn('h-12 w-12 mx-auto mb-4', isDragging ? 'text-primary' : 'text-muted-foreground')} />
        <p className="text-foreground font-medium">
          {isDragging ? 'Drop files here' : 'Drag & drop resumes here'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">or click to browse — PDF, DOCX up to 10MB</p>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">GPT-4o</span>
          <span>powered analysis</span>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {files.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-panel p-4 flex items-center gap-4"
              >
                <FileText className={cn('h-8 w-8 shrink-0',
                  f.status === 'error' ? 'text-destructive' :
                    f.status === 'complete' ? 'text-success' : 'text-primary'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{f.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(f.file.size)}
                    {f.candidateName && (
                      <span className="ml-2 text-success">→ {f.candidateName}</span>
                    )}
                  </p>
                  {f.status === 'uploading' && <Progress value={f.progress} className="mt-2 h-1.5" />}
                  {f.error && <p className="text-xs text-destructive mt-1">{f.error}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {f.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {f.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                  {f.status === 'complete' && <CheckCircle className="h-4 w-4 text-success" />}
                  {f.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                  {(f.status === 'pending' || f.status === 'error') && (
                    <button onClick={() => removeFile(i)} className="p-1 hover:bg-muted rounded">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}

            {pendingCount > 0 && !isUploading && (
              <Button onClick={handleUpload} className="gradient-primary text-primary-foreground gap-2">
                <Upload className="h-4 w-4" /> Analyze {pendingCount} resume{pendingCount > 1 ? 's' : ''} with AI
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Pipeline */}
      {activeStage >= 0 && !analysisResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-foreground">AI Processing Pipeline</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">Real-time</span>
          </div>
          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 flex justify-center">
                  {stageStatuses[i] === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {stageStatuses[i] === 'complete' && <CheckCircle className="h-4 w-4 text-success" />}
                  {stageStatuses[i] === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                  {stageStatuses[i] === 'pending' && <div className="h-2 w-2 rounded-full bg-muted" />}
                </div>
                <span className={cn(
                  'text-sm',
                  stageStatuses[i] === 'processing' && 'text-primary font-medium',
                  stageStatuses[i] === 'complete' && 'text-success',
                  stageStatuses[i] === 'pending' && 'text-muted-foreground',
                  stageStatuses[i] === 'error' && 'text-destructive',
                )}>
                  {stage}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Analysis Results for Candidate */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-4"
          >
            <div className="glass-panel p-8 border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                  Personal Analysis Result
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Score Circle */}
                <div className="relative h-32 w-32 shrink-0">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle className="text-muted/20" strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                    <motion.circle
                      className="text-primary"
                      strokeWidth="8"
                      strokeDasharray="264"
                      initial={{ strokeDashoffset: 264 }}
                      animate={{ strokeDashoffset: 264 - (264 * analysisResult.fit_score) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">{analysisResult.fit_score.toFixed(0)}%</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Fit Score</span>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Great work, {analysisResult.profile?.name}!</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    Our AI has analyzed your profile for the <strong>{analysisResult.profile?.role}</strong> position.
                    Based on your experience and skills, here is your personalized match report.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border">
                    <span className="text-xs text-muted-foreground">Recommendation:</span>
                    <span className={cn(
                      "text-sm font-bold capitalize",
                      analysisResult.recommendation === 'advance' ? "text-success" :
                        analysisResult.recommendation === 'hold' ? "text-warning" : "text-destructive"
                    )}>
                      {analysisResult.recommendation === 'advance' ? "Highly Recommended" :
                        analysisResult.recommendation === 'hold' ? "Under Consideration" : "Development Needed"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Areas / Skill Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6">
                <h3 className="text-sm font-semibold text-success mb-4 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Your Top Strengths
                </h3>
                <ul className="space-y-3">
                  {analysisResult.strengths.slice(0, 3).map((s: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-3">
                      <span className="h-5 w-5 rounded-full bg-success/10 text-success flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-panel p-6 border-warning/20">
                <h3 className="text-sm font-semibold text-warning mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Skills to Develop
                </h3>
                <div className="space-y-4">
                  {analysisResult.skill_gaps.length > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground italic mb-2">
                        To increase your match score, we recommend focusing on:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.skill_gaps.map((skill: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 rounded-md bg-warning/5 border border-warning/20 text-warning text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">You have a very strong skill match for this role!</p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Narrative */}
            <div className="glass-panel p-6 bg-primary/5 border-primary/10">
              <h3 className="text-sm font-semibold text-primary mb-3">AI Career Insights</h3>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{analysisResult.ai_explanation}"
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setAnalysisResult(null)}
                className="text-xs border-border hover:bg-muted"
              >
                Analyze Another Resume
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
