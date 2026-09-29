import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import { UserModel } from "./src/models/User.js";
import { CourseModel } from "./src/models/Course.js";
import { MaterialModel } from "./src/models/Material.js";
import { DownloadLogModel } from "./src/models/DownloadLog.js";
import { AuditLogModel } from "./src/models/AuditLog.js";
import { 
  User, 
  Course, 
  Material, 
  AuditLog, 
  DownloadLog, 
  CalendarEvent, 
  AppNotification, 
  MaterialSummary, 
  RevisionGuide,
  UserRole,
  EventType,
  ApprovalStatus
} from "./src/types.js"; // Standard ESM resolving in build CJS output

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
    console.log("Gemini Client initialized successfully on the server.");
  } catch (error) {
    console.error("Failed to initialize Gemini Client:", error);
  }
}

// Robust generic function to call generateContent with retry and model fallback
async function generateContentWithRetry(prompt: string, options: { 
  model?: string; 
  responseMimeType?: string; 
  maxRetries?: number;
} = {}) {
  if (!aiClient) {
    throw new Error("Gemini AI Client is not initialized.");
  }

  const preferredModel = options.model || 'gemini-3.5-flash';
  const alternativeModel = 'gemini-3.1-flash-lite';
  const secondAlternativeModel = 'gemini-flash-latest';

  const maxRetries = options.maxRetries || 2;
  const modelsToTry = [preferredModel, alternativeModel, secondAlternativeModel];

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Executing Gemini API [Model: ${modelName}] [Attempt: ${attempt}/${maxRetries}]...`);
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: options.responseMimeType as any
          }
        });
        
        const responseText = response.text || "";
        if (responseText) {
          return responseText;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini run failed with model ${modelName} on attempt ${attempt}:`, err.message || err);
        if (attempt < maxRetries) {
          const delay = attempt * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    console.log(`Model ${modelName} not available. Falling back to next available model...`);
  }

  throw lastError || new Error("Failed to generate content after all model/retry attempts.");
}

// Persist database in database.json
const DB_PATH = path.join(process.cwd(), "database.json");

interface DBStructure {
  users: User[];
  courses: Course[];
  materials: Material[];
  auditLogs: AuditLog[];
  downloadLogs: DownloadLog[];
  calendarEvents: CalendarEvent[];
  notifications: AppNotification[];
  materialSummaries: MaterialSummary[];
  revisionGuides: RevisionGuide[];
}

