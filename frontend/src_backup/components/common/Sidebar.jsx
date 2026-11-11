import { 
  LayoutDashboard, 
  BookOpen, 
  Flame, 
  CalendarClock, 
  Sparkles, 
  HelpCircle, 
  Settings, 
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";
import { useStudent } from "../../context/StudentContext";

export function Sidebar() {
  const { 
    activeTab, 
    setActiveTab, 
    subjects, 
    rankedSubjects, 
    dailySchedule, 
    preferences, 
    setIsSettingsOpen 
  } = useStudent();

  const urgentSubjectsCount = rankedSubjects.filter(s => s.priorityScore >= 60).length;
  const completedTasksCount = dailySchedule.filter(t => t.completed).length;
  const totalTasksCount = dailySchedule.length;

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: "subjects",
      label: "Subject Hub",
      icon: BookOpen,
      badge: subjects.length
    },
    {
      id: "priority",
      label: "Priority Engine",
      icon: Flame,
      badge: urgentSubjectsCount > 0 ? `${urgentSubjectsCount} urgent` : null,
      badgeVariant: "rose"
    },
    {
      id: "planner",
      label: "Smart Planner",
      icon: CalendarClock,
      badge: totalTasksCount > 0 ? `${completedTasksCount}/${totalTasksCount}` : null
    },
    {
      id: "chat",
      label: "AI Academic Tutor",
      icon: Sparkles,
      badge: "Groq",
      badgeVariant: "indigo"
    },
    {
      id: "quiz",
      label: "Quiz Generator",
      icon: HelpCircle,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 select-none min-h-[calc(100vh-61px)]">
      {/* Navigation List */}
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Workspaces
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-50/80 text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    item.badgeVariant === "rose"
                      ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                      : item.badgeVariant === "indigo"
                      ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer: Daily Progress & Settings */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {/* Daily Goal Mini Card */}
        <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/70">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Daily Study Goal
            </span>
            <span className="font-semibold text-slate-800">{preferences.dailyTargetHours}h</span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0
                )}%`
              }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5">
            <span>{completedTasksCount} of {totalTasksCount} tasks done</span>
            <span className="font-medium text-indigo-600">
              {totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Quick Settings Action */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Preferences & API Key</span>
          </div>
          <span className="text-[10px] text-slate-400">v1.0</span>
        </button>
      </div>
    </aside>
  );
}

