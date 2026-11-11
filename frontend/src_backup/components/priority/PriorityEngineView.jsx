import { Flame, Calculator, Sparkles, CalendarClock, BookOpen } from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { PriorityScoreCard } from "./PriorityScoreCard";
import { PriorityChart } from "./PriorityChart";
import { EmptyState } from "../common/EmptyState";

export function PriorityEngineView() {
  const { rankedSubjects, setActiveTab } = useStudent();

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Priority Engine</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
              Algorithm V1
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Dynamic academic ranking combining Exam Proximity, Confidence Gap, Difficulty, and Credits.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("planner")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <CalendarClock className="w-4 h-4" />
          <span>Apply to Smart Planner</span>
        </button>
      </div>

      {/* Formula Explanation Card */}
      <div className="bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-slate-50 border border-indigo-100/90 rounded-2xl p-4.5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              The Pedagogical Priority Formula
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              <code className="text-indigo-800 font-mono font-semibold bg-white/80 px-2 py-0.5 rounded border border-indigo-100">
                Score = (Urgency × 35%) + (Confidence Gap × 30%) + (Difficulty × 20%) + (Credits × 15%)
              </code>
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Subjects with closer exams and lower confidence ratings automatically float to the top, protecting your GPA from surprise exam cramming.
            </p>
          </div>
        </div>
      </div>

      {/* Priority Chart */}
      {rankedSubjects.length > 0 && (
        <PriorityChart rankedSubjects={rankedSubjects} />
      )}

      {/* Ranked Subjects List */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-bold text-slate-900">Ranked Academic Action Queue</h2>
          <span className="text-xs text-slate-500 font-medium">
            {rankedSubjects.length} courses evaluated
          </span>
        </div>

        {rankedSubjects.length > 0 ? (
          <div className="space-y-4">
            {rankedSubjects.map((sub) => (
              <PriorityScoreCard key={sub.id} subject={sub} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No subjects to rank"
            description="Add your enrolled courses to calculate priority scores and get targeted study recommendations."
            actionText="Go to Subject Hub"
            onAction={() => setActiveTab("subjects")}
          />
        )}
      </div>
    </div>
  );
}

