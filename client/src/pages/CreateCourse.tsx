import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { coursesApi } from "@/lib/api";

type CreateCourseProps = {
  onCancel?: () => void;
  onCreated?: (courseJson: unknown) => void;
};

type CourseResource = { url: string; label: string };
type CourseOutlineItem = { title: string; description: string };

export default function CreateCourse({ onCancel, onCreated }: CreateCourseProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [notes, setNotes] = useState("");
  const [pptLinks, setPptLinks] = useState<string[]>([""]);
  const [resources, setResources] = useState<CourseResource[]>([{ url: "", label: "" }]);
  const [attachments, setAttachments] = useState<string[]>([""]);
  const [tags, setTags] = useState<string>("");
  const [estimatedDuration, setEstimatedDuration] = useState<string>("");
  const [outline, setOutline] = useState<CourseOutlineItem[]>([{ title: "", description: "" }]);

  const courseJson = {
    title,
    department,
    notes,
    pptLinks: pptLinks.filter(Boolean),
    resources: resources.filter(r => r.url || r.label),
    attachments: attachments.filter(Boolean),
    tags: tags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean),
    estimatedDuration,
    outline: outline.filter(o => o.title || o.description),
    createdAt: new Date().toISOString(),
  };

  const handleAddArrayItem = (setter: (v: any) => void, emptyValue: any) => setter((prev: any) => [...prev, emptyValue]);
  const handleRemoveArrayItem = (setter: (v: any) => void, index: number) =>
    setter((prev: any[]) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    try {
      const courseData = {
        title: courseJson.title,
        description: courseJson.notes,
        department: courseJson.department,
        instructorId: "demo-tutor-id", // In real app, get from auth context
        notes: courseJson.notes,
        pptLinks: courseJson.pptLinks,
        resources: courseJson.resources,
        attachments: courseJson.attachments,
        tags: courseJson.tags,
        estimatedDuration: courseJson.estimatedDuration,
        outline: courseJson.outline,
      };
      
      const newCourse = await coursesApi.create(courseData);
      toast({ title: "Course created", description: "Your course has been created successfully." });
      onCreated?.(newCourse);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create course",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Course Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advanced AI Techniques" />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Technology" />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Course Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Brief description or notes..." />
            <p className="text-xs text-muted-foreground mt-1">Include key objectives, prerequisites, or grading info.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>PPT Links</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddArrayItem(setPptLinks, "")}>
                <Plus className="mr-2 h-4 w-4" /> Add link
              </Button>
            </div>
            {pptLinks.map((link, idx) => (
              <div key={idx} className="flex gap-2">
                <Input value={link} onChange={(e) => setPptLinks(pptLinks.map((v, i) => (i === idx ? e.target.value : v)))} placeholder="https://..." />
                {pptLinks.length > 1 && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveArrayItem(setPptLinks, idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Additional Resources</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddArrayItem(setResources, { url: "", label: "" })}>
                <Plus className="mr-2 h-4 w-4" /> Add resource
              </Button>
            </div>
            {resources.map((res, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input className="md:col-span-3" value={res.url} onChange={(e) => setResources(resources.map((r, i) => (i === idx ? { ...r, url: e.target.value } : r)))} placeholder="https://resource..." />
                <Input className="md:col-span-2" value={res.label} onChange={(e) => setResources(resources.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)))} placeholder="Label (e.g. Syllabus)" />
                <div className="flex items-center">
                  {resources.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveArrayItem(setResources, idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attachments (links)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddArrayItem(setAttachments, "")}>
                <Plus className="mr-2 h-4 w-4" /> Add attachment
              </Button>
            </div>
            {attachments.map((att, idx) => (
              <div key={idx} className="flex gap-2">
                <Input value={att} onChange={(e) => setAttachments(attachments.map((v, i) => (i === idx ? e.target.value : v)))} placeholder="https://attachment..." />
                {attachments.length > 1 && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveArrayItem(setAttachments, idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma,separated,tags" />
            </div>
            <div>
              <Label htmlFor="duration">Estimated Duration</Label>
              <Input id="duration" value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} placeholder="e.g. 8 weeks" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Outline</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddArrayItem(setOutline, { title: "", description: "" })}>
                <Plus className="mr-2 h-4 w-4" /> Add section
              </Button>
            </div>
            {outline.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input className="md:col-span-2" value={item.title} onChange={(e) => setOutline(outline.map((o, i) => (i === idx ? { ...o, title: e.target.value } : o)))} placeholder="Section title" />
                <Textarea className="md:col-span-3" value={item.description} onChange={(e) => setOutline(outline.map((o, i) => (i === idx ? { ...o, description: e.target.value } : o)))} placeholder="What is covered in this section?" />
                <div className="flex items-center">
                  {outline.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveArrayItem(setOutline, idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex flex-wrap gap-2">
              {(courseJson.tags as string[]).map((t, i) => (
                <Badge key={`${t}-${i}`} variant="secondary">{t}</Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="button" onClick={handleSubmit} data-testid="button-submit-course">Create Course</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      
    </div>
  );
}


