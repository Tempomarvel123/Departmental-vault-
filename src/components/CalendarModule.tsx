import React, { useState } from "react";
import { CalendarEvent, EventType, User, UserRole } from "../types";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, BookOpen, AlertCircle, CalendarRange } from "lucide-react";

interface CalendarModuleProps {
  currentUser: User;
  events: CalendarEvent[];
  onCreateEvent: (title: string, description: string, date: string, type: EventType) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export default function CalendarModule({
  currentUser,
  events,
  onCreateEvent,
  onDeleteEvent
}: CalendarModuleProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState<EventType>(EventType.EXAM);
  const [filterType, setFilterType] = useState<string>("All");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const canManageEvents = currentUser.role === UserRole.DEPARTMENT_ADMIN || currentUser.role === UserRole.SUPER_ADMIN;

  // Render Category Badge Color
  const getBadgeStyles = (type: EventType) => {
    switch (type) {
      case EventType.EXAM:
        return "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40";
      case EventType.DEADLINE:
        return "bg-amber-50 dark:bg-amber-955/20 text-amber-705 dark:text-amber-400 border-amber-200 dark:border-amber-900/40";
      case EventType.SEMINAR:
        return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40";
      case EventType.MEETING:
        return "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40";
      case EventType.ANNOUNCEMENT:
        return "bg-purple-50 dark:bg-purple-950/20 text-purple-705 dark:text-purple-400 border-purple-200 dark:border-purple-900/40";
      default:
        return "bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700";
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !eventDate) {
      setMsg("Please provide all event parameters.");
      return;
    }
    try {
      setIsSubmitting(true);
      setMsg("");
      await onCreateEvent(title, description, eventDate, eventType);
      setTitle("");
      setDescription("");
      setEventDate("");
      setEventType(EventType.EXAM);
      setMsg("Schedule event created and broadcasted successfully!");
    } catch (err: any) {
      setMsg(err.message || "Failed to preserve event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  const filteredEvents = filterType === "All" 
    ? sortedEvents 
    : sortedEvents.filter(e => e.eventType === filterType);

  // Quick Calendar Grid Preview relative to current Month (e.g. June 2026)
  const currentYear = 2026;
  const currentMonthIndex = 5; // June (0-based)
  const daysInMonth = 30; // June has 30 days
  const monthName = "June 2026";

  const getEventForDay = (day: number) => {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateQuery = `2026-06-${dayStr}`;
    return events.filter(e => e.eventDate === dateQuery || e.eventDate.endsWith(`-06-${dayStr}`));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT & CENTER: Event Calendar View */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-xs transition-colors">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-50 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-sans font-semibold text-gray-900 dark:text-zinc-100 flex items-center">
                <CalendarRange className="h-5 w-5 mr-2 text-gray-500 dark:text-zinc-400" />
                Departmental Academic Schedule
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-sans mt-0.5">
                Centralized curriculum events, test schedules, and announcements.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5">
              {["All", ...Object.values(EventType)].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                    filterType === type 
                      ? "bg-gray-955 dark:bg-zinc-100 text-white dark:text-zinc-950" 
                      : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-750"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Month Matrix (Academic Calendar Layout) */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold font-sans text-gray-801 dark:text-zinc-100">{monthName}</span>
              <span className="text-xs text-gray-400 dark:text-zinc-500 font-mono">UTC Audited Tracking</span>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center py-2 bg-gray-50 dark:bg-zinc-950 rounded-lg text-xs font-medium text-gray-500 dark:text-zinc-400 font-sans">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1 mt-1 font-sans">
              {/* Pad initial offsets: June 1 2026 starts on Monday, so we pad 1 empty space */}
              <div className="p-2 border border-dotted border-gray-100 dark:border-zinc-850 rounded-lg bg-gray-50/30 dark:bg-zinc-950/20 text-xs text-transparent select-none">1</div>
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventForDay(day);
                const isToday = day === 9; // Modern Local date: June 09 from metadata
                
                return (
                  <div 
                    key={day} 
                    className={`min-h-[50px] p-1.5 border border-gray-100 dark:border-zinc-800 rounded-lg flex flex-col justify-between transition-colors ${
                      isToday 
                        ? "bg-amber-50/50 dark:bg-amber-955/15 border-amber-300 dark:border-amber-700/60" 
                        : "bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-850"
                    }`}
                  >
                    <span className={`text-[10px] font-mono font-medium leading-none ${
                      isToday 
                        ? "text-amber-850 dark:text-amber-400 font-bold bg-amber-200/60 dark:bg-amber-950/40 px-1 py-0.5 rounded" 
                        : "text-gray-400 dark:text-zinc-500"
                    }`}>
                      {day}
                    </span>
                    
                    {dayEvents.length > 0 && (
                      <div className="flex flex-col gap-0.5 mt-1">
                        {dayEvents.map(e => (
                          <div 
                            key={e.id}
                            title={`${e.eventType}: ${e.title}`} 
                            className={`text-[8px] truncate px-1 py-0.5 rounded border leading-none font-sans font-semibold uppercase tracking-tighter ${
                              e.eventType === EventType.EXAM ? "bg-red-100 dark:bg-red-950/50 text-red-900 dark:text-red-300 border-red-200 dark:border-red-900/40" :
                              e.eventType === EventType.DEADLINE ? "bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-900/40" :
                              e.eventType === EventType.MEETING ? "bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-900/40" : "bg-emerald-100 dark:bg-emerald-955/50 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
                            }`}
                          >
                            {e.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* List layout of Academic Events */}
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-sans font-semibold text-gray-801 dark:text-zinc-100">Timeline Schedule</h3>
            
            {filteredEvents.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-100 dark:border-zinc-805 rounded-xl bg-gray-50/40 dark:bg-zinc-950/20">
                <AlertCircle className="h-6 w-6 mx-auto text-gray-300 dark:text-zinc-600" />
                <p className="text-xs text-gray-400 dark:text-zinc-500 font-sans mt-2">No department events stored in this category.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((evt) => (
                  <div 
                    id={`evt_item_${evt.id}`}
                    key={evt.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 dark:border-zinc-800 rounded-xl hover:shadow-xs hover:border-gray-200 dark:hover:border-zinc-700 transition-all gap-4 bg-white dark:bg-zinc-900/60"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 p-2.5 rounded-lg flex items-center justify-center">
                        <Clock className="h-4.5 w-4.5 text-gray-500 dark:text-zinc-400" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-sans font-semibold text-gray-900 dark:text-zinc-100">{evt.title}</h4>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-medium border uppercase tracking-wider uppercase ${getBadgeStyles(evt.eventType)}`}>
                            {evt.eventType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 font-sans max-w-lg leading-relaxed">{evt.description}</p>
                        
                        <div className="flex items-center space-x-4 pt-1.5 text-[11px] text-gray-400 dark:text-zinc-500 font-mono">
                          <span>Scheduled: {evt.eventDate}</span>
                          <span>•</span>
                          <span>Coordinator: {evt.creatorName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete action if allowed */}
                    {canManageEvents && (
                      <button
                        id={`btn_delete_evt_${evt.id}`}
                        onClick={() => onDeleteEvent(evt.id)}
                        className="p-1 px-2.5 text-xs text-red-655 border border-transparent rounded hover:border-red-101 hover:bg-red-50 transition-colors flex items-center space-x-1 cursor-pointer self-start sm:self-center text-red-600 dark:text-red-400 hover:border-red-100 dark:hover:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Delete Calendar event"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline font-sans">Delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Manage & Create Events (Admins only) */}
      <div className="space-y-6">
        
        {/* Creation Box */}
        {canManageEvents ? (
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-805 rounded-xl p-6 shadow-xs transition-colors">
            <h3 className="text-sm font-sans font-semibold text-gray-900 dark:text-zinc-100 flex items-center pb-3 border-b border-gray-50 dark:border-zinc-800 mb-4">
              <Plus className="h-4 w-4 mr-1.5 text-gray-500 dark:text-zinc-400" />
              Schedule Department Event
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-mono mb-1">
                  Event Title *
                </label>
                <input
                  id="evt_input_title"
                  type="text"
                  required
                  placeholder="e.g. CSC 303 Final Examination"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:border-gray-900 dark:focus:border-zinc-450 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-mono mb-1">
                  Event Type *
                </label>
                <select
                  id="evt_input_type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:border-gray-900 dark:focus:border-zinc-450 font-sans"
                >
                  {Object.values(EventType).map((type) => (
                    <option key={type} className="bg-white dark:bg-zinc-900" value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-mono mb-1">
                  Target Date *
                </label>
                <input
                  id="evt_input_date"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-910 dark:text-zinc-100 focus:outline-hidden focus:border-gray-900 dark:focus:border-zinc-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-mono mb-1">
                  Description *
                </label>
                <textarea
                  id="evt_input_desc"
                  required
                  rows={3}
                  placeholder="Include venue, compulsory requirements, topics covered, and timing notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-gray-910 dark:text-zinc-100 focus:outline-hidden focus:border-gray-900 dark:focus:border-zinc-400 font-sans leading-relaxed"
                />
              </div>

              {msg && (
                <div id="evt_form_feedback" className={`text-xs p-2.5 rounded-lg border flex items-start space-x-2 ${
                  msg.includes("successfully") 
                    ? "bg-emerald-50 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40" 
                    : "bg-red-50 dark:bg-red-950/25 text-red-800 dark:text-red-400 border-red-100 dark:border-red-900/40"
                }`}>
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{msg}</span>
                </div>
              )}

              <button
                id="evt_submit_btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-gray-900 dark:hover:bg-zinc-200 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Publishing Academic Agenda...</span>
                ) : (
                  <>
                    <Plus className="h-4.5 w-4.5" />
                    <span>Publish Schedule Event</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-amber-50/40 dark:bg-amber-955/15 border border-amber-100 dark:border-amber-900/40 rounded-xl p-5 shadow-xs">
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-amber-800 dark:text-amber-400 flex items-center mb-1">
              <AlertCircle className="h-4 w-4 mr-1 pb-0.5" />
              Administrative Level Required
            </h4>
            <p className="text-xs text-amber-700/80 dark:text-amber-300 leading-relaxed font-sans">
              Only department board coordinators and academic administrators have peer authority to edit calendars or agenda entries in the vault.
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-xs transition-colors">
          <h3 className="text-sm font-sans font-semibold text-gray-801 dark:text-zinc-100 pb-3 border-b border-gray-50 dark:border-zinc-800 mb-3">Academic Guidelines</h3>
          <ul className="text-xs text-gray-500 dark:text-zinc-400 font-sans space-y-2.5 leading-relaxed">
            <li className="flex items-start space-x-1.5">
              <span className="text-gray-900 dark:text-zinc-200 font-bold font-mono">1.</span>
              <span>All Exams must indicate room assignments clearly (e.g. Block C, Hall B).</span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span className="text-gray-900 dark:text-zinc-200 font-bold font-mono">2.</span>
              <span>Publishing an event triggers automatic alerts to all targeted roles.</span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span className="text-gray-900 dark:text-zinc-200 font-bold font-mono">3.</span>
              <span>Deletions to active agendas are recorded in the Secure Audit Trail.</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
