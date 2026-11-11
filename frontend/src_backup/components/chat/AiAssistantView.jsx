import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Sparkles, 
  Trash2, 
  BookOpen, 
  AlertTriangle, 
  Settings, 
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Zap,
  FileText,
  BookOpenCheck
} from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { sendChatMessage } from "../../services/api";
import { ChatMessage } from "./ChatMessage";

const SUGGESTED_PROMPTS = [
  "Explain the CAP Theorem and its real-world trade-offs in distributed databases.",
  "Give me an exam-ready breakdown of Raft leader election with common pitfalls.",
  "What is the difference between 2PL (Two-Phase Locking) and Strict 2PL in DBMS?",
  "How does TCP Reno handle fast recovery compared to TCP Tahoe?",
  "Provide a memory mnemonic to easily remember the 7 OSI model layers."
];

const ANSWER_STYLES = [
  {
    id: "quick",
    label: "Quick Answer",
    icon: Zap,
    description: "Short, direct explanations in 1–3 paragraphs without unnecessary filler.",
    badgeClass: "text-amber-700 bg-amber-50 border-amber-200"
  },
  {
    id: "exam_ready",
    label: "Exam Ready",
    icon: FileText,
    description: "Structured college-level answers with definitions, numbered points, examples and conclusions.",
    badgeClass: "text-indigo-700 bg-indigo-50 border-indigo-200"
  },
  {
    id: "detailed",
    label: "Detailed Explanation",
    icon: BookOpenCheck,
    description: "Step-by-step teaching with examples, applications, comparison tables and revision summaries.",
    badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200"
  }
];

export function AiAssistantView() {
  const { 
    subjects, 
    chatDraftParams, 
    setChatDraftParams, 
    backendHealth, 
    setIsSettingsOpen, 
    setActiveTab, 
    setQuizDraftParams 
  } = useStudent();

  const [selectedSubject, setSelectedSubject] = useState(
    chatDraftParams?.subject || (subjects.length > 0 ? subjects[0].name : "General Academic")
  );

  // Answer Style: default to exam_ready, persisted in localStorage
  const [answerStyle, setAnswerStyle] = useState(() => {
    try {
      return localStorage.getItem("studentos_chat_style_v1") || "exam_ready";
    } catch {
      return "exam_ready";
    }
  });

  const handleStyleChange = (styleId) => {
    setAnswerStyle(styleId);
    try {
      localStorage.setItem("studentos_chat_style_v1", styleId);
    } catch (e) {
      console.error(e);
    }
  };

  const [inputPrompt, setInputPrompt] = useState(chatDraftParams?.initialQuery || "");
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("studentos_chat_history_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return [
      {
        id: "msg-welcome",
        role: "assistant",
        content: "Hello! I am your StudentOS AI Academic Tutor, powered by Groq. Select your preferred course and answer style above, then ask any concept question, proof, or exam problem to get started.",
        subject: null,
        answerStyle: "exam_ready"
      }
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const messagesEndRef = useRef(null);

  // Sync draft params if navigating from another view
  useEffect(() => {
    if (chatDraftParams) {
      if (chatDraftParams.subject) setSelectedSubject(chatDraftParams.subject);
      if (chatDraftParams.initialQuery) setInputPrompt(chatDraftParams.initialQuery);
      setChatDraftParams(null);
    }
  }, [chatDraftParams, setChatDraftParams]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem("studentos_chat_history_v1", JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      subject: selectedSubject !== "General Academic" ? selectedSubject : null,
      answerStyle
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt("");
    setIsLoading(true);

    try {
      // Map messages for backend API
      const apiMessages = newMessages
        .filter((m) => m.id !== "msg-welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendChatMessage({
        messages: apiMessages,
        subject: selectedSubject !== "General Academic" ? selectedSubject : null,
        answer_style: answerStyle
      });

      const assistantMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: res.reply,
        subject: selectedSubject !== "General Academic" ? selectedSubject : null,
        answerStyle: res.answer_style || answerStyle
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setErrorMessage(err.message || "Failed to generate AI response.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "msg-welcome",
        role: "assistant",
        content: "Chat history cleared. How can I assist your college studies today?",
        subject: null,
        answerStyle
      }
    ]);
  };

  const handleTransferToQuiz = (topic) => {
    setQuizDraftParams({
      subject: selectedSubject !== "General Academic" ? selectedSubject : subjects[0]?.name || "Computer Science",
      topic: topic || "Recent discussion topics"
    });
    setActiveTab("quiz");
  };

  const currentStyleConfig = ANSWER_STYLES.find((s) => s.id === answerStyle) || ANSWER_STYLES[1];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-3">
      {/* Top Header & Context Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">AI Academic Tutor</h1>
            <p className="text-xs text-slate-500">
              High-speed reasoning via Groq ({backendHealth.groq_model || "Llama 3.3 70B"})
            </p>
          </div>
        </div>

        {/* Course Context Picker & Clear Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="General Academic">General Academic Tutor</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.code}: {sub.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Answer Style Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Answer Style:
          </span>

          <div className="inline-flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 gap-1">
            {ANSWER_STYLES.map((style) => {
              const Icon = style.icon;
              const isSelected = answerStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleStyleChange(style.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                  title={style.description}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{style.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Style helper info */}
        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
          <span className="line-clamp-1">{currentStyleConfig.description}</span>
        </div>
      </div>

      {/* Groq Key Warning Banner if unconfigured */}
      {!backendHealth.groq_configured && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Groq API Key is not yet configured in <code className="font-mono bg-amber-100 px-1 rounded">backend/.env</code>.
            </span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Set API Key
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-slate-50/40 rounded-2xl border border-slate-200/80 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onTopicSelectForQuiz={handleTransferToQuiz}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-500 ml-1">
                Groq is crafting {currentStyleConfig.label.toLowerCase()}...
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs font-bold underline cursor-pointer"
            >
              Check Groq Settings
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length <= 3 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium text-[11px]">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Prompts:
          </span>
          {SUGGESTED_PROMPTS.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/90 text-slate-600 text-xs whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-end gap-2">
        <textarea
          rows="2"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about ${selectedSubject} in ${currentStyleConfig.label} style... (Press Enter to send, Shift+Enter for new line)`}
          className="flex-1 p-2 text-sm text-slate-800 placeholder-slate-400 bg-transparent resize-none focus:outline-none"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputPrompt.trim() || isLoading}
          className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 shadow-xs transition-colors cursor-pointer shrink-0"
          title={`Send message (${currentStyleConfig.label})`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
