import { Calendar, ChevronRight, Clock, Award } from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { formatExamCountdown, formatDate } from "../../utils/formatters";
import { Badge } from "../common/Badge";

export function UpcomingExamsWidget() {
  const { subjects, setActiveTab } = useStudent();

  // Sort subjects by exam date ascending
  const upcoming = [...subjects]
    .filter((s) => s.examDate)
    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
    .slice(0, 4);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Upcoming Exams Schedule</h3>
          </div>

          <button
            onClick={() => setActiveTab("subjects")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((sub) => {
              const countdown = formatExamCountdown(sub.examDate);
              return (
                <div
                  key={sub.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color || "#4f46e5" }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{sub.code}</span>
                        <span className="text-xs text-slate-500 line-clamp-1">{sub.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{formatDate(sub.examDate)}</span>
                    </div>
                  </div>

                  <Badge
                    variant={
                      countdown.urgency === "critical"
                        ? "rose"
                        : countdown.urgency === "high"
                        ? "amber"
                        : "default"
                    }
                    size="xs"
                  >
                    {countdown.text}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">No exam dates set yet.</p>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 text-right">
        <span className="text-[11px] text-slate-500 font-medium">
          Target: Exam Readiness &gt; 80%
        </span>
      </div>
    </div>
  );
}

