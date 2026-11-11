import { CheckCircle2, Circle, CalendarClock, ChevronRight } from "lucide-react";
import { useStudent } from "../../context/StudentContext";

export function TodayTasksWidget() {
  const { dailySchedule, toggleTaskCompleted, setActiveTab } = useStudent();

  const studyBlocks = dailySchedule.filter((b) => b.type === "study").slice(0, 4);
  const completedCount = dailySchedule.filter((b) => b.completed).length;
  const totalCount = dailySchedule.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarClock className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Focus Queue</h3>
              <p className="text-[11px] text-slate-500">
                {completedCount} of {totalCount} scheduled blocks finished
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("planner")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Open Planner</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {studyBlocks.length > 0 ? (
          <div className="space-y-2.5">
            {studyBlocks.map((block) => (
              <div
                key={block.id}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  block.completed
                    ? "bg-slate-50/70 border-slate-200 opacity-60"
                    : "bg-white border-slate-200/80 hover:border-indigo-300"
                }`}
              >
                <button
                  onClick={() => toggleTaskCompleted(block.id)}
                  className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                  title={block.completed ? "Mark incomplete" : "Mark completed"}
                >
                  {block.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700 font-mono">
                      {block.startTime}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: block.subjectColor || "#4f46e5" }}
                    />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {block.subjectCode}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 truncate font-medium ${
                      block.completed ? "line-through text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {block.task}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">No study blocks planned yet.</p>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Organized by Priority Engine</span>
        <button
          onClick={() => setActiveTab("planner")}
          className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
        >
          Customize Hours →
        </button>
      </div>
    </div>
  );
}