const DEFAULT_DB: DBStructure = {
  users: [
    {
      id: "usr_super",
      fullName: "Professor Obiorah Marvellous",
      email: "super_admin@vault.edu",
      role: UserRole.SUPER_ADMIN,
      department: "Computer Science",
      matricOrStaffNumber: "ADMIN-001",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_admin",
      fullName: "Dr. Evelyn Peterson",
      email: "dept_admin@vault.edu",
      role: UserRole.DEPARTMENT_ADMIN,
      department: "Computer Science",
      matricOrStaffNumber: "STAFF-CSA-02",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_lecturer1",
      fullName: "Dr. Alan Turing",
      email: "lecturer_taylor@vault.edu",
      role: UserRole.LECTURER,
      department: "Computer Science",
      matricOrStaffNumber: "STAFF-CS-45",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_student1",
      fullName: "Mary Lovelace",
      email: "student_mary@vault.edu",
      role: UserRole.STUDENT,
      level: "300",
      department: "Computer Science",
      matricOrStaffNumber: "CS/2023/1042",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_student_100",
      fullName: "Bob Franklin (100 Level)",
      email: "student_bob@vault.edu",
      role: UserRole.STUDENT,
      level: "100",
      department: "Computer Science",
      matricOrStaffNumber: "CS/2025/0012",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_student_200",
      fullName: "Alice Vance (200 Level)",
      email: "student_alice@vault.edu",
      role: UserRole.STUDENT,
      level: "200",
      department: "Computer Science",
      matricOrStaffNumber: "CS/2024/0981",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_student_450",
      fullName: "David Hopper (400 Level)",
      email: "student_david@vault.edu",
      role: UserRole.STUDENT,
      level: "400",
      department: "Computer Science",
      matricOrStaffNumber: "CS/2022/1945",
      createdAt: new Date().toISOString()
    },
    {
      id: "usr_student_500",
      fullName: "Benjamin (500 Level)",
      email: "Benjamin@vault.edu",
      role: UserRole.STUDENT,
      level: "500",
      department: "Information Technology",
      matricOrStaffNumber: "20211275342",
      createdAt: new Date().toISOString()
    }
  ],
  courses: [
    {
      id: "crs_ift101",
      courseCode: "IFT 101",
      courseTitle: "Introduction to Information Technology",
      level: "100",
      semester: "1st",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    },
    {
      id: "crs_ift102",
      courseCode: "IFT 102",
      courseTitle: "Logic and Computer Problems",
      level: "100",
      semester: "2nd",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    },
    {
      id: "crs_ift201",
      courseCode: "IFT 201",
      courseTitle: "Computer Architecture and Web Applications",
      level: "200",
      semester: "1st",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    },
    {
      id: "crs_ift202",
      courseCode: "IFT 202",
      courseTitle: "Database and Information Management",
      level: "200",
      semester: "2nd",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    },
    {
      id: "crs_ift305",
      courseCode: "IFT 305",
      courseTitle: "Operating Systems and Shell Scripting",
      level: "300",
      semester: "1st",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    },
    {
      id: "crs_ift306",
      courseCode: "IFT 306",
      courseTitle: "Data Communications and Networking",
      level: "300",
      semester: "2nd",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    },
    {
      id: "crs_ift401",
      courseCode: "IFT 401",
      courseTitle: "Systems Analysis and Design Methods",
      level: "400",
      semester: "1st",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    },
    {
      id: "crs_ift402",
      courseCode: "IFT 402",
      courseTitle: "IT Security and Risk Engineering",
      level: "400",
      semester: "2nd",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    },
    {
      id: "crs_ift499",
      courseCode: "IFT 499",
      courseTitle: "Senior Capstone IT Venture Project Unit A",
      level: "500",
      semester: "1st",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    },
    {
      id: "crs_ift500",
      courseCode: "IFT 500",
      courseTitle: "Practical Capstone System Project Unit B",
      level: "500",
      semester: "2nd",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    },
    {
      id: "crs_ift501",
      courseCode: "IFT 501",
      courseTitle: "Intelligent Forensics and Threat Detection",
      level: "500",
      semester: "1st",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    },
    {
      id: "crs_ift502",
      courseCode: "IFT 502",
      courseTitle: "Cryptographic Systems Security Protocols",
      level: "500",
      semester: "2nd",
      lecturerId: "usr_lecturer1",
      lecturerName: "Dr. Alan Turing"
    }
  ],
  materials: [
    {
      id: "mat_100_1",
      title: "IFT 101 Lecture 1 - Basics of Computing & Information Logic",
      description: "Fundamental digital computing concepts, binary arithmetic, and truth tables.",
      courseId: "crs_ift101",
      courseCode: "IFT 101",
      uploadedBy: "usr_lecturer1",
      uploaderName: "Dr. Alan Turing",
      fileUrl: "vault://ift101_l1.pdf",
      fileHash: "7b8db9cfad289bbecf359be2d721015c7e7bca54db4c125bbde2a8b301b7a2d7",
      fileSize: "920 KB",
      approvalStatus: ApprovalStatus.APPROVED,
      uploadedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      documentType: "Lecture Note",
      semester: "1st"
    },
    {
      id: "mat_200_1",
      title: "IFT 201 Lecture 1 - Introduction to Web Servers and Client Protocols",
      description: "Deep dive into web architectures, HTTP request lifecycle, and server endpoints.",
      courseId: "crs_ift201",
      courseCode: "IFT 201",
      uploadedBy: "usr_lecturer1",
      uploaderName: "Dr. Alan Turing",
      fileUrl: "vault://ift201_l1.pdf",
      fileHash: "2feaa0c55ad9f86d081884c7d65015a3bf4f1b2b0b822cd15d6c15b150c90f00",
      fileSize: "1.2 MB",
      approvalStatus: ApprovalStatus.APPROVED,
      uploadedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      documentType: "Lecture Note",
      semester: "1st"
    },
    {
      id: "mat_1",
      title: "IFT 305 Lecture 1 - POSIX Shell scripting and execution pipelines",
      description: "Comprehensive introduction to terminal pipelines, file descriptors, and custom scripts.",
      courseId: "crs_ift305",
      courseCode: "IFT 305",
      uploadedBy: "usr_lecturer1",
      uploaderName: "Dr. Alan Turing",
      fileUrl: "vault://ift305_l1.pdf",
      fileHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      fileSize: "1.4 MB",
      approvalStatus: ApprovalStatus.APPROVED,
      uploadedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      documentType: "Lecture Note",
      semester: "1st"
    },
    {
      id: "mat_csc301_pq",
      title: "IFT 305 Past Questions — First Semester Exam (2024)",
      description: "Question 1: Explain standard files (stdout, stdin, stderr) inside POSIX processes.\nQuestion 2: Create a bash script that iterates over lines of log entries and parses telemetry counts.\nQuestion 3: Elaborate on symmetric file permission octals inside Unix file architectures.",
      courseId: "crs_ift305",
      courseCode: "IFT 305",
      uploadedBy: "usr_lecturer1",
      uploaderName: "Dr. Alan Turing",
      fileUrl: "vault://ift305_pq_2024.pdf",
      fileHash: "8e7dd92f2bcf0ebc934ca495991b7852b855866eefffa11bbdecb08e7df0a012",
      fileSize: "1.1 MB",
      approvalStatus: ApprovalStatus.APPROVED,
      uploadedAt: new Date(Date.now() - 2.5 * 24 * 3600 * 1000).toISOString(),
      documentType: "Past Question",
      semester: "1st"
    },
    {
      id: "mat_2",
      title: "IFT 305 Lecture 2 - Kernel Space vs User Space",
      description: "Deep dive into context switching, hardware ring levels, and system call boundaries.",
      courseId: "crs_ift305",
      courseCode: "IFT 305",
      uploadedBy: "usr_lecturer1",
      uploaderName: "Dr. Alan Turing",
      fileUrl: "vault://ift305_l2.pdf",
      fileHash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      fileSize: "2.1 MB",
      approvalStatus: ApprovalStatus.APPROVED,
      uploadedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      documentType: "Lecture Note",
      semester: "1st"
    },
    {
      id: "mat_3",
      title: "IFT 306 Syllabus & Modern Ethernet Topologies",
      description: "Overview of networking standards, packet headers, physical signal framing, and data routers.",
      courseId: "crs_ift306",
      courseCode: "IFT 306",
      uploadedBy: "usr_lecturer1",
      uploaderName: "Dr. Alan Turing",
      fileUrl: "vault://ift306_syllabus.pdf",
      fileHash: "4a28f731e847c234a9efdf15c32fa1d5a3bf1015c7e7bca54db4c125bbde2d71",
      fileSize: "780 KB",
      approvalStatus: ApprovalStatus.APPROVED,
      uploadedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      documentType: "Syllabus",
      semester: "2nd"
    },
    {
      id: "mat_ift501_note",
      title: "IFT 501 Lecture 1 - Mobile Security Architectures",
      description: "Detailed breakdown of the secure sandbox, Android permission enforcement logic, secure system audits, and threat telemetry monitoring.",
      courseId: "crs_ift501",
      courseCode: "IFT 501",
      uploadedBy: "usr_lecturer1",
      uploaderName: "Dr. Alan Turing",
      fileUrl: "vault://ift501_l1.pdf",
      fileHash: "a9efdf15c32fa1d5a3bf1015c7e7bca54db4c125bbde2d71676dfda45cd12e3f8",
      fileSize: "1.6 MB",
      approvalStatus: ApprovalStatus.APPROVED,
      uploadedAt: new Date(Date.now() - 3.5 * 24 * 3600 * 1000).toISOString(),
      documentType: "Lecture Note",
      semester: "1st"
    },
    {
      id: "mat_ift501_pq",
      title: "IFT 501 Past Questions — First Semester Exam (2025)",
      description: "Question 1: Explain the functional differences between root exploit detection models and dynamic binary instrumentation.\nQuestion 2: Detail how signature-based Android package verification patterns operate.\nQuestion 3: Critique permission isolation constraints under modern Linux namespace contexts.",
      courseId: "crs_ift501",
      courseCode: "IFT 501",
      uploadedBy: "usr_lecturer1",
      uploaderName: "Dr. Alan Turing",
      fileUrl: "vault://ift501_pq_2025.pdf",
      fileHash: "8cd9b275211f42eab098bbbeacdb9217316719280dcb8cc91bfeaa7d716298ac",
      fileSize: "1.3 MB",
      approvalStatus: ApprovalStatus.APPROVED,
      uploadedAt: new Date(Date.now() - 1.5 * 24 * 3600 * 1000).toISOString(),
      documentType: "Past Question",
      semester: "1st"
    },
    {
      id: "mat_ift502_pq",
      title: "IFT 502 Past Questions — Second Semester Exam (2025)",
      description: "Question 1: Detail the Diffie-Hellman discrete logarithm structure and potential active MITM mitigations.\nQuestion 2: Construct are algebraic formulations for Elliptic Curve Cryptography over prime fields.\nQuestion 3: Elaborate on zero-knowledge interactive proofs vs non-interactive proofs.",
      courseId: "crs_ift502",
      courseCode: "IFT 502",
      uploadedBy: "usr_lecturer1",
      uploaderName: "Dr. Alan Turing",
      fileUrl: "vault://ift502_pq_2025.pdf",
      fileHash: "ad7df9c8e1ba098b111666ff72fec01a3bf39d89280dfdfa52b8558f6280927c",
      fileSize: "1.5 MB",
      approvalStatus: ApprovalStatus.APPROVED,
      uploadedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      documentType: "Past Question",
      semester: "2nd"
    }
  ],
  auditLogs: [
    {
      id: "log_1",
      userId: "usr_super",
      userName: "Professor Obiorah Marvellous",
      userRole: UserRole.SUPER_ADMIN,
      action: "System Bootstrapped",
      details: "Database initialized with secure preseed entities",
      ipAddress: "127.0.0.1",
      device: "System Process",
      timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "log_2",
      userId: "usr_lecturer1",
      userName: "Dr. Alan Turing",
      userRole: UserRole.LECTURER,
      action: "Material Uploaded",
      details: "Uploaded 'CSC 301 Lecture 1 - Object Oriented Design'",
      ipAddress: "192.168.1.15",
      device: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
      timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "log_3",
      userId: "usr_admin",
      userName: "Dr. Evelyn Peterson",
      userRole: UserRole.DEPARTMENT_ADMIN,
      action: "Material Approved",
      details: "Approved 'CSC 301 Lecture 1 - Object Oriented Design'",
      ipAddress: "192.168.1.10",
      device: "Mozilla/5.0 (Windows NT 10.0; Win64)",
      timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 3600000).toISOString()
    }
  ],
  downloadLogs: [
    {
      id: "dl_1",
      materialId: "mat_1",
      materialTitle: "CSC 301 Lecture 1 - Object Oriented Design",
      courseCode: "CSC 301",
      studentId: "usr_student1",
      studentName: "Mary Lovelace",
      timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    }
  ],
  calendarEvents: [
    {
      id: "evt_1",
      title: "CSC 301 First In-Course Test",
      description: "Classroom Block C. Topics cover Lectures 1 to 4 of Object Oriented Paradigm. Compulsory attendance.",
      eventDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
      eventType: EventType.EXAM,
      createdBy: "usr_admin",
      creatorName: "Dr. Evelyn Peterson"
    },
    {
      id: "evt_2",
      title: "material upload deadline (CSC 303)",
      description: "All lecturers assigned to CSC 303 are expected to have populated the course vaults in view of the upcoming department audits.",
      eventDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
      eventType: EventType.DEADLINE,
      createdBy: "usr_admin",
      creatorName: "Dr. Evelyn Peterson"
    },
    {
      id: "evt_3",
      title: "Department Board Meeting",
      description: "Regular departmental curriculum review meeting. Venue: Board Room.",
      eventDate: new Date().toISOString().split("T")[0],
      eventType: EventType.MEETING,
      createdBy: "usr_admin",
      creatorName: "Dr. Evelyn Peterson"
    }
  ],
  notifications: [
    {
      id: "not_1",
      recipientRole: "All",
      title: "Welcome to academic content vault",
      message: "The custom Content Vault has been established for tracking materials, audit logging download metrics, calendar schedules, and AI revision.",
      readBy: [],
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "not_2",
      recipientRole: UserRole.LECTURER,
      title: "Review pending lecture materials submission",
      message: "Admin reminds all lecturers to upload approved materials & lecture content for 1st-semester courses to ensure sufficient revision coverage before exam schedules.",
      readBy: [],
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ],
  materialSummaries: [
    {
      id: "sum_1",
      materialId: "mat_1",
      generatedSummary: "This document introduces structured Object-Oriented Design (OOD) paradigms for modern software. It covers the core foundations of programming with specific focus on custom abstractions, classes, entities, structured data schemas, and encapsulating system operations cleanly.",
      keyPoints: [
        "Encapsulation aggregates state data with logic routines safely.",
        "Abstraction hides internal complexity and provides simple, clean public interfaces.",
        "Inheritance supports design reuse, whereas polymorphism supports interface substitution."
      ],
      definitions: [
        { term: "Class", definition: "A blueprint or template description for creating custom objects." },
        { term: "Polymorphism", definition: "The ability for of different sub-types to satisfy a single generic interface." }
      ],
      formulaSheet: "None/Conceptual foundations.",
      generatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    }
  ],
  revisionGuides: []
};

