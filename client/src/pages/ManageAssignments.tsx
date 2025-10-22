import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AssignmentLite = {
  id: string;
  courseId: string;
  title: string;
  dueDate?: string;
};

type Props = {
  assignments: AssignmentLite[];
  onExtendDueDate: (id: string, newDueDate: string) => void;
};

export default function ManageAssignments({ assignments, onExtendDueDate }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Manage Assignments</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="text-base">{a.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">Course: {a.courseId}</div>
              <div>
                <Label className="text-sm">Current deadline</Label>
                <div className="text-sm">{a.dueDate ? new Date(a.dueDate).toLocaleString() : "None"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Input type="datetime-local" onChange={(e) => (e.currentTarget.dataset.date = e.target.value)} data-date="" />
                <Button
                  size="sm"
                  onClick={(e) => {
                    const container = (e.currentTarget.previousSibling as HTMLInputElement);
                    const newDate = (container as any)?.dataset?.date || (container as HTMLInputElement).value;
                    if (newDate) onExtendDueDate(a.id, newDate);
                  }}
                >
                  Extend
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


