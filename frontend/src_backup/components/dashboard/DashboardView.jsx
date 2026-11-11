import { Sparkles, CalendarClock, BookOpen, Flame, HelpCircle } from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { StatsOverview } from "./StatsOverview";
import { UpcomingExamsWidget } from "./UpcomingExamsWidget";
import { PrioritySnapshotWidget } from "./PrioritySnapshotWidget";
import { StudyActivityChart } from "./StudyActivityChart";
import { TodayTasksWidget } from "./TodayTasksWidget";

export function DashboardView() {
  const { preferences, setActiveTab, backendHealth, setIsSettingsOpen } = useStudent();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI-Driven Academic Excellence</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {preferences.studentName.split(" ")[0]}!
          </h1>
          <p className="text-sm text-indigo-200/90 leading-relaxed">
            Your personalized study plan has been updated by the Priority Engine. Focus on your highest-yield exam subjects today to maximize your semester GPA.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => setActiveTab("planner")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 text-xs font-bold hover:bg-indigo-50 shadow-xs transition-colors cursor-pointer"
          >
            <CalendarClock className="w-4 h-4 text-indigo-600" />
            <span>Start Today's Plan</span>
          </button>

          <button
            onClick={() => setActiveTab("quiz")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 border border-indigo-500/30 text-white text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Practice AI Quiz</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <StatsOverview />

      {/* Row 1: Upcoming Exams & Priority Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingExamsWidget />
        <PrioritySnapshotWidget />
      </div>

      {/* Row 2: Velocity Chart & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudyActivityChart />
        <TodayTasksWidget />
      </div>
    </div>
  );
}

