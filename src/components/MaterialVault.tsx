import React, { useState } from "react";
import { Material, Course, ApprovalStatus, User, UserRole, MaterialSummary } from "../types";
import { 
  Plus, Search, FileText, ArrowDownToLine, Check, X, Sparkles, 
  ChevronRight, BookOpen, AlertCircle, FileUp, Hash, Layers,
  Lock, ShieldCheck, Globe, Key
} from "lucide-react";

interface MaterialVaultProps {
  currentUser: User;
  courses: Course[];
  materials: Material[];
  summaries: Record<string, MaterialSummary>;
  onUpload: (title: string, description: string, courseId: string, documentType?: string, semester?: string, customFileName?: string) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onDownload: (id: string) => Promise<void>;
  onGenerateSummary: (id: string) => Promise<MaterialSummary>;
  onSolvePastQuestion?: (id: string) => Promise<Material>;
}

export default function MaterialVault({
  currentUser,
  courses,
  materials,
  summaries,
  onUpload,
  onApprove,
  onReject,
  onDownload,
  onGenerateSummary,
  onSolvePastQuestion
}: MaterialVaultProps) {
  
  // Search state
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [customFileName, setCustomFileName] = useState("");
  const [uploaderMsg, setUploaderMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState<"Lecture Note" | "Past Question" | "Syllabus">("Lecture Note");
  const [semester, setSemester] = useState<"1st" | "2nd">("1st");

  // Rejection reason overlay state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // AI Summary drawer state
  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // AI Solution drawer state
  const [activeSolutionId, setActiveSolutionId] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [solveError, setSolveError] = useState("");

  // Drag and drop simulator state
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedFile, setDraggedFile] = useState<{ name: string; size: string } | null>(null);

  const canUpload = currentUser.role === UserRole.LECTURER || currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.DEPARTMENT_ADMIN;
  const canApprove = currentUser.role === UserRole.DEPARTMENT_ADMIN || currentUser.role === UserRole.SUPER_ADMIN;

  // Filter Logic
  const filteredMaterials = materials.filter(m => {
    const matchedSearch = 
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.courseCode.toLowerCase().includes(search.toLowerCase());

    const courseObj = courses.find(c => c.id === m.courseId);
    
    // Strict level and registered course security clearance checks for Student roles
    const matchesLevel = currentUser.role === UserRole.STUDENT
      ? (courseObj && courseObj.level === currentUser.level && (currentUser.registeredCourseIds || []).includes(courseObj.id))
      : (levelFilter === "All" || (courseObj && courseObj.level === levelFilter));

    const matchesStatus = statusFilter === "All" || m.approvalStatus === statusFilter;
    const matchesCourse = courseFilter === "All" || m.courseId === courseFilter;

    // Student can ONLY see APPROVED materials of their specific level criteria
    if (currentUser.role === UserRole.STUDENT) {
      return matchedSearch && matchesLevel && matchesCourse && m.approvalStatus === ApprovalStatus.APPROVED;
    }

    return matchedSearch && matchesLevel && matchesStatus && matchesCourse;
  });

  const triggerAISolvePastQuestion = async (materialId: string) => {
    if (!onSolvePastQuestion) return;
    try {
      setActiveSolutionId(materialId);
      setIsSolving(true);
      setSolveError("");
      await onSolvePastQuestion(materialId);
    } catch (err: any) {
      setSolveError(err.message || "Failed to solve past questions with Gemini.");
    } finally {
      setIsSolving(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !courseId) {
      setUploaderMsg("Please satisfy all material upload criteria.");
      return;
    }

    try {
      setIsUploading(true);
      setUploaderMsg("");
      await onUpload(title, description, courseId, documentType, semester, draggedFile?.name || customFileName || undefined);
      setTitle("");
      setDescription("");
      setCourseId("");
      setCustomFileName("");
      setDraggedFile(null);
      setUploaderMsg("Material uploaded successfully and queued for peer audit!");
      setTimeout(() => {
        setShowUpload(false);
        setUploaderMsg("");
      }, 1500);
    } catch (err: any) {
      setUploaderMsg(err.message || "Failure uploading vault node.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingId) return;
    if (!rejectReason) {
      alert("Provide a compliance rejection reason.");
      return;
    }
    await onReject(rejectingId, rejectReason);
    setRejectingId(null);
    setRejectReason("");
  };

  const triggerAISummary = async (id: string) => {
    setActiveSummaryId(id);
    setSummaryError("");
    if (summaries[id]) return; // already loaded

    try {
      setIsSynthesizing(true);
      await onGenerateSummary(id);
    } catch (err: any) {
      setSummaryError(err.message || "Failed to make Gemini summarization. Call your administrator.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Simulating drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setDraggedFile({
        name: file.name,
        size: `${sizeMb} MB`
      });
      setCustomFileName(file.name);
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case ApprovalStatus.PENDING:
        return "bg-amber-50 text-amber-700 border-amber-100";
      case ApprovalStatus.REJECTED:
        return "bg-red-50 text-red-700 border-red-100";
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      
      {/* FILTER PANEL / SIDEBAR (Left on Wide layouts) */}
      <div className="xl:col-span-1 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs space-y-5 transition-colors">
          <div className="border-b border-gray-50 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-sans font-semibold text-gray-900 dark:text-zinc-100">Vault Filters</h3>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-sans mt-0.5">Refine files by parameter matching</p>
          </div>

          {/* Search bar inside Sidebar */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-medium text-gray-500 dark:text-zinc-400 mb-1.5">
              General Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                id="vault_sidebar_search"
                type="text"
                placeholder="Search Title, course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:border-indigo-500 dark:focus:border-indigo-400 font-sans bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Course filter list */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-medium text-gray-500 dark:text-zinc-400 mb-1.5">
              Syllabus Course
            </label>
            <select
              id="vault_filter_course"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 focus:outline-hidden focus:border-indigo-500 font-sans"
            >
              <option value="All" className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100">All Courses</option>
              <optgroup label="First Semester" className="text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 font-bold">
                {courses
                  .filter(c => currentUser.role !== UserRole.STUDENT || (c.level === currentUser.level && (currentUser.registeredCourseIds || []).includes(c.id)))
                  .filter(c => c.semester === "1st")
                  .map(c => (
                    <option key={c.id} value={c.id} className="text-gray-950 dark:text-zinc-100 font-normal">
                      {c.courseCode} — {c.courseTitle}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Second Semester" className="text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 font-bold">
                {courses
                  .filter(c => currentUser.role !== UserRole.STUDENT || (c.level === currentUser.level && (currentUser.registeredCourseIds || []).includes(c.id)))
                  .filter(c => c.semester === "2nd")
                  .map(c => (
                    <option key={c.id} value={c.id} className="text-gray-950 dark:text-zinc-100 font-normal">
                      {c.courseCode} — {c.courseTitle}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Academic program levels */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-medium text-gray-500 dark:text-zinc-400 mb-1.5">
              Academic Level
            </label>
            {currentUser.role === UserRole.STUDENT ? (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-indigo-700 dark:text-indigo-400 text-xs">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span>Clearance: Level {currentUser.level}</span>
                </div>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-normal">
                  Your student identity restricts document display purely to Level {currentUser.level} course modules.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {["All", "100", "200", "300", "400", "500"].map((lvl) => (
                  <button
                    id={`btn_filter_level_${lvl}`}
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded transition-all cursor-pointer font-sans font-medium flex justify-between ${
                      levelFilter === lvl
                        ? "bg-gray-150 dark:bg-zinc-805 text-gray-950 dark:text-zinc-100 font-semibold"
                        : "text-gray-655 dark:text-zinc-400 hover:bg-gray-55 dark:hover:bg-zinc-850/60"
                    }`}
                  >
                    <span>{lvl === "All" ? "All Levels" : `${lvl} Level`}</span>
                    <ChevronRight className="h-3 w-3 mt-0.5 opacity-60" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Document compliance filters - HIDDEN FOR STUDENTS */}
          {currentUser.role !== UserRole.STUDENT && (
            <div>
              <label className="block text-[10px] uppercase font-mono font-medium text-gray-500 dark:text-zinc-400 mb-1.5">
                Audit Review Status
              </label>
              <div className="flex flex-col gap-1">
                {["All", ...Object.values(ApprovalStatus)].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded transition-all cursor-pointer font-sans font-medium flex items-center space-x-2 ${
                      statusFilter === status
                        ? "bg-gray-150 dark:bg-zinc-800 text-gray-950 dark:text-zinc-100 font-semibold"
                        : "text-gray-650 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-850/60"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      status === "All" ? "bg-gray-400" :
                      status === ApprovalStatus.APPROVED ? "bg-emerald-500" :
                      status === ApprovalStatus.PENDING ? "bg-amber-500" : "bg-red-500"
                    }`} />
                    <span>{status === "All" ? "All Audit Items" : status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Informative Security Panel */}
        <div className="bg-gray-955 dark:bg-zinc-950 text-white rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-3 translate-x-3">
            <Hash className="h-40 w-40" />
          </div>
          <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400">Security Vault Integrity</h4>
          <p className="text-xs font-sans mt-2 text-gray-300 dark:text-zinc-350 leading-relaxed font-medium">
            Every file incorporates instant SHA-256 integrity verification. Download operations track matric credentials synchronously on active system audits.
          </p>
        </div>
      </div>      {/* CENTER WORKSPACE: Materials list & actions */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* Workspace Toolbar card */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
          <div>
            <h2 className="text-lg font-sans font-semibold text-gray-950 dark:text-zinc-100 flex items-center">
              <Layers className="h-5 w-5 mr-2 text-gray-500 dark:text-zinc-400" />
              Lectures & Course Content depository
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-sans mt-0.5">
              Available validated materials for your custom departmental path ({filteredMaterials.length} materials matching query)
            </p>
          </div>

          {canUpload && (
            <button
              id="vault_btn_upload"
              onClick={() => setShowUpload(!showUpload)}
              className="bg-gray-955 dark:bg-zinc-100 hover:bg-gray-900 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 self-start cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Lecture Content</span>
            </button>
          )}
        </div>

        {/* FORM DRAWER CONTAINER */}
        {showUpload && canUpload && (
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-md border-t-4 border-t-gray-950 dark:border-t-zinc-200 duration-300 transition-all">
            <div className="flex justify-between items-center pb-4 border-b border-gray-50 dark:border-zinc-800 mb-4">
              <h3 className="text-sm font-sans font-semibold text-gray-900 dark:text-zinc-100 flex items-center">
                <FileUp className="h-4.5 w-4.5 mr-2 text-gray-600 dark:text-zinc-450" />
                Prepare New Lecture Depository Node
              </h3>
              <button 
                onClick={() => setShowUpload(false)}
                className="text-gray-400 hover:text-gray-655 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-widest font-mono mb-1">
                    Lectures Title *
                  </label>
                  <input
                    id="upload_input_title"
                    type="text"
                    required
                    placeholder="e.g. Lecture 3 - Structural Integrity Principles"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:border-[#f59e0b] dark:focus:border-[#f59e0b] text-gray-900 dark:text-zinc-100 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-widest font-mono mb-1">
                    Select Target Course *
                  </label>
                  <select
                    id="upload_input_course"
                    required
                    value={courseId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setCourseId(cid);
                      // Pre-fill semester from course
                      const selectedC = courses.find(c => c.id === cid);
                      if (selectedC) {
                        setSemester(selectedC.semester);
                      }
                    }}
                    className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#f59e0b] font-sans"
                  >
                    <option value="" className="bg-white dark:bg-zinc-900 text-gray-400">-- Choose Syllabus Match --</option>
                    <optgroup label="First Semester" className="text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 font-bold">
                      {courses.filter(c => c.semester === "1st").map(c => (
                        <option key={c.id} value={c.id} className="text-gray-900 dark:text-zinc-300 font-normal">{c.courseCode} — {c.courseTitle} (Level {c.level})</option>
                      ))}
                    </optgroup>
                    <optgroup label="Second Semester" className="text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 font-bold">
                      {courses.filter(c => c.semester === "2nd").map(c => (
                        <option key={c.id} value={c.id} className="text-gray-900 dark:text-zinc-300 font-normal">{c.courseCode} — {c.courseTitle} (Level {c.level})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Document Type and Semester Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-widest font-mono mb-1">
                    Document Category / Type *
                  </label>
                  <select
                    id="upload_input_document_type"
                    required
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#f59e0b] font-sans"
                  >
                    <option value="Lecture Note">Lecture Note</option>
                    <option value="Past Question">Past Question</option>
                    <option value="Syllabus">Syllabus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-widest font-mono mb-1">
                    Target Semester *
                  </label>
                  <select
                    id="upload_input_semester"
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#f59e0b] font-sans"
                  >
                    <option value="1st">First Semester</option>
                    <option value="2nd">Second Semester</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest font-mono mb-1">
                  {documentType === "Past Question" 
                    ? "Full Exam Paper / Questions list *" 
                    : "Topic Description & Synopsis *"}
                </label>
                <textarea
                  id="upload_input_desc"
                  required
                  rows={documentType === "Past Question" ? 5 : 2}
                  placeholder={documentType === "Past Question" 
                    ? "Type or paste the exam questions (e.g., Question 1: ... Question 2: ...) here. The Gemini AI past question solver will parse this text to produce step-by-step solutions!" 
                    : "Detail curriculum outcomes, key definitions covered, and revision guidelines..."}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:border-[#f59e0b] dark:focus:border-[#f59e0b] text-gray-900 dark:text-zinc-100 font-sans leading-relaxed"
                />
              </div>

              {documentType === "Past Question" && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-[11px] text-amber-800 dark:text-amber-400 leading-normal font-sans">
                  <strong>Guideline:</strong> You are uploading a <strong>Past Question</strong> paper. Please verify that the questions list in the text area above contains clear exam questions. Students will be able to click the <strong>Solve with Gemini</strong> tool on this resource to formulate solutions automatically.
                </div>
              )}

              {/* Secure Drag & Drop File Mock panel */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest font-mono mb-1">
                  Drag & Drop Lecture File (PDF, slides, DOCX)
                </label>
                
                <div
                  id="upload_drag_zone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file_input_hidden")?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragOver 
                      ? "border-gray-950 bg-gray-50/70 scale-98" 
                      : draggedFile 
                        ? "border-emerald-300 bg-emerald-50/25" 
                        : "border-gray-200 hover:border-gray-300 bg-gray-50/20"
                  }`}
                >
                  <FileUp className={`h-8 w-8 mx-auto mb-2 ${draggedFile ? "text-emerald-600" : "text-gray-400"}`} />
                  {draggedFile ? (
                    <div>
                      <p className="text-xs font-sans font-semibold text-gray-950">{draggedFile.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">Integrity node computed: {draggedFile.size}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-sans font-medium text-gray-650">Drag and drop course material here, or click to find file</p>
                      <p className="text-[10px] text-gray-400 font-sans mt-0.5">File size is simulated. Safe cryptographics applied on upload.</p>
                    </div>
                  )}
                  <input
                    id="file_input_hidden"
                    type="file"
                    className="hidden"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        setDraggedFile({
                          name: file.name,
                          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                        });
                        setCustomFileName(file.name);
                      }
                    }}
                  />
                </div>
              </div>

              {uploaderMsg && (
                <div id="upload_form_msg" className={`text-xs p-3 rounded-lg border flex items-start space-x-2 ${
                  uploaderMsg.includes("successfully") 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                    : "bg-red-50 text-red-800 border-red-100"
                }`}>
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{uploaderMsg}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-150 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="vault_upload_submit"
                  type="submit"
                  disabled={isUploading}
                  className="bg-gray-950 hover:bg-gray-900 text-white text-xs font-medium px-5 py-2.5 rounded-lg cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isUploading ? (
                    <span>Anchoring Vault Parameters...</span>
                  ) : (
                    <>
                      <FileUp className="h-4 w-4" />
                      <span>Anchor Content & Vault File</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MATERIALS GRID LIST */}
        {filteredMaterials.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-12 text-center shadow-xs">
            <FileText className="h-10 w-10 text-gray-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-sans font-semibold text-gray-900 dark:text-zinc-100 mt-3">Empty content vault segment</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed font-sans">
              There are no approved materials, lecture slides, or past questionnaires matches in this query segment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredMaterials.map((mat) => {
              const matchingSummary = summaries[mat.id];
              return (
                <div 
                  id={`vault_card_${mat.id}`}
                  key={mat.id} 
                  className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:shadow-xs hover:border-gray-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between p-5 sm:p-6 relative min-w-0"
                >
                  
                  {/* Card Header information */}
                  <div className="space-y-3.5 min-w-0">
                    <div className="flex justify-between items-start gap-2 min-w-0">
                      <span className="inline-flex items-center justify-center bg-gray-950 dark:bg-zinc-100 text-white dark:text-zinc-950 px-2.5 py-0.5 rounded-md text-[10px] font-mono leading-none font-bold border border-gray-800 dark:border-zinc-300 shrink-0">
                        {mat.courseCode}
                      </span>
                      
                      {currentUser.role !== UserRole.STUDENT && (
                        <span className={`px-2 py-0.5 rounded text-[10px] border font-sans font-medium uppercase shrink-0 ${getStatusBadge(mat.approvalStatus)}`}>
                          {mat.approvalStatus}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-sans font-bold text-gray-900 dark:text-zinc-100 leading-snug break-words">
                        {mat.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed font-sans line-clamp-3 break-words">
                        {mat.description}
                      </p>
                    </div>

                    {/* Metadata attributes with cryptographic security lock & SHA-256 integrity indicator */}
                    <div className="bg-gray-50/80 dark:bg-zinc-950/60 rounded-lg p-3 border border-gray-200 dark:border-zinc-800 space-y-2 text-[10px] font-mono text-gray-500 dark:text-zinc-400 min-w-0 overflow-hidden">
                      <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>Integrity: SHA-256 Verified Lock</span>
                      </div>

                      <div className="flex items-center space-x-1.5 min-w-0">
                        <Hash className="h-3 w-3 text-gray-400 dark:text-zinc-500 shrink-0" />
                        <span className="truncate text-[9.5px] font-mono break-all" title={mat.fileHash}>SHA-256: {mat.fileHash}</span>
                      </div>

                      <div className="flex items-center justify-between font-sans border-t border-dotted border-gray-200 dark:border-zinc-800 pt-1.5 text-[9.5px] mt-1 text-gray-500 dark:text-zinc-400">
                        <span className="flex items-center truncate mr-1">
                          <Globe className="h-3.5 w-3.5 mr-1 text-indigo-500 dark:text-indigo-400 shrink-0" />
                          Geofence: 192.168.4.XX
                        </span>
                        <span className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-semibold text-[8.5px] shrink-0">CAMPUS LAN</span>
                      </div>

                      <div className="flex items-center justify-between border-t border-dotted border-gray-200 dark:border-zinc-800 pt-1.5 text-gray-500 dark:text-zinc-400">
                        <span>Size: {mat.fileSize}</span>
                        <span className="truncate ml-2">By: {mat.uploaderName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational buttons */}
                  <div className="border-t border-gray-100 dark:border-zinc-800 mt-5 pt-3.5 flex flex-wrap sm:flex-nowrap gap-2 items-center justify-between min-w-0">
                    
                    {/* Peer audit approving workspace for coordinators */}
                    {canApprove && mat.approvalStatus === ApprovalStatus.PENDING ? (
                      <div className="flex space-x-1.5 w-full sm:w-auto">
                        <button
                          id={`btn_approve_mat_${mat.id}`}
                          onClick={() => onApprove(mat.id)}
                          className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          id={`btn_reject_mat_init_${mat.id}`}
                          onClick={() => setRejectingId(mat.id)}
                          className="flex-1 sm:flex-initial bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap sm:flex-nowrap gap-1.5 w-full sm:w-auto min-w-0">
                        <button
                          id={`btn_download_mat_${mat.id}`}
                          onClick={() => onDownload(mat.id)}
                          className="flex-1 sm:flex-initial bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-750 text-gray-800 dark:text-zinc-200 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 flex items-center justify-center space-x-1.5 cursor-pointer transition-colors shrink-0"
                          title="Anchor file download"
                        >
                          <ArrowDownToLine className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </button>

                        {mat.documentType === "Past Question" ? (
                          <button
                            id={`btn_solve_mat_${mat.id}`}
                            onClick={() => triggerAISolvePastQuestion(mat.id)}
                            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer transition-colors shrink-0"
                            title="Generate exam answers/solutions using Gemini AI"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                            <span>{mat.solutionMarkdown ? "View AI Solution" : "Solve with Gemini"}</span>
                          </button>
                        ) : (
                          <button
                            id={`btn_summarize_mat_${mat.id}`}
                            onClick={() => triggerAISummary(mat.id)}
                            className="flex-1 sm:flex-initial bg-gray-950 dark:bg-zinc-100 hover:bg-gray-900 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer transition-colors shrink-0"
                            title="Generate content summary"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-300 dark:text-amber-600" />
                            <span>Gemini Summary</span>
                          </button>
                        )}
                      </div>
                    )}

                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono text-center sm:text-right shrink-0">
                      {new Date(mat.uploadedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                      })}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* AI SUMMARY DRAWER PANEL */}
        {activeSummaryId && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg border-t-4 border-t-amber-400/95 duration-300 transition-all mt-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-sm font-sans font-bold text-gray-950 flex items-center">
                  <Sparkles className="h-4.5 w-4.5 mr-2 text-amber-500 animate-pulse" />
                  Gemini-Engine Content Synthesis
                </h3>
                <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                  Summarized model: gemini-3.5-flash
                </p>
              </div>
              <button 
                onClick={() => { setActiveSummaryId(null); setSummaryError(""); }}
                className="text-gray-400 hover:text-gray-650 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {isSynthesizing ? (
              <div className="py-12 text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-950 mx-auto" />
                <p className="text-xs text-gray-500 font-mono">Running university AI summarizer algorithms...</p>
              </div>
            ) : summaryError ? (
              <div id="summary_error_alert" className="p-4 bg-red-50 text-red-800 border-red-100 border rounded-lg text-xs flex space-x-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Synthesis model error</p>
                  <p className="mt-0.5">{summaryError}</p>
                </div>
              </div>
            ) : summaries[activeSummaryId] ? (
              <div id="summary_data_display" className="space-y-5 text-xs font-sans">
                
                {/* Generated abstract Summary */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-gray-900 tracking-wide font-sans flex items-center">
                    <BookOpen className="h-3.5 w-3.5 mr-1 text-gray-500" />
                    Lecture Abstract
                  </h4>
                  <p className="bg-amber-50/30 p-4 border border-amber-100/55 rounded-lg text-gray-700 leading-relaxed font-sans">
                    {summaries[activeSummaryId].generatedSummary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  
                  {/* Bullet study points */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] uppercase tracking-wider font-mono font-bold text-gray-500">
                      Key Highlights
                    </h4>
                    <ul className="space-y-1.5 text-gray-700">
                      {summaries[activeSummaryId].keyPoints.map((pt, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-amber-500 font-bold mr-2">•</span>
                          <span className="leading-relaxed">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Core Definitions */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] uppercase tracking-wider font-mono font-bold text-gray-500">
                      Critical Definitions
                    </h4>
                    {summaries[activeSummaryId].definitions.length === 0 ? (
                      <p className="text-gray-400 italic">No formal vocabulary definitions generated.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {summaries[activeSummaryId].definitions.map((def, idx) => (
                          <div key={idx} className="border-l-2 border-gray-200 pl-2.5">
                            <span className="font-bold text-gray-900">{def.term}</span>
                            <p className="text-gray-600 leading-relaxed mt-0.5">{def.definition}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Formula sheet panel */}
                {summaries[activeSummaryId].formulaSheet && (
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-150 mt-2">
                    <h5 className="text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider mb-1">
                      Equation / Concept Reference Sheet
                    </h5>
                    <p className="font-mono text-gray-700 text-[11px] break-all leading-relaxed">
                      {summaries[activeSummaryId].formulaSheet}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* AI PAST QUESTION SOLUTION DRAWER PANEL */}
        {activeSolutionId && (
          <div className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-800 rounded-xl p-6 shadow-lg border-t-4 border-t-indigo-600 duration-300 transition-all mt-6 text-gray-900 dark:text-zinc-100">
            <div className="flex justify-between items-center pb-4 border-b border-indigo-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-sans font-bold flex items-center text-gray-900 dark:text-zinc-100">
                  <Sparkles className="h-4.5 w-4.5 mr-2 text-indigo-500 animate-pulse" />
                  Gemini AI Answers & Past Question Solutions
                </h3>
                <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                  Solved model: gemini-3.5-flash — Subject Matter Verification Engine
                </p>
              </div>
              <button 
                onClick={() => { setActiveSolutionId(null); setSolveError(""); }}
                className="text-gray-400 hover:text-gray-650 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {isSolving ? (
              <div className="py-12 text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" strokeWidth={3} />
                <p className="text-xs text-indigo-500 font-mono">Formulating comprehensive Solutions & Explanations...</p>
              </div>
            ) : solveError ? (
              <div id="solution_error_alert" className="p-4 bg-red-50 text-red-800 border-red-100 border rounded-lg text-xs flex space-x-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Solving process anomaly</p>
                  <p className="mt-0.5">{solveError}</p>
                </div>
              </div>
            ) : materials.find(m => m.id === activeSolutionId)?.solutionMarkdown ? (
              <div id="solution_data_display" className="space-y-4 text-xs font-sans">
                <div className="p-4 md:p-6 bg-gray-50 dark:bg-zinc-950/80 rounded-xl border border-indigo-100 dark:border-zinc-850 shadow-inner overflow-x-auto text-[13px] leading-relaxed select-text max-h-[500px] overflow-y-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-zinc-200 space-y-3">
                    {materials.find(m => m.id === activeSolutionId)?.solutionMarkdown?.split('\n').map((line, idx) => {
                      if (line.startsWith('###')) {
                        return <h4 key={idx} className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mt-5 border-b border-indigo-100 dark:border-zinc-800 pb-1">{line.replace('###', '').trim()}</h4>;
                      } else if (line.startsWith('####')) {
                        return <h5 key={idx} className="text-xs font-semibold text-gray-950 dark:text-zinc-100 mt-4">{line.replace('####', '').trim()}</h5>;
                      } else if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                        return (
                          <li key={idx} className="ml-4 list-disc pl-1 text-gray-700 dark:text-zinc-300">
                            {line.substring(2)}
                          </li>
                        );
                      } else if (line.trim().match(/^\d+\./)) {
                        return (
                          <div key={idx} className="pl-3 border-l-2 border-indigo-400 dark:border-indigo-600 my-2 dark:text-zinc-300 font-sans text-gray-800">
                            <strong>{line.match(/^\d+\./)?.[0] || ""}</strong> {line.replace(/^\d+\./, "")}
                          </div>
                        );
                      } else {
                        return <p key={idx} className="text-gray-700 dark:text-zinc-300 my-1">{line}</p>;
                      }
                    })}
                  </div>
                </div>
                
                {materials.find(m => m.id === activeSolutionId)?.solutionGeneratedAt && (
                  <div className="text-[10px] text-gray-400 font-mono text-right">
                    Solved at: {new Date(materials.find(m => m.id === activeSolutionId)!.solutionGeneratedAt!).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-gray-400 italic">No solution available. Please generate it.</div>
            )}
          </div>
        )}

      </div>

      {/* COMPLIANCE REJECTION REASON MODAL OVERLAY */}
      {rejectingId && (
        <div id="rejection_modal_overlay" className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-gray-950 font-sans">Audit Compliance Rejection</h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">Please indicate why this lecture material does not satisfy department standards:</p>
            </div>

            <textarea
              id="rejection_reason_textarea"
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Broken links, outdated syllabus reference numbers, or formatting issues..."
              className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-hidden focus:border-red-500 font-sans"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => { setRejectingId(null); setRejectReason(""); }}
                className="px-3.5 py-1.5 text-xs text-gray-650 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="rejection_confirm_submit"
                onClick={handleRejectSubmit}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Confirm Reject Node
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
