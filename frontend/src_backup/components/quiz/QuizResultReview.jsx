import { Award, CheckCircle2, XCircle, RotateCcw, Plus, Sparkles, HelpCircle } from "lucide-react";
import { useStudent } from "../../context/StudentContext";

export function QuizResultReview({ result, onRetake, onNewQuiz }) {
  const { setActiveTab, setChatDraftParams } = useStudent();
  const { quiz, userAnswers, score, total } = result;
  const percentage = Math.round((score / total) * 100);

  // Identify incorrect questions for AI tutor prompt
  const incorrectQuestions = quiz.questions.filter((q, idx) => userAnswers[idx] !== q.correct_index);

  const handleAskAiAboutMistakes = () => {
    const missedSummaries = incorrectQuestions
      .slice(0, 3)
      .map((q) => `"${q.question}" (Correct answer: ${q.options[q.correct_index]})`)
      .join("; ");

    setChatDraftParams({
      subject: quiz.subject,
      initialQuery: `I just completed a practice quiz on "${quiz.topic}" and missed questions on: ${missedSummaries}. Could you explain these core concepts and how to solve similar problems on exams?`
    });
    setActiveTab("chat");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Score Summary Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs text-center space-y-4">
        <div
          className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
            percentage >= 80
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : percentage >= 60
              ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
              : "bg-amber-50 text-amber-600 border border-amber-200"
          }`}
        >
          <Award className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {quiz.subject} • Diagnostic Quiz Complete
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-1">
            {score} / {total} Correct
          </h2>
          <p className="text-sm font-semibold text-slate-600 mt-0.5">
            Score: <span className="text-indigo-600">{percentage}%</span> •{" "}
            {percentage >= 80
              ? "Exemplary Mastery! 🌟"
              : percentage >= 60
              ? "Solid Understanding! 👍"
              : "High-Yield Review Recommended 📚"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onRetake}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Quiz</span>
          </button>

          {incorrectQuestions.length > 0 && (
            <button
              onClick={handleAskAiAboutMistakes}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI About Mistakes ({incorrectQuestions.length})</span>
            </button>
          )}

          <button
            onClick={onNewQuiz}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Quiz</span>
          </button>
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Comprehensive Answers & Explanations</h3>

        {quiz.questions.map((q, qIdx) => {
          const userChoice = userAnswers[qIdx];
          const isCorrect = userChoice === q.correct_index;
          const letters = ["A", "B", "C", "D"];

          return (
            <div
              key={q.id || qIdx}
              className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 ${
                isCorrect ? "border-emerald-200" : "border-rose-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`p-1 rounded-lg shrink-0 mt-0.5 ${
                      isCorrect ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </span>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Question {qIdx + 1}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">{q.question}</h4>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isCorrect
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {isCorrect ? "+1 Correct" : "Incorrect"}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isUserSelection = userChoice === optIdx;
                  const isCorrectChoice = q.correct_index === optIdx;

                  let optClass = "bg-slate-50 border-slate-200 text-slate-700";
                  if (isCorrectChoice) {
                    optClass = "bg-emerald-50/80 border-emerald-400 text-emerald-950 font-semibold";
                  } else if (isUserSelection && !isCorrect) {
                    optClass = "bg-rose-50/80 border-rose-400 text-rose-950 line-through";
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optClass}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-white border border-slate-200">
                          {letters[optIdx]}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {isCorrectChoice && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          Correct Answer
                        </span>
                      )}
                      {isUserSelection && !isCorrect && (
                        <span className="text-[10px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                          Your Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pedagogical Explanation Box */}
              {q.explanation && (
                <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 text-xs">
                  <span className="font-bold text-slate-800 block mb-1">
                    Pedagogical Explanation:
                  </span>
                  <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