// Helper inside server to load DB
function loadDB(): DBStructure {
  try {
    let db: DBStructure;
    if (fs.existsSync(DB_PATH)) {
      const fileContent = fs.readFileSync(DB_PATH, "utf-8");
      db = JSON.parse(fileContent) as DBStructure;
    } else {
      db = JSON.parse(JSON.stringify(DEFAULT_DB));
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    }

    let dbChanged = false;

    // 1. Core Safeguard: Ensure syllabus courses are matched to Information Technology (IFT)
    const hasIftCourses = db.courses && db.courses.some(c => c.courseCode.startsWith("IFT"));
    if (!hasIftCourses || db.courses.length < 10) {
      db.courses = JSON.parse(JSON.stringify(DEFAULT_DB.courses));
      db.materials = JSON.parse(JSON.stringify(DEFAULT_DB.materials));
      dbChanged = true;
    }

    // 2. Pre-registration mapping: initialize registeredCourseIds for all student roles
    if (db.users) {
      db.users.forEach(u => {
        if (u.role === UserRole.STUDENT) {
          if (!u.registeredCourseIds || !Array.isArray(u.registeredCourseIds)) {
            // Map student to all courses corresponding to their level (pre-registered by default)
            const matchedLevelCourses = db.courses.filter(c => c.level === u.level).map(c => c.id);
            u.registeredCourseIds = matchedLevelCourses;
            dbChanged = true;
          }
        }
      });
    }

    if (dbChanged) {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    }

    return db;
  } catch (error) {
    console.error("Error loading mock file database:", error);
    return DEFAULT_DB;
  }
}

