import { useState } from "react";
import { 
  CalendarClock, 
  Sparkles, 
  RefreshCw, 
  SlidersHorizontal, 
  CheckCircle2, 
  Flame,
  ArrowRight
} from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { ScheduleTimeline } from "./ScheduleTimeline";
import { StudyTimer } from "./StudyTimer";

export function SmartPlannerView() {
  const { 
    preferences, 
    setPreferences, 
    dailySchedule, 
    regenerateSchedule, 
    rankedSubjects 
  } = useStudent();

  const [hours, setHours] = useState(preferences.dailyTargetHours || 4);
  const [blockMins, setBlockMins] = useState(preferences.preferredBlockMinutes || 45);
  const [breakMins, setBreakMins] = useState(preferences.breakMinutes || 15);
  const [startTime, setStartTime] = useState(preferences.startTime || "09:00");
  const [activeTimerSubject, setActiveTimerSubject] = useState(null);

  const completedCount = dailySchedule.filter((b) => b.completed).length;
  const totalCount = dailySchedule.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleRegenerate = () => {
    // Save preferences
    setPreferences((prev) => ({
      ...prev,
      dailyTargetHours: hours,
      preferredBlockMinutes: blockMins,
      breakMinutes: breakMins,
      startTime
    }));

    // Trigger regeneration
    regenerateSchedule(hours);
  };

  const handleSelectBlockForTimer = (block) => {
    const matchingSubject = rankedSubjects.find((s) => s.id === block.subjectId);
    if (matchingSubject) {
      setActiveTimerSubject(matchingSubject);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smart Planner</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              Auto-Sequencer
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Allocates your available study hours into realistic, high-yield focus blocks ordered by exam priority.
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Regenerate Daily Schedule</span>
        </button>
      </div>

      {/* Configuration & Preferences Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
          <span>Daily Schedule Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Daily Hours Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Available Study Time</span>
              <span className="text-indigo-600 font-bold">{hours} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>1 hr</span>
              <span>4 hrs</span>
              <span>8 hrs</span>
            </div>
          </div>

          {/* Block Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Focus Block Duration
            </label>
            <select
              value={blockMins}
              onChange={(e) => setBlockMins(Number(e.target.value))}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="25">25 mins (Pomodoro)</option>
              <option value="45">45 mins (Balanced Standard)</option>
              <option value="60">60 mins (Intensive Deep Work)</option>
            </select>
          </div>

          {/* Break Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rest Break Duration
            </label>
            <select
              value={breakMins}
              onChange={(e) => setBreakMins(Number(e.target.value))}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="5">5 mins</option>
              <option value="10">10 mins</option>
              <option value="15">15 mins (Recommended)</option>
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Starting Time Today
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="08:00">08:00 AM (Early Bird)</option>
              <option value="09:00">09:00 AM (Morning Standard)</option>
              <option value="10:00">10:00 AM</option>
              <option value="13:00">01:00 PM (Afternoon)</option>
              <option value="16:00">04:00 PM (Post-Classes)</option>
              <option value="19:00">07:00 PM (Night Owl)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Today's Execution Progress: {completedCount} of {totalCount} Blocks Completed
            </h4>
            <p className="text-xs text-slate-500">
              Targeting {hours} planned hours across your highest-ranked priority subjects
            </p>
          </div>
        </div>

        <div className="w-full sm:w-48">
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
            <span>Completion</span>
            <span className="text-indigo-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Timeline + Live Focus Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline (2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Today's Focus Timeline</h2>
            <span className="text-xs text-slate-500">Click checkboxes to track completion</span>
          </div>
          <ScheduleTimeline onSelectBlockForTimer={handleSelectBlockForTimer} />
        </div>

        {/* Live Timer Widget (1 Column) */}
        <div>
          <div className="sticky top-20">
            <StudyTimer activeSubject={activeTimerSubject} />
          </div>
        </div>
      </div>
    </div>
  );
}

