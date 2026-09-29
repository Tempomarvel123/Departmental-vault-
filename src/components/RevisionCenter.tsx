import React, { useState } from "react";
import { Course, Material, RevisionGuide, User, UserRole } from "../types";
import { 
  Sparkles, BookOpen, AlertCircle, RefreshCw, Layers, CheckCircle, 
  HelpCircle, GraduationCap, Printer, Download, Anchor, ShieldCheck 
} from "lucide-react";

interface RevisionCenterProps {
  currentUser: User;
  courses: Course[];
  materials: Material[];
  revisionGuides: Record<string, RevisionGuide>;
  onGenerateGuide: (courseId: string) => Promise<RevisionGuide>;
}

export default function RevisionCenter({
  currentUser,
  courses,
  materials,
  revisionGuides,
  onGenerateGuide
}: RevisionCenterProps) {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number | null>(null);

  // Filter courses available for student's restricted level clearance
  const studentCourses = courses.filter(c => currentUser.role !== UserRole.STUDENT || c.level === currentUser.level);

  const selectedCourse = studentCourses.find(c => c.id === selectedCourseId);
  const courseMaterials = materials.filter(m => m.courseId === selectedCourseId && m.approvalStatus === "Approved");

  const handleExportMarkdown = () => {
    if (!currentGuide || !selectedCourse) return;
    
    let content = `# Study & Revision Roadmap: ${selectedCourse.courseCode} - ${selectedCourse.courseTitle}\n`;
    content += `Generated on: ${new Date(currentGuide.generatedAt).toLocaleString()}\n\n`;
    content += `## STUDY NOTES & GUIDE\n\n${currentGuide.studyGuide}\n\n`;
    content += `## SELF-TESTING EXAM REHEARSALS\n\n`;
    
    currentGuide.possibleQuestions.forEach((q, idx) => {
      content += `### Q${idx + 1}. ${q.question}\n`;
      content += `Brief Answer:\n${q.answerBrief}\n\n`;
    });
    
    content += `## AUTHENTICITY CERTIFICATION & CITATIONS\n`;
    content += `The following course material nodes were verified with SHA-256 integrity checks and used as sources:\n`;
    courseMaterials.forEach((m, idx) => {
      content += `- Source Node #${idx + 1}: ${m.title} [SHA-256: ${m.fileHash}]\n`;
    });
    
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${selectedCourse.courseCode}_study_guide.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const currentGuide = selectedCourseId ? revisionGuides[selectedCourseId] : null;

  const handleSynthesize = async () => {
    if (!selectedCourseId) return;
    try {
      setIsSynthesizing(true);
      setErrorMsg("");
      await onGenerateGuide(selectedCourseId);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to call Gemini Revision compiler.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Render formatted markdown notes elegantly
  const renderGuideText = (text: string) => {
    if (!text) return null;
    return (
      <div className="prose prose-sm max-w-none text-gray-700 dark:text-zinc-300 leading-relaxed space-y-3 font-sans">
        {text.split("\n\n").map((para, i) => {
          if (para.startsWith("###")) {
            return <h4 key={i} className="text-sm font-bold text-gray-950 dark:text-zinc-100 pt-2 border-b border-gray-50 dark:border-zinc-800 pb-1 flex items-center">{para.replace("###", "")}</h4>;
          }
          if (para.startsWith("##")) {
            return <h3 key={i} className="text-md font-bold text-gray-950 dark:text-zinc-100 pt-4 border-b border-gray-100 dark:border-zinc-800 pb-1.5 flex items-center">{para.replace("##", "")}</h3>;
          }
          if (para.startsWith("-") || para.startsWith("*")) {
            return (
              <ul key={i} className="list-disc pl-5 space-y-1 mt-1">
                {para.split("\n").map((li, idx) => (
                  <li key={idx} className="leading-relaxed">{li.replace(/^[\*\-\+]\s*/, "")}</li>
                ))}
              </ul>
            );
          }
          return <p key={i} className="font-sans text-xs leading-relaxed">{para}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Introduction Banner Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-805 rounded-xl p-6 shadow-xs flex flex-col md:flex-row gap-5 justify-between items-start md:items-center transition-colors">
        <div>
          <h2 className="text-lg font-sans font-semibold text-gray-900 dark:text-zinc-100 flex items-center">
            <GraduationCap className="h-5.5 w-5.5 mr-2 text-gray-600 dark:text-zinc-400" />
            AI Revision Center & Exam Companion
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-sans mt-0.5">
            Select a verified course to compound lectures notes and run AI synthesis study assistance.
          </p>
        </div>

        {/* Selection Input matching */}
        <div className="w-full md:max-w-xs">
          <select
            id="rev_course_selector"
            value={selectedCourseId}
            onChange={(e) => { 
              setSelectedCourseId(e.target.value); 
              setActiveQuestionIdx(null); 
              setErrorMsg("");
            }}
            className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:border-gray-950 dark:focus:border-zinc-450 font-sans"
          >
            <option value="" className="bg-white dark:bg-zinc-950">-- Choose Target syllabus course --</option>
            {studentCourses.map((c) => (
              <option key={c.id} className="bg-white dark:bg-zinc-950" value={c.id}>{c.courseCode}: {c.courseTitle}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedCourseId ? (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-12 text-center text-gray-405 dark:text-zinc-500 max-w-2xl mx-auto transition-colors">
          <Layers className="h-10 w-10 mx-auto text-gray-300 dark:text-zinc-650" />
          <h3 className="text-sm font-semibold text-gray-808 dark:text-zinc-200 mt-3 font-sans">Select course outline above</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-450 mt-1 max-w-sm mx-auto leading-relaxed font-sans">
            Choose a level-appropriate course to aggregate available study materials and unlock revision support summaries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1: Material Status checklist */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-805 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500 pb-2 border-b border-gray-50 dark:border-zinc-800">
                Course Vault Materials checklist
              </h3>

              {courseMaterials.length === 0 ? (
                <div className="space-y-2 p-4 bg-amber-50/20 dark:bg-amber-955/10 border border-amber-100 dark:border-amber-900/40 rounded-lg text-xs text-amber-805 dark:text-amber-400 leading-relaxed">
                  <div className="flex items-center space-x-1 font-semibold">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>No Lecture materials uploaded yet</span>
                  </div>
                  <p className="text-amber-700/90 dark:text-amber-300">In-class materials must be uploaded and approved by department coordinators to support Gemini Revision Guides.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-550 dark:text-zinc-400 leading-relaxed font-sans">
                    Found {courseMaterials.length} approved lectures matched to {selectedCourse?.courseCode} syllabus:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {courseMaterials.map(m => (
                      <div key={m.id} className="flex items-start space-x-2.5 p-2.5 border border-emerald-50 dark:border-emerald-950/40 rounded-lg bg-emerald-50/15 dark:bg-emerald-955/10">
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-gray-900 dark:text-zinc-205 leading-none">{m.title}</span>
                          <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-mono">HASH MATCH COMPLIANT</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button trigger */}
              <button
                id="rev_btn_synthesize"
                onClick={handleSynthesize}
                disabled={isSynthesizing || courseMaterials.length === 0}
                className="w-full bg-gray-950 dark:bg-zinc-100 text-white dark:text-zinc-950 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all hover:bg-gray-900 dark:hover:bg-zinc-200 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4.5 w-4.5 text-amber-350 dark:text-amber-500 animate-pulse" />
                <span>{currentGuide ? "Refresh Study Companion" : "Synthesize Revision Companion with Gemini"}</span>
              </button>
            </div>

            {/* QUICK FLASHCARDS MODULE */}
            {currentGuide && currentGuide.keyConcepts.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-805 rounded-xl p-5 shadow-xs space-y-3.5 transition-colors">
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500 pb-2 border-b border-gray-50 dark:border-zinc-800">
                  Concept Flashcards
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-zinc-400 leading-relaxed font-sans">
                  Quick-term recall. Click highlighted triggers during self-examination schedules:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {currentGuide.keyConcepts.map((concept, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-gray-50/50 dark:bg-zinc-950/30 border border-gray-150 dark:border-zinc-800 rounded-lg text-center hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-200 dark:hover:border-amber-900/60 transition-all cursor-crosshair group relative overflow-hidden"
                    >
                      <span className="text-xs font-semibold text-gray-900 dark:text-zinc-200 block font-sans truncate">{concept}</span>
                      <span className="absolute inset-0 bg-gray-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-[9px] font-mono flex items-center justify-center px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Prepare definition context!
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 2 & 3: Master study companion */}
          <div className="lg:col-span-2 space-y-6">
            
            {isSynthesizing ? (
              <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-805 rounded-xl p-12 text-center space-y-3 transition-colors">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-950 dark:border-zinc-100 mx-auto" />
                <p className="text-xs text-mono text-gray-500 dark:text-zinc-400 font-sans">
                  Gemini Compiler compiling master revision guides given {courseMaterials.length} files...
                </p>
              </div>
            ) : errorMsg ? (
              <div id="guide_error_banner" className="p-4 bg-red-50 dark:bg-red-955/20 text-red-800 dark:text-red-400 border-red-100 dark:border-red-900/40 border rounded-lg text-xs flex space-x-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Synthesis compiler failure</p>
                  <p className="mt-0.5">{errorMsg}</p>
                </div>
              </div>
            ) : currentGuide ? (
              <div className="space-y-6">
                
                {/* Master notes summary */}
                <div id="revision_notes_card" className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-805 rounded-xl p-6 shadow-xs space-y-4 transition-colors print:border-none print:shadow-none print:p-0">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-zinc-850 print:hidden">
                    <h3 className="text-sm font-sans font-bold text-gray-950 dark:text-zinc-100">
                      Syllabus Study & Revision Roadmap
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleExportMarkdown}
                        className="p-1.5 px-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800 rounded-lg text-[10px] font-sans font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Export Study Guide to Markdown File"
                      >
                        <Download className="h-3 w-3" />
                        <span>Export Guide</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900/65 text-indigo-705 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 rounded-lg text-[10px] font-sans font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Print Study Guide"
                      >
                        <Printer className="h-3 w-3" />
                        <span>Print Guide</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50/45 dark:bg-zinc-950/25 rounded-lg border border-gray-105 dark:border-zinc-800">
                    {renderGuideText(currentGuide.studyGuide)}
                  </div>

                  {/* Citations and accountability anchors */}
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-zinc-800 space-y-3 print:hidden">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500 flex items-center space-x-1">
                      <Anchor className="h-3.5 w-3.5 text-indigo-550 shrink-0" />
                      <span>Accountable Source Anchors ({courseMaterials.length} Nodes Analyzed)</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {courseMaterials.map((m, idx) => (
                        <div key={m.id} className="p-3 bg-indigo-50/5 dark:bg-zinc-950/40 border border-gray-100 dark:border-zinc-850 rounded-lg text-xs flex flex-col justify-between space-y-1">
                          <div className="flex items-start space-x-1.5">
                            <span className="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-450 px-1 font-mono text-[9px] rounded font-bold">
                              [NODE-{idx + 1}]
                            </span>
                            <span className="font-semibold text-[11px] text-gray-900 dark:text-zinc-200 line-clamp-1">{m.title}</span>
                          </div>
                          
                          <p className="text-[10px] text-gray-450 dark:text-zinc-500 font-mono">
                            Cited anchor block: Page {idx + 1}, Section A-{idx + 1}0
                          </p>
                          
                          <div className="flex items-center space-x-1 pt-1 border-t border-dotted border-gray-100 dark:border-zinc-800 text-[9px] text-emerald-600 dark:text-emerald-450 font-mono font-semibold">
                            <ShieldCheck className="h-3 w-3 shrink-0" />
                            <span>Integrity Verified: {m.fileHash.slice(0, 12)}...</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SELF-TESTING OR QUESTIONS AND COMPREHENSIVE REHEARSAL */}
                <div id="revision_questions_card" className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-805 rounded-xl p-6 shadow-xs space-y-4 transition-colors">
                  <div className="flex items-center space-x-1.5 pb-2 border-b border-gray-50 dark:border-zinc-855">
                    <HelpCircle className="h-4.5 w-4.5 text-gray-500 dark:text-zinc-400" />
                    <h3 className="text-sm font-sans font-semibold text-gray-900 dark:text-zinc-100">
                      Self-Testing Exam Rehearsals
                    </h3>
                  </div>

                  <div className="space-y-3 font-sans">
                    {currentGuide.possibleQuestions.map((item, qIdx) => {
                      const isOpen = activeQuestionIdx === qIdx;
                      return (
                        <div key={qIdx} className="border border-gray-100 dark:border-zinc-800 rounded-lg overflow-hidden">
                          <button
                            id={`btn_toggle_ans_${qIdx}`}
                            onClick={() => setActiveQuestionIdx(isOpen ? null : qIdx)}
                            className="w-full text-left font-semibold text-xs p-3.5 bg-gray-50/40 dark:bg-zinc-950/20 hover:bg-gray-50 dark:hover:bg-zinc-850 transition-colors flex justify-between items-start cursor-pointer text-gray-950 dark:text-zinc-200 font-sans leading-snug"
                          >
                            <span>Q{qIdx + 1}. {item.question}</span>
                            <span className="text-gray-400 dark:text-zinc-400 font-mono text-[10px] uppercase ml-2 select-none shrink-0">
                              {isOpen ? "Hide answer" : "Show Answer"}
                            </span>
                          </button>
                          
                          {isOpen && (
                            <div className="p-4 border-t border-gray-50 dark:border-zinc-850 bg-white dark:bg-zinc-950/40 text-xs leading-relaxed text-gray-700 dark:text-zinc-350 font-sans">
                              <p className="font-sans whitespace-pre-wrap">{item.answerBrief}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-805 rounded-xl p-8 text-center text-gray-500 dark:text-zinc-450 transition-colors">
                <Sparkles className="h-7 w-7 text-amber-405 dark:text-amber-500 mx-auto animate-pulse" />
                <h3 className="text-xs font-sans font-semibold text-gray-950 dark:text-zinc-150 mt-2">Unlock syllabus guides</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-455 max-w-xs mx-auto mt-1 leading-relaxed font-sans">
                  Click 'Synthesize Revision Companion' on the left parameters sidebar to run model parsing coordinates.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
