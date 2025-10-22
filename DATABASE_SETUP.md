# Database Setup Guide

## PostgreSQL Integration

This project now uses PostgreSQL with Drizzle ORM for all data persistence. Here's what has been implemented:

### Database Schema

The following tables have been created:

1. **users** - User accounts with roles (student, tutor, admin)
2. **courses** - Course information with JSON fields for resources, outline, etc.
3. **course_enrollments** - Student enrollments in courses
4. **assignments** - Assignments with questions, due dates, and types (auto/upload)
5. **submissions** - Student assignment submissions
6. **grades** - Grading records with auto and manual scoring
7. **announcements** - System announcements from tutors/admins

### API Endpoints

All CRUD operations are available via REST API:

- `GET/POST /api/users` - User management (admin only)
- `GET/POST /api/courses` - Course management
- `GET/POST/PUT /api/assignments` - Assignment management
- `GET/POST /api/submissions` - Assignment submissions
- `GET/PUT /api/grades` - Grade management
- `GET/POST /api/announcements` - Announcements
- `POST /api/enrollments` - Course enrollments
- `GET /api/admin/dashboard` - Admin dashboard data

### Setup Instructions

1. **Set up PostgreSQL database** (Neon, Supabase, or local PostgreSQL)

2. **Set environment variable**:
   ```bash
   DATABASE_URL="postgresql://username:password@host:port/database"
   ```

3. **Push schema to database**:
   ```bash
   npm run db:push
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

### Features Implemented

✅ **Course Creation**: Tutors can create courses with notes, PPT links, resources, and outlines
✅ **Assignment Management**: Create assignments with deadlines, questions, images, and auto/manual grading
✅ **Student Submissions**: Students can submit assignments with file uploads
✅ **Auto-grading**: MCQ assignments are automatically graded
✅ **Manual Grading**: Tutors can grade upload-type assignments
✅ **Deadline Enforcement**: Assignments become unavailable after due dates
✅ **Announcements**: Tutors and admins can post announcements
✅ **Admin Monitoring**: Admins can see all activities and data
✅ **Role-based Access**: Different permissions for students, tutors, and admins

### Authentication

Currently using simplified demo authentication. In production, implement:
- JWT tokens or session-based auth
- Password hashing
- User registration/login
- Role-based middleware

### Data Flow

1. **Tutors** create courses and assignments
2. **Students** enroll in courses and submit assignments
3. **System** auto-grades MCQ assignments
4. **Tutors** manually grade upload assignments
5. **Admins** monitor all activities
6. **Everyone** can post/view announcements

The system now provides a complete learning management platform with persistent data storage and proper API architecture.
