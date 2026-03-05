import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Briefcase, Plus, MapPin, Building, Clock, Users, CheckCircle, Upload, FileText, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface FirestoreTimestamp {
    toMillis: () => number;
}

interface HiringAnalysis {
    fit_score: number;
    profile: {
        name: string;
        email?: string;
        phone?: string;
        role?: string;
    };
    recommendation: 'advance' | 'hold' | 'reject';
    strengths: string[];
    ai_explanation: string;
}

interface Job {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string;
    requirements: string;
    status: 'open' | 'closed';
    createdAt?: FirestoreTimestamp;
}

interface Application {
    id: string;
    jobId: string;
    userId: string;
    candidateName: string;
    candidateEmail: string;
    status: 'pending' | 'reviewed';
    hrStatus?: 'pending' | 'accepted' | 'rejected';
    hrNote?: string;
    appliedAt?: FirestoreTimestamp;
    resumeData?: HiringAnalysis;
}

export default function Jobs() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // New Job Form State
    const [title, setTitle] = useState('');
    const [department, setDepartment] = useState('');
    const [location, setLocation] = useState('');
    const [type, setType] = useState('Full-time');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState('');

    // Application Form State
    const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // HR Review State
    const [viewingApplicantsJobId, setViewingApplicantsJobId] = useState<string | null>(null);
    const [decisionNote, setDecisionNote] = useState<string>('');
    const [isUpdatingDecision, setIsUpdatingDecision] = useState<string | null>(null);

    const isHR = user && ['admin', 'hr', 'manager', 'recruiter'].includes(user.role);

    const fetchJobs = async () => {
        try {
            let q;
            if (isHR && user?.role !== 'admin') {
                q = query(collection(db, 'jobs'), where('createdBy', '==', user?.id), orderBy('createdAt', 'desc'));
            } else {
                q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
            }

            const snapshot = await getDocs(q);
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as Job));
            setJobs(jobsData);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            // Fallback if composite index missing for createdAt
            try {
                let fallbackQ;
                if (isHR && user?.role !== 'admin') {
                    fallbackQ = query(collection(db, 'jobs'), where('createdBy', '==', user?.id));
                } else {
                    fallbackQ = query(collection(db, 'jobs'));
                }
                const fallbackSnapshot = await getDocs(fallbackQ);
                let fbJobsData = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as Job));
                fbJobsData = fbJobsData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                setJobs(fbJobsData);
            } catch (err) {
                console.error("Fallback error:", err);
            }
        }
    };

    const fetchApplications = async () => {
        if (!user) return;
        try {
            if (isHR) {
                // HR sees all applications
                const q = query(collection(db, 'applications'));
                const snapshot = await getDocs(q);
                setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as Application)));
            } else {
                // Users see only their own applications
                const q = query(collection(db, 'applications'), where('userId', '==', user.id));
                const snapshot = await getDocs(q);
                setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as Application)));
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchJobs();
            if (user) {
                await fetchApplications();
            }
            setLoading(false);
        };
        loadData();
    }, [user, isHR]);

    const handleHRDecision = async (applicationId: string, decision: 'accepted' | 'rejected') => {
        try {
            setIsUpdatingDecision(applicationId);
            const appRef = doc(db, 'applications', applicationId);
            await updateDoc(appRef, {
                hrStatus: decision,
                hrNote: decisionNote
            });
            toast.success(`Application marked as ${decision}`);
            setDecisionNote('');
            await fetchApplications();
        } catch (error) {
            console.error("Error updating decision:", error);
            toast.error("Failed to update application decision");
        } finally {
            setIsUpdatingDecision(null);
        }
    };

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !user) return;

        try {
            const jobData = {
                title,
                department,
                location,
                type,
                description,
                requirements,
                status: 'open',
                createdAt: serverTimestamp(),
                createdBy: user.id
            };

            await addDoc(collection(db, 'jobs'), jobData);
            toast.success("Job posted successfully!");
            setIsDialogOpen(false);
            setTitle('');
            setDepartment('');
            setLocation('');
            setType('Full-time');
            setDescription('');
            setRequirements('');
            fetchJobs();
        } catch (error) {
            console.error("Error adding job:", error);
            toast.error("Failed to post job");
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !applyingJobId) return;

        // Check if already applied
        if (applications.some(app => app.jobId === applyingJobId && app.userId === user.id)) {
            toast.error("You have already applied for this position.");
            setApplyingJobId(null);
            return;
        }

        try {
            setIsApplying(true);
            setUploadProgress(0);

            let resumeData = null;

            if (resumeFile) {
                // Animate fake progress
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => Math.min(prev + 10, 90));
                }, 300);

                const formData = new FormData();
                formData.append('file', resumeFile);

                try {
                    const data = await api.upload<unknown>('/api/candidates/upload', formData) as { analysis: unknown };
                    resumeData = data.analysis;

                    // Store as current resume globally to match standard behavior
                    const existing: unknown[] = JSON.parse(localStorage.getItem('wiq_candidates') || '[]');
                    existing.unshift(data.analysis);
                    localStorage.setItem('wiq_candidates', JSON.stringify(existing.slice(0, 10)));
                    localStorage.setItem('wiq_current_resume', JSON.stringify(data.analysis));
                } catch (err: unknown) {
                    const error = err as Error;
                    clearInterval(progressInterval);
                    toast.error(error.message || 'Failed to process resume via AI');
                    setIsApplying(false);
                    return;
                }

                clearInterval(progressInterval);
                setUploadProgress(100);
            } else {
                // Fallback to local storage if no file uploaded
                try {
                    const storedResumes = localStorage.getItem('wiq_current_resume');
                    if (storedResumes) {
                        resumeData = JSON.parse(storedResumes);
                    }
                } catch (e) { console.warn("No stored resume found to attach"); }
            }

            const appData = {
                jobId: applyingJobId,
                userId: user.id,
                candidateName: user.name || 'Applicant',
                candidateEmail: user.email || '',
                status: 'pending',
                hrStatus: 'pending',
                appliedAt: serverTimestamp(),
                resumeData: resumeData
            };

            await addDoc(collection(db, 'applications'), appData);
            toast.success("Application submitted successfully with AI evaluation!");
            setApplyingJobId(null);
            setResumeFile(null);
            fetchApplications();
        } catch (error) {
            console.error("Error applying:", error);
            toast.error("Failed to submit application");
        } finally {
            setIsApplying(false);
            setUploadProgress(0);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-primary" /> Job Board
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {isHR ? "Manage job postings and applications" : "Discover and apply for open positions"}
                    </p>
                </div>

                {isHR && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Post New Job
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create Job Posting</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateJob} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Job Title</Label>
                                        <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Input required value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input required value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Remote, NY" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Job Type</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                            value={type} onChange={e => setType(e.target.value)}
                                        >
                                            <option>Full-time</option>
                                            <option>Part-time</option>
                                            <option>Contract</option>
                                            <option>Internship</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Job Description</Label>
                                    <Textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the role and responsibilities..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Requirements & Qualifications</Label>
                                    <Textarea required rows={4} value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="List the required skills and experience..." />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit">Post Job</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] glass-panel text-center p-8">
                    <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Open Positions</h3>
                    <p className="text-muted-foreground">
                        {isHR ? "You haven't posted any jobs yet. Create a new posting to get started." : "There are currently no open positions. Please check back later."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {jobs.map((job) => {
                        const applicants = applications.filter(app => app.jobId === job.id);
                        const userHasApplied = applications.some(app => app.jobId === job.id && app.userId === user?.id);

                        return (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel p-6 flex flex-col hover:border-primary/30 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-xl text-foreground mb-1">{job.title}</h3>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {job.department}</span>
                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.type}</span>
                                        </div>
                                    </div>
                                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                                        {job.status}
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6 flex-1">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Description</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Requirements</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-3">{job.requirements}</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-border/50 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        {isHR ? (
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                                                    <Users className="h-4 w-4" />
                                                    <span className="font-semibold text-foreground">{applicants.length}</span> Applicants
                                                </div>
                                                <Dialog open={viewingApplicantsJobId === job.id} onOpenChange={(open) => {
                                                    if (open) setViewingApplicantsJobId(job.id);
                                                    else setViewingApplicantsJobId(null);
                                                }}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" disabled={applicants.length === 0}>
                                                            View Applicants
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Applicants for {job.title}</DialogTitle>
                                                            <DialogDescription>
                                                                AI-analyzed candidate profiles sorted by Fit Score.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="py-4 space-y-4">
                                                            {applicants
                                                                .sort((a, b) => ((b.resumeData?.fit_score || 0) - (a.resumeData?.fit_score || 0)))
                                                                .map((app) => (
                                                                    <div key={app.id} className="p-4 rounded-lg border border-border bg-card">
                                                                        <div className="flex justify-between items-start mb-3">
                                                                            <div>
                                                                                <h4 className="font-bold text-lg">{app.resumeData?.profile?.name || app.candidateName}</h4>
                                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                                                    <FileText className="h-3 w-3" />
                                                                                    <span>{app.resumeData?.profile?.email || app.candidateEmail}</span>
                                                                                    {app.resumeData?.profile?.phone && (
                                                                                        <>
                                                                                            <span>•</span>
                                                                                            <span>{app.resumeData.profile.phone}</span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {app.resumeData && (
                                                                                <div className="flex flex-col items-end">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-sm font-medium text-muted-foreground">Fit Score</span>
                                                                                        <span className={cn(
                                                                                            "px-2 py-1 rounded bg-muted text-foreground font-bold text-lg",
                                                                                            app.resumeData.fit_score >= 80 ? "text-success" :
                                                                                                app.resumeData.fit_score >= 60 ? "text-warning" : "text-destructive"
                                                                                        )}>
                                                                                            {app.resumeData.fit_score.toFixed(0)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className={cn(
                                                                                        "text-xs font-semibold uppercase mt-1",
                                                                                        app.resumeData.recommendation === 'advance' ? "text-success" :
                                                                                            app.resumeData.recommendation === 'hold' ? "text-warning" : "text-destructive"
                                                                                    )}>
                                                                                        {app.resumeData.recommendation === 'advance' ? 'Shortlisted' :
                                                                                            app.resumeData.recommendation === 'hold' ? 'In Review' : 'Rejected'}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {app.resumeData?.strengths && (
                                                                            <div className="mt-4">
                                                                                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Skills Detected</h5>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {app.resumeData.strengths.slice(0, 4).map((skill: string, idx: number) => (
                                                                                        <span key={idx} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                                                                                            {skill}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {app.resumeData?.ai_explanation && (
                                                                            <div className="mt-4 p-3 bg-muted/50 rounded-md">
                                                                                <p className="text-sm text-muted-foreground italic line-clamp-2">
                                                                                    "{app.resumeData.ai_explanation}"
                                                                                </p>
                                                                            </div>
                                                                        )}

                                                                        <div className="mt-5 pt-4 border-t border-border flex flex-col gap-3">
                                                                            {(app.hrStatus === 'accepted' || app.hrStatus === 'rejected') ? (
                                                                                <div className="bg-muted p-3 rounded-md">
                                                                                    <div className="flex items-center gap-2 mb-2">
                                                                                        <span className="text-xs font-semibold text-muted-foreground uppercase">HR Decision:</span>
                                                                                        <span className={cn(
                                                                                            "px-2 py-0.5 rounded text-xs font-bold",
                                                                                            app.hrStatus === 'accepted' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                                                                                        )}>
                                                                                            {app.hrStatus.toUpperCase()}
                                                                                        </span>
                                                                                    </div>
                                                                                    {app.hrNote && (
                                                                                        <p className="text-sm text-foreground">"{app.hrNote}"</p>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    <Textarea
                                                                                        placeholder="Optional note for candidate..."
                                                                                        className="text-sm min-h-[60px]"
                                                                                        value={decisionNote}
                                                                                        onChange={(e) => setDecisionNote(e.target.value)}
                                                                                    />
                                                                                    <div className="flex justify-end gap-2">
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                                            disabled={isUpdatingDecision === app.id}
                                                                                            onClick={() => handleHRDecision(app.id, 'rejected')}
                                                                                        >
                                                                                            {isUpdatingDecision === app.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                                                                                            Reject
                                                                                        </Button>
                                                                                        <Button
                                                                                            className="bg-success hover:bg-success/90 text-white"
                                                                                            disabled={isUpdatingDecision === app.id}
                                                                                            onClick={() => handleHRDecision(app.id, 'accepted')}
                                                                                        >
                                                                                            {isUpdatingDecision === app.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                                                                            Accept
                                                                                        </Button>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between w-full">
                                                {userHasApplied ? (
                                                    (() => {
                                                        const userApp = applications.find(app => app.jobId === job.id && app.userId === user?.id);
                                                        if (userApp?.hrStatus === 'accepted') {
                                                            return (
                                                                <div className="w-full">
                                                                    <div className="flex items-center gap-2 text-success bg-success/10 px-4 py-2 rounded-t-md text-sm font-semibold w-full justify-center">
                                                                        <CheckCircle className="h-4 w-4" /> Application Accepted!
                                                                    </div>
                                                                    {userApp.hrNote && (
                                                                        <div className="bg-muted p-3 text-sm text-foreground rounded-b-md border border-t-0 border-border">
                                                                            <span className="font-semibold text-xs text-muted-foreground block mb-1">Message from HR:</span>
                                                                            "{userApp.hrNote}"
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        if (userApp?.hrStatus === 'rejected') {
                                                            return (
                                                                <div className="w-full">
                                                                    <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-2 rounded-t-md text-sm font-semibold w-full justify-center">
                                                                        <XCircle className="h-4 w-4" /> Application Not Selected
                                                                    </div>
                                                                    {userApp.hrNote && (
                                                                        <div className="bg-muted p-3 text-sm text-foreground rounded-b-md border border-t-0 border-border">
                                                                            <span className="font-semibold text-xs text-muted-foreground block mb-1">Message from HR:</span>
                                                                            "{userApp.hrNote}"
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-md text-sm font-semibold w-full justify-center">
                                                                <Clock className="h-4 w-4" /> Application in Review
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <Dialog open={applyingJobId === job.id} onOpenChange={(open) => {
                                                        if (open) setApplyingJobId(job.id);
                                                        else { setApplyingJobId(null); setResumeFile(null); }
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button className="w-full">
                                                                Apply Now
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[500px]">
                                                            <form onSubmit={handleApply}>
                                                                <DialogHeader>
                                                                    <DialogTitle>Apply for {job.title}</DialogTitle>
                                                                    <DialogDescription>
                                                                        Upload your latest resume to apply. Our AI Hiring Intelligence will evaluate your profile against the job requirements instantly.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="py-6 space-y-4">
                                                                    <div className="space-y-2">
                                                                        <Label>Resume Upload (Required)</Label>
                                                                        <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center relative cursor-pointer hover:border-primary/50 transition-colors"
                                                                            onClick={() => document.getElementById('resume-upload')?.click()}>
                                                                            <input
                                                                                type="file"
                                                                                id="resume-upload"
                                                                                className="hidden"
                                                                                accept=".pdf,.docx"
                                                                                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                                                                disabled={isApplying}
                                                                            />
                                                                            {resumeFile ? (
                                                                                <div className="flex flex-col items-center text-center">
                                                                                    <FileText className="h-8 w-8 text-primary mb-2" />
                                                                                    <span className="text-sm font-medium">{resumeFile.name}</span>
                                                                                    <span className="text-xs text-muted-foreground mt-1">Click to change file</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center text-center">
                                                                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                                                    <span className="text-sm font-medium">Click to select PDF or DOCX</span>
                                                                                    <span className="text-xs text-muted-foreground mt-1">Max 10MB</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {isApplying && (
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between text-xs">
                                                                                <span className="text-muted-foreground">Uploading & AI Analyzing...</span>
                                                                                <span className="font-bold">{uploadProgress}%</span>
                                                                            </div>
                                                                            <Progress value={uploadProgress} className="h-1.5" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button type="button" variant="outline" onClick={() => setApplyingJobId(null)} disabled={isApplying}>
                                                                        Cancel
                                                                    </Button>
                                                                    <Button type="submit" disabled={!resumeFile || isApplying}>
                                                                        {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                        Submit Application
                                                                    </Button>
                                                                </DialogFooter>
                                                            </form>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
