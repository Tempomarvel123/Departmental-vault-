export enum UserRole {
  SUPER_ADMIN = "Super Admin",
  DEPARTMENT_ADMIN = "Department Admin",
  LECTURER = "Lecturer",
  STUDENT = "Student"
}

export enum EventType {
  EXAM = "Exam",
  SEMINAR = "Seminar",
  DEADLINE = "Deadline",
  MEETING = "Meeting",
  ANNOUNCEMENT = "Announcement"
}

export enum ApprovalStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected"
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  level?: string; // e.g. "100", "200", "300", "400", "500" - relevant to students
  department: string;
  matricOrStaffNumber: string; // matricNumber or staffNumber
  registeredCourseIds?: string[]; // student enrolled/registered courses list
  createdAt: string;
}

export interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
  level: string; // "100", "200", etc.
  semester: "1st" | "2nd";
  lecturerId: string; // ID of the assigned Lecturer
  lecturerName: string;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseCode: string;
  uploadedBy: string; // Lecturer User ID
  uploaderName: string;
  fileUrl: string; // In our app, we can use synthetic/simulated vault links or data URIs
  fileHash: string; // SHA-256 integrity hash
  fileSize: string; // human readable (e.g. "2.4 MB")
  approvalStatus: ApprovalStatus;
  uploadedAt: string;
  documentType?: "Lecture Note" | "Past Question" | "Syllabus";
  semester?: "1st" | "2nd";
  solutionMarkdown?: string;
  solutionGeneratedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // Login, Logout, Upload, Download, Approval, Rejection, Deletion, etc.
  details?: string;
  ipAddress: string;
  device: string;
  timestamp: string;
}

export interface DownloadLog {
  id: string;
  materialId: string;
  materialTitle: string;
  courseCode: string;
  studentId: string;
  studentName: string;
  timestamp: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string; // YYYY-MM-DD
  eventType: EventType;
  createdBy: string; // Creator ID (Department Admin)
  creatorName: string;
}

export interface AppNotification {
  id: string;
  recipientRole?: UserRole | "All"; // Role-specific notification, or "All", or userId
  recipientId?: string; // Individual user notification
  title: string;
  message: string;
  readBy: string[]; // List of userIds who read it
  createdAt: string;
}

export interface MaterialSummary {
  id: string;
  materialId: string;
  generatedSummary: string;
  keyPoints: string[];
  definitions: { term: string; definition: string }[];
  formulaSheet?: string;
  generatedAt: string;
}

export interface RevisionGuide {
  id: string;
  courseId: string;
  courseCode: string;
  studyGuide: string; // AI generated guide
  possibleQuestions: { question: string; answerBrief: string }[];
  keyConcepts: string[];
  generatedAt: string;
}
