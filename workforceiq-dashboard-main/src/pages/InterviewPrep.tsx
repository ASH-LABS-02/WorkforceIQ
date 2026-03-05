import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { MessageSquare, Lightbulb, UserCheck, Code, AlertCircle, Loader2, ChevronDown, CheckCircle, BrainCircuit } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface InterviewQuestion {
    question: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topic: string;
    hint: string;
}

interface InterviewResponse {
    questions: InterviewQuestion[];
    overall_advice: string;
}

export default function InterviewPrep() {
    const { user } = useAuth();
    const [data, setData] = useState<InterviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [visibleHint, setVisibleHint] = useState<number | null>(null);

    // Check for resume
    const candidatesStr = localStorage.getItem('wiq_current_resume');
    const hasResume = !!candidatesStr;

    useEffect(() => {
        if (!hasResume) {
            setLoading(false);
            return;
        }

        const fetchQuestions = async () => {
            try {
                const resumeData = JSON.parse(candidatesStr);
                const candidateId = resumeData.candidate_id;

                const response = await api.post<InterviewResponse>(`/api/agents/interview/${candidateId}`);
                setData(response);
            } catch (error) {
                console.error("Error fetching interview questions:", error);
                toast.error("Failed to load interview preparation material.");
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [hasResume, candidatesStr]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                        <BrainCircuit className="h-12 w-12 text-primary animate-pulse relative z-10" />
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating custom interview questions from your unique skills...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!hasResume) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Interview Prep</h1>
                        <p className="text-muted-foreground mt-1">Get AI-generated interview questions based on your resume.</p>
                    </div>
                </div>

                <div className="glass-panel p-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto border-dashed border-2">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <AlertCircle className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">No Resume Profile Found</h2>
                    <p className="text-muted-foreground mb-8 max-w-md">
                        Please upload your resume first so the Interview Agent can analyze your skills and generate customized technical questions for you.
                    </p>
                    <Button onClick={() => window.location.href = '/upload'} size="lg" className="rounded-full px-8">
                        Upload Your Resume
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                    <MessageSquare className="h-7 w-7 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        Interview Preparation
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Customized technical questions tailored to your specific skillset.
                    </p>
                </div>
            </div>

            {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Main Questions Column */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Code className="h-5 w-5 text-primary" /> Technical Questions
                            </h2>
                            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">
                                {data.questions.length} Questions Generated
                            </span>
                        </div>

                        {data.questions.map((q: any, idx: number) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass-panel overflow-hidden border border-border/50 hover:border-primary/30 transition-colors"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                                {idx + 1}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                                Topic: <span className="text-foreground">{q.topic}</span>
                                            </span>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${q.difficulty === 'Easy' ? 'bg-success/10 text-success' :
                                            q.difficulty === 'Medium' ? 'bg-warning/10 text-warning' :
                                                'bg-destructive/10 text-destructive'
                                            }`}>
                                            {q.difficulty}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-medium text-foreground mb-4 pr-8">
                                        {q.question}
                                    </h3>

                                    <div className="pt-4 border-t border-border/50">
                                        <button
                                            onClick={() => setVisibleHint(visibleHint === idx ? null : idx)}
                                            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
                                        >
                                            <Lightbulb className="h-4 w-4 group-hover:fill-primary/20 transition-all" />
                                            {visibleHint === idx ? 'Hide Hint' : 'Show Hint'}
                                            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${visibleHint === idx ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {visibleHint === idx && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border text-sm text-muted-foreground leading-relaxed">
                                                        <strong className="text-foreground block mb-1">Key talking points:</strong>
                                                        {q.hint}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Sidebar / Advice Column */}
                    <div className="space-y-6">
                        <div className="glass-panel p-6 bg-gradient-to-b from-card to-muted/20 border-primary/20">
                            <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
                                <UserCheck className="h-5 w-5 text-primary" /> Assessor Notes
                            </h3>
                            <div className="prose prose-sm dark:prose-invert">
                                <p className="text-muted-foreground leading-relaxed">
                                    {data.overall_advice}
                                </p>
                            </div>
                        </div>

                        <div className="glass-panel p-6 border-transparent bg-primary/5">
                            <h3 className="font-bold text-lg mb-3">Interview Tips</h3>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <span>Use the <strong>STAR</strong> method (Situation, Task, Action, Result) for behavioral aspects.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <span>If you don't know an answer, clearly explain your thought process for finding the solution.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <span>Review the hints provided to ensure you hit all technical buzzwords.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
