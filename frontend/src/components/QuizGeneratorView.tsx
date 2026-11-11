import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft,
  Trophy,
  BookOpen,
  CalendarRange,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, QuizQuestion, PageTab } from '../types';
import { generateQuizQuestionsForTopic } from '../services/aiService';

interface QuizGeneratorViewProps {
  subjects: Subject[];
  initialSubjectId?: string;
  onNavigateTab: (tab: PageTab) => void;
  onAddWeakTopicToPlanner: (topicTitle: string, subjectCode: string) => void;
}

export const QuizGeneratorView: React.FC<QuizGeneratorViewProps> = ({
  subjects,
  initialSubjectId = "cs301",
  onNavigateTab,
  onAddWeakTopicToPlanner,
}) => {
  // Configuration state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const [topicInput, setTopicInput] = useState<string>("Shortest Paths & Dynamic Programming");
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Challenging'>('Intermediate');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active quiz state
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
  const [addedTopics, setAddedTopics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
      const sub = subjects.find(s => s.id === initialSubjectId);
      if (sub && sub.topics.length > 0) {
        setTopicInput(sub.topics[2]?.title || sub.topics[0]?.title || "Core Invariants");
      }
    }
  }, [initialSubjectId, subjects]);

  const handleSubjectChange = (newSubjectId: string) => {
    setSelectedSubjectId(newSubjectId);
    const sub = subjects.find(s => s.id === newSubjectId);
    if (sub && sub.topics.length > 0) {
      setTopicInput(sub.topics[0]?.title || "Course Invariants");
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    const currentSubject = subjects.find(s => s.id === selectedSubjectId);
    const subjectCode = currentSubject ? currentSubject.code : "CS 301";

    try {
      const generated = await generateQuizQuestionsForTopic(subjectCode, topicInput, questionCount, difficulty);
      if (generated && generated.length > 0) {
        setActiveQuizQuestions(generated);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setIsQuizSubmitted(false);
        setAddedTopics({});
      } else {
        setGenerationError("Unable to produce questions for this topic. Please try again.");
      }
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      setGenerationError("Error communicating with AI quiz generator. Please check your backend.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isQuizSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    setIsQuizSubmitted(true);
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Safe fallback
    }
  };

  const handleResetQuiz = () => {
    setActiveQuizQuestions(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsQuizSubmitted(false);
  };

  const handleAddWeakTopic = (topic: string, subjectCode: string) => {
    onAddWeakTopicToPlanner(topic, subjectCode);
    setAddedTopics(prev => ({ ...prev, [topic]: true }));
  };

  // Calculate score
  const totalQuestions = activeQuizQuestions ? activeQuizQuestions.length : 0;
  const correctCount = activeQuizQuestions 
    ? activeQuizQuestions.filter((q, idx) => selectedAnswers[idx] === q.correctIndex).length 
    : 0;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const currentSubjectObj = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quiz Generator
          </h1>
          <p className="font-sans text-slate-500 text-sm mt-1 leading-relaxed">
            Produce targeted active-recall diagnostic quizzes to test theoretical understanding and exam readiness.
          </p>
        </div>

        {activeQuizQuestions && (
          <button
            onClick={handleResetQuiz}
            className="font-sans flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 active:scale-[0.99] transition-all shadow-2xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Quiz Config</span>
          </button>
        )}
      </div>

      {/* VIEW A: Quiz Configuration Panel (when no quiz is active) */}
      {!activeQuizQuestions && (
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Custom Diagnostic Generator</h2>
              <p className="font-sans text-xs text-slate-500">Configure subject, topic, and cognitive rigor (Powered by Groq)</p>
            </div>
          </div>

          {generationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{generationError}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Subject Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                Target Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name} ({s.confidence}% current confidence)
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Specific Topic / Focus Area
                </label>
                {currentSubjectObj && (
                  <span className="text-[11px] text-indigo-600 font-semibold">
                    {currentSubjectObj.topics.length} topics on syllabus
                  </span>
                )}
              </div>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g. Dynamic Programming Invariants or Virtual Memory"
                className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 shadow-2xs"
              />

              {/* Quick Topic Chips from Subject */}
              {currentSubjectObj && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <span className="text-[11px] text-slate-400 py-0.5">Syllabus suggestions:</span>
                  {currentSubjectObj.topics.slice(0, 3).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTopicInput(t.title)}
                      className="text-[11px] text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Number of Questions & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Question Count
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 8].map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer font-display ${
                        questionCount === count
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {count} MCQs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Beginner', 'Intermediate', 'Challenging'] as const).map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 text-[11px] font-semibold rounded-xl border transition-all truncate px-1 cursor-pointer ${
                        difficulty === diff
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate CTA Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating || !topicInput.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 transition-all shadow-sm shadow-indigo-600/30 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? "Synthesizing Diagnostic Quiz via Groq..." : "Generate Quiz with AI"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: Active Quiz Taking Mode */}
      {activeQuizQuestions && !isQuizSubmitted && (
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
          {/* Quiz Progress Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="font-display text-xs font-bold text-indigo-600">
                {currentSubjectObj?.code} · {difficulty} Level
              </span>
              <h2 className="font-display text-base font-bold text-slate-900 mt-0.5">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </h2>
            </div>
            <div className="text-right">
              <span className="font-display text-xs font-bold text-slate-600 tabular-nums">
                {Object.keys(selectedAnswers).length} / {totalQuestions} Answered
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          {/* Question Prompt */}
          <div className="py-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Topic: {activeQuizQuestions[currentQuestionIndex].topic}
            </span>
            <p className="font-display text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {activeQuizQuestions[currentQuestionIndex].question}
            </p>
          </div>

          {/* Options Grid */}
          <div className="space-y-3 pt-2">
            {activeQuizQuestions[currentQuestionIndex].options.map((option, optIdx) => {
              const optionLetters = ['A', 'B', 'C', 'D'];
              const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/60'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-lg text-xs font-bold font-display flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}>
                    {optionLetters[optIdx]}
                  </span>
                  <span className="text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation and Submit Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(selectedAnswers).length === 0}
                className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] rounded-xl transition-all shadow-sm shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
              >
                <span>Finish & Review Results</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW C: Score Summary & Detailed Review */}
      {activeQuizQuestions && isQuizSubmitted && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Score Header Card */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Diagnostic Assessment Complete
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight tabular-nums mt-1">
                {scorePercent}%
              </h2>
              <p className="font-sans text-sm font-semibold text-slate-700 mt-1">
                {scorePercent >= 80 ? "Excellent mastery of the underlying theoretical invariants!" :
                 scorePercent >= 60 ? "Solid foundation, with specific review recommended before exam day." :
                 "Key concepts need reinforcement. We recommend adding weak areas to your study planner."}
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-500">
              <span>Correct Answers: <strong className="text-emerald-600 font-display font-bold tabular-nums">{correctCount}</strong></span>
              <span>Total Questions: <strong className="text-slate-800 font-display font-bold tabular-nums">{totalQuestions}</strong></span>
              <span>Subject: <strong className="text-slate-800 font-display font-bold">{currentSubjectObj?.code}</strong></span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleResetQuiz}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 active:scale-[0.99] transition-all shadow-2xs cursor-pointer"
              >
                Retake or Generate New Quiz
              </button>
              <button
                onClick={() => onNavigateTab('planner')}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                Open Smart Planner
              </button>
            </div>
          </div>

          {/* Question by Question Detailed Review */}
          <div className="space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900">
              Detailed Question Analysis & Explanations
            </h3>

            {activeQuizQuestions.map((q, qIdx) => {
              const userAnswer = selectedAnswers[qIdx];
              const isCorrect = userAnswer === q.correctIndex;
              const isWeakAdded = addedTopics[q.topic];

              return (
                <div 
                  key={q.id}
                  className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-display text-xs font-bold text-slate-400">Question {qIdx + 1}</span>
                        <h4 className="font-display text-sm font-bold text-slate-900 mt-0.5 leading-snug">{q.question}</h4>
                      </div>
                    </div>

                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                      isCorrect 
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                        : 'text-rose-700 bg-rose-50 border-rose-200'
                    }`}>
                      {isCorrect ? 'Correct' : 'Needs Review'}
                    </span>
                  </div>

                  {/* Options review */}
                  <div className="space-y-1.5 pl-9">
                    {q.options.map((opt, oIdx) => {
                      const isOptionCorrect = oIdx === q.correctIndex;
                      const isOptionSelected = oIdx === userAnswer;

                      let style = "bg-slate-50 border-slate-200 text-slate-600";
                      if (isOptionCorrect) {
                        style = "bg-emerald-50/80 border-emerald-400 text-emerald-950 font-semibold";
                      } else if (isOptionSelected && !isCorrect) {
                        style = "bg-rose-50/80 border-rose-400 text-rose-950 line-through";
                      }

                      return (
                        <div key={oIdx} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${style}`}>
                          <span>{opt}</span>
                          {isOptionCorrect && (
                            <span className="text-[10px] uppercase font-bold text-emerald-700 shrink-0 ml-2">Correct Answer</span>
                          )}
                          {isOptionSelected && !isCorrect && (
                            <span className="text-[10px] uppercase font-bold text-rose-700 shrink-0 ml-2">Your Answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Callout */}
                  <div className="ml-9 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                    <span className="font-semibold text-slate-800 block">Why this is correct:</span>
                    <p>{q.explanation}</p>
                  </div>

                  {/* Add Weak Topic to Planner */}
                  {!isCorrect && currentSubjectObj && (
                    <div className="ml-9 pt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Topic: <strong className="text-slate-700">{q.topic}</strong>
                      </span>
                      <button
                        onClick={() => handleAddWeakTopic(q.topic, currentSubjectObj.code)}
                        disabled={isWeakAdded}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          isWeakAdded
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        <CalendarRange className="w-3.5 h-3.5" />
                        <span>{isWeakAdded ? "Added to Planner" : "Add to Smart Planner"}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