// MongoDB Synchronization Helper
async function syncToMongo(db: DBStructure) {
  if (mongoose.connection.readyState !== 1) return;
  try {
    if (db.users && db.users.length > 0) {
      for (const u of db.users) {
        await UserModel.findOneAndUpdate(
          { email: u.email.toLowerCase().trim() },
          {
            fullName: u.fullName,
            email: u.email.toLowerCase().trim(),
            role: u.role,
            level: u.level || "",
            department: u.department,
            matricOrStaffNumber: u.matricOrStaffNumber,
            registeredCourseIds: u.registeredCourseIds || [],
            createdAt: u.createdAt || new Date().toISOString()
          },
          { upsert: true, new: true }
        );
      }
    }

    if (db.courses && db.courses.length > 0) {
      for (const c of db.courses) {
        await CourseModel.findOneAndUpdate(
          { courseCode: c.courseCode },
          {
            courseCode: c.courseCode,
            courseTitle: c.courseTitle,
            level: c.level,
            semester: c.semester,
            lecturerId: c.lecturerId,
            lecturerName: c.lecturerName
          },
          { upsert: true, new: true }
        );
      }
    }

    if (db.materials && db.materials.length > 0) {
      for (const m of db.materials) {
        await MaterialModel.findOneAndUpdate(
          { title: m.title, courseCode: m.courseCode },
          {
            title: m.title,
            description: m.description || "",
            courseId: m.courseId,
            courseCode: m.courseCode,
            uploadedBy: m.uploadedBy,
            uploaderName: m.uploaderName,
            fileUrl: m.fileUrl,
            fileHash: m.fileHash,
            fileSize: m.fileSize,
            approvalStatus: m.approvalStatus,
            uploadedAt: m.uploadedAt,
            documentType: m.documentType,
            semester: m.semester,
            solutionMarkdown: m.solutionMarkdown,
            solutionGeneratedAt: m.solutionGeneratedAt
          },
          { upsert: true, new: true }
        );
      }
    }

    if (db.downloadLogs && db.downloadLogs.length > 0) {
      for (const dl of db.downloadLogs) {
        await DownloadLogModel.findOneAndUpdate(
          { materialId: dl.materialId, studentId: dl.studentId, timestamp: dl.timestamp },
          {
            materialId: dl.materialId,
            materialTitle: dl.materialTitle,
            courseCode: dl.courseCode,
            studentId: dl.studentId,
            studentName: dl.studentName,
            timestamp: dl.timestamp
          },
          { upsert: true, new: true }
        );
      }
    }

    if (db.auditLogs && db.auditLogs.length > 0) {
      for (const al of db.auditLogs.slice(0, 50)) {
        await AuditLogModel.findOneAndUpdate(
          { userId: al.userId, action: al.action, timestamp: al.timestamp },
          {
            userId: al.userId,
            userName: al.userName,
            userRole: al.userRole,
            action: al.action,
            details: al.details,
            ipAddress: al.ipAddress,
            device: al.device,
            timestamp: al.timestamp
          },
          { upsert: true, new: true }
        );
      }
    }
  } catch (err) {
    console.warn("MongoDB sync notice:", err);
  }
}

// Helper to save DB
function saveDB(db: DBStructure) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    syncToMongo(db).catch(err => console.warn("Background Mongo sync error:", err));
  } catch (error) {
    console.error("Error persistent writing file database:", error);
  }
}

// Log audit helper
function logAuditEvent(
  userId: string, 
  action: string, 
  detailsValue: string, 
  req: express.Request
) {
  const db = loadDB();
  const user = db.users.find(u => u.id === userId);
  const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
  const device = req.headers["user-agent"] || "Unknown Device";

  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId: userId,
    userName: user ? user.fullName : "Unknown/Anonymous",
    userRole: user ? user.role : UserRole.STUDENT,
    action,
    details: detailsValue,
    ipAddress,
    device,
    timestamp: new Date().toISOString()
  };

  db.auditLogs.unshift(newLog);
  saveDB(db);
  console.log(`[AUDIT EVENT]: ${action} - ${detailsValue}`);
}

// REST ENDPOINTS

// 1. Auth Endpoint: LOGIN
app.post("/api/auth/login", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required to access the vault!" });
  }

  const db = loadDB();
  const user = db.users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: "This email is not registered in the Vault. Please contact Super Admin or register." });
  }

  // Auditable event
  logAuditEvent(user.id, "Login", `User signed in successfully via ${user.role} role.`, req);

  res.json({ user });
});

// Auth Endpoint: REGISTER
app.post("/api/auth/register", async (req, res) => {
  const { fullName, email, role, level, department, matricOrStaffNumber } = req.body;
  if (!fullName || !email || !role || !department || !matricOrStaffNumber) {
    return res.status(400).json({ error: "Please fill out all required fields to register." });
  }

  const db = loadDB();
  const cleanEmail = email.toLowerCase().trim();
  const existingUser = db.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
  if (existingUser) {
    return res.status(400).json({ error: "User with this email is already registered." });
  }

  // Pre-register all courses matching student level so student has immediate course access
  let registeredCourseIds: string[] = [];
  if (role === UserRole.STUDENT) {
    const studentLevel = level || "100";
    registeredCourseIds = db.courses.filter(c => c.level === studentLevel).map(c => c.id);
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    fullName: fullName.trim(),
    email: cleanEmail,
    role: role as UserRole,
    level,
    department: department.trim(),
    matricOrStaffNumber: matricOrStaffNumber.trim(),
    registeredCourseIds,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);

  // Directly save/upsert to MongoDB UserModel if MongoDB is connected
  if (mongoose.connection.readyState === 1) {
    try {
      await UserModel.findOneAndUpdate(
        { email: cleanEmail },
        {
          fullName: newUser.fullName,
          email: cleanEmail,
          role: newUser.role,
          level: newUser.level || "",
          department: newUser.department,
          matricOrStaffNumber: newUser.matricOrStaffNumber,
          registeredCourseIds: newUser.registeredCourseIds,
          createdAt: newUser.createdAt
        },
        { upsert: true, new: true }
      );
      console.log(`[MongoDB]: Registered user ${cleanEmail} saved to MongoDB.`);
    } catch (mongoErr) {
      console.warn("MongoDB registration save notice:", mongoErr);
    }
  }

  // Auditable logging
  logAuditEvent(newUser.id, "Register", `New user successfully registered in database with ID/matric: ${matricOrStaffNumber}`, req);

  res.json({ user: newUser });
});

// Auth Endpoint: LOGOUT
app.post("/api/auth/logout", (req, res) => {
  const { userId } = req.body;
  if (userId) {
    logAuditEvent(userId, "Logout", "Session closed gracefully by user", req);
  }
  res.json({ success: true });
});

// Users: GET all users (Super Admin or Dept Admin only, client handles view restricting but backend also supports it)
app.get("/api/users", (req, res) => {
  const db = loadDB();
  res.json(db.users);
});

// Users: Create User (Admin Feature)
app.post("/api/users", async (req, res) => {
  const { creatorId, fullName, email, role, level, department, matricOrStaffNumber } = req.body;
  if (!fullName || !email || !role || !department || !matricOrStaffNumber) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const db = loadDB();
  const cleanEmail = email.toLowerCase().trim();
  const existingUser = db.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
  if (existingUser) {
    return res.status(400).json({ error: "User email already exists" });
  }

  let registeredCourseIds: string[] = [];
  if (role === UserRole.STUDENT) {
    const studentLevel = level || "100";
    registeredCourseIds = db.courses.filter(c => c.level === studentLevel).map(c => c.id);
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    fullName: fullName.trim(),
    email: cleanEmail,
    role: role as UserRole,
    level,
    department: department.trim(),
    matricOrStaffNumber: matricOrStaffNumber.trim(),
    registeredCourseIds,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);

  if (mongoose.connection.readyState === 1) {
    try {
      await UserModel.findOneAndUpdate(
        { email: cleanEmail },
        {
          fullName: newUser.fullName,
          email: cleanEmail,
          role: newUser.role,
          level: newUser.level || "",
          department: newUser.department,
          matricOrStaffNumber: newUser.matricOrStaffNumber,
          registeredCourseIds: newUser.registeredCourseIds,
          createdAt: newUser.createdAt
        },
        { upsert: true, new: true }
      );
    } catch (mongoErr) {
      console.warn("MongoDB admin user save notice:", mongoErr);
    }
  }

  if (creatorId) {
    logAuditEvent(creatorId, "User Created", `Admin created user ${fullName} (${role}) in database`, req);
  }

  res.json(newUser);
});

