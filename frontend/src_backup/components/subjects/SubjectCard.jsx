import { useState } from "react";
import { 
  Calendar, 
  Clock, 
  HelpCircle, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Award,
  AlertCircle,
  MoreVertical
} from "lucide-react";
import { formatExamCountdown, formatDate } from "../../utils/formatters";
import { calculateSubjectPriority } from "../../utils/priorityCalculator";
import { useStudent } from "../../context/StudentContext";
import { Badge } from "../common/Badge";

export function SubjectCard({ subject, onEdit }) {
  const { deleteSubject, setActiveTab, setQuizDraftParams, setChatDraftParams } = useStudent();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const countdown = formatExamCountdown(subject.examDate);
  const priority = calculateSubjectPriority(subject);
  const progressPercent = Math.min(
    100,
    Math.round(((subject.hoursStudied || 0) / (subject.targetHours || 25)) * 100)
  );

  const handleLaunchQuiz = () => {
    setQuizDraftParams({
      subject: subject.name,
      topic: subject.topics ? subject.topics.split(',')[0].trim() : "Core syllabus"
    });
    setActiveTab("quiz");
  };

  const handleLaunchChat = () => {
    setChatDraftParams({
      subject: subject.name,
      initialQuery: `Can you break down the most important exam topics for ${subject.code} (${subject.name}) and suggest high-yield revision strategies?`
    });
    setActiveTab("chat");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between relative group">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: subject.color || "#4f46e5" }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {subject.code}
            </span>
            <Badge variant="default" size="xs">
              {subject.credits} Credits
            </Badge>
          </div>

          {/* Exam Countdown Pill */}
          <Badge
            variant={
              countdown.urgency === "critical"
                ? "rose"
                : countdown.urgency === "high"
                ? "amber"
                : countdown.urgency === "medium"
                ? "blue"
                : "default"
            }
            size="xs"
          >
            <Calendar className="w-3 h-3" />
            {countdown.text}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {subject.name}
        </h3>

        {/* Topics Preview */}
        {subject.topics && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {subject.topics}
          </p>
        )}
      </div>

      {/* Middle: Metrics & Sliders */}
      <div className="my-4 space-y-3 pt-3 border-t border-slate-100">
        {/* Difficulty & Confidence Matrix */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Difficulty</span>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((d) => (
                <div
                  key={d}
                  className={`h-1.5 flex-1 rounded-full ${
                    d <= subject.difficulty ? "bg-amber-500" : "bg-slate-200"
                  }`}
                />
              ))}
              <span className="text-[11px] font-bold text-slate-700 ml-1">
                {subject.difficulty}/5
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Confidence</span>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((c) => (
                <div
                  key={c}
                  className={`h-1.5 flex-1 rounded-full ${
                    c <= subject.confidence ? "bg-indigo-600" : "bg-slate-200"
                  }`}
                />
              ))}
              <span className="text-[11px] font-bold text-slate-700 ml-1">
                {subject.confidence}/5
              </span>
            </div>
          </div>
        </div>

        {/* Hours Progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Hours Studied: <strong className="text-slate-800">{subject.hoursStudied || 0}h</strong>
            </span>
            <span className="text-slate-400">Target: {subject.targetHours || 25}h</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: subject.color || "#4f46e5"
              }}
            />
          </div>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400">Priority Index</span>
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                priority.priorityScore >= 75
                  ? "bg-rose-500"
                  : priority.priorityScore >= 60
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            {priority.priorityScore} / 100 ({priority.tier})
          </span>
        </div>
      </div>

      {/* Card Footer: Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLaunchChat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
            title="Ask AI Tutor questions about this subject"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ask AI</span>
          </button>

          <button
            onClick={handleLaunchQuiz}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Generate custom practice quiz with AI"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>Quiz</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(subject)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Edit Subject"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {showConfirmDelete ? (
            <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
              <span className="text-[10px] text-rose-700 font-semibold">Delete?</span>
              <button
                onClick={() => deleteSubject(subject.id)}
                className="text-[10px] text-rose-700 font-bold hover:underline cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="text-[10px] text-slate-500 hover:underline cursor-pointer ml-1"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete Subject"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

