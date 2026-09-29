import React, { useState } from "react";
import { AuditLog, DownloadLog, User, UserRole } from "../types";
import { Shield, Search, ArrowDownToLine, RefreshCw, Smartphone, Monitor, Info, CheckCircle2 } from "lucide-react";

interface AuditTrailsProps {
  currentUser: User;
  auditLogs: AuditLog[];
  downloadLogs: DownloadLog[];
  onRefresh: () => void;
}

export default function AuditTrails({
  currentUser,
  auditLogs,
  downloadLogs,
  onRefresh
}: AuditTrailsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [auditFilter, setAuditFilter] = useState("All");
  const [activeSubTab, setActiveSubTab] = useState<"system" | "downloads">("system");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 15;

  const isSuperOrAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.DEPARTMENT_ADMIN;

  // Render browser / OS device icon
  const getDeviceIcon = (deviceStr: string) => {
    if (deviceStr.toLowerCase().includes("mobi") || deviceStr.toLowerCase().includes("android") || deviceStr.toLowerCase().includes("phone")) {
      return <Smartphone className="h-3.5 w-3.5 text-gray-400" title={deviceStr} />;
    }
    return <Monitor className="h-3.5 w-3.5 text-gray-400" title={deviceStr} />;
  };

  // Filter System Audit Logs
  const filteredAudits = auditLogs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (auditFilter === "All") return matchesSearch;
    return matchesSearch && log.userRole === auditFilter;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredAudits.length / logsPerPage);
  const paginatedAudits = filteredAudits.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  return (
    <div className="space-y-6">
      
      {/* Header with Sub-tabs and Info Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-xs transition-with-colors">
        <div>
          <h2 className="text-lg font-sans font-semibold text-gray-900 dark:text-zinc-100 flex items-center">
            <Shield className="h-5 w-5 mr-1.5 text-gray-500 dark:text-zinc-400" />
            Security & Audit Ledger
          </h2>
          <p className="text-xs text-gray-550 dark:text-zinc-400 font-sans mt-0.5">
            Cryptographically logged transaction logs tracking auth, downloads, and peer review approvals.
          </p>
        </div>

        {/* Sync Trigger and Ledger Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="bg-gray-100 dark:bg-zinc-950 p-0.5 rounded-lg flex shrink-0">
            <button
              onClick={() => { setActiveSubTab("system"); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeSubTab === "system" ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-xs" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              System Transactions ({filteredAudits.length})
            </button>
            <button
              onClick={() => { setActiveSubTab("downloads"); }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeSubTab === "downloads" ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-xs" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              Downloads Counter ({downloadLogs.length})
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 text-gray-500 dark:text-zinc-450 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-800 cursor-pointer self-start"
            title="Refresh Ledger Logs From Server"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeSubTab === "system" ? (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs transition-colors">
          
          {/* Table Toolbar controls */}
          <div className="p-4 bg-gray-50 dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-805 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="audit_search_input"
                type="text"
                placeholder="Search actor or details..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs pl-9 pr-3 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-hidden focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 dark:text-zinc-500 font-sans">Role Context Filter:</span>
              <select
                id="audit_role_filter"
                value={auditFilter}
                onChange={(e) => { setAuditFilter(e.target.value); setCurrentPage(1); }}
                className="text-xs p-1.5 border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-150 focus:outline-hidden focus:border-indigo-500 font-sans"
              >
                <option value="All" className="bg-white dark:bg-zinc-900 text-gray-900">All Roles</option>
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role} className="bg-white dark:bg-zinc-900 text-gray-900">{role}</option>
                ))}
              </select>
            </div>
          </div>

          {!isSuperOrAdmin ? (
            <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-950/40 rounded-xl my-4">
              <Info className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
              <h3 className="text-sm font-sans font-semibold text-gray-900 dark:text-zinc-100 mt-2">Privacy & Classification Notice</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-md mx-auto mt-1 font-sans">
                You are restricted from listing administrative log entities. Your own access parameters remain recorded by the system for security validation.
              </p>
            </div>
          ) : (
            <>
              {/* Logs Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-zinc-950/40 border-b border-gray-100 dark:border-zinc-805 text-[10px] font-mono text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                      <th className="px-6 py-3.5 font-medium">Actor & Role</th>
                      <th className="px-6 py-3.5 font-medium">Action Event</th>
                      <th className="px-6 py-3.5 font-medium">Detailed Parameters</th>
                      <th className="px-6 py-3.5 font-medium">Remote IP / Device</th>
                      <th className="px-6 py-3.5 font-medium text-right font-mono">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs font-sans text-gray-900 dark:text-zinc-250">
                    {paginatedAudits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-400 dark:text-zinc-500 font-sans">
                          No audited logs found matching query filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedAudits.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/40 dark:hover:bg-zinc-850/40 transition-colors">
                          <td className="px-6 py-4.5">
                            <div className="font-semibold text-gray-900 dark:text-zinc-100 font-sans">{log.userName}</div>
                            <div className="text-[10px] font-mono text-gray-500 dark:text-zinc-500 uppercase tracking-wider">{log.userRole}</div>
                          </td>
                          <td className="px-6 py-4.5">
                            <span className="inline-flex items-center space-x-1 font-semibold text-gray-900 dark:text-zinc-200">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-550 dark:text-emerald-400" />
                              <span>{log.action}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-gray-500 dark:text-zinc-400 max-w-xs truncate leading-relaxed" title={log.details}>
                            {log.details || "—"}
                          </td>
                          <td className="px-6 py-4.5">
                            <div className="font-mono text-[11px] text-gray-700 dark:text-zinc-350">{log.ipAddress}</div>
                            <div className="flex items-center space-x-1 mt-0.5">
                              {getDeviceIcon(log.device)}
                              <span className="text-[10px] text-gray-400 dark:text-zinc-500 max-w-[100px] truncate">{log.device}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-right font-mono text-gray-400 dark:text-zinc-500 text-[11px]">
                            {new Date(log.timestamp).toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit"
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-zinc-805 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-950/20">
                  <span className="text-xs text-gray-500 dark:text-zinc-400 font-sans font-medium">
                    Showing {(currentPage - 1) * logsPerPage + 1} to {Math.min(currentPage * logsPerPage, filteredAudits.length)} of {filteredAudits.length} entries
                  </span>
                  <div className="flex space-x-1 font-sans">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="px-2.5 py-1 text-xs border border-gray-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-805 cursor-pointer disabled:opacity-40"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-2.5 py-1 text-xs border rounded-md cursor-pointer ${
                          currentPage === i + 1 
                            ? "bg-gray-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-gray-950 dark:border-zinc-100 font-semibold" 
                            : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-450 border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-805"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-2.5 py-1 text-xs border border-gray-200 dark:border-zinc-805 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-805 cursor-pointer disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* DOWNLOAD LOGS CONTAINER */
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs transition-colors">
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-sans font-semibold text-gray-950 dark:text-zinc-100 flex items-center">
                <ArrowDownToLine className="h-4 w-4 mr-2 text-gray-550 dark:text-zinc-400" />
                Lecturer Download Verification Trails
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-sans mt-0.5">Auditable download records mapping student telemetry</p>
            </div>
            <span className="text-[10px] font-mono text-gray-450 dark:text-zinc-500 uppercase tracking-widest bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 px-2.5 py-1 rounded">
              Auditable Integrity Tracking Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 text-[10px] font-mono text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5 font-medium">Student Name</th>
                  <th className="px-6 py-3.5 font-medium">Material Downloaded</th>
                  <th className="px-6 py-3.5 font-medium">Course Code</th>
                  <th className="px-6 py-3.5 font-medium text-right font-mono">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs font-sans text-gray-900 dark:text-zinc-200">
                {downloadLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-400 dark:text-zinc-500 font-sans">
                      No material file downloading events registered in the database yet.
                    </td>
                  </tr>
                ) : (
                  downloadLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/40 dark:hover:bg-zinc-850/40 transition-colors">
                      <td className="px-6 py-4.5 font-semibold text-gray-900 dark:text-zinc-100">{log.studentName}</td>
                      <td className="px-6 py-4.5 text-gray-600 dark:text-zinc-400 font-medium">
                        <span className="flex items-center space-x-1.5 text-gray-800 dark:text-zinc-100">
                          <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{log.materialTitle}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="bg-gray-100 dark:bg-zinc-850 text-gray-700 dark:text-zinc-300 px-2 py-0.5 rounded font-mono text-[10px] font-medium border border-gray-250 dark:border-zinc-700">
                          {log.courseCode}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right font-mono text-gray-400 dark:text-zinc-500 text-[11px]">
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
