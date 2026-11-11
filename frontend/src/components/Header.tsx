import React from 'react';
import { 
  Menu, 
  Timer, 
  Sparkles, 
  CalendarDays,
  Bell
} from 'lucide-react';
import { PageTab } from '../types';
import { StudentOSLogo } from './StudentOSLogo';

interface HeaderProps {
  currentTab: PageTab;
  onOpenMobileNav: () => void;
  onOpenFocusTimer: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileNav,
  onOpenFocusTimer,
  unreadCount = 2,
}) => {
  const getTabTitle = (tab: PageTab) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'subjects': return 'My Subjects';
      case 'planner': return 'Smart Planner';
      case 'assistant': return 'AI Study Assistant';
      case 'quiz': return 'Quiz Generator';
      case 'settings': return 'Settings & Preferences';
      default: return 'Dashboard';
    }
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 h-18 bg-white/95 backdrop-blur-xs border-b border-[#E5E9F2] px-6 flex items-center justify-between gap-4">
      {/* Left zone: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm font-sans">
          <StudentOSLogo size="sm" className="md:hidden" />
          <span className="text-slate-400 font-medium hidden sm:inline">StudentOS</span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">/</span>
          <span className="font-display font-bold text-slate-900 tracking-tight text-base sm:text-sm">
            {getTabTitle(currentTab)}
          </span>
        </div>
      </div>

      {/* Right zone: Date & Primary Focus Action */}
      <div className="flex items-center gap-3">
        {/* Date display */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium font-sans text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayDateString}</span>
        </div>

        {/* Focus Timer CTA Button */}
        <button
          onClick={onOpenFocusTimer}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold font-sans text-indigo-700 bg-indigo-50/90 border border-indigo-200/80 rounded-xl hover:bg-indigo-100/90 active:scale-[0.99] transition-all whitespace-nowrap shadow-2xs cursor-pointer"
        >
          <Timer className="w-4 h-4 text-indigo-600 stroke-[2.2]" />
          <span>Focus Mode</span>
          <span className="font-display font-bold text-[11px] bg-white text-indigo-700 px-1.5 py-0.5 rounded-md border border-indigo-200/70 tabular-nums">
            45m
          </span>
        </button>
      </div>
    </header>
  );
};
