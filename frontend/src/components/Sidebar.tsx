import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  CalendarRange, 
  Sparkles, 
  HelpCircle, 
  Settings,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { PageTab, StudentProfile } from '../types';
import { StudentOSLogo } from './StudentOSLogo';

interface SidebarProps {
  currentTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  profile: StudentProfile;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard' as PageTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects' as PageTab, label: 'My Subjects', icon: BookOpen },
    { id: 'planner' as PageTab, label: 'Smart Planner', icon: CalendarRange },
    { id: 'assistant' as PageTab, label: 'AI Study Assistant', icon: Sparkles },
    { id: 'quiz' as PageTab, label: 'Quiz Generator', icon: HelpCircle },
    { id: 'settings' as PageTab, label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tab: PageTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-[#E5E9F2] flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-[#E5E9F2]">
          <div className="flex items-center gap-3">
            <StudentOSLogo size="md" />
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                StudentOS
              </span>
              <span className="text-[11px] text-slate-400 font-medium block">
                Academic Operating System
              </span>
            </div>
          </div>
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium font-sans transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon 
                    className={`w-4.5 h-4.5 transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`} 
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Study Focus Strip */}
        <div className="px-4 py-3.5 mx-4 mb-4 rounded-xl bg-slate-50/90 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs mb-1.5 font-sans">
            <span className="font-semibold text-slate-700">Daily Study Goal</span>
            <span className="font-display font-bold text-slate-900 tabular-nums">4.5 / {profile.dailyGoalHours?.toFixed(1) || '5.0'}h</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(100, Math.round((4.5 / (profile.dailyGoalHours || 5)) * 100))}%` }} 
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-sans">
            <span>Streak: <strong className="font-display font-semibold text-slate-700">12 days</strong></span>
            <span className="font-display font-semibold text-indigo-700">
              {Math.min(100, Math.round((4.5 / (profile.dailyGoalHours || 5)) * 100))}% done
            </span>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="p-4 border-t border-[#E5E9F2] bg-white">
          <button
            onClick={() => handleNavClick('settings')}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-display font-bold text-sm shrink-0 shadow-2xs border border-indigo-200">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <div className="min-w-0 flex-1 font-sans">
                <p className="font-display text-sm font-bold text-slate-900 truncate">
                  {profile.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {profile.major} · {profile.semester}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};
