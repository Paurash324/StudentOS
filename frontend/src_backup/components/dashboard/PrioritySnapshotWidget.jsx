import { Flame, ChevronRight, Sparkles, HelpCircle, ArrowRight } from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { Badge } from "../common/Badge";

export function PrioritySnapshotWidget() {
  const { rankedSubjects, setActiveTab, setQuizDraftParams, setChatDraftParams } = useStudent();

  const topPriorities = rankedSubjects.slice(0, 3);

  const handleLaunchQuiz = (sub) => {
    setQuizDraftParams({
      subject: sub.name,
      topic: sub.topics ? sub.topics.split(',')[0].trim() : "High-yield topics"
    });
    setActiveTab("quiz");
  };

  const handleLaunchChat = (sub) => {
    setChatDraftParams({
      subject: sub.name,
      initialQuery: `What are the critical exam concepts and common problem types for ${sub.code} (${sub.name})?`
    });
    setActiveTab("chat");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Flame className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Highest Priority Subjects</h3>
          </div>

          <button
            onClick={() => setActiveTab("priority")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Full Engine</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {topPriorities.map((sub, idx) => (
            <div
              key={sub.id}
              className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                      idx === 0
                        ? "bg-rose-100 text-rose-700"
                        : idx === 1
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {sub.code}: {sub.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {sub.recommendation}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-800 block">
                    {sub.priorityScore}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Index</span>
                </div>
              </div>

              {/* Quick Action Chips */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  Exam in <strong className="text-slate-700">{sub.daysUntil} days</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleLaunchChat(sub)}
                    className="p-1 rounded text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Ask AI Tutor"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleLaunchQuiz(sub)}
                    className="p-1 rounded text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Take Practice Quiz"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Dynamic weighting applied</span>
        <button
          onClick={() => setActiveTab("planner")}
          className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
        >
          <span>Schedule Today's Sessions</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

