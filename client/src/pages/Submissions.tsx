import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { coursesApi, submissionsApi, gradesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type Course = { id: string; title: string };

export default function SubmissionsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [gradingDraft, setGradingDraft] = useState<any | null>(null);
  const [isViewGradeOpen, setIsViewGradeOpen] = useState(false);
  const [viewGradeDraft, setViewGradeDraft] = useState<any | null>(null);
  const { toast } = useToast();

  const loadCourses = async () => {
    try {
      const res = await coursesApi.getMine();
      // normalize id
      const normalized = Array.isArray(res) ? res.map((c: any) => ({ id: c.id || c._id, title: c.title })) : [];
      setCourses(normalized);
    } catch (err) {
      console.error('Failed to load courses', err);
    }
  };

  const loadSubmissions = async () => {
    try {
      const res: any = await submissionsApi.getAll({ courseId: selectedCourse, status: statusFilter === 'all' ? undefined : statusFilter, page, limit });
      if (res && Array.isArray(res.items)) {
        setSubmissions(res.items);
        setTotal(res.total || 0);
      } else {
        setSubmissions([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Failed to load submissions', err);
      setSubmissions([]);
      setTotal(0);
    }
  };

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { setPage(1); }, [selectedCourse, statusFilter]);
  useEffect(() => { loadSubmissions(); }, [selectedCourse, statusFilter, page]);

  const openGrade = (submission: any) => {
    setGradingDraft({ submission, score: submission.grade?.score ?? submission.assignment?.maxScore ?? 100, feedback: '' });
    setIsGradingOpen(true);
  };

  const openViewGrade = (submission: any) => {
    setViewGradeDraft(submission);
    setIsViewGradeOpen(true);
  };

  const submitGrade = async () => {
    if (!gradingDraft) return;
    try {
      const { submission, score, feedback } = gradingDraft;
      const payload = {
        assignmentId: submission.assignmentId._id || submission.assignmentId,
        studentId: submission.studentId._id || submission.studentId,
        score,
        maxScore: submission.assignmentId?.maxScore ?? 100,
        feedback,
      };
      const created = await gradesApi.create(payload);
      toast({ title: 'Graded', description: 'Submission graded successfully.' });
      setIsGradingOpen(false);
      setGradingDraft(null);
      await loadSubmissions();
    } catch (err) {
      console.error('Failed to grade', err);
      toast({ title: 'Failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submissions</h1>
        <p className="text-muted-foreground">Review and grade student submissions.</p>
      </div>

      {/* Horizontal filter bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm block mb-1">Course</label>
            <Select value={selectedCourse ?? '__all__'} onValueChange={(v) => setSelectedCourse(v === '__all__' ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Courses</SelectItem>
                {courses.map((c) => (<SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm block mb-1">Status</label>
            <div className="flex items-center gap-2">
              {(['all','submitted','graded'] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-md ${statusFilter===s? 'bg-primary text-primary-foreground' : 'border'}`}>
                  {s === 'all' ? 'All' : s === 'submitted' ? 'Submitted' : 'Graded'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <Button onClick={() => { setSelectedCourse(undefined); setStatusFilter('all'); }}>Reset Filters</Button>
        </div>
      </div>

      {/* Submissions list */}
      <div className="space-y-4">
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions match the selected filters.</p>
        ) : (
          submissions.map((s: any) => (
            <Card key={s._id}>
              <CardHeader>
                <CardTitle className="text-lg">{s.assignment?.title || 'Untitled'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{s.student?.fullName || s.student}</p>
                    <p className="text-sm text-muted-foreground">Submitted: {new Date(s.submittedAt || s.createdAt || s.updatedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm">{s.grade ? <span className="font-medium text-green-600">Graded ({s.grade.score})</span> : <span className="font-medium text-yellow-600">Submitted</span>}</div>
                    {!s.grade && (
                      <Dialog open={isGradingOpen && gradingDraft?.submission._id === s._id} onOpenChange={(open) => { if (!open) { setIsGradingOpen(false); setGradingDraft(null); } }}>
                        <DialogTrigger asChild>
                          <Button onClick={() => openGrade(s)}>Grade</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Grade Submission</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm block mb-1">Score</label>
                              <Input type="number" value={gradingDraft?.score ?? ''} onChange={(e) => setGradingDraft({ ...gradingDraft, score: Number(e.target.value) })} />
                            </div>
                            <div>
                              <label className="text-sm block mb-1">Feedback (optional)</label>
                              <Textarea value={gradingDraft?.feedback ?? ''} onChange={(e) => setGradingDraft({ ...gradingDraft, feedback: e.target.value })} rows={6} />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => { setIsGradingOpen(false); setGradingDraft(null); }}>Cancel</Button>
                              <Button onClick={submitGrade}>Submit Grade</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {s.grade && (
                      <>
                        <Dialog open={isViewGradeOpen && viewGradeDraft?._id === s._id} onOpenChange={(open) => { if (!open) setIsViewGradeOpen(false); }}>
                          <DialogTrigger asChild>
                            <Button onClick={() => openViewGrade(s)}>View</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Grade Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm"><strong>Student:</strong> {s.student?.fullName}</p>
                              <p className="text-sm"><strong>Assignment:</strong> {s.assignment?.title}</p>
                              <p className="text-sm"><strong>Score:</strong> {s.grade.score} / {s.grade.maxScore}</p>
                              {s.grade.feedback && (
                                <div>
                                  <p className="text-sm font-medium">Feedback</p>
                                  <p className="text-sm text-muted-foreground">{s.grade.feedback}</p>
                                </div>
                              )}
                              <div className="flex justify-end">
                                <Button onClick={() => setIsViewGradeOpen(false)}>Close</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Showing {Math.min((page-1)*limit+1, total || 0)} - {Math.min(page*limit, total || 0)} of {total} submissions</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page <= 1}>Previous</Button>
          <Button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}>Next</Button>
        </div>
      </div>
    </div>
  );
}
