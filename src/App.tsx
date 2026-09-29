import React, { useState, useEffect } from "react";
import { 
  User, Course, Material, CalendarEvent, AppNotification, AuditLog, DownloadLog, MaterialSummary, RevisionGuide, UserRole, EventType, ApprovalStatus 
} from "./types";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import MaterialVault from "./components/MaterialVault";
import CalendarModule from "./components/CalendarModule";
import AuditTrails from "./components/AuditTrails";
import UserCourseManager from "./components/UserCourseManager";
import RevisionCenter from "./components/RevisionCenter";
import Landing from "./components/Landing";
import { 
  Layers, LogIn, ChevronRight, GraduationCap, ShieldCheck, 
  Sparkles, CheckCircle2, AlertCircle, Info, Sun, Moon,
  ArrowUpRight, Globe, Shield, Eye, HelpCircle, Check,
  BookOpen, Calendar, Users, ArrowRight, Lock, Activity,
  Bell, LogOut, Menu, X, Search
} from "lucide-react";

export default function App() {
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [authEmail, setAuthEmail] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(() => localStorage.getItem("showRegisterForm") === "true");

  // Persist showRegisterForm
  useEffect(() => {
    localStorage.setItem("showRegisterForm", showRegisterForm.toString());
  }, [showRegisterForm]);
  const [viewingLanding, setViewingLanding] = useState(() => localStorage.getItem("viewingLanding") !== "false");

  // Persist currentUser
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  // Theme state - forced light mode
  const [darkMode] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  // New account state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<UserRole>(UserRole.STUDENT);
  const [regLevel, setRegLevel] = useState("300");
  const [regDept, setRegDept] = useState("Computer Science");
  const [regCode, setRegCode] = useState("");

  // System states
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // AI related states
  const [summaries, setSummaries] = useState<Record<string, MaterialSummary>>({});
  const [revisionGuides, setRevisionGuides] = useState<Record<string, RevisionGuide>>({});

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem("activeTab") || "dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 1024 : false;
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Persist state
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("viewingLanding", viewingLanding.toString());
  }, [viewingLanding]);

  // Initial Sync from server
  const syncServerData = async () => {
    try {
      const [
        usersRes, coursesRes, materialsRes, eventsRes, notificationsRes, dlRes, auditRes
      ] = await Promise.all([
        fetch("/api/users").then(r => r.json()),
        fetch("/api/courses").then(r => r.json()),
        fetch("/api/materials").then(r => r.json()),
        fetch("/api/calendar").then(r => r.json()),
        fetch("/api/notifications").then(r => r.json()),
        fetch("/api/downloads/report").then(r => r.json()),
        fetch("/api/logs").then(r => r.json())
      ]);

      setUsers(usersRes);
      setCourses(coursesRes);
      setMaterials(materialsRes);
      setCalendarEvents(eventsRes);
      setNotifications(notificationsRes);
      setDownloadLogs(dlRes);
      setAuditLogs(auditRes);
    } catch (error) {
      console.error("Failed to synchronizing data repositories:", error);
    }
  };

  // Run data sync on mount and when currentUser session establishes
  useEffect(() => {
    syncServerData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      syncServerData();
      // Set level context filter dynamically for standard Student role
      if (currentUser.role === UserRole.STUDENT) {
        setActiveTab("dashboard");
      }
    }
  }, [currentUser]);

  // LOGIN OPERATION
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;

    try {
      setIsAuthLoading(true);
      setAuthError("");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login rejected.");
      }

      setCurrentUser(data.user);
      setIsAuthLoading(false);
    } catch (err: any) {
      setAuthError(err.message || "Email query matched no records. Please register!");
      setIsAuthLoading(false);
    }
  };

  // QUICK DEMO ACCESS SELECTORS
  const handleQuickDemoAccess = async (targetEmail: string) => {
    try {
      setIsAuthLoading(true);
      setAuthError("");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCurrentUser(data.user);
    } catch (err: any) {
      setAuthError(err.message || "Failed initializing role.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // REGISTER OPERATION
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regCode) {
      setAuthError("All fields are required to establish access.");
      return;
    }

    try {
      setIsAuthLoading(true);
      setAuthError("");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regFullName,
          email: regEmail,
          role: regRole,
          level: regRole === UserRole.STUDENT ? regLevel : undefined,
          department: regDept,
          matricOrStaffNumber: regCode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCurrentUser(data.user);
      setRegFullName("");
      setRegEmail("");
      setRegCode("");
      setShowRegisterForm(false);
    } catch (err: any) {
      setAuthError(err.message || "Account compilation failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // LOGOUT OPERATION
  const handleLogout = async () => {
    if (!currentUser) return;
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(null);
    setAuthEmail("");
    setActiveTab("dashboard");
  };

  // 1. ADD USER 
  const handleAdminCreateUser = async (payload: any) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, creatorId: currentUser?.id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Account creation failed");
    await syncServerData();
  };

  // 2. DELETE USER
  const handleAdminDeleteUser = async (id: string) => {
    const res = await fetch(`/api/users/${id}?adminId=${currentUser?.id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Could not delete entity.");
    }
    await syncServerData();
  };

  // 3. CREATE COURSE
  const handleAdminCreateCourse = async (payload: any) => {
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, adminId: currentUser?.id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed building course outline");
    await syncServerData();
  };

  // 4. UPDATE COURSE
  const handleAdminUpdateCourse = async (id: string, payload: any) => {
    const res = await fetch(`/api/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, adminId: currentUser?.id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed updating course");
    await syncServerData();
  };

  // 4b. REGISTER STUDENT COURSES (Self or Admin Assignment)
  const handleUpdateRegisteredCourses = async (studentId: string, courseIds: string[], adminId?: string) => {
    const res = await fetch(`/api/users/${studentId}/register-courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseIds, adminId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed committing course registrations");

    // Dynamic session mirroring: immediately update the student user's live profile
    if (currentUser && currentUser.id === studentId) {
      setCurrentUser(prev => prev ? { ...prev, registeredCourseIds: courseIds } : null);
    }
    await syncServerData();
  };

  // 5. UPLOAD MATERIAL (PDF / Slide)
  const handleUploadMaterial = async (
    title: string, 
    description: string, 
    courseId: string, 
    documentType?: string,
    semester?: string,
    customFileName?: string
  ) => {
    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        courseId,
        uploadedBy: currentUser?.id,
        documentType,
        semester,
        customFileName,
        fileSizeStr: customFileName ? "2.4 MB" : "1.2 MB",
        // Pass baseline text simulating files base64
        fileContentBase64: window.btoa(unescape(encodeURIComponent(title + description + Date.now().toString())))
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Document upload rejected.");
    await syncServerData();
  };

  // 6. APPROVE LECTURE CONTENT
  const handleApproveMaterial = async (id: string) => {
    const res = await fetch(`/api/materials/approve/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: currentUser?.id })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Peer audit approval failed.");
    }
    await syncServerData();
  };

  // 7. REJECT LECTURE CONTENT
  const handleRejectMaterial = async (id: string, reason: string) => {
    const res = await fetch(`/api/materials/reject/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: currentUser?.id, reason })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed rejecting compliance node.");
    }
    await syncServerData();
  };

  // 8. FILE DOWNLOAD COMPILATION LOGS
  const handleDownloadMaterial = async (id: string) => {
    const targetMat = materials.find((m) => m.id === id);
    if (!targetMat) return;

    try {
      const res = await fetch(`/api/materials/download/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentUser?.id })
      });
      if (res.ok) {
        // Triggering standard physical viewport opening browser node
        const blob = new Blob([`Security-Audited Content Vault Node\nCourse Code: ${targetMat.courseCode}\nFile Title: ${targetMat.title}\nSHA-256 Hash: ${targetMat.fileHash}\nAccess Matric Key: ${currentUser?.matricOrStaffNumber || "Guest"}\n\n[Official Educational Syllabus Document content encrypted on primary servers]`], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${targetMat.title.toLowerCase().replace(/\s+/g, "_")}_audited.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        await syncServerData();
      } else {
        const data = await res.json();
        alert(data.error || "Security clearance error downloading this node.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 9. SCHEDULE EVENT IN AGENDA
  const handleCreateEvent = async (title: string, description: string, date: string, type: EventType) => {
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        eventDate: date,
        eventType: type,
        createdBy: currentUser?.id
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Event scheduler failed.");
    await syncServerData();
  };

  // 10. REMOVE AGENDA EVENT
  const handleDeleteEvent = async (id: string) => {
    const res = await fetch(`/api/calendar/${id}?adminId=${currentUser?.id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Removal of agenda item failed.");
    }
    await syncServerData();
  };

  // 11. MARK ALL NOTIFICATIONS AS READ
  const handleMarkNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/notifications/read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        await syncServerData();
      }
    } catch (e) {
      console.warn("Failed signaling read status:", e);
    }
  };

  // 12. RUN AI SUMMARIZE SYNTHESIS via Gemini
  const handleGenerateSummary = async (materialId: string) => {
    const res = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId, userId: currentUser?.id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gemini synthesis failed.");
    
    setSummaries(prev => ({
      ...prev,
      [materialId]: data
    }));
    return data as MaterialSummary;
  };

  // 13. RUN AI REVISION COMPILER via Gemini
  const handleGenerateRevisionGuide = async (courseId: string) => {
    const res = await fetch("/api/ai/revision-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, userId: currentUser?.id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gemini study guide compiler failed.");

    setRevisionGuides(prev => ({
      ...prev,
      [courseId]: data
    }));
    return data as RevisionGuide;
  };

  // 12.5 RUN AI PAST QUESTION SOLVER via Gemini
  const handleSolvePastQuestion = async (materialId: string) => {
    const res = await fetch("/api/ai/solve-past-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId, userId: currentUser?.id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gemini past question solver failed.");
    await syncServerData();
    return data;
  };

  // Filter courses and materials based on global search in the top utility header
  const getFilteredCourses = () => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase();
    return courses.filter(course => 
      course.courseTitle.toLowerCase().includes(query) ||
      course.courseCode.toLowerCase().includes(query) ||
      course.lecturerName.toLowerCase().includes(query)
    );
  };

  const getFilteredMaterials = () => {
    if (!searchQuery.trim()) return materials;
    const query = searchQuery.toLowerCase();
    return materials.filter(material => {
      const course = courses.find(c => c.id === material.courseId);
      const courseMatch = course ? (
        course.courseTitle.toLowerCase().includes(query) ||
        course.courseCode.toLowerCase().includes(query)
      ) : false;
      return (
        material.title.toLowerCase().includes(query) ||
        material.description.toLowerCase().includes(query) ||
        (material.documentType && material.documentType.toLowerCase().includes(query)) ||
        (material.uploaderName && material.uploaderName.toLowerCase().includes(query)) ||
        courseMatch
      );
    });
  };

  // Render correct Active subview content
  const renderTabContent = () => {
    if (!currentUser) return null;

    const filteredCourses = getFilteredCourses();
    const filteredMaterials = getFilteredMaterials();

    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            currentUser={currentUser}
            users={users}
            courses={filteredCourses}
            materials={filteredMaterials}
            events={calendarEvents}
            notifications={notifications}
            downloadLogs={downloadLogs}
            auditLogs={auditLogs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onApprove={handleApproveMaterial}
            onReject={handleRejectMaterial}
            onMarkNotificationsRead={handleMarkNotificationsRead}
            onUpdateRegisteredCourses={handleUpdateRegisteredCourses}
          />
        );
      case "vault":
        return (
          <MaterialVault
            currentUser={currentUser}
            courses={filteredCourses}
            materials={filteredMaterials}
            summaries={summaries}
            onUpload={handleUploadMaterial}
            onApprove={handleApproveMaterial}
            onReject={handleRejectMaterial}
            onDownload={handleDownloadMaterial}
            onGenerateSummary={handleGenerateSummary}
            onSolvePastQuestion={handleSolvePastQuestion}
          />
        );
      case "calendar":
        return (
          <CalendarModule
            currentUser={currentUser}
            events={calendarEvents}
            onCreateEvent={handleCreateEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        );
      case "revision":
        return (
          <RevisionCenter
            currentUser={currentUser}
            courses={filteredCourses}
            materials={filteredMaterials}
            revisionGuides={revisionGuides}
            onGenerateGuide={handleGenerateRevisionGuide}
          />
        );
      case "users":
      case "courses":
        return (
          <UserCourseManager
            currentUser={currentUser}
            users={users}
            courses={filteredCourses}
            onCreateUser={handleAdminCreateUser}
            onDeleteUser={handleAdminDeleteUser}
            onCreateCourse={handleAdminCreateCourse}
            onUpdateCourse={handleAdminUpdateCourse}
            onUpdateRegisteredCourses={handleUpdateRegisteredCourses}
          />
        );
      case "audit":
        return (
          <AuditTrails
            currentUser={currentUser}
            auditLogs={auditLogs}
            downloadLogs={downloadLogs}
            onRefresh={syncServerData}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-sm font-semibold">Unknown page state</h3>
          </div>
        );
    }
  };

  // Render unread notifications alert sum
  const getUnreadNotifCount = () => {
    if (!currentUser) return 0;
    return notifications.filter((n) => {
      const isTarget = 
        n.recipientRole === "All" || 
        n.recipientRole === currentUser.role ||
        n.recipientId === currentUser.id;
      return isTarget && !n.readBy.includes(currentUser.id);
    }).length;
  };

  const unreadCount = getUnreadNotifCount();

  // RENDER APP ENTRY SCREEN (Either Authenticating gate or main workspace)
  if (!currentUser) {
    if (viewingLanding) {
      return (
        <Landing
          onLogin={() => { setViewingLanding(false); setShowRegisterForm(false); }}
          onRegister={() => { setViewingLanding(false); setShowRegisterForm(true); }}
          onQuickAccess={handleQuickDemoAccess}
          coursesCount={courses.length}
          materialsCount={materials.length}
          calendarEventsCount={calendarEvents.length}
          auditLogsCount={auditLogs.length}
        />
      );
    }

    return (
      <div className="min-h-screen bg-gray-50/55 dark:bg-zinc-950 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-150 text-gray-900 dark:text-zinc-100 font-sans">
        
        {/* Top bar with Status Indicator */}
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewingLanding(true)}
              className="text-xs font-bold text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white flex items-center space-x-1.5 transition-all p-1 px-2.5 rounded-lg border border-gray-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              <span>Landing Page</span>
            </button>
            <div className="h-4 w-[1px] bg-gray-200 dark:bg-zinc-800 hidden sm:block"></div>
          </div>
        </div>

        {/* Master Double-Column Card visual grid */}
        <div id="auth_block" className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[32px] p-6 sm:p-8 lg:p-10 shadow-xs transition-colors duration-150 my-auto">
          
          {/* COLUMN 1: LOGIN & REGISTRATION WORKSPACE (5 cols span) */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-center space-y-6 sm:space-y-8 py-2">
            
            {/* Headline and text write-up (Maintained exactly from original code) */}
            <div className="space-y-2.5">

            </div>


            {/* FORM CONTAINER */}
            <div className="space-y-4">
              {showRegisterForm ? (
                /* REGISTRATION FORM */
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-gray-950 text-center">Sign up</h2>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">E-mail</label>
                      <input
                        type="email"
                        required
                        placeholder="example@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-brand-primary text-white p-3 rounded-lg font-semibold hover:bg-brand-secondary transition"
                    >
                      Sign up
                    </button>
                  </form>
                  
                  <div className="text-xs text-center">

                    Have an account? <span className="text-brand-primary cursor-pointer" onClick={() => setShowRegisterForm(false)}>Sign in</span>
                  </div>
                </div>
              ) : (
                /* LOGIN FORM */
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-gray-950 text-center">Sign in</h2>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">E-mail</label>
                      <input
                        id="auth_email_input"
                        type="email"
                        required
                        placeholder="example@email.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-brand-primary text-white p-3 rounded-lg font-semibold hover:bg-brand-secondary transition"
                    >
                      Sign In
                    </button>
                  </form>
                  
                  <div className="text-xs text-center">

                    Don't have an account? <span className="text-brand-primary cursor-pointer" onClick={() => setShowRegisterForm(true)}>Sign up</span>
                  </div>
                </div>
              )}
            </div>
          </div>
            {/* COLUMN 2: HIGH-FIDELITY SPLIT HERO GRAPHIC ENCOMPASSING DEMO ROLE SELECTION (7 cols span) */}
            <div className="lg:col-span-7 w-full h-full min-h-[580px] lg:min-h-[640px] flex items-stretch">
            
            <div className="relative w-full rounded-[32px] bg-gradient-to-tr from-brand-primary via-brand-secondary to-blue-900 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 p-6 sm:p-10 overflow-hidden shadow-xl flex flex-col justify-between transition-all border border-blue-400/20 dark:border-zinc-800/80">
              
              {/* Stacked sheets visual backdrop looking exactly like the lined pages stack in the reference image */}
              <div className="absolute top-[22%] right-[-10%] w-[85%] h-[60%] rounded-2xl bg-sky-200/25 dark:bg-zinc-950/40 border border-sky-305/35 dark:border-zinc-800 shadow-2xl rotate-[-12deg] pointer-events-none overflow-hidden flex flex-col p-6 space-y-3">
                <div className="h-6 w-1/3 bg-white/20 dark:bg-zinc-800/40 rounded"></div>
                <div className="space-y-2">
                  <div className="h-[2px] bg-white/15 dark:bg-zinc-800/20 w-full"></div>
                  <div className="h-[2px] bg-white/15 dark:bg-zinc-800/20 w-full"></div>
                  <div className="h-[2px] bg-white/15 dark:bg-zinc-800/20 w-full"></div>
                  <div className="h-[2px] bg-white/15 dark:bg-zinc-800/20 w-full"></div>
                  <div className="h-[2px] bg-white/15 dark:bg-zinc-800/20 w-full"></div>
                  <div className="h-[2px] bg-white/15 dark:bg-zinc-800/20 w-3/4"></div>
                </div>
              </div>
              
              <div className="absolute top-[28%] right-[-5%] w-[85%] h-[55%] rounded-2xl bg-sky-50/30 dark:bg-zinc-950/60 border border-sky-300/40 dark:border-zinc-850 shadow-2xl rotate-[-6deg] pointer-events-none overflow-hidden flex flex-col p-6 space-y-3">
                <div className="h-6 w-1/2 bg-white/30 dark:bg-zinc-805/40 rounded"></div>
                <div className="space-y-2">
                  <div className="h-[2px] bg-white/20 dark:bg-zinc-800/30 w-full"></div>
                  <div className="h-[2px] bg-white/20 dark:bg-zinc-800/30 w-full"></div>
                  <div className="h-[2px] bg-white/20 dark:bg-zinc-800/30 w-full"></div>
                  <div className="h-[2px] bg-white/20 dark:bg-zinc-800/30 w-full"></div>
                  <div className="h-[2px] bg-white/20 dark:bg-zinc-800/30 w-full"></div>
                  <div className="h-[2px] bg-white/20 dark:bg-zinc-800/30 w-3/4"></div>
                </div>
              </div>

              {/* OVERLAY ELEMENTS MATCHING THE TARGET DESIGN */}
              
              {/* Top Left Badge: Clearance Help available */}
              <div className="flex items-center space-x-1.5 self-start bg-white/10 dark:bg-zinc-850/40 p-2.5 px-3.5 rounded-full border border-white/10 backdrop-blur-md text-[11px] font-sans font-bold text-white/95 relative z-10 animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-405"></span>
                </span>
                <span>Security Clearance active</span>
              </div>

              {/* Top Right Box layout: "100% Protection..." */}
              <div className="absolute top-8 right-8 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 p-4 rounded-2xl shadow-xl flex flex-col justify-between h-24 w-32 border border-gray-150/45 dark:border-zinc-800 hover:scale-105 transition-transform duration-200 ease-out relative z-10">
                <div className="flex justify-between items-start">
                  <span className="text-xl font-extrabold font-mono text-blue-600 dark:text-sky-450">100%</span>
                  <div className="h-5 w-5 rounded-full bg-blue-50 dark:bg-zinc-800 flex items-center justify-center text-blue-600 dark:text-sky-400">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="text-[9.5px] font-bold text-gray-450 dark:text-zinc-400 font-sans leading-tight">
                  Cryptographic Integrity Verified
                </p>
              </div>

              {/* Middle Left overlay badge */}
              <div className="absolute bottom-52 left-8 flex items-center space-x-2 bg-white/10 dark:bg-zinc-850/45 p-1.5 pr-4 rounded-full border border-white/10 backdrop-blur-md text-[11px] font-semibold text-white/95 shadow-md relative z-10 transition-transform hover:scale-102">
                <span className="h-5.5 w-5.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="h-3 w-3 text-white" />
                </span>
                <span className="font-sans">Role Enforcement active</span>
              </div>

              {/* BOTTOM WHITE CARD CONTAINING DEMO PERSONAS SELECTION */}
              <div className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 rounded-[24px] p-5.5 sm:p-6 shadow-2xl border border-gray-105 dark:border-zinc-800 relative z-10 w-full mt-auto space-y-4">
                <div className="flex -space-x-2 overflow-hidden pb-1 justify-center">
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px] shadow-sm">PM</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px] shadow-sm">EP</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shadow-sm font-sans">AT</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shadow-sm font-sans">ML</div>
                </div>
                
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-gray-950 dark:text-zinc-105 font-sans">
                    Quick-Access Simulation Clearance
                  </h4>
                  <p className="text-[11px] text-gray-450 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto font-sans">
                    Skip onboarding or registration entirely. Pick an academic identity segment below to instant clearance into the workspace.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Persona: Super Admin */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemoAccess("super_admin@vault.edu")}
                    className="flex flex-col text-left p-3 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-red-50/50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-900/40 rounded-xl transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-zinc-100">Prof. Marvellous</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/80 whitespace-nowrap">SUPER</span>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1 truncate font-sans">Full administrative ledger & user management</span>
                  </button>

                  {/* Persona: Department Admin */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemoAccess("dept_admin@vault.edu")}
                    className="flex flex-col text-left p-3 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-900/40 rounded-xl transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-zinc-100">Dr. Evelyn Peterson</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 whitespace-nowrap">DEPT</span>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1 truncate font-sans">Approve uploads & course syllabus manager</span>
                  </button>

                  {/* Persona: Lecturer */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemoAccess("lecturer_taylor@vault.edu")}
                    className="flex flex-col text-left p-3 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-900/40 rounded-xl transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-zinc-100">Dr. Alan Turing</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 whitespace-nowrap">LECTURER</span>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1 truncate font-sans">Upload notes & view SHA verification</span>
                  </button>

                  {/* Persona: Student */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemoAccess("student_mary@vault.edu")}
                    className="flex flex-col text-left p-3 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-900/40 rounded-xl transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-zinc-100">Mary Lovelace</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 whitespace-nowrap">STUDENT</span>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1 truncate font-sans">Access course vault & AI synthesis</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Humble system footer */}
        <div className="text-center text-[11px] text-gray-400 dark:text-zinc-600 font-mono mt-6">
          Secured University Content Vault System • Audit Logging SHA-256 Enabled
        </div>
      </div>
    );
  }

  // RENDER MAIN APPLICATION INTERFACE
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150">
      
      {/* 1. Unified persistent Top Header Section across the entire top width */}
      <header id="top_utility_header" className="bg-white dark:bg-zinc-900 border-b border-gray-150 dark:border-zinc-800/80 h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-150 shadow-xs select-none">
        <div className="flex items-center space-x-3.5">
          {/* Toggle Menu Button */}
          <button
            id="top_sidebar_toggle_btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 text-gray-500 dark:text-zinc-450 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
            title={isSidebarCollapsed ? "Expand Sidebar Menu" : "Collapse Sidebar Menu"}
          >
            {isSidebarCollapsed ? (
              <Menu className="h-4.5 w-4.5" />
            ) : (
              <X className="h-4.5 w-4.5" />
            )}
          </button>

          {/* Consistent Premium First Logo with Blue Centering Dot */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer" 
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="h-[28px] w-[28px] rounded-full border-[3px] border-sky-450 dark:border-sky-550 flex items-center justify-center bg-sky-50 dark:bg-sky-950/20 shadow-xs ring-1 ring-sky-200/20 shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"></div>
            </div>
            <span className="font-sans font-black text-gray-900 dark:text-white text-base sm:text-lg tracking-tight leading-none">
              SecureVault
            </span>
          </div>

          {/* Page Dashboard Control Panel Title */}
          <div className="hidden md:flex items-center pl-3 border-l border-gray-200 dark:border-zinc-800/80 space-x-2">
            <span className="text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 uppercase tracking-widest">
              {activeTab === "vault" ? "🎓 Academic Content Vault" : activeTab === "revision" ? "⚡ AI Revision Center" : activeTab === "calendar" ? "📅 Department Agenda" : activeTab === "users" ? "👥 Program Manager" : activeTab === "audit" ? "🛡️ Audit Trails" : "📊 Dashboard Control Page"}
            </span>
          </div>
        </div>

        {/* Global Search Input Field located between title and controls */}
        <div className="flex-1 max-w-[200px] sm:max-w-xs md:max-w-md mx-3 sm:mx-6 md:mx-10 select-none">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-400 dark:text-zinc-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search courses or materials by title/code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-150 dark:border-zinc-800/80 hover:border-gray-200 focus:border-brand-primary dark:hover:border-zinc-700/80 focus:dark:border-brand-primary transition-all rounded-xl pl-9 pr-8 py-1.5 sm:py-2 text-[11px] sm:text-xs text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-650 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-100 p-0.5 rounded-md cursor-pointer transition-colors"
                title="Clear Search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right spacing end: notification bell and student profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Notification Center Bell */}
          <button 
            id="notif_bell_btn"
            onClick={() => setActiveTab("dashboard")} 
            className="relative p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
            title="View Alerts"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Student/Lecturer Profile Block */}
          <div className="flex items-center pl-1 sm:pl-2.5 space-x-2.5 border-l border-gray-150 dark:border-zinc-805">
            <div className="flex flex-col items-end text-right hidden lg:flex select-none">
              <span className="text-[11px] font-sans font-bold text-gray-800 dark:text-zinc-100 leading-tight">
                {currentUser.fullName}
              </span>
              <span className="text-[9px] font-mono text-gray-400 dark:text-zinc-550 leading-none mt-0.5">
                {currentUser.matricOrStaffNumber}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="bg-indigo-50 dark:bg-zinc-850 text-indigo-700 dark:text-indigo-400 border border-indigo-150 dark:border-zinc-700/80 px-2 py-1 rounded text-[9px] font-mono leading-none tracking-wide font-bold uppercase select-none shadow-2xs">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout with Static Desktop Sidebar & Mobile Drawer */}
      <div className="flex-1 flex w-full relative min-w-0">
        <Navigation
          currentUser={currentUser}
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadCount={unreadCount}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Primary Content Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 min-w-0">
            {renderTabContent()}
          </main>

          {/* Footer */}
          <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-zinc-800 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 dark:text-zinc-400 font-mono gap-4 pb-10">
            <div>
              Academic Course Content Vault Module • State Audited
            </div>
            <div>
              Role logged: {currentUser.role} ({currentUser.fullName})
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
