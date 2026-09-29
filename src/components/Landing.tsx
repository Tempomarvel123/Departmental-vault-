import React, { useState } from 'react';
import { 
  ShieldCheck, BookOpen, Lock, Users, ChevronRight, Globe, Zap, Cpu, 
  Star, PlayCircle, GraduationCap, Sparkles, Plus, RotateCcw, Check, 
  HelpCircle, Lightbulb, Eye, Download, History, X, Upload, Sun, Moon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MockMaterial {
  id: number;
  original_name: string;
  mimetype: string;
  version: number;
  uploaded_by: string;
  upload_date: string;
  file_size: number;
  type: string;
  topic: string;
  status: 'approved' | 'pending';
  history: Array<{ version: number; date: string; uploader: string; size: number; reason: string }>;
}

const INITIAL_MOCK_MATERIALS: MockMaterial[] = [
  {
    id: 1,
    original_name: 'CS402_Introduction_to_Applied_Cryptography.pdf',
    mimetype: 'application/pdf',
    version: 3,
    uploaded_by: 'Dr. Sarah Jenkins',
    upload_date: '2026-05-18T14:30:00.000Z',
    file_size: 2451200,
    type: 'lecture_note',
    topic: 'Cryptography',
    status: 'approved',
    history: [
      { version: 3, date: '2026-05-18T14:30:00.000Z', uploader: 'Dr. Sarah Jenkins', size: 2451200, reason: 'Updated section on post-quantum secure signatures.' },
      { version: 2, date: '2026-05-15T09:12:00.000Z', uploader: 'Dr. Sarah Jenkins', size: 2410500, reason: 'Corrected formulas for ElGamal decryptions.' },
      { version: 1, date: '2026-05-10T11:00:00.000Z', uploader: 'Dr. Sarah Jenkins', size: 2380000, reason: 'Initial release for spring semester.' }
    ]
  },
  {
    id: 2,
    original_name: 'Distributed_Systems_Architecture_Blueprint.png',
    mimetype: 'image/png',
    version: 2,
    uploaded_by: 'Prof. Marcus Vance',
    upload_date: '2026-05-17T16:45:00.000Z',
    file_size: 5124000,
    type: 'diagram',
    topic: 'Software Architecture',
    status: 'approved',
    history: [
      { version: 2, date: '2026-05-17T16:45:00.000Z', uploader: 'Prof. Marcus Vance', size: 5124000, reason: 'Refactored consensus layer layout and added Raft cluster diagram.' },
      { version: 1, date: '2026-05-14T08:30:00.000Z', uploader: 'Prof. Marcus Vance', size: 4890000, reason: 'Initial architecture block diagram.' }
    ]
  },
  {
    id: 3,
    original_name: 'IFT301_Academic_Integrity_and_Writing_Guide.pdf',
    mimetype: 'application/pdf',
    version: 1,
    uploaded_by: 'Dean Alistair Thorne',
    upload_date: '2026-05-12T10:00:00.000Z',
    file_size: 1540000,
    type: 'syllabus',
    topic: 'Academic Integrity',
    status: 'approved',
    history: [
      { version: 1, date: '2026-05-12T10:00:00.000Z', uploader: 'Dean Alistair Thorne', size: 1540000, reason: 'Official material for IFT department standard guidelines.' }
    ]
  }
];

interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
  onQuickAccess: (email: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  coursesCount: number;
  materialsCount: number;
  calendarEventsCount: number;
  auditLogsCount: number;
}

export default function Landing({
  onLogin,
  onRegister,
  onQuickAccess,
  darkMode,
  onToggleDarkMode,
  coursesCount,
  materialsCount,
  calendarEventsCount,
  auditLogsCount
}: LandingProps) {
  // Playground MVP State
  const [activeTab, setActiveTab] = useState<'vault' | 'tutor' | 'quiz'>('vault');
  const [materials, setMaterials] = useState<MockMaterial[]>(INITIAL_MOCK_MATERIALS);
  
  // Simulated Vault states
  const [selectedMaterial, setSelectedMaterial] = useState<MockMaterial | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistOpen, setIsHistOpen] = useState(false);
  const [histMaterial, setHistMaterial] = useState<MockMaterial | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  
  // AI Tutor states
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([
    { role: 'assistant', text: "Hello! I am your AI Study Assistant for the IFT Course Vault. Select a topic below to instantly analyze, outline, or explain core study topics!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Quiz states
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Stats Carousel State & Auto-rotation Loop
  const [activeSlide, setActiveSlide] = useState(0);
  
  const statsList = [
    {
      value: coursesCount > 0 ? coursesCount : 12,
      label: "Active Courses",
      icon: BookOpen,
      desc: "Comprehensive study curriculum modules mapped to IFT core guidelines",
      highlight: "Approved v2.4"
    },
    {
      value: materialsCount > 0 ? materialsCount : 9,
      label: "Encrypted Materials",
      icon: Lock,
      desc: "Secured course syllabus & slide archives running military cryptography",
      highlight: "AES-255 Enabled"
    },
    {
      value: calendarEventsCount > 0 ? calendarEventsCount : 3,
      label: "Department Agendas",
      icon: GraduationCap,
      desc: "Academic term calendars, scheduled exams, and consultation sessions",
      highlight: "Live Agenda"
    },
    {
      value: auditLogsCount > 0 ? auditLogsCount : 3,
      label: "Security Ledger Checks",
      icon: ShieldCheck,
      desc: "Real-time auditing files, download records, and system-integrity checks",
      highlight: "Active Audit"
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % statsList.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [statsList.length]);

  const quizQuestions = [
    {
      question: "What is the primary role of cryptographic Hash functions in ensuring security of course materials?",
      options: [
        "To verify integrity and guarantee that unauthorized versions have not been tampered with",
        "To translate academic documents into human-readable slide translations",
        "To rate limit the speed of course document downloads",
        "To compress files on server disks automatically"
      ],
      correctAnswer: 0,
      explanation: "A cryptographic SHA-256 hash serves as a unique file fingerprint. If even a single character in the lecture file is changed, the computed hash alters completely, preventing tampering."
    },
    {
      question: "If a lecturer reverts a material to v1 in IFT Vault, what actually occurs behind the scenes?",
      options: [
        "The server permanently deletes v2 and v3 logs and restarts the server",
        "A new v4 record is appended containing v1 data, preserving the full immutable audit-history",
        "All enrolled student browser cache memories are wiped remotely",
        "Nothing, since only students can revert file records"
      ],
      correctAnswer: 1,
      explanation: "In secure compliance systems, past versions are never deleted because of audit trailing. Instead, a new higher version is inserted carrying the restored data content, keeping the full log secure."
    }
  ];

  const handleUploadSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    const formattedName = newFileName.endsWith('.pdf') || newFileName.endsWith('.png') ? newFileName : `${newFileName}.pdf`;
    
    setUploadFeedback('processing');
    setTimeout(() => {
      const newMat: MockMaterial = {
        id: Date.now(),
        original_name: formattedName,
        mimetype: formattedName.endsWith('.png') ? 'image/png' : 'application/pdf',
        version: 1,
        uploaded_by: 'You (Lecturer Guest)',
        upload_date: new Date().toISOString(),
        file_size: Math.floor(Math.random() * 3000000) + 500000,
        type: 'lecture_note',
        topic: 'Simulated Topic',
        status: 'approved',
        history: [{ version: 1, date: new Date().toISOString(), uploader: 'You (Lecturer Guest)', size: Math.floor(Math.random() * 3000000) + 500000, reason: 'Initial guest sandbox upload.' }]
      };
      
      setMaterials([newMat, ...materials]);
      setNewFileName('');
      setUploadFeedback('success');
      setTimeout(() => setUploadFeedback(null), 3000);
    }, 800);
  };

  const handleVersionRevertSimulate = (matId: number, targetVersionNum: number) => {
    const original = materials.find(m => m.id === matId);
    if (!original) return;

    const histTarget = original.history.find(h => h.version === targetVersionNum);
    if (!histTarget) return;

    const nextVer = original.version + 1;
    const updatedHistory = [
      {
        version: nextVer,
        date: new Date().toISOString(),
        uploader: 'You (Lecturer Guest - Reverted)',
        size: histTarget.size,
        reason: `Reverted back to Version ${targetVersionNum} (Restored content uploaded on ${new Date(histTarget.date).toLocaleDateString()}).`
      },
      ...original.history
    ];

    const updatedMaterials = materials.map(m => {
      if (m.id === matId) {
        return {
          ...m,
          version: nextVer,
          uploaded_by: 'You (Lecturer Guest - Reverted)',
          upload_date: new Date().toISOString(),
          history: updatedHistory
        };
      }
      return m;
    });

    setMaterials(updatedMaterials);
    setHistMaterial(updatedMaterials.find(m => m.id === matId) || null);
    alert(`Successfully created new Version v${nextVer} by reverting to v${targetVersionNum}!`);
  };

  const handleAiAsk = (topicPrompt: string) => {
    if (isTyping) return;
    
    const newMsgs = [...chatMessages, { role: 'user' as const, text: topicPrompt }];
    setChatMessages(newMsgs);
    setIsTyping(true);

    setTimeout(() => {
      let responseText = '';
      if (topicPrompt.includes('Versioning')) {
        responseText = "🔒 **IFT Vault Versioning Control Explained**:\n\nWhen lecturers upload an updated version of any material, or choose to revert back to an older one, the system appends a new version row. Students will always secure the latest verified, lecturer-approved PDF/diagram version instantly, avoiding any confusion about whether their notes are outdated!";
      } else if (topicPrompt.includes('encryption')) {
        responseText = "🔑 **Military-Grade Encryption Pipeline**:\n\nAll submitted files are sliced, run through AES-256 binary encryption using unique IV vector keys on the servers, and stored securely off-limits to unverified web spiders or crawlable robots. Previews and downloads are securely decrypted on-the-fly when authentic student tokens are produced.";
      } else {
        responseText = "📚 **Welcome to the Vault Syllabus Companion**!\n\nThis material contains structured guidelines for the spring term courses. You can easily view previous lecture releases inside the material page, read integrated outlines, and generate short practice assessments.";
      }

      setChatMessages([...newMsgs, { role: 'assistant' as const, text: responseText }]);
      setIsTyping(false);
    }, 1200);
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAns(null);
    setQuizScore(0);
    setQuizSubmitted(false);
    setQuizFinished(false);
  };

  const submitQuizAnswer = () => {
    if (selectedAns === null) return;
    const isCorrect = selectedAns === quizQuestions[currentQuizIndex].correctAnswer;
    if (isCorrect) setQuizScore(prev => prev + 1);
    setQuizSubmitted(true);
  };

  const nextQuizStep = () => {
    setSelectedAns(null);
    setQuizSubmitted(false);
    if (currentQuizIndex + 1 < quizQuestions.length) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep text-text-main selection:bg-brand-primary selection:text-white transition-colors duration-150 font-sans">
      
      {/* Navigation */}
      <nav id="landing_navigation_bar" className="fixed top-0 w-full z-50 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-border-subtle transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] rounded-full border-[3px] border-sky-450 dark:border-sky-550 flex items-center justify-center bg-sky-50 dark:bg-sky-950/20 shadow-xs ring-1 ring-sky-200/20">
              <div className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"></div>
            </div>
            <span className="font-sans font-black text-2xl tracking-tight text-gray-900 dark:text-white leading-none">
              SecureVault
            </span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="#features" className="hidden sm:inline-block text-xs font-semibold text-text-dim hover:text-brand-primary transition-colors">
              Features
            </a>
            
            <button 
              id="landing_nav_login_btn"
              onClick={onLogin} 
              className="btn-gold px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="landing_hero_section" className="relative pt-40 pb-20 overflow-hidden bg-white dark:bg-zinc-950 transition-colors duration-150">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-radial from-sky-400/10 via-transparent to-transparent opacity-80 dark:opacity-40"></div>
          <div className="absolute inset-0 bg-linear-to-b from-white/10 via-white/80 to-white dark:from-zinc-950/10 dark:via-zinc-950/90 dark:to-zinc-950"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 text-center z-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-100/70 dark:bg-sky-955/20 border border-sky-200/50 dark:border-sky-900/40 rounded-full text-[10px] sm:text-[11px] font-semibold text-sky-700 dark:text-sky-450 uppercase tracking-wildest font-mono mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              <span>Intranet Academic Credential Ledger</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-950 dark:text-white leading-[1.15] mb-8 max-w-5xl mx-auto">
              Secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500">Material Vault</span> & <br /> Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-sky-400">Versioning Log</span> Hub
            </h1>
            
            <p className="max-w-3xl mx-auto text-text-dim text-sm sm:text-base md:text-lg font-normal leading-relaxed mb-12">
              The premium academic archive for IFT students and lecturers. View, audit, download, and review lectures with military-grade encryption under pristine version control.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
              <button 
                onClick={onLogin} 
                className="btn-gold px-10 py-4 text-xs font-bold uppercase tracking-widest rounded-xl flex items-center gap-2.5 w-full justify-center cursor-pointer font-bold"
              >
                <GraduationCap className="w-4.5 h-4.5" />
                Sign In
              </button>
              <button 
                id="hero_register_btn"
                onClick={onRegister} 
                className="w-full px-10 py-4 bg-white dark:bg-zinc-900 border border-brand-primary/20 text-brand-primary rounded-xl text-xs font-bold uppercase tracking-wildest hover:bg-brand-primary/5 dark:hover:bg-zinc-800 transition-all cursor-pointer text-center shadow-2xs"
              >
                Register
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center -space-x-4 mb-2">
                {[1, 2, 3, 4].map(i => (
                  <img 
                    key={i}
                    src={`https://i.pravatar.cc/100?img=${i + 15}`} 
                    className="w-11 h-11 rounded-full border-4 border-white dark:border-zinc-900 object-cover shadow-sm bg-zinc-200"
                    alt="User"
                  />
                ))}
                <div className="w-11 h-11 rounded-full border-4 border-white dark:border-zinc-900 bg-brand-primary flex items-center justify-center text-white text-xs font-bold font-mono shadow-sm">+</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex text-amber-500">
                   <Star className="w-4 h-4 fill-current" />
                   <Star className="w-4 h-4 fill-current" />
                   <Star className="w-4 h-4 fill-current" />
                   <Star className="w-4 h-4 fill-current" />
                   <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">4.9/5 Student Rating</span>
                <span className="text-xs text-text-dim">• Secure Cryptographic Deliveries</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hero Image Group */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-6xl mx-auto mt-16 px-6 relative"
        >
          <div className="relative flex justify-center items-center">
            {/* Main Students Image */}
            <div className="relative group overflow-hidden rounded-[2rem] shadow-2xl border-4 border-white dark:border-zinc-800 max-w-4xl w-full">
               <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
                alt="Students studying" 
                className="w-full h-[280px] sm:h-[380px] object-cover transition-transform duration-700 group-hover:scale-102"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white text-left z-20">
                <p className="text-[10px] uppercase font-mono tracking-widest text-sky-400">Department of Private Academic Archive</p>
                <h4 className="text-xl sm:text-2xl font-bold mt-1">Smarter Learning Through Immutable Delivery</h4>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* GLOWING DARK SYSTEM METRICS CAROUSEL */}
      <section 
        id="system_metrics_bar" 
        className="py-16 bg-slate-950 text-white relative overflow-hidden border-y border-zinc-900 transition-colors duration-150"
      >
        {/* Glow ambient background leaks from Tactile sandbox design */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-sky-500 rounded-full filter blur-[110px] animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full filter blur-[110px] animate-pulse [animation-delay:2s]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-8">
            <span className="text-[10px] font-mono tracking-widest text-[#f59e0b] uppercase font-black bg-white/5 border border-white/10 px-4 py-1.5 rounded-full inline-block shadow-sm">
              ✨ Real-Time Verification Registry
            </span>
          </div>

          {/* Interactive Core Carousel Track */}
          <div className="relative overflow-hidden w-full py-4">
            {/* Viewport for Mobile & Tablet (Discrete Slider Frame) */}
            <div className="md:hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, x: 50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="w-full p-8 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center text-center relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#f59e0b]/5 rounded-bl-full pointer-events-none"></div>
                  
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-primary mb-5 shadow-inner">
                    {React.createElement(statsList[activeSlide].icon, { className: "w-7 h-7 text-[#f59e0b]" })}
                  </div>
                  
                  <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mb-2">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-350 to-amber-500">
                      {statsList[activeSlide].value}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary mb-3">
                    {statsList[activeSlide].label}
                  </h4>
                  
                  <p className="text-xs text-zinc-300 max-w-sm leading-relaxed mb-4">
                    {statsList[activeSlide].desc}
                  </p>
                  
                  <span className="text-[9px] font-mono bg-white/15 border border-white/10 px-2 py-0.5 rounded-full text-zinc-200">
                    {statsList[activeSlide].highlight}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Slider Dots & Indicators for Mobile */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <button 
                  onClick={() => setActiveSlide((prev) => (prev - 1 + statsList.length) % statsList.length)}
                  className="w-11 h-11 rounded-full border border-white/10 hover:border-brand-primary bg-white/5 hover:bg-brand-primary/10 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-md"
                  aria-label="Previous metrics item"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                
                <div className="flex gap-2">
                  {statsList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2.5 rounded-full cursor-pointer transition-all duration-300 ${activeSlide === idx ? 'bg-[#f59e0b] w-6' : 'bg-white/20 hover:bg-white/40 w-2.5'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button 
                  onClick={() => setActiveSlide((prev) => (prev + 1) % statsList.length)}
                  className="w-11 h-11 rounded-full border border-white/10 hover:border-brand-primary bg-white/5 hover:bg-brand-primary/10 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-md"
                  aria-label="Next metrics item"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewport for Desktop / Large Displays (Infinite Track marquee slide of active cards) */}
            <div className="hidden md:block w-full">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {statsList.map((stat, idx) => {
                  const isCurrentActive = activeSlide === idx;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -8, scale: 1.03 }}
                      animate={isCurrentActive ? { 
                        boxShadow: "0 20px 25px -5px rgba(245, 158, 11, 0.15), 0 10px 10px -5px rgba(245, 158, 11, 0.04)",
                        borderColor: "rgba(245, 158, 11, 0.4)",
                        backgroundColor: "rgba(39, 39, 42, 0.7)"
                      } : {
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        backgroundColor: "rgba(24, 24, 27, 0.4)"
                      }}
                      onClick={() => setActiveSlide(idx)}
                      transition={{ type: "spring", stiffness: 180, damping: 22 }}
                      className="p-6 border rounded-3xl cursor-pointer relative overflow-hidden transition-all duration-300 flex flex-col justify-between min-h-[220px] group"
                    >
                      {/* Interactive slide indicator bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${isCurrentActive ? 'bg-[#f59e0b]' : 'bg-transparent'}`}></div>
                      
                      {/* Corner ambient reflect lights */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#f59e0b]/5 rounded-bl-full group-hover:bg-[#f59e0b]/10 transition-colors duration-300 pointer-events-none"></div>

                      <div>
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isCurrentActive ? 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30' : 'bg-white/5 text-zinc-300 border border-white/5'} mb-5`}>
                          {React.createElement(stat.icon, { className: "w-5.5 h-5.5" })}
                        </div>
                        
                        <div className="text-3.5xl font-black font-mono tracking-tight text-white mb-1 flex items-baseline gap-2">
                          <span>{stat.value}</span>
                          <span className="text-[9px] font-mono bg-white/10 border border-white/5 text-[#f59e0b] font-bold px-1.5 py-0.5 rounded-sm shrink-0">
                            {stat.highlight}
                          </span>
                        </div>
                        
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#f59e0b] mb-1">
                          {stat.label}
                        </h4>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-2">
                        {stat.desc}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
              
              {/* Slide indicators at bottom */}
              <div className="flex justify-center gap-2 mt-8">
                {statsList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${activeSlide === idx ? 'bg-[#f59e0b] w-8' : 'bg-white/20 hover:bg-white/40 w-2'}`}
                    aria-label={`Go to metric section ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        </section>

      {/* DETAILED FEATURES GRID */}
      <section id="features" className="py-24 bg-bg-deep dark:bg-zinc-950 transition-colors duration-150 relative">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <p className="text-brand-primary font-bold text-xs uppercase tracking-widest mb-4">Why Choose Us</p>
          <h2 className="text-4xl font-black text-gray-950 dark:text-white mb-6">Everything <span className="text-brand-primary">You Need</span> to Excel</h2>
          <p className="text-text-dim max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Smarter infrastructure tools designed to enhance departmental note sharing, calendar schedules, and AI assessment workflows.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-7 h-7" />}
              title="Secure Cryptographic Vault"
              description="Keep academic syllabus files stored securely, decrypted only with authorized credentials, under strict control."
              index={0}
            />
            <FeatureCard 
              icon={<Cpu className="w-7 h-7" />}
              title="Advanced AI Tutors"
              description="Get guidance from our high-compliance study systems available 24/7 to summarize or explain tough lecture sections."
              index={1}
            />
            <FeatureCard 
              icon={<Users className="w-7 h-7" />}
              title="Audit-Trailing Compliance"
              description="Administrators map every uploaded revision or downloaded document immediately to prevent unapproved edits."
              index={2}
            />
            <FeatureCard 
              icon={<Globe className="w-7 h-7" />}
              title="Local Access & Auth"
              description="Enjoy immediate speeds accessing materials custom tailored to your academic role and department."
              index={3}
            />
            <FeatureCard 
              icon={<Zap className="w-7 h-7" />}
              title="Quick Practice Quizzes"
              description="Automatic, AI-derived practice tests assist students to rehearse exam material safely in real-time."
              index={4}
            />
            <FeatureCard 
              icon={<BookOpen className="w-7 h-7" />}
              title="Versioned Library Logs"
              description="Promote full clarity in material history. Review and revert notes with flawless revision numbers."
              index={5}
            />
          </div>
        </div>
      </section>

      {/* LIVE VIEW PREVIEW DRAWER (Vault Simulation) */}
      {isPreviewOpen && selectedMaterial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-slate-905 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col font-sans">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
               <div>
                 <h4 className="font-bold text-white text-base">Material Reader Preview</h4>
                 <p className="text-xs text-slate-500 font-mono mt-1">Status: Encrypted AES-256 On-fly Decrypt</p>
               </div>
               <button 
                onClick={() => { setSelectedMaterial(null); setIsPreviewOpen(false); }}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center font-bold cursor-pointer"
               >
                 <X className="w-4.5 h-4.5" />
               </button>
            </div>

            <div className="p-6 sm:p-8 text-center text-slate-300">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-base text-white mb-2">{selectedMaterial.original_name}</h5>
              <p className="text-xs text-slate-400 mb-6">Version {selectedMaterial.version} • {(selectedMaterial.file_size / 1024 / 1024).toFixed(2)} MB • {selectedMaterial.mimetype}</p>
              
              <div className="bg-slate-950 text-left p-5 rounded-2xl border border-slate-850 font-mono text-[11px] text-slate-400 mb-6 max-h-[140px] overflow-y-auto leading-relaxed scrollbar-thin">
                [SYSTEM LOG]: Handshaking local authorization key...<br />
                [SYSTEM LOG]: Fetching decrypted binary stream...<br />
                📚 PDF Preview Contents Mocked:<br />
                Greetings student! This lecture covers basic RSA cryptography principles, including prime factor selection and ciphering algorithms. Review previous logs for the full lecture material!
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { alert("This was a simulated download successful! In the live dashboard, this downloads the decrypted version of the actual file secure storage stream."); }} 
                  className="btn-gold flex-1 py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Decrypted Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY SIMULATOR MODAL */}
      {isHistOpen && histMaterial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-slate-905 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col font-sans">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
               <div>
                 <h4 className="font-bold text-white text-base">File Version Logs & Auditing</h4>
                 <p className="text-xs text-slate-400 font-medium italic mt-1 font-mono">For: {histMaterial.original_name}</p>
               </div>
               <button 
                onClick={() => { setHistMaterial(null); setIsHistOpen(false); }}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center font-bold cursor-pointer"
               >
                 <X className="w-4.5 h-4.5" />
               </button>
            </div>

            <div className="p-6 max-h-[350px] overflow-y-auto space-y-4">
              {histMaterial.history.map((h, index) => (
                <div key={h.version} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${index === 0 ? 'bg-brand-primary/5 border-brand-primary/20' : 'bg-slate-950 border-slate-850'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${index === 0 ? 'bg-brand-primary text-white' : 'bg-slate-800 text-slate-400'}`}>
                      v{h.version}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">Version v{h.version}</span>
                        {index === 0 && <span className="text-[8px] font-bold bg-brand-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Latest Active</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{h.reason}</p>
                      <p className="text-[10px] text-slate-505 mt-0.5">Uploaded by {h.uploader} • {new Date(h.date).toLocaleString()}</p>
                    </div>
                  </div>

                  {index > 0 && (
                    <button 
                      onClick={() => handleVersionRevertSimulate(histMaterial.id, h.version)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-brand-primary hover:text-white text-[9px] font-bold uppercase tracking-wider text-slate-300 rounded-xl transition-all shrink-0 cursor-pointer"
                    >
                      Revert
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => { setHistMaterial(null); setIsHistOpen(false); }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer id="landing_footer_section" className="py-16 border-t border-border-subtle bg-white dark:bg-zinc-950 transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
          <div className="space-y-4 max-w-xs">
            <div className="flex items-center justify-center md:justify-start gap-3">
               <ShieldCheck className="text-brand-primary w-7 h-7" />
               <span className="font-sans font-black text-2xl tracking-tight text-gray-950 dark:text-white">SecureVault</span>
            </div>
            <p className="text-xs text-text-dim leading-relaxed">
              Empowering students through innovative, high-compliance and audit-trailing academic credential portals. Access private study resources safely.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-8 sm:gap-16 text-xs text-left">
            <div>
              <h4 className="font-bold text-gray-950 dark:text-white mb-4 uppercase tracking-widest text-[10px]">Academic</h4>
              <ul className="space-y-3 text-text-dim">
                <li className="hover:text-brand-primary cursor-pointer">Courses</li>
                <li className="hover:text-brand-primary cursor-pointer">Syllabuses</li>
                <li className="hover:text-brand-primary cursor-pointer">Agenda</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-950 dark:text-white mb-4 uppercase tracking-widest text-[10px]">Security</h4>
              <ul className="space-y-3 text-text-dim">
                <li className="hover:text-brand-primary cursor-pointer">Encryption</li>
                <li className="hover:text-brand-primary cursor-pointer">Audit Ledger</li>
                <li className="hover:text-brand-primary cursor-pointer">Privacy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-950 dark:text-white mb-4 uppercase tracking-widest text-[10px]">Department</h4>
              <ul className="space-y-3 text-text-dim">
                <li className="hover:text-brand-primary cursor-pointer">Help Desk</li>
                <li className="hover:text-brand-primary cursor-pointer">Intranet</li>
                <li className="hover:text-brand-primary cursor-pointer">Admin Gate</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-dim">
          <p className="font-medium">
            &copy; 2026 SecureVault Intranet System. All rights reserved.
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center hover:bg-brand-primary hover:text-white transition-colors cursor-pointer border border-border-subtle">
              <Globe className="w-4 h-4" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, description, index }: { icon: React.ReactNode, title: string, description: string, index: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100, damping: 15 }}
    whileHover={{ y: -6, scale: 1.02 }}
    className="p-8 bg-white dark:bg-zinc-900 border border-[#e4e4e7] dark:border-zinc-800 rounded-3xl hover:shadow-xl hover:border-brand-primary/20 transition-all duration-200 group flex flex-col items-start text-left cursor-pointer"
  >
    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-6 group-hover:bg-[#f59e0b] group-hover:text-black transition-all duration-200 shadow-sm">
      {icon}
    </div>
    <h3 className="text-base font-bold text-gray-950 dark:text-white mb-2 group-hover:text-[#f59e0b] transition-colors duration-200">{title}</h3>
    <p className="text-text-dim text-xs leading-relaxed">{description}</p>
  </motion.div>
);
