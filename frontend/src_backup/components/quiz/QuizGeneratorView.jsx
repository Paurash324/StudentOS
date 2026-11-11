import { useState, useEffect } from "react";
import { 
  HelpCircle, 
  Sparkles, 
  AlertTriangle, 
  BookOpen, 
  Award, 
  SlidersHorizontal,
  RotateCcw,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { generateQuiz } from "../../services/api";
import { QuizPlayer } from "./QuizPlayer";
import { QuizResultReview } from "./QuizResultReview";

export function QuizGeneratorView() {
  const { 
    subjects, 
    quizDraftParams, 
    setQuizDraftParams, 
    backendHealth, 
    setIsSettingsOpen, 
    quizHistory, 
    saveQuizResult 
  } = useStudent();

  const [selectedSubject, setSelectedSubject] = useState(
    quizDraftParams?.subject || (subjects.length > 0 ? subjects[0].name : "")
  );
  const [topic, setTopic] = useState(quizDraftParams?.topic || "");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [numQuestions, setNumQuestions] = useState(5);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Active quiz session states
  const [activeQuiz, setActiveQuiz] = useState(null); // quiz object
  const [completedResult, setCompletedResult] = useState(null); // { quiz, userAnswers, score, total }

  // Sync draft params from subject card or chat
  useEffect(() => {
    if (quizDraftParams) {
      if (quizDraftParams.subject) setSelectedSubject(quizDraftParams.subject);
      if (quizDraftParams.topic) setTopic(quizDraftParams.topic);
      setQuizDraftParams(null);
    }
  }, [quizDraftParams, setQuizDraftParams]);

  // When subject changes, pre-fill topic if empty
  const handleSubjectChange = (newSubName) => {
    setSelectedSubject(newSubName);
    const found = subjects.find((s) => s.name === newSubName);
    if (found && found.topics && !topic) {
      setTopic(found.topics.split(',')[0].trim());
    }
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!selectedSubject) {
      setErrorMessage("Please select a subject.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const quizData = await generateQuiz({
        subject: selectedSubject,
        topic: topic.trim() || "High-yield course curriculum and exam concepts",
        difficulty,
        num_questions: numQuestions
      });

      setActiveQuiz(quizData);
      setCompletedResult(null);
    } catch (err) {
      console.error("Quiz generation error:", err);
      setErrorMessage(err.message || "Failed to generate quiz. Please ensure Groq API key is configured.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizCompleted = (result) => {
    setCompletedResult(result);
    // Persist to history
    saveQuizResult({
      title: result.quiz.title,
      subject: result.quiz.subject,
      score: result.score,
      total: result.total
    });
  };

  const handleRetake = () => {
    setCompletedResult(null);
  };

  const handleNewQuiz = () => {
    setActiveQuiz(null);
    setCompletedResult(null);
  };

  // If in review mode
  if (completedResult) {
    return (
      <QuizResultReview
        result={completedResult}
        onRetake={handleRetake}
        onNewQuiz={handleNewQuiz}
      />
    );
  }

  // If actively playing quiz
  if (activeQuiz) {
    return (
      <QuizPlayer
        quiz={activeQuiz}
        onComplete={handleQuizCompleted}
        onExit={handleNewQuiz}
      />
    );
  }

  // Otherwise, render Quiz Setup Screen
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Quiz Generator</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              Diagnostic Mode
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Generate custom exam-grade multiple choice questions with pedagogical explanations powered by Groq.
          </p>
        </div>
      </div>

      {/* Groq Key Warning if unconfigured */}
      {!backendHealth.groq_configured && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Groq API Key is needed to generate questions in real-time. Please configure in <code className="font-mono bg-amber-100 px-1 rounded">backend/.env</code>.
            </span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Configure Key
          </button>
        </div>
      )}

      {/* Generator Form */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Subject *
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.code}: {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Specific Topic or Concept
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Raft Consensus, 2PL, TCP Congestion Control"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      difficulty === level
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Question Count
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumQuestions(num)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      numQuestions === num
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !selectedSubject}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-sm shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Generating Exam Questions via Groq AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Practice Quiz</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Past Quiz History */}
      {quizHistory && quizHistory.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">Recent Quiz Diagnostic History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizHistory.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {q.date}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{q.title}</h4>
                  <p className="text-xs text-slate-500">{q.subject}</p>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-base font-black ${
                      q.percentage >= 80
                        ? "text-emerald-600"
                        : q.percentage >= 60
                        ? "text-indigo-600"
                        : "text-amber-600"
                    }`}
                  >
                    {q.score}/{q.total}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {q.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