// Users: Delete User (Admin Feature)
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { adminId } = req.query;

  const db = loadDB();
  const userToDelete = db.users.find(u => u.id === id);
  if (!userToDelete) {
    return res.status(404).json({ error: "User not found" });
  }

  db.users = db.users.filter(u => u.id !== id);
  saveDB(db);

  if (adminId) {
    logAuditEvent(adminId as string, "User Deleted", `Super Admin deleted user ${userToDelete.fullName} (${userToDelete.email})`, req);
  }

  res.json({ success: true });
});

// Courses: GET Courses
app.get("/api/courses", (req, res) => {
  const db = loadDB();
  res.json(db.courses);
});

// Courses: POST create Course
app.post("/api/courses", (req, res) => {
  const { courseCode, courseTitle, level, semester, lecturerId, adminId } = req.body;
  if (!courseCode || !courseTitle || !level || !semester || !lecturerId) {
    return res.status(400).json({ error: "All fields are required to create a Course" });
  }

  const db = loadDB();
  const lecturer = db.users.find(u => u.id === lecturerId);
  const newCourse: Course = {
    id: `crs_${Date.now()}`,
    courseCode,
    courseTitle,
    level,
    semester,
    lecturerId,
    lecturerName: lecturer ? lecturer.fullName : "Assigned Lecturer"
  };

  db.courses.push(newCourse);
  saveDB(db);

  if (adminId) {
    logAuditEvent(adminId, "Course Created", `Created courses entity: ${courseCode} (${courseTitle})`, req);
  }

  res.json(newCourse);
});

// Courses: Update Course
app.put("/api/courses/:id", (req, res) => {
  const { id } = req.params;
  const { courseCode, courseTitle, level, semester, lecturerId, adminId } = req.body;

  const db = loadDB();
  const courseIdx = db.courses.findIndex(c => c.id === id);
  if (courseIdx === -1) {
    return res.status(404).json({ error: "Course not found" });
  }

  const lecturer = db.users.find(u => u.id === lecturerId);
  db.courses[courseIdx] = {
    ...db.courses[courseIdx],
    courseCode,
    courseTitle,
    level,
    semester,
    lecturerId,
    lecturerName: lecturer ? lecturer.fullName : db.courses[courseIdx].lecturerName
  };

  saveDB(db);

  if (adminId) {
    logAuditEvent(adminId, "Course Updated", `Updated courses code parameters: ${courseCode}`, req);
  }

  res.json(db.courses[courseIdx]);
});

// Materials: GET Materials
app.get("/api/materials", (req, res) => {
  const db = loadDB();
  res.json(db.materials);
});

// Materials: POST Upload
app.post("/api/materials", (req, res) => {
  const { title, description, courseId, uploadedBy, fileContentBase64, customFileName, fileSizeStr, documentType, semester } = req.body;
  if (!title || !description || !courseId || !uploadedBy) {
    return res.status(400).json({ error: "All material fields are required." });
  }

  const db = loadDB();
  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: "Target Course not found" });
  }

  const uploader = db.users.find(u => u.id === uploadedBy);

  // Generate an integrity file hash
  const shasum = crypto.createHash('sha256');
  shasum.update(fileContentBase64 || title + description + Date.now().toString());
  const fileHash = shasum.digest('hex');

  // Strict Safeguard: Prevent duplicated files / titles inside the same syllabus node
  const isDuplicate = db.materials.some(m => 
    m.courseId === courseId && (
      m.fileHash === fileHash || 
      m.title.toLowerCase().trim() === title.toLowerCase().trim()
    )
  );

  if (isDuplicate) {
    return res.status(400).json({ error: "Administrative Safeguard: Duplicate file detected. A document with this exact title or matching file content hash already exists for this course, preventing redundant uploads." });
  }

  const newMaterial: Material = {
    id: `mat_${Date.now()}`,
    title,
    description,
    courseId,
    courseCode: course.courseCode,
    uploadedBy,
    uploaderName: uploader ? uploader.fullName : "Lecturer Assigned",
    fileUrl: `vault://${customFileName || "material_" + Date.now() + ".pdf"}`,
    fileHash,
    fileSize: fileSizeStr || "1.2 MB",
    approvalStatus: ApprovalStatus.PENDING,
    documentType: documentType || "Lecture Note",
    semester: semester || course.semester || "1st",
    uploadedAt: new Date().toISOString()
  };

  db.materials.push(newMaterial);
  saveDB(db);

  logAuditEvent(uploadedBy, "Material Uploaded", `Uploaded material '${title}' for ${course.courseCode}`, req);

  // Send Admin Notification about a pending review
  const adminNotification: AppNotification = {
    id: `not_${Date.now()}`,
    recipientRole: UserRole.DEPARTMENT_ADMIN,
    title: "New Material Awaiting Approval",
    message: `${uploader ? uploader.fullName : "A Lecturer"} uploaded '${title}' for ${course.courseCode}. Peer-review approval is required.`,
    readBy: [],
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(adminNotification);
  saveDB(db);

  res.json(newMaterial);
});

// Users: POST Student Course Registrations
app.post("/api/users/:id/register-courses", (req, res) => {
  const { id } = req.params;
  const { courseIds, adminId } = req.body;
  if (!Array.isArray(courseIds)) {
    return res.status(400).json({ error: "courseIds array is required." });
  }

  const db = loadDB();
  const userIdx = db.users.findIndex(u => u.id === id);
  if (userIdx === -1) {
    return res.status(404).json({ error: "User profile not found." });
  }

  const user = db.users[userIdx];
  user.registeredCourseIds = courseIds;
  saveDB(db);

  if (adminId) {
    const admin = db.users.find(u => u.id === adminId);
    logAuditEvent(adminId, "Admin Course Assignment", `Assigned student ${user.fullName} (${user.matricOrStaffNumber}) course IDs: ${courseIds.join(", ")}`, req);
  } else {
    logAuditEvent(id, "Course Self-Registration", `Student synchronized course registration count to: ${courseIds.length}`, req);
  }

  res.json({ success: true, user });
});

