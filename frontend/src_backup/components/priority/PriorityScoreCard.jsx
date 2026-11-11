import { Calendar, HelpCircle, Sparkles, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "../common/Badge";
import { formatExamCountdown } from "../../utils/formatters";
import { useStudent } from "../../context/StudentContext";

export function PriorityScoreCard({ subject }) {
  const { setActiveTab, setQuizDraftParams, setChatDraftParams } = useStudent();
  const countdown = formatExamCountdown(subject.examDate);

  const handleQuiz = () => {
    setQuizDraftParams({
      subject: subject.name,
      topic: subject.topics ? subject.topics.split(',')[0].trim() : "High-yield topics"
    });
    setActiveTab("quiz");
  };

  const handleChat = () => {
    setChatDraftParams({
      subject: subject.name,
      initialQuery: `What are the critical, high-yield exam concepts I should prioritize right now for ${subject.code} (${subject.name})?`
    });
    setActiveTab("chat");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-sm transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Rank & Title */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
              subject.rank === 1
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : subject.rank === 2
                ? "bg-amber-50 text-amber-600 border border-amber-200"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            #{subject.rank}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {subject.code}
              </span>
              <h3 className="text-base font-bold text-slate-900">{subject.name}</h3>
              <Badge
                variant={
                  subject.priorityScore >= 75
                    ? "rose"
                    : subject.priorityScore >= 60
                    ? "amber"
                    : subject.priorityScore >= 40
                    ? "blue"
                    : "emerald"
                }
                size="xs"
              >
                {subject.tier}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5">
              <span>{subject.recommendation}</span>
            </p>
          </div>
        </div>

        {/* Right: Score Pill & Action Buttons */}
        <div className="flex items-center gap-4 lg:self-center">
          {/* Priority Score Gauge */}
          <div className="text-right">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {subject.priorityScore}
              <span className="text-xs text-slate-400 font-normal"> / 100</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Priority Score
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleChat}
              className="p-2 rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
              title="Tutor me on this subject"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={handleQuiz}
              className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Take a practice quiz"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Factor Breakdown Bars */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Urgency Factor */}
        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3 h-3 text-slate-400" /> Exam Urgency
            </span>
            <span className="font-semibold text-slate-700">{countdown.text}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-rose-500"
              style={{ width: `${subject.urgencyFactor}%` }}
            />
          </div>
        </div>

        {/* Confidence Deficit */}
        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-medium">Confidence Gap</span>
            <span className="font-semibold text-slate-700">{subject.confidence}/5</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-amber-500"
              style={{ width: `${subject.confidenceDeficitFactor}%` }}
            />
          </div>
        </div>

        {/* Difficulty */}
        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-medium">Difficulty</span>
            <span className="font-semibold text-slate-700">{subject.difficulty}/5</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-indigo-600"
              style={{ width: `${subject.difficultyFactor}%` }}
            />
          </div>
        </div>

        {/* Credits */}
        <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span className="flex items-center gap-1 font-medium">Credit Weight</span>
            <span className="font-semibold text-slate-700">{subject.credits} Credits</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-blue-600"
              style={{ width: `${subject.creditFactor}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

