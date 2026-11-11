import { CheckCircle2, Circle, Clock, Coffee, Sparkles, HelpCircle, ArrowRight } from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { Badge } from "../common/Badge";

export function ScheduleTimeline({ onSelectBlockForTimer }) {
  const { dailySchedule, toggleTaskCompleted, setActiveTab, setQuizDraftParams, setChatDraftParams } = useStudent();

  if (!dailySchedule || dailySchedule.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
        <p className="text-sm text-slate-500">No scheduled study blocks generated for today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dailySchedule.map((block, index) => {
        const isBreak = block.type === "break";

        return (
          <div
            key={block.id || index}
            className={`rounded-2xl border transition-all duration-200 p-4 ${
              block.completed
                ? "bg-slate-50/70 border-slate-200 opacity-60"
                : isBreak
                ? "bg-amber-50/30 border-amber-200/60"
                : "bg-white border-slate-200/90 shadow-xs hover:border-indigo-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Checkbox and Info */}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTaskCompleted(block.id)}
                  className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                  title={block.completed ? "Mark incomplete" : "Mark completed"}
                >
                  {block.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Time Window */}
                    <span className="text-xs font-bold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                      {block.startTime} – {block.endTime}
                    </span>

                    {/* Block Type / Subject Code */}
                    {isBreak ? (
                      <Badge variant="amber" size="xs">
                        <Coffee className="w-3 h-3" /> Break ({block.duration}m)
                      </Badge>
                    ) : (
                      <>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: block.subjectColor || "#4f46e5" }}
                        />
                        <span className="text-xs font-bold text-slate-800">
                          {block.subjectCode}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({block.duration} min study)
                        </span>
                      </>
                    )}
                  </div>

                  <p
                    className={`text-sm mt-1.5 font-medium ${
                      block.completed ? "line-through text-slate-400" : "text-slate-800"
                    }`}
                  >
                    {block.task}
                  </p>
                </div>
              </div>

              {/* Right Quick Actions */}
              {!isBreak && !block.completed && (
                <div className="flex items-center gap-1 shrink-0">
                  {onSelectBlockForTimer && (
                    <button
                      onClick={() => onSelectBlockForTimer(block)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                      title="Load this block into the live focus timer"
                    >
                      Focus
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