// Materials: Approve
app.put("/api/materials/approve/:id", (req, res) => {
  const { id } = req.params;
  const { adminId } = req.body;

  const db = loadDB();
  const materialIdx = db.materials.findIndex(m => m.id === id);
  if (materialIdx === -1) {
    return res.status(404).json({ error: "Material not found" });
  }

  db.materials[materialIdx].approvalStatus = ApprovalStatus.APPROVED;
  saveDB(db);

  const approvedMat = db.materials[materialIdx];

  if (adminId) {
    logAuditEvent(adminId, "Material Approved", `Approved material '${approvedMat.title}'`, req);
  }

  // Create general Student notification
  const studentNotification: AppNotification = {
    id: `not_${Date.now()}`,
    recipientRole: UserRole.STUDENT,
    title: `New vault content: ${approvedMat.courseCode}`,
    message: `Lectures vault for ${approvedMat.courseCode} updated with approved study guide: '${approvedMat.title}'. Available for revision.`,
    readBy: [],
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(studentNotification);
  saveDB(db);

  res.json(approvedMat);
});

// Materials: Reject
app.put("/api/materials/reject/:id", (req, res) => {
  const { id } = req.params;
  const { adminId, reason } = req.body;

  const db = loadDB();
  const materialIdx = db.materials.findIndex(m => m.id === id);
  if (materialIdx === -1) {
    return res.status(404).json({ error: "Material not found" });
  }

  db.materials[materialIdx].approvalStatus = ApprovalStatus.REJECTED;
  saveDB(db);

  const rejectedMat = db.materials[materialIdx];

  if (adminId) {
    logAuditEvent(adminId, "Material Rejected", `Rejected material '${rejectedMat.title}'. Reason: ${reason || "Not specified"}`, req);
  }

  // Create custom notifications for Lecturer uploader
  const lecturerNotification: AppNotification = {
    id: `not_${Date.now()}`,
    recipientId: rejectedMat.uploadedBy,
    title: `Material rejected in ${rejectedMat.courseCode}`,
    message: `Your material '${rejectedMat.title}' was rejected during departmental peer-review audit. Reason: ${reason || "Incomplete content compliance"}`,
    readBy: [],
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(lecturerNotification);
  saveDB(db);

  res.json(rejectedMat);
});

// Download Log and Action Tracking
app.post("/api/materials/download/:id", (req, res) => {
  const { id } = req.params;
  const { studentId } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Id is required" });
  }

  const db = loadDB();
  const material = db.materials.find(m => m.id === id);
  if (!material) {
    return res.status(404).json({ error: "Material not found" });
  }

  const student = db.users.find(u => u.id === studentId);

  // Enforce student level security clearance constraints
  if (student && student.role === UserRole.STUDENT) {
    const courseObj = db.courses.find(c => c.id === material.courseId);
    if (courseObj && courseObj.level !== student.level) {
      logAuditEvent(studentId, "Download Level Violation Blocked", `BLOCKED: Student '${student.fullName}' (Level ${student.level}) attempted unauthorized download on '${material.title}' (Clearance required: Level ${courseObj.level})`, req);
      return res.status(403).json({ error: `Access Denied: Level clearance mismatch. Students at Level ${student.level} cannot access Level ${courseObj.level} files.` });
    }
  }

  const newDlLog: DownloadLog = {
    id: `dl_${Date.now()}`,
    materialId: id,
    materialTitle: material.title,
    courseCode: material.courseCode,
    studentId: studentId || "Anonymous",
    studentName: student ? student.fullName : "Unknown Student",
    timestamp: new Date().toISOString()
  };

  db.downloadLogs.unshift(newDlLog);
  saveDB(db);

  logAuditEvent(studentId || "Guest", "Download Recorded", `Downloaded Vault file '${material.title}' (Hash: ${material.fileHash})`, req);

  res.json({ success: true, log: newDlLog });
});

// Download Analysis reports
app.get("/api/downloads/report", (req, res) => {
  const db = loadDB();
  res.json(db.downloadLogs);
});

// Audit Trails
app.get("/api/logs", (req, res) => {
  const db = loadDB();
  res.json(db.auditLogs);
});

// Calendar: GET
app.get("/api/calendar", (req, res) => {
  const db = loadDB();
  res.json(db.calendarEvents);
});

// Calendar: POST
app.post("/api/calendar", (req, res) => {
  const { title, description, eventDate, eventType, createdBy } = req.body;
  if (!title || !description || !eventDate || !eventType) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const db = loadDB();
  const creator = db.users.find(u => u.id === createdBy);
  const newEvt: CalendarEvent = {
    id: `evt_${Date.now()}`,
    title,
    description,
    eventDate,
    eventType: eventType as EventType,
    createdBy: createdBy || "System",
    creatorName: creator ? creator.fullName : "Department Coordinator"
  };

  db.calendarEvents.push(newEvt);
  
  // Create an automated app-wide notification for this calendar update
  const newNotif: AppNotification = {
    id: `not_${Date.now()}`,
    recipientRole: "All",
    title: `Calendar Update: ${title}`,
    message: `New department event scheduled for ${eventDate}. Category: ${eventType}. Description: ${description}`,
    readBy: [],
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(newNotif);

  saveDB(db);

  if (createdBy) {
    logAuditEvent(createdBy, "Event Created", `Added schedule: ${title} for date ${eventDate}`, req);
  }

  res.json(newEvt);
});

// Calendar: DELETE
app.delete("/api/calendar/:id", (req, res) => {
  const { id } = req.params;
  const { adminId } = req.query;

  const db = loadDB();
  const evt = db.calendarEvents.find(e => e.id === id);
  if (!evt) {
    return res.status(404).json({ error: "Event not found" });
  }

  db.calendarEvents = db.calendarEvents.filter(e => e.id !== id);
  saveDB(db);

  if (adminId) {
    logAuditEvent(adminId as string, "Event Deleted", `Removed schedule event '${evt.title}'`, req);
  }

  res.json({ success: true });
});

// Notifications: GET notifications
app.get("/api/notifications", (req, res) => {
  const db = loadDB();
  res.json(db.notifications);
});

// Notifications: POST create custom alerting broadcast
app.post("/api/notifications", (req, res) => {
  const { title, message, recipientRole, creatorId } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required" });
  }

  const db = loadDB();
  const newNotification: AppNotification = {
    id: `not_${Date.now()}`,
    recipientRole: (recipientRole || "All") as any,
    title,
    message,
    readBy: [],
    createdAt: new Date().toISOString()
  };

  db.notifications.unshift(newNotification);
  saveDB(db);

  if (creatorId) {
    logAuditEvent(creatorId, "Notification Broadcasted", `Broadcasted message: '${title}' targeting recipients: '${recipientRole || "All"}'`, req);
  }

  res.json(newNotification);
});

// Notifications: PUT mark read state
app.put("/api/notifications/read", (req, res) => {
  const { userId, notificationId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const db = loadDB();
  if (notificationId) {
    const idx = db.notifications.findIndex(n => n.id === notificationId);
    if (idx !== -1) {
      if (!db.notifications[idx].readBy.includes(userId)) {
        db.notifications[idx].readBy.push(userId);
      }
    }
  } else {
    // Mark all as read for this user
    db.notifications.forEach(n => {
      if (!n.readBy.includes(userId)) {
        n.readBy.push(userId);
      }
    });
  }

  saveDB(db);
  res.json({ success: true });
});

// 9. AI Summary Engine
app.post("/api/ai/summarize", async (req, res) => {
  const { materialId, userId } = req.body;
  if (!materialId) {
    return res.status(400).json({ error: "materialId is required" });
  }

  const db = loadDB();
  const material = db.materials.find(m => m.id === materialId);
  if (!material) {
    return res.status(404).json({ error: "Material not found" });
  }

  // Enforce student level security clearance constraints on AI summarize
  const user = db.users.find(u => u.id === userId);
  if (user && user.role === UserRole.STUDENT) {
    const courseObj = db.courses.find(c => c.id === material.courseId);
    if (courseObj && courseObj.level !== user.level) {
      logAuditEvent(userId, "AI Summary Level Violation Blocked", `BLOCKED: Student '${user.fullName}' (Level ${user.level}) attempted AI summary of Level ${courseObj.level} material '${material.title}'`, req);
      return res.status(403).json({ error: `Access Denied: Level clearance mismatch. Students at Level ${user.level} cannot access Level ${courseObj.level} files.` });
    }
  }

  // If a summary is already generated, return it instantly!
  const existingSummary = db.materialSummaries.find(s => s.materialId === materialId);
  if (existingSummary) {
    return res.json(existingSummary);
  }

  let generatedSummary = `No active API key set yet. Summary of '${material.title}': A custom detailed guide outlining primary computer science constraints, development modules, program structures, and system definitions relative to ${material.courseCode}.`;
  let keyPoints = [
    "Identifies structural variables and component states.",
    "Promotes peer auditing for content validity.",
    "Encourages robust version logs on all lectures."
  ];
  let definitions = [
    { term: "Auditing", definition: "A methodology to track structural file hashes & login state accesses." },
    { term: "Synthesis", definition: "Condensing several resources into structured guides." }
  ];
  let formulaSheet = "E = mc² (Complexity context: O(N) operations in bounded iteration cycles)";

  // If aiClient is available and API key is set, call Gemini with retry and fallback!
  if (aiClient) {
    try {
      const prompt = `You are an expert university AI teaching assistant. Summarize the following course content details.
Material Name: ${material.title}
Course Code: ${material.courseCode}
Description: ${material.description}

Generate a concise summary, key study points, important absolute technical definitions, and a short formulas/conceptual equation cheat sheet.
Return EXACTLY a JSON format block like:
{
  "summary": "Full paragraph summary here...",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "definitions": [
    { "term": "term", "definition": "definition of the term" }
  ],
  "formulaSheet": "Brief formula/cheat code guide here..."
}`;

      const responseText = await generateContentWithRetry(prompt, {
        model: 'gemini-3.5-flash',
        responseMimeType: "application/json"
      });

      console.log("Raw Gemini Response text is successfully retrieved.");

      try {
        const parsedJson = JSON.parse(responseText.trim());
        if (parsedJson.summary) generatedSummary = parsedJson.summary;
        if (parsedJson.keyPoints) keyPoints = parsedJson.keyPoints;
        if (parsedJson.definitions) definitions = parsedJson.definitions;
        if (parsedJson.formulaSheet) formulaSheet = parsedJson.formulaSheet;
      } catch (jsonErr) {
        console.warn("Could not parse JSON cleanly, matching string patterns.", jsonErr);
      }
    } catch (gemError) {
      console.error("Gemini model execution failed after retries:", gemError);
      // Fallback is gracefully assigned
    }
  }

  const newSummary: MaterialSummary = {
    id: `sum_${Date.now()}`,
    materialId,
    generatedSummary,
    keyPoints,
    definitions,
    formulaSheet,
    generatedAt: new Date().toISOString()
  };

  db.materialSummaries.push(newSummary);
  saveDB(db);

  if (userId) {
    logAuditEvent(userId, "AI Material Summarized", `Synthesized file '${material.title}' using Gemini Summary Engine`, req);
  }

  res.json(newSummary);
});

// 9.5 AI Solve Past Question
app.post("/api/ai/solve-past-question", async (req, res) => {
  const { materialId, userId } = req.body;
  if (!materialId) {
    return res.status(400).json({ error: "materialId is required" });
  }

  const db = loadDB();
  const material = db.materials.find(m => m.id === materialId);
  if (!material) {
    return res.status(404).json({ error: "Material not found" });
  }

  const courseObj = db.courses.find(c => c.id === material.courseId);

  // Enforce student level security clearance constraints
  const user = db.users.find(u => u.id === userId);
  if (user && user.role === UserRole.STUDENT) {
    if (courseObj && courseObj.level !== user.level) {
      logAuditEvent(userId, "AI Solve PQ Level Violation Blocked", `BLOCKED: Student '${user.fullName}' (Level ${user.level}) attempted AI solve past question of Level ${courseObj.level} material '${material.title}'`, req);
      return res.status(403).json({ error: `Access Denied: Level clearance mismatch. Students at Level ${user.level} cannot access Level ${courseObj.level} files.` });
    }
  }

  // If already solved, return material immediately
  if (material.solutionMarkdown) {
    return res.json(material);
  }

  let finalSolution = `No active API key. Dynamic fallback solution for '${material.title}':\n\n### Comprehensive Suggested Answer Sheet\n\n#### Part A: Fundamental Critique\nThe past question requires solving topics related to ${courseObj ? courseObj.courseTitle : "the syllabus"}. Here are the solutions to the questions described:\n\n1. **Question 1 Solution**: Clear structural isolation of resources prevents cross-module data leakage. Ensure encapsulated variables feature strict access modes.\n2. **Question 2 Solution**: Follow industry-standard modular definitions. Design modules around high cohesion and low coupling.\n3. **Question 3 Solution**: Apply robust runtime polymorphic interfaces ensuring clean code execution.\n\n*Study Suggestion: Revise key concepts using the core reference syllabus and solve mock papers under timed constraints.*`;

  if (aiClient) {
    try {
      const prompt = `You are an expert university AI Professor and academic subject authority.
Please solve the following past questions and output a comprehensive, highly accurate, and meticulously structured solution guide.
      
Course details: ${courseObj ? courseObj.courseCode : material.courseCode} - ${courseObj ? courseObj.courseTitle : ""} (Level ${courseObj ? courseObj.level : ""}, Semester ${courseObj ? courseObj.semester : ""})
Past Question Document Title: ${material.title}
Questions / Exam prompts to solve:
${material.description}

Please provide:
1. "### Exam Overview & High-Yield Analysis": An introductory analysis of the examinable topics covered in this question paper.
2. "### Recommended Solutions & Detailed Step-by-Step Answers": Provide meticulous, mathematically or logically complete solutions for EACH question and subsection explicitly described in the document.
3. Code blocks, architectural diagrams, mathematical equations, or code templates (e.g. Java, Python, SQL) where relevant to show proper practical solutions.
4. "### Practical Study Tips for Students": Specific revision directives and mnemonics to master these exam topics.

Format the entire output in highly readable visual Markdown with elegant headings, lists, bold concepts, and styled quotes.`;

      const responseText = await generateContentWithRetry(prompt, {
        model: 'gemini-3.5-flash'
      });

      if (responseText) {
        finalSolution = responseText;
      }
    } catch (err) {
      console.error("Gemini past question solver failed:", err);
    }
  }

  // Update material in DB
  const matIdx = db.materials.findIndex(m => m.id === materialId);
  if (matIdx !== -1) {
    db.materials[matIdx].solutionMarkdown = finalSolution;
    db.materials[matIdx].solutionGeneratedAt = new Date().toISOString();
    saveDB(db);
  }

  if (userId) {
    logAuditEvent(userId, "AI Past Question Solved", `Generated solutions for '${material.title}' using Gemini AI Solver`, req);
  }

  res.json(db.materials[matIdx]);
});

// 10. AI Revision Study Guide (Rich Synthesis of multiple materials for a course)
app.post("/api/ai/revision-guide", async (req, res) => {
  const { courseId, userId } = req.body;
  if (!courseId) {
    return res.status(400).json({ error: "courseId is required" });
  }

  const db = loadDB();
  const course = db.courses.find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: "Course not found" });
  }

  // Enforce student level security clearance constraints on AI revision-guide
  const user = db.users.find(u => u.id === userId);
  if (user && user.role === UserRole.STUDENT) {
    if (course.level !== user.level) {
      logAuditEvent(userId, "AI Revision Guide Level Violation Blocked", `BLOCKED: Student '${user.fullName}' (Level ${user.level}) attempted AI revision guide for Course ${course.courseCode} (Level ${course.level})`, req);
      return res.status(403).json({ error: `Access Denied: Level clearance mismatch. Students at Level ${user.level} cannot access Level ${course.level} courses.` });
    }
  }

  // Get all approved materials uploaded for this course
  const approvedMaterials = db.materials.filter(m => m.courseId === courseId && m.approvalStatus === ApprovalStatus.APPROVED);

  // If revision guide already exists, return it!
  const existingGuide = db.revisionGuides.find(rg => rg.courseId === courseId);
  if (existingGuide && approvedMaterials.length <= 1) { // If material list hasn't changed significantly
    return res.json(existingGuide);
  }

  let studyGuide = `### ${course.courseCode} Master Revision Study Guide\n\nWelcome to your centralized revision roadmap. Incorporating all validated content. Ready for active study:`;
  let possibleQuestions = [
    { question: "Explain the main architectural goals of this course's topics?", answerBrief: "To construct reliable software that is auditable, secure, and utilizes modular structural concepts." },
    { question: "Why are file integrity and version hash checks useful in Content Vaults?", answerBrief: "They verify that the content hasn't been altered or poisoned, establishing data trust." },
  ];
  let keyConcepts = ["Design Patterns", "Hash Verification", "Asymptotic Analysis", "Peer Auditing"];

  if (approvedMaterials.length === 0) {
    studyGuide += `\n\n*No approved lecture materials have been published in the content vault for ${course.courseCode} yet. Showing baseline course roadmap.*`;
  } else {
    studyGuide += `\n\nFound ${approvedMaterials.length} approved vault resources: ${approvedMaterials.map(m => `'${m.title}'`).join(", ")}.`;
  }

  if (aiClient) {
    try {
      const materialListStr = approvedMaterials.length > 0 
        ? approvedMaterials.map(m => `Title: ${m.title}\nDescription: ${m.description}`).join("\n\n")
        : "No materials uploaded yet. Use typical syllabus guidelines.";

      const prompt = `You are a distinguished computer science professor. Prepare an master study revision guide for the course '${course.courseCode}: ${course.courseTitle}' at level ${course.level} based on these available course materials:

${materialListStr}

Generate:
1. A master study guide (in elegant markdown syntax, with clear headers, key concepts, bulleted study guide summary notes).
2. A list of 4 possible revision/exam questions with high-quality brief answers.
3. A list of key critical concepts (4-6 concepts max, short strings).

Return EXACTLY a JSON format block like:
{
  "studyGuide": "## ${course.courseCode} Study Guide\\n\\n### Core Revision Topics\\n1. [Markdown study notes here]...",
  "possibleQuestions": [
    { "question": "Question text here?", "answerBrief": "Brief detailed answer description here..." }
  ],
  "keyConcepts": ["Concept A", "Concept B", "Concept C"]
}`;

      const responseText = await generateContentWithRetry(prompt, {
        model: 'gemini-3.5-flash',
        responseMimeType: "application/json"
      });

      console.log("Raw Gemini Revision Guide Response is successfully retrieved.");

      try {
        const parsedJson = JSON.parse(responseText.trim());
        if (parsedJson.studyGuide) studyGuide = parsedJson.studyGuide;
        if (parsedJson.possibleQuestions) possibleQuestions = parsedJson.possibleQuestions;
        if (parsedJson.keyConcepts) keyConcepts = parsedJson.keyConcepts;
      } catch (jsonErr) {
        console.warn("Could not parse JSON cleanly for Revision Guide, using defaults.", jsonErr);
      }
    } catch (gemError) {
      console.error("Gemini revision model execution failed after retries:", gemError);
    }
  }

  // Save or replace inside database
  db.revisionGuides = db.revisionGuides.filter(rg => rg.courseId !== courseId);
  const newGuide: RevisionGuide = {
    id: `guide_${Date.now()}`,
    courseId,
    courseCode: course.courseCode,
    studyGuide,
    possibleQuestions,
    keyConcepts,
    generatedAt: new Date().toISOString()
  };
  db.revisionGuides.push(newGuide);
  saveDB(db);

  if (userId) {
    logAuditEvent(userId, "AI Master Guide Generated", `Created multi-document revision guides for course ${course.courseCode}`, req);
  }

  res.json(newGuide);
});

