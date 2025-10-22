import type { Express } from "express";
import { createServer, type Server } from "http";
import { Router } from "express";
import { db } from "./db";
import { 
  users, courses, assignments, submissions, grades, announcements, courseEnrollments,
  insertUserSchema, insertCourseSchema, insertAssignmentSchema, insertSubmissionSchema,
  insertGradeSchema, insertAnnouncementSchema
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = Router();

  // Authentication middleware (simplified for demo)
  const authenticate = (req: any, res: any, next: any) => {
    // In a real app, you'd verify JWT tokens or session
    req.user = { id: "demo-user", role: "student" }; // Default for demo
    next();
  };

  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };

  // Users routes
  router.get("/users", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  router.post("/users", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const [newUser] = await db.insert(users).values(userData).returning();
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Courses routes
  router.get("/courses", authenticate, async (req, res) => {
    try {
      const allCourses = await db.select().from(courses).where(eq(courses.isActive, true));
      res.json(allCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  router.post("/courses", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const [newCourse] = await db.insert(courses).values(courseData).returning();
      res.json(newCourse);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  router.get("/courses/:id", authenticate, async (req, res) => {
    try {
      const [course] = await db.select().from(courses).where(eq(courses.id, req.params.id));
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  // Assignments routes
  router.get("/assignments", authenticate, async (req, res) => {
    try {
      const { courseId } = req.query;
      let query = db.select().from(assignments).where(eq(assignments.isActive, true));
      
      if (courseId) {
        query = query.where(and(eq(assignments.courseId, courseId as string), eq(assignments.isActive, true)));
      }
      
      const allAssignments = await query;
      res.json(allAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  router.post("/assignments", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const assignmentData = insertAssignmentSchema.parse(req.body);
      const [newAssignment] = await db.insert(assignments).values(assignmentData).returning();
      res.json(newAssignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  router.put("/assignments/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const { dueDate } = req.body;
      const [updatedAssignment] = await db
        .update(assignments)
        .set({ dueDate, updatedAt: new Date() })
        .where(eq(assignments.id, req.params.id))
        .returning();
      
      if (!updatedAssignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });

  // Submissions routes
  router.get("/submissions", authenticate, async (req, res) => {
    try {
      const { assignmentId, studentId } = req.query;
      let query = db.select().from(submissions);
      
      if (assignmentId) {
        query = query.where(eq(submissions.assignmentId, assignmentId as string));
      }
      if (studentId) {
        query = query.where(eq(submissions.studentId, studentId as string));
      }
      
      const allSubmissions = await query;
      res.json(allSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  router.post("/submissions", authenticate, requireRole(["student"]), async (req, res) => {
    try {
      const submissionData = insertSubmissionSchema.parse(req.body);
      const [newSubmission] = await db.insert(submissions).values(submissionData).returning();
      
      // Auto-grade if assignment type is "auto"
      const [assignment] = await db.select().from(assignments).where(eq(assignments.id, submissionData.assignmentId));
      if (assignment && assignment.type === "auto") {
        // Simple auto-grading logic
        const score = Object.values(submissionData.answers || {}).filter(answer => answer.trim()).length;
        await db.insert(grades).values({
          assignmentId: submissionData.assignmentId,
          studentId: submissionData.studentId,
          score,
          maxScore: assignment.maxScore || 100,
          status: "graded",
          gradedAt: new Date(),
        });
      }
      
      res.json(newSubmission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  // Grades routes
  router.get("/grades", authenticate, async (req, res) => {
    try {
      const { studentId, assignmentId } = req.query;
      let query = db.select().from(grades);
      
      if (studentId) {
        query = query.where(eq(grades.studentId, studentId as string));
      }
      if (assignmentId) {
        query = query.where(eq(grades.assignmentId, assignmentId as string));
      }
      
      const allGrades = await query;
      res.json(allGrades);
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ error: "Failed to fetch grades" });
    }
  });

  router.put("/grades/:id", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const { manualScore, feedback } = req.body;
      const [updatedGrade] = await db
        .update(grades)
        .set({ 
          manualScore, 
          feedback, 
          status: "graded",
          gradedBy: req.user.id,
          gradedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(grades.id, req.params.id))
        .returning();
      
      if (!updatedGrade) {
        return res.status(404).json({ error: "Grade not found" });
      }
      
      res.json(updatedGrade);
    } catch (error) {
      console.error("Error updating grade:", error);
      res.status(500).json({ error: "Failed to update grade" });
    }
  });

  // Announcements routes
  router.get("/announcements", authenticate, async (req, res) => {
    try {
      const { courseId, isGlobal } = req.query;
      let query = db.select().from(announcements);
      
      if (courseId) {
        query = query.where(eq(announcements.courseId, courseId as string));
      }
      if (isGlobal === "true") {
        query = query.where(eq(announcements.isGlobal, true));
      }
      
      const allAnnouncements = await query.orderBy(desc(announcements.createdAt));
      res.json(allAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  router.post("/announcements", authenticate, requireRole(["tutor", "admin"]), async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const [newAnnouncement] = await db.insert(announcements).values(announcementData).returning();
      res.json(newAnnouncement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  // Course enrollments
  router.post("/enrollments", authenticate, requireRole(["student"]), async (req, res) => {
    try {
      const { courseId } = req.body;
      const [enrollment] = await db.insert(courseEnrollments).values({
        courseId,
        studentId: req.user.id,
      }).returning();
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ error: "Failed to enroll in course" });
    }
  });

  // Admin dashboard data
  router.get("/admin/dashboard", authenticate, requireRole(["admin"]), async (req, res) => {
    try {
      const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
      const [courseCount] = await db.select({ count: sql`count(*)` }).from(courses);
      const [assignmentCount] = await db.select({ count: sql`count(*)` }).from(assignments);
      const [submissionCount] = await db.select({ count: sql`count(*)` }).from(submissions);
      
      res.json({
        users: userCount.count,
        courses: courseCount.count,
        assignments: assignmentCount.count,
        submissions: submissionCount.count,
      });
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
