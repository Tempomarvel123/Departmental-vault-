import React from "react";
import { User, UserRole } from "../types";
import { 
  BookOpen, LogOut, Shield, GraduationCap, FileText, Calendar, 
  X 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavigationProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Navigation({ 
  currentUser, 
  onLogout, 
  activeTab, 
  setActiveTab,
  unreadCount,
  isCollapsed,
  onToggleCollapse
}: NavigationProps) {

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50";
      case UserRole.DEPARTMENT_ADMIN:
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
      case UserRole.LECTURER:
        return "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50";
      case UserRole.STUDENT:
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50";
      default:
        return "bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700";
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BookOpen },
    { id: "vault", label: "Content Vault", icon: FileText },
    { id: "calendar", label: "Department Calendar", icon: Calendar }
  ];

  // Role-specific secondary items
  if (currentUser.role === UserRole.SUPER_ADMIN) {
    menuItems.push({ id: "users", label: "User Accounts", icon: GraduationCap });
    menuItems.push({ id: "audit", label: "Audit Ledger", icon: Shield });
  } else if (currentUser.role === UserRole.DEPARTMENT_ADMIN) {
    menuItems.push({ id: "users", label: "Course & Program Manager", icon: GraduationCap });
    menuItems.push({ id: "audit", label: "Audit Ledger", icon: Shield });
  } else if (currentUser.role === UserRole.LECTURER) {
    menuItems.push({ id: "audit", label: "Access & Downloads Report", icon: Shield });
  } else if (currentUser.role === UserRole.STUDENT) {
    menuItems.push({ id: "revision", label: "AI Revision Center", icon: GraduationCap });
  }

  const renderNavContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full justify-between p-4 font-sans text-gray-900 dark:text-zinc-100">
      <div className="flex flex-col space-y-4">
        {/* Mobile Header Branding */}
        {isMobile && (
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-200 dark:border-zinc-800">
            <div 
              className="flex items-center space-x-2.5 cursor-pointer select-none" 
              onClick={() => {
                setActiveTab("dashboard");
                onToggleCollapse();
              }}
            >
              <div className="h-7 w-7 rounded-full border-2 border-sky-500 dark:border-sky-400 flex items-center justify-center bg-sky-50 dark:bg-sky-950/20 shadow-xs">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                  SecureVault
                </h1>
                <p className="text-[9px] font-mono text-gray-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                  Academic Portal
                </p>
              </div>
            </div>

            <button
              id="side_drawer_close_btn"
              onClick={onToggleCollapse}
              className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
              title="Close Navigation Drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Menu Navigation Buttons */}
        <nav className="flex flex-col space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                id={`drawer_menu_item_${item.id}`}
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobile) onToggleCollapse(); // Auto-close drawer on mobile selection
                }}
                className={`flex items-center px-3.5 py-2.5 space-x-3 w-full justify-start rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 group relative
                  ${isActive 
                    ? "bg-indigo-600 text-white font-bold shadow-xs" 
                    : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white border border-transparent"
                  }
                `}
                title={item.label}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-gray-500 dark:text-zinc-400 group-hover:text-gray-800 dark:group-hover:text-zinc-200"}`} />
                
                {(!isCollapsed || isMobile) && (
                  <span className="truncate">{item.label}</span>
                )}

                {/* Notification Badge inside menu */}
                {item.id === "dashboard" && unreadCount > 0 && (
                  <span className={`ml-auto text-[10px] py-0.5 px-2 rounded-full font-bold ${isActive ? "bg-white text-indigo-700" : "bg-red-500 text-white"}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Summary & Logout Button */}
      <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 flex flex-col space-y-3">
        {(!isCollapsed || isMobile) && (
          <div className="p-3 bg-gray-50 dark:bg-zinc-950/60 rounded-xl border border-gray-200 dark:border-zinc-800">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate block">
                {currentUser.fullName}
              </span>
              <span className="text-[10px] font-mono text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                {currentUser.matricOrStaffNumber}
              </span>
            </div>
            <div className="mt-2 flex items-center">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border tracking-wider ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
          </div>
        )}

        <button
          id="drawer_logout_btn"
          onClick={() => {
            onLogout();
            if (isMobile) onToggleCollapse();
          }}
          className="group flex items-center px-3.5 py-2.5 space-x-3 justify-start rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer w-full"
          title="Sign Out of Session"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0 text-red-500 group-hover:translate-x-0.5 transition-transform" />
          {(!isCollapsed || isMobile) && (
            <span className="font-sans font-bold">Sign Out</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP STATIC SIDEBAR (Visible on lg screens without backdrop overlay or body blur) */}
      <aside className={`hidden lg:flex flex-col h-[calc(100vh-4rem)] sticky top-16 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 shrink-0 z-20 transition-all duration-200 ${isCollapsed ? "w-20" : "w-64 xl:w-72"}`}>
        {renderNavContent(false)}
      </aside>

      {/* 2. MOBILE OVERLAY DRAWER (Visible on < lg screens when mobile menu is toggled) */}
      <AnimatePresence>
        {!isCollapsed && (
          <div className="lg:hidden">
            {/* Mobile Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs z-40 cursor-pointer"
              onClick={onToggleCollapse}
            />

            {/* Mobile Drawer Panel */}
            <motion.aside
              id="mobile_navigation_drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-72 h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col font-sans"
            >
              {renderNavContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
