import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { assignmentsApi } from "@/lib/api";

type Question = {
  text: string;
  imageUrl?: string;
  choices?: string[]; // for auto-graded MCQ
  correctAnswer?: string; // for auto-graded
};

export type AssignmentDraft = {
  id?: string;
  courseId: string;
  title: string;
  type: "auto" | "upload"; // auto (MCQ) or upload (doc upload/manual grade)
  instructions: string;
  dueDate?: string;
  questions: Question[]; // for upload type, this can still list prompts
  attachments?: string[]; // extra resource links
};

type Props = {
  onCancel?: () => void;
  onCreated?: (assignment: AssignmentDraft) => void;
  courseId?: string;
};

export default function CreateAssignment({ onCancel, onCreated, courseId }: Props) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<AssignmentDraft>({
    courseId: courseId || "",
    title: "",
    type: "auto",
    instructions: "",
    dueDate: "",
    questions: [{ text: "", imageUrl: "", choices: [""], correctAnswer: "" }],
    attachments: [""],
  });

  const setField = <K extends keyof AssignmentDraft>(key: K, value: AssignmentDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const addQuestion = () => setField("questions", [...draft.questions, { text: "", imageUrl: "", choices: [""], correctAnswer: "" }]);
  const removeQuestion = (idx: number) => setField("questions", draft.questions.filter((_, i) => i !== idx));

  const updateQuestion = (idx: number, update: Partial<Question>) =>
    setField(
      "questions",
      draft.questions.map((q, i) => (i === idx ? { ...q, ...update } : q))
    );

  const addChoice = (idx: number) => updateQuestion(idx, { choices: [...(draft.questions[idx].choices || []), ""] });
  const removeChoice = (qIdx: number, cIdx: number) =>
    updateQuestion(
      qIdx,
      { choices: (draft.questions[qIdx].choices || []).filter((_, i) => i !== cIdx) }
    );

  const setChoice = (qIdx: number, cIdx: number, value: string) =>
    updateQuestion(
      qIdx,
      { choices: (draft.questions[qIdx].choices || []).map((c, i) => (i === cIdx ? value : c)) }
    );

  const handleCreate = async () => {
    try {
      const assignmentData = {
        courseId: draft.courseId,
        title: draft.title,
        type: draft.type,
        instructions: draft.instructions,
        dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : undefined,
        questions: draft.questions.map((q) => ({
          text: q.text,
          imageUrl: q.imageUrl?.trim() || undefined,
          choices: (q.choices || []).filter(Boolean),
          correctAnswer: q.correctAnswer?.trim() || undefined,
        })),
        attachments: (draft.attachments || []).filter(Boolean),
        maxScore: 100,
      };
      
      const newAssignment = await assignmentsApi.create(assignmentData);
      toast({ title: "Assignment created", description: "Your assignment has been created successfully." });
      onCreated?.(newAssignment as AssignmentDraft);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create assignment",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="courseId">Course ID</Label>
              <Input id="courseId" value={draft.courseId} onChange={(e) => setField("courseId", e.target.value)} placeholder="e.g. 1" />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={draft.title} onChange={(e) => setField("title", e.target.value)} placeholder="Assignment title" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={draft.type} onValueChange={(v: "auto" | "upload") => setField("type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-graded (MCQ)</SelectItem>
                  <SelectItem value="upload">Upload (manual grading)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due">Due Date</Label>
              <Input id="due" type="date" value={draft.dueDate} onChange={(e) => setField("dueDate", e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea id="instructions" value={draft.instructions} onChange={(e) => setField("instructions", e.target.value)} placeholder="What should students do?" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Questions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" /> Add question
              </Button>
            </div>

            {draft.questions.map((q, idx) => (
              <Card key={idx}>
                <CardContent className="space-y-3 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div className="md:col-span-3">
                      <Label>Question text</Label>
                      <Textarea value={q.text} onChange={(e) => updateQuestion(idx, { text: e.target.value })} placeholder="Write the question" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Image URL (optional)</Label>
                      <Input value={q.imageUrl || ""} onChange={(e) => updateQuestion(idx, { imageUrl: e.target.value })} placeholder="https://image..." />
                    </div>
                  </div>

                  {draft.type === "auto" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Choices</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => addChoice(idx)}>
                          <Plus className="h-4 w-4 mr-2" /> Add choice
                        </Button>
                      </div>
                      {(q.choices || []).map((c, cIdx) => (
                        <div key={cIdx} className="flex gap-2">
                          <Input value={c} onChange={(e) => setChoice(idx, cIdx, e.target.value)} placeholder={`Choice ${cIdx + 1}`} />
                          {(q.choices || []).length > 1 && (
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeChoice(idx, cIdx)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <div>
                        <Label>Correct Answer</Label>
                        <Input value={q.correctAnswer || ""} onChange={(e) => updateQuestion(idx, { correctAnswer: e.target.value })} placeholder="Enter the correct answer text" />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    {draft.questions.length > 1 && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeQuestion(idx)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remove question
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleCreate} data-testid="button-create-assignment">Create Assignment</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


