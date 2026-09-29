import React, { useState } from "react";
import { User, Course, UserRole } from "../types";
import { Plus, Trash2, Edit, Users, FolderOpen, AlertCircle, ShieldAlert, GraduationCap } from "lucide-react";

interface UserCourseManagerProps {
  currentUser: User;
  users: User[];
  courses: Course[];
  onCreateUser: (payload: any) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onCreateCourse: (payload: any) => Promise<void>;
  onUpdateCourse: (id: string, payload: any) => Promise<void>;
  onUpdateRegisteredCourses: (id: string, courseIds: string[], adminId?: string) => Promise<void>;
}

export default function UserCourseManager({
  currentUser,
  users,
  courses,
  onCreateUser,
  onDeleteUser,
  onCreateCourse,
  onUpdateCourse,
  onUpdateRegisteredCourses
}: UserCourseManagerProps) {
  
  const [activeSegment, setActiveSegment] = useState<"users" | "courses">("users");

  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);
  const [assignMsg, setAssignMsg] = useState("");
  const [isSavingAssign, setIsSavingAssign] = useState(false);

  // User form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [level, setLevel] = useState("100");
  const [department, setDepartment] = useState("Computer Science");
  const [matricNumber, setMatricNumber] = useState("");
  const [userMsg, setUserMsg] = useState("");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Course form state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseLevel, setCourseLevel] = useState("300");
  const [courseSemester, setCourseSemester] = useState<"1st" | "2nd">("1st");
  const [assignedLecturerId, setAssignedLecturerId] = useState("");
  const [courseMsg, setCourseMsg] = useState("");

  // Role restriction checks
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isDeptAdmin = currentUser.role === UserRole.DEPARTMENT_ADMIN;
  const hasUserRights = isSuperAdmin || isDeptAdmin;
  const hasCourseRights = isDeptAdmin || isSuperAdmin;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !matricNumber.trim()) {
      setUserMsg("Please provide all required profile fields.");
      return;
    }
    try {
      setIsSubmittingUser(true);
      setUserMsg("");
      await onCreateUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        level: role === UserRole.STUDENT ? level : undefined,
        department: department.trim() || "Computer Science",
        matricOrStaffNumber: matricNumber.trim()
      });
      setFullName("");
      setEmail("");
      setMatricNumber("");
      setUserMsg("User account instantiated successfully!");
    } catch (err: any) {
      setUserMsg(err.message || "Failed to instantiate user account.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !courseTitle || !assignedLecturerId) {
      setCourseMsg("Please satisfy all course parameters.");
      return;
    }
    try {
      setCourseMsg("");
      if (editingCourseId) {
        await onUpdateCourse(editingCourseId, {
          courseCode,
          courseTitle,
          level: courseLevel,
          semester: courseSemester,
          lecturerId: assignedLecturerId
        });
        setEditingCourseId(null);
        setCourseMsg("Course outline updated successfully!");
      } else {
        await onCreateCourse({
          courseCode,
          courseTitle,
          level: courseLevel,
          semester: courseSemester,
          lecturerId: assignedLecturerId
        });
        setCourseMsg("Course node established inside database!");
      }
      setCourseCode("");
      setCourseTitle("");
      setAssignedLecturerId("");
    } catch (err: any) {
      setCourseMsg(err.message || "Failure persisting course outline.");
    }
  };

  const lecturersList = users.filter(u => u.role === UserRole.LECTURER);

  return (
    <div className="space-y-6">
      
      {/* Tab select bar */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-sans font-semibold text-gray-900 dark:text-zinc-100 flex items-center">
            <GraduationCap className="h-5.5 w-5.5 mr-2 text-gray-500 dark:text-zinc-400" />
            Administrative Account & Program Manager
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-405 font-sans mt-0.5">
            Configure student & lecturer rosters or map course curriculums.
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-zinc-950 p-0.5 rounded-lg flex shrink-0 transition-colors">
          <button
            onClick={() => setActiveSegment("users")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
              activeSegment === "users" ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-xs font-semibold" : "text-gray-500 dark:text-zinc-405 hover:text-gray-900"
            }`}
          >
            User Accounts ({users.length})
          </button>
          <button
            onClick={() => { setActiveSegment("courses"); setEditingCourseId(null); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
              activeSegment === "courses" ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-xs font-semibold" : "text-gray-500 dark:text-zinc-405 hover:text-gray-900"
            }`}
          >
            Syllabus Courses ({courses.length})
          </button>
        </div>
      </div>

       {activeSegment === "users" ? (
        <div className="space-y-6">
          {/* Admin Course Assignment Panel */}
          {assigningStudentId && (() => {
            const student = users.find(u => u.id === assigningStudentId);
            if (!student) return null;
            const studentLevelCourses = courses.filter(c => c.level === student.level);
            return (
              <div className="bg-indigo-50/10 dark:bg-zinc-950/40 border border-indigo-150 dark:border-zinc-805 rounded-xl p-6 mb-6 space-y-4 shadow-xs animate-in fade-in transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-gray-950 dark:text-zinc-150 flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                      Dynamic Course Assignment for Student: {student.fullName} ({student.level} Level)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-405 mt-0.5 font-sans">
                      Assign registered courses corresponding to Level {student.level} for this student. Student clearance determines access bounds.
                    </p>
                  </div>
                  <button 
                    onClick={() => setAssigningStudentId(null)}
                    className="text-xs text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 px-2 py-1 rounded border border-gray-200 dark:border-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentLevelCourses.length === 0 ? (
                    <p className="text-xs text-gray-400 italic col-span-3">No syllabus courses available at Level {student.level} to map.</p>
                  ) : (
                    studentLevelCourses.map(crs => {
                      const isChecked = assignedCourseIds.includes(crs.id);
                      return (
                        <label 
                          key={crs.id}
                          className={`flex items-start p-3 rounded-lg border cursor-pointer select-none transition-all ${
                            isChecked 
                              ? "bg-indigo-50/10 dark:bg-zinc-800/20 border-indigo-200 dark:border-zinc-700 font-semibold" 
                              : "bg-white dark:bg-zinc-950/20 border-gray-150 dark:border-zinc-850 hover:border-gray-200"
                          }`}
                        >
                          <input 
                            type="checkbox"
                            className="mt-1 mr-3 rounded text-indigo-605"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignedCourseIds([...assignedCourseIds, crs.id]);
                              } else {
                                setAssignedCourseIds(assignedCourseIds.filter(id => id !== crs.id));
                              }
                            }}
                          />
                          <div className="text-xs">
                            <span className="font-mono bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-350 px-1.5 py-0.5 rounded text-[9px] font-bold mr-1.5">
                              {crs.courseCode}
                            </span>
                            <span className="text-gray-500 dark:text-zinc-405">{crs.semester} Semester</span>
                            <h5 className="font-medium text-gray-900 dark:text-zinc-100 mt-1">{crs.courseTitle}</h5>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                {assignMsg && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-sans font-medium">● {assignMsg}</p>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => {
                      const allIds = studentLevelCourses.map(c => c.id);
                      setAssignedCourseIds(allIds);
                    }}
                    className="text-xs text-gray-600 hover:text-gray-900 border border-gray-200 dark:border-zinc-800 rounded-lg py-1.5 px-3 cursor-pointer transition-colors"
                  >
                    Select All Level {student.level} Courses
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setIsSavingAssign(true);
                        setAssignMsg("");
                        await onUpdateRegisteredCourses(student.id, assignedCourseIds, currentUser.id);
                        setAssignMsg("Records mapped successfully! Enrollment log created.");
                        setTimeout(() => {
                          setAssigningStudentId(null);
                        }, 1500);
                      } catch (err: any) {
                        setAssignMsg(err.message || "Failed to persist map configurations.");
                      } finally {
                        setIsSavingAssign(false);
                      }
                    }}
                    className="text-xs bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg py-1.5 px-4 cursor-pointer font-semibold transition-colors"
                    disabled={isSavingAssign}
                  >
                    {isSavingAssign ? "Synchronizing..." : "Save Assignments"}
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* USER ROSTER TABLE (2 columns) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs transition-colors">
            <div className="p-5 border-b border-gray-50 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-950/20">
              <h3 className="text-sm font-sans font-semibold text-gray-900 dark:text-zinc-100 flex items-center">
                <Users className="h-4.5 w-4.5 mr-2 text-gray-550 dark:text-zinc-400" />
                University Roster Entities
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 text-[10px] uppercase font-mono text-gray-400 dark:text-zinc-500">
                    <th className="px-6 py-3 font-medium">FullName & Email</th>
                    <th className="px-6 py-3 font-medium">Identity Role</th>
                    <th className="px-6 py-3 font-medium">Department context</th>
                    <th className="px-6 py-3 font-medium">Matric / Staff</th>
                    {hasCourseRights && <th className="px-6 py-3 font-medium text-right">Course Assignment</th>}
                    {isSuperAdmin && <th className="px-6 py-3 font-medium text-right">Delete</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-900 dark:text-zinc-250">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/40 dark:hover:bg-zinc-850/40 transition-all font-sans">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-zinc-100 font-sans">{u.fullName}</div>
                        <div className="text-[10px] text-gray-500 dark:text-zinc-500 font-mono mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border whitespace-nowrap ${
                          u.role === UserRole.SUPER_ADMIN ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" :
                          u.role === UserRole.DEPARTMENT_ADMIN ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800" :
                          u.role === UserRole.LECTURER ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800" :
                          "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-605 dark:text-zinc-350 font-sans">
                        {u.department} {u.level ? `(${u.level} Level)` : ""}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-gray-600 dark:text-zinc-400">
                        {u.matricOrStaffNumber}
                      </td>
                      {hasCourseRights && (
                        <td className="px-6 py-4 text-right">
                          {u.role === UserRole.STUDENT ? (
                            <button
                              id={`btn_assign_courses_${u.id}`}
                              onClick={() => {
                                setAssigningStudentId(u.id);
                                setAssignedCourseIds(u.registeredCourseIds || []);
                                setAssignMsg("");
                              }}
                              className="text-xs text-indigo-650 bg-indigo-50/50 hover:bg-indigo-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-indigo-150 dark:border-zinc-700 py-1 px-2 rounded-lg cursor-pointer transition-colors font-medium"
                            >
                              Manage ({u.registeredCourseIds?.length || 0})
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 italic">Not Required</span>
                          )}
                        </td>
                      )}
                      {isSuperAdmin && (
                        <td className="px-6 py-4 text-right">
                          <button
                            id={`btn_delete_user_${u.id}`}
                            disabled={u.id === currentUser.id}
                            onClick={() => onDeleteUser(u.id)}
                            className="text-red-650 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-md text-xs cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Delete User identity"
                          >
                            <Trash2 className="h-4 w-4 inline" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* USER FORM PANEL (1 column) */}
          <div className="lg:col-span-1 space-y-6">
            {hasUserRights ? (
              <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs transition-colors">
                <h3 className="text-sm font-sans font-bold text-gray-950 dark:text-zinc-150 pb-3 border-b border-gray-50 dark:border-zinc-800 mb-4 flex items-center">
                  <Plus className="h-4.5 w-4.5 mr-1.5 text-gray-555 dark:text-zinc-400" />
                  Instantiate New Account
                </h3>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-zinc-450 mb-1 font-semibold">Full Name *</label>
                    <input
                      id="user_input_fullname"
                      type="text"
                      required
                      placeholder="e.g. Professor Grace Hopper"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:border-indigo-500 text-gray-900 dark:text-zinc-100 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-zinc-450 mb-1 font-semibold">Email *</label>
                    <input
                      id="user_input_email"
                      type="email"
                      required
                      placeholder="e.g. hopper@vault.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:border-[#f59e0b] dark:focus:border-[#f59e0b] text-gray-900 dark:text-zinc-100 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-zinc-450 mb-1 font-semibold">Select Role *</label>
                      <select
                        id="user_input_role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-500 font-sans"
                      >
                        {Object.values(UserRole).map(r => (
                          <option key={r} value={r} className="bg-white dark:bg-zinc-900">{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-zinc-450 mb-1 font-semibold">Matric / Staff Code *</label>
                      <input
                        id="user_input_matric"
                        type="text"
                        required
                        placeholder="e.g. STAFF-CS-12"
                        value={matricNumber}
                        onChange={(e) => setMatricNumber(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:border-indigo-500 text-gray-900 dark:text-zinc-100 font-mono"
                      />
                    </div>
                  </div>

                  {role === UserRole.STUDENT && (
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-zinc-450 mb-1 font-semibold">Active Study Level</label>
                      <select
                        id="user_input_level"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-200 focus:outline-hidden focus:border-indigo-500 font-sans"
                      >
                        {["100", "200", "300", "400", "500"].map(lvl => (
                          <option key={lvl} value={lvl} className="bg-white dark:bg-zinc-900">{lvl} Level</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-zinc-450 mb-1 font-semibold">Academic department *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:border-[#f59e0b] dark:focus:border-[#f59e0b] text-gray-900 dark:text-zinc-100 font-sans"
                    />
                  </div>

                  {userMsg && (
                    <div id="user_form_msg" className={`text-xs p-3 rounded-lg border flex items-start space-x-2 ${
                      userMsg.includes("successfully") 
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80" 
                        : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/80"
                    }`}>
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{userMsg}</span>
                    </div>
                  )}

                  <button
                    id="submit_user_creation"
                    type="submit"
                    disabled={isSubmittingUser}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg py-2.5 px-4 text-xs font-semibold cursor-pointer transition-colors shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingUser ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Instantiating Account...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Instantiate New Account</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-5 text-amber-800 dark:text-amber-400 text-xs leading-relaxed font-sans flex items-start space-x-2 transition-colors">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Admin Clearance Mandated</h4>
                  <p className="mt-0.5">Instantiating and modifying user profile parameters requires Department Admin or Super Admin authority. Your current role has view access only.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      ) : (
        /* COURSE OUTLINE MANAGEMENT SEGMENT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COURSE LIST TABLE (2 columns) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs transition-colors">
            <div className="p-5 border-b border-gray-50 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-950/20">
              <h3 className="text-sm font-sans font-semibold text-gray-900 dark:text-zinc-100 flex items-center">
                <FolderOpen className="h-4.5 w-4.5 mr-2 text-gray-550 dark:text-zinc-400" />
                Departmental syllabus Courses
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 text-[10px] uppercase font-mono text-gray-405 dark:text-zinc-500">
                    <th className="px-6 py-3 font-medium">Course Code</th>
                    <th className="px-6 py-3 font-medium">Course Title</th>
                    <th className="px-6 py-3 font-medium">Level & Semester</th>
                    <th className="px-6 py-3 font-medium">Instructor Assigned</th>
                    {hasCourseRights && <th className="px-6 py-3 font-medium text-right">Edit</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-900 dark:text-zinc-250">
                  {courses.map((crs) => (
                    <tr key={crs.id} className="hover:bg-gray-50/40 dark:hover:bg-zinc-850/40 transition-all font-sans">
                      <td className="px-6 py-4">
                        <span className="bg-gray-900 dark:bg-zinc-850 text-white px-2 py-0.5 rounded text-[10px] font-mono leading-none border border-gray-800 dark:border-zinc-700 font-semibold uppercase">
                          {crs.courseCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-950 dark:text-zinc-100 font-sans">
                        {crs.courseTitle}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-zinc-450 font-sans">
                        {crs.level} Level / {crs.semester} Semester
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-zinc-300 font-sans font-medium">
                        {crs.lecturerName}
                      </td>
                      {hasCourseRights && (
                        <td className="px-6 py-4 text-right">
                          <button
                            id={`btn_edit_course_${crs.id}`}
                            onClick={() => {
                              setEditingCourseId(crs.id);
                              setCourseCode(crs.courseCode);
                              setCourseTitle(crs.courseTitle);
                              setCourseLevel(crs.level);
                              setCourseSemester(crs.semester);
                              setAssignedLecturerId(crs.lecturerId);
                              setCourseMsg("");
                            }}
                            className="text-gray-500 hover:text-gray-900 dark:text-zinc-450 dark:hover:text-zinc-100 p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md text-xs cursor-pointer transition-colors"
                            title="Edit course outlines"
                          >
                            <Edit className="h-4 w-4 inline" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COURSE CREATE/EDIT FORM (1 column) */}
          <div className="lg:col-span-1 space-y-6">
            {hasCourseRights ? (
              <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-xs transition-colors">
                <h3 className="text-sm font-sans font-bold text-gray-950 dark:text-zinc-100 pb-3 border-b border-gray-50 dark:border-zinc-800 mb-4 flex items-center">
                  <FolderOpen className="h-4.5 w-4.5 mr-1.5 text-gray-500 dark:text-zinc-400" />
                  {editingCourseId ? "Modify Course node" : "Establish Course Node"}
                </h3>                <form onSubmit={handleCourseSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-zinc-455 mb-1 font-semibold">Course Code (Syllabus Match) *</label>
                    <input
                      id="course_input_code"
                      type="text"
                      required
                      placeholder="e.g. CSC 301"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:border-[#f59e0b] dark:focus:border-[#f59e0b] text-gray-900 dark:text-zinc-100 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-zinc-455 mb-1 font-semibold">Course Title *</label>
                    <input
                      id="course_input_title"
                      type="text"
                      required
                      placeholder="e.g. Algorithmic Complexity Charts"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-805 rounded-lg focus:outline-hidden focus:border-[#f59e0b] dark:focus:border-[#f59e0b] text-gray-900 dark:text-zinc-100 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-zinc-455 mb-1 font-semibold">Active Level</label>
                      <select
                        id="course_input_level"
                        value={courseLevel}
                        onChange={(e) => setCourseLevel(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#f59e0b] font-sans"
                      >
                        {["100", "200", "300", "400", "500"].map(lvl => (
                          <option key={lvl} value={lvl} className="bg-white dark:bg-zinc-900">{lvl} Level</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-zinc-455 mb-1 font-semibold">Semester Cycle</label>
                      <select
                        id="course_input_semester"
                        value={courseSemester}
                        onChange={(e) => setCourseSemester(e.target.value as any)}
                        className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#f59e0b] font-sans"
                      >
                        <option value="1st" className="bg-white dark:bg-zinc-900">1st Semester</option>
                        <option value="2nd" className="bg-white dark:bg-zinc-900">2nd Semester</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-zinc-455 mb-1 font-semibold">Assign Lecturer *</label>
                    <select
                      id="course_input_lecturer"
                      required
                      value={assignedLecturerId}
                      onChange={(e) => setAssignedLecturerId(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:border-[#f59e0b] font-sans"
                    >
                      <option value="" className="bg-white dark:bg-zinc-900 text-gray-400">-- Choose Instructor --</option>
                      {lecturersList.map((lec) => (
                        <option key={lec.id} value={lec.id} className="bg-white dark:bg-zinc-900">{lec.fullName} ({lec.matricOrStaffNumber})</option>
                      ))}
                    </select>
                  </div>

                  {courseMsg && (
                    <div id="course_form_msg" className={`text-xs p-3 rounded-lg border flex items-start space-x-2 ${
                      courseMsg.includes("successfully") || courseMsg.includes("established")
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80" 
                        : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/80"
                    }`}>
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{courseMsg}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {editingCourseId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCourseId(null);
                          setCourseCode("");
                          setCourseTitle("");
                          setAssignedLecturerId("");
                          setCourseMsg("");
                        }}
                        className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg py-2.5 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      id="course_submit_btn"
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg py-2.5 px-4 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                    >
                      {editingCourseId ? "Apply Modifications" : "Instantiate Course Outline"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-5 text-amber-800 dark:text-amber-400 text-xs leading-relaxed font-sans flex items-start space-x-2 transition-colors">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <div>
                  <h4 className="font-bold">Administrative Clearance necessary</h4>
                  <p className="mt-0.5">Creating or modifying course metadata requires Departmental Admin peer permission structures. All edits trigger notifications.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