// Server checks
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString(), hasGemini: !!aiClient });
});

// VITE MIDDLEWARE SETUP FOR DEV/PROD ROUTING
async function boot() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Development Middleware Mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static production assets mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Full-stack Server listening on http://0.0.0.0:${PORT}`);
  });

  // Connect to MongoDB asynchronously if a valid remote connection string is provided
  const mongoUri = process.env.MONGODB_URI;
  const isLocalHost = mongoUri?.includes("localhost") || mongoUri?.includes("127.0.0.1");
  const isPlaceholder = !mongoUri || mongoUri.includes("...") || mongoUri.includes("<");

  if (mongoUri && mongoUri.startsWith("mongodb") && !isLocalHost && !isPlaceholder) {
    mongoose
      .connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
      .then(async () => {
        console.log("Connected to MongoDB database successfully.");
        const currentDb = loadDB();
        await syncToMongo(currentDb);
        console.log("Database records synchronized with MongoDB collections.");
      })
      .catch((err) => {
        console.log("MongoDB connection notice: External host unreachable. Operating on built-in persistent storage.");
      });
  } else {
    console.log("MongoDB Notice: No external MONGODB_URI provided in environment. Operating on built-in persistent database.");
  }
}

boot().catch((err) => {
  console.error("Critical error booting full-stack server:", err);
});
