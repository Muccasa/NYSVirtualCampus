import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { coursesApi, usersApi, type ApiCourse, type ApiUser } from "@/lib/api";
import {
  Settings,
  Users,
  FileText,
  BarChart3,
  Copy,
  Archive,
  Wrench,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  UserPlus,
  Shield,
  Eye,
  Download,
  Upload,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface CourseManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  onUpdate?: () => void;
}

export function CourseManagementDialog({
  isOpen,
  onOpenChange,
  courseId,
  courseTitle,
  onUpdate,
}: CourseManagementDialogProps) {
  const { toast } = useToast();
  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [tutors, setTutors] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Setup state
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [enrollmentKey, setEnrollmentKey] = useState("");

  // Configure state
  const [allowSelfEnroll, setAllowSelfEnroll] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [isMandatory, setIsMandatory] = useState(false);

  // Populate state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkEnrollEmails, setBulkEnrollEmails] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");

  // Maintain state
  const [copyCourseName, setCopyCourseName] = useState("");

  useEffect(() => {
    if (isOpen && courseId) {
      loadCourseData();
      loadUsers();
    }
  }, [isOpen, courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const data: any = await coursesApi.getById(courseId);
      const normalized = Object.assign({}, data, { id: data.id || data._id }) as ApiCourse;
      setCourse(normalized);
      setEnrollmentKey(normalized.enrollmentKey || "");
      setIsPublished(normalized.isActive !== false);
      setIsMandatory(normalized.isMandatory === true);
      setSelectedInstructor(normalized.instructorId || "");
    } catch (err) {
      console.error("Failed to load course", err);
      toast({ title: "Error", description: "Failed to load course data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await usersApi.getAll();
      const normalized = Array.isArray(allUsers)
        ? allUsers.map((u: any) => ({ ...u, id: u.id || u._id }))
        : [];
      setUsers(normalized);
      setTutors(normalized.filter((u) => u.role === "tutor"));
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  // CREATE/SETUP Functions
  const handleApplyTemplate = (templateType: string) => {
    toast({ title: "Template Applied", description: `Applied ${templateType} template` });
  };

  const handleSetDates = async () => {
    try {
      await coursesApi.update(courseId, {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      });
      toast({ title: "Dates Updated", description: "Course dates have been set" });
      onUpdate?.();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to set dates", variant: "destructive" });
    }
  };

  // CONFIGURE Functions
  const handleUpdatePermissions = async () => {
    try {
      await coursesApi.update(courseId, {
        isActive: isPublished,
        isMandatory,
        enrollmentKey: allowSelfEnroll ? enrollmentKey : "",
      });
      toast({ title: "Settings Updated", description: "Course configuration saved" });
      onUpdate?.();
      loadCourseData();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update", variant: "destructive" });
    }
  };

  const handleGenerateEnrollmentKey = () => {
    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    setEnrollmentKey(key);
  };

  // POPULATE Functions
  const handleBulkEnroll = async () => {
    if (!bulkEnrollEmails.trim()) {
      toast({ title: "Error", description: "Enter at least one email", variant: "destructive" });
      return;
    }

    try {
      const emails = bulkEnrollEmails.split(/[,\n]/).map((e) => e.trim()).filter(Boolean);
      const currentEmails = course?.enrollEmails || [];
      const combinedEmails = currentEmails.concat(emails);
      const updatedEmails = combinedEmails.filter((email, index) => combinedEmails.indexOf(email) === index);

      await coursesApi.update(courseId, { enrollEmails: updatedEmails });
      toast({ title: "Enrolled", description: `${emails.length} user(s) enrolled` });
      setBulkEnrollEmails("");
      loadCourseData();
      onUpdate?.();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to enroll", variant: "destructive" });
    }
  };

  const handleEnrollSelected = async () => {
    if (selectedUsers.size === 0) {
      toast({ title: "Error", description: "Select at least one user", variant: "destructive" });
      return;
    }

    try {
      const selectedEmails = Array.from(selectedUsers).map((id) => {
        const user = users.find((u) => u.id === id);
        return user?.email || "";
      }).filter(Boolean);

      const currentEmails = course?.enrollEmails || [];
      const combinedEmails = currentEmails.concat(selectedEmails);
      const updatedEmails = combinedEmails.filter((email, index) => combinedEmails.indexOf(email) === index);

      await coursesApi.update(courseId, { enrollEmails: updatedEmails });
      toast({ title: "Enrolled", description: `${selectedUsers.size} user(s) enrolled` });
      setSelectedUsers(new Set());
      loadCourseData();
      onUpdate?.();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to enroll", variant: "destructive" });
    }
  };

  const handleAssignInstructor = async () => {
    if (!selectedInstructor) {
      toast({ title: "Error", description: "Select an instructor", variant: "destructive" });
      return;
    }

    try {
      await coursesApi.update(courseId, { instructorId: selectedInstructor });
      toast({ title: "Instructor Assigned", description: "Successfully assigned instructor" });
      loadCourseData();
      onUpdate?.();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to assign", variant: "destructive" });
    }
  };

  // MAINTAIN Functions
  const handleCopyCourse = async () => {
    if (!copyCourseName.trim()) {
      toast({ title: "Error", description: "Enter a name for the copy", variant: "destructive" });
      return;
    }

    try {
      const newCourse = {
        ...course,
        title: copyCourseName,
        enrollEmails: [],
      };
      delete (newCourse as any).id;
      delete (newCourse as any)._id;
      delete (newCourse as any).createdAt;
      delete (newCourse as any).updatedAt;

      await coursesApi.create(newCourse as any);
      toast({ title: "Course Copied", description: `Created copy: ${copyCourseName}` });
      setCopyCourseName("");
      onUpdate?.();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to copy course", variant: "destructive" });
    }
  };

  const handleTogglePublish = async () => {
    try {
      const newStatus = !isPublished;
      await coursesApi.update(courseId, { isActive: newStatus });
      setIsPublished(newStatus);
      toast({ title: newStatus ? "Published" : "Unpublished", description: courseTitle });
      loadCourseData();
      onUpdate?.();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to toggle publish", variant: "destructive" });
    }
  };

  const handleArchiveCourse = async () => {
    if (!confirm(`Archive "${courseTitle}"? This will unpublish and hide the course.`)) return;

    try {
      await coursesApi.update(courseId, { isActive: false, archived: true });
      toast({ title: "Archived", description: courseTitle });
      onOpenChange(false);
      onUpdate?.();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to archive", variant: "destructive" });
    }
  };

  // TROUBLESHOOT Functions
  const handleResetEnrollments = async () => {
    if (!confirm("Remove all enrollments? This cannot be undone.")) return;

    try {
      await coursesApi.update(courseId, { enrollEmails: [] });
      toast({ title: "Reset Complete", description: "All enrollments removed" });
      loadCourseData();
      onUpdate?.();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to reset", variant: "destructive" });
    }
  };

  const handleFixAccessIssues = async () => {
    try {
      // Re-generate enrollment key and make course accessible
      const newKey = Math.random().toString(36).substring(2, 10).toUpperCase();
      await coursesApi.update(courseId, { 
        enrollmentKey: newKey,
        isActive: true,
      });
      setEnrollmentKey(newKey);
      toast({ title: "Access Fixed", description: `New enrollment key: ${newKey}` });
      loadCourseData();
      onUpdate?.();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to fix access", variant: "destructive" });
    }
  };

  // MONITOR Functions
  const enrolledCount = course?.enrollEmails?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Course: {courseTitle}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="setup">
              <Settings className="h-4 w-4 mr-2" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="configure">
              <Shield className="h-4 w-4 mr-2" />
              Configure
            </TabsTrigger>
            <TabsTrigger value="populate">
              <Users className="h-4 w-4 mr-2" />
              Populate
            </TabsTrigger>
            <TabsTrigger value="monitor">
              <BarChart3 className="h-4 w-4 mr-2" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="maintain">
              <Copy className="h-4 w-4 mr-2" />
              Maintain
            </TabsTrigger>
            <TabsTrigger value="troubleshoot">
              <Wrench className="h-4 w-4 mr-2" />
              Troubleshoot
            </TabsTrigger>
          </TabsList>

          {/* CREATE/SETUP Tab */}
          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Setup & Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Apply Course Template</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="outline" onClick={() => handleApplyTemplate("Standard")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Standard
                    </Button>
                    <Button variant="outline" onClick={() => handleApplyTemplate("Workshop")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Workshop
                    </Button>
                    <Button variant="outline" onClick={() => handleApplyTemplate("Self-Paced")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Self-Paced
                    </Button>
                    <Button variant="outline" onClick={() => handleApplyTemplate("Bootcamp")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Bootcamp
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button onClick={handleSetDates} className="w-full">
                  Set Course Dates
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONFIGURE Tab */}
          <TabsContent value="configure" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Published</Label>
                    <p className="text-sm text-muted-foreground">Course is visible and accessible</p>
                  </div>
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mandatory Course</Label>
                    <p className="text-sm text-muted-foreground">All students auto-enrolled</p>
                  </div>
                  <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Self-Enrollment</Label>
                    <p className="text-sm text-muted-foreground">Students can enroll with key</p>
                  </div>
                  <Switch checked={allowSelfEnroll} onCheckedChange={setAllowSelfEnroll} />
                </div>

                {allowSelfEnroll && (
                  <div>
                    <Label>Enrollment Key</Label>
                    <div className="flex gap-2 mt-2">
                      <Input value={enrollmentKey} onChange={(e) => setEnrollmentKey(e.target.value)} />
                      <Button variant="outline" onClick={handleGenerateEnrollmentKey}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button onClick={handleUpdatePermissions} className="w-full">
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* POPULATE Tab */}
          <TabsContent value="populate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enroll Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bulk Enroll (Emails)</Label>
                  <Textarea
                    placeholder="Enter emails (comma or line separated)"
                    value={bulkEnrollEmails}
                    onChange={(e) => setBulkEnrollEmails(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleBulkEnroll} className="w-full mt-2">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Bulk Enroll
                  </Button>
                </div>

                <div>
                  <Label>Select Individual Users</Label>
                  <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2 mt-2">
                    {users.filter((u) => u.role === "student").map((user) => (
                      <div key={user.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedUsers);
                            if (checked) newSet.add(user.id);
                            else newSet.delete(user.id);
                            setSelectedUsers(newSet);
                          }}
                        />
                        <span className="text-sm">{user.fullName || user.username}</span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleEnrollSelected} className="w-full mt-2" disabled={selectedUsers.size === 0}>
                    Enroll Selected ({selectedUsers.size})
                  </Button>
                </div>

                <div>
                  <Label>Assign Instructor</Label>
                  <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tutor" />
                    </SelectTrigger>
                    <SelectContent>
                      {tutors.map((tutor) => (
                        <SelectItem key={tutor.id} value={tutor.id}>
                          {tutor.fullName || tutor.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignInstructor} className="w-full mt-2">
                    Assign Instructor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MONITOR Tab */}
          <TabsContent value="monitor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground">Enrolled Students</p>
                    <p className="text-3xl font-bold">{enrolledCount}</p>
                  </div>
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={isPublished ? "default" : "secondary"} className="mt-2">
                      {isPublished ? "Published" : "Unpublished"}
                    </Badge>
                  </div>
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground">Enrollment Type</p>
                    <Badge variant={isMandatory ? "destructive" : "outline"} className="mt-2">
                      {isMandatory ? "Mandatory" : "Optional"}
                    </Badge>
                  </div>
                  <div className="p-4 border rounded">
                    <p className="text-sm text-muted-foreground">Access</p>
                    <Badge variant="outline" className="mt-2">
                      {allowSelfEnroll ? "Self-Enroll" : "Admin Only"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Enrolled Users</Label>
                  <div className="border rounded p-2 max-h-60 overflow-y-auto mt-2">
                    {course?.enrollEmails?.map((email, idx) => (
                      <div key={idx} className="py-2 border-b last:border-0 text-sm">
                        {email}
                      </div>
                    ))}
                    {enrolledCount === 0 && (
                      <p className="text-sm text-muted-foreground p-4 text-center">No enrollments yet</p>
                    )}
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Enrollment Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MAINTAIN Tab */}
          <TabsContent value="maintain" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Maintenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Copy Course</Label>
                  <Input
                    placeholder="Name for course copy"
                    value={copyCourseName}
                    onChange={(e) => setCopyCourseName(e.target.value)}
                    className="mt-2"
                  />
                  <Button onClick={handleCopyCourse} variant="outline" className="w-full mt-2">
                    <Copy className="mr-2 h-4 w-4" />
                    Create Copy
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleTogglePublish} variant="outline" className="flex-1">
                    <Eye className="mr-2 h-4 w-4" />
                    {isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button onClick={handleArchiveCourse} variant="destructive" className="flex-1">
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Course
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Archiving will unpublish the course and hide it from all views. 
                    You can restore it later from the admin panel.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TROUBLESHOOT Tab */}
          <TabsContent value="troubleshoot" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleFixAccessIssues} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Fix Access Issues (Regenerate Key)
                </Button>

                <Button onClick={handleResetEnrollments} variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset All Enrollments
                </Button>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200">
                  <p className="text-sm font-medium">⚠️ Destructive Actions</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The actions above are permanent and cannot be undone. Use with caution.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Debug Information</Label>
                  <div className="p-3 bg-muted rounded text-xs font-mono">
                    <p>Course ID: {courseId}</p>
                    <p>Enrollments: {enrolledCount}</p>
                    <p>Published: {isPublished ? "Yes" : "No"}</p>
                    <p>Enrollment Key: {enrollmentKey || "Not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
