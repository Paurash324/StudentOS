import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  User, 
  Copy, 
  Check, 
  RotateCcw,
  ChevronDown,
  Lightbulb,
  Zap,
  FileText,
  BookOpenCheck,
  AlertCircle
} from 'lucide-react';
import { Subject, ChatMessage } from '../types';
import { askAcademicAssistant } from '../services/aiService';
import { StudentOSLogo } from './StudentOSLogo';

export type AnswerStyle = 'quick' | 'exam_ready' | 'detailed';

interface AIAssistantViewProps {
  subjects: Subject[];
  messages: ChatMessage[];
  onAddMessage: (msg: ChatMessage) => void;
  onClearHistory: () => void;
  userName?: string;
}

// Markdown helper to render formatted text, headers, tables, code blocks, lists
function formatInline(str: string): React.ReactNode[] {
  if (!str) return [];
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-bold text-slate-900 font-display">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-slate-200/70 text-indigo-700 font-mono text-[11px] border border-slate-300/60"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("$") && token.endsWith("$")) {
      parts.push(
        <span
          key={match.index}
          className="px-1 py-0.5 rounded bg-indigo-50 text-indigo-900 font-mono text-[11px] font-semibold"
        >
          {token.slice(1, -1)}
        </span>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }
  return parts;
}

function RenderMarkdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      nodes.push(
        <div key={`code-${i}`} className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 text-slate-100 shadow-xs font-mono text-xs">
          {lang && (
            <div className="px-3.5 py-1.5 bg-slate-800/80 text-[11px] font-semibold text-slate-400 border-b border-slate-700/70 flex justify-between items-center">
              <span>{lang.toUpperCase()}</span>
            </div>
          )}
          <pre className="p-3.5 overflow-x-auto text-slate-200 leading-relaxed">
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 2. Table Block
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headers = tableLines[0].split("|").slice(1, -1).map(c => c.trim());
        const rows = tableLines.slice(2).map(r => r.split("|").slice(1, -1).map(c => c.trim()));
        nodes.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="px-3 py-2 font-display">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/70">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-slate-700">{formatInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // 3. Headings
    if (line.startsWith("### ")) {
      nodes.push(
        <h4 key={`h4-${i}`} className="font-display font-bold text-sm text-slate-900 mt-3 mb-1">
          {formatInline(line.slice(4))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      nodes.push(
        <h5 key={`h5-${i}`} className="font-display font-semibold text-xs uppercase tracking-wider text-indigo-700 mt-2 mb-1">
          {formatInline(line.slice(5))}
        </h5>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(
        <h3 key={`h3-${i}`} className="font-display font-extrabold text-base text-slate-900 mt-3 mb-1.5">
          {formatInline(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }

    // 4. Bullet lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      nodes.push(
        <li key={`li-${i}`} className="ml-4 list-disc text-slate-700 my-0.5 leading-relaxed">
          {formatInline(line.trim().slice(2))}
        </li>
      );
      i++;
      continue;
    }

    // 5. Numbered lists
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      nodes.push(
        <div key={`num-${i}`} className="flex gap-2 text-slate-700 my-0.5 leading-relaxed ml-1">
          <span className="font-display font-bold text-indigo-600 shrink-0">{numMatch[1]}.</span>
          <span>{formatInline(numMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // 6. Regular line
    if (line.trim().length > 0) {
      nodes.push(
        <p key={`p-${i}`} className="my-1.5 leading-relaxed text-slate-800">
          {formatInline(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-0.5 font-sans">{nodes}</div>;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  subjects,
  messages,
  onAddMessage,
  onClearHistory,
  userName = 'Student',
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [selectedSubjectContext, setSelectedSubjectContext] = useState<string>('All Subjects');
  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>('exam_ready');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestedPrompts = [
    "Explain Dijkstra's Algorithm vs Bellman-Ford simply with an example",
    "Why does a 2-level page table reduce physical memory in Operating Systems?",
    "How to find the eigenvalues and eigenvectors of a 2x2 matrix step-by-step",
    "Give me an active recall revision plan for CS 301 Midterm II",
    "What is the difference between a Mutex and a Semaphore in concurrency?"
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    setErrorMessage(null);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subjectContext: selectedSubjectContext,
    };

    onAddMessage(userMessage);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.content
      }));

      const result = await askAcademicAssistant(query, selectedSubjectContext, history, answerStyle);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subjectContext: selectedSubjectContext,
        suggestedFollowUps: result.followUps,
      };

      onAddMessage(assistantMessage);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Unable to connect to AI tutor. Please verify your connection or try again.");
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: "I encountered an issue processing your academic query. Please try asking again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onAddMessage(fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>AI Academic Tutor</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Groq AI Model" />
          </h1>
          <p className="font-sans text-slate-500 text-sm mt-1 leading-relaxed">
            Personalized academic tutor grounded in your university syllabus, assignments, and exam invariants.
          </p>
        </div>

        {/* Subject Context Selector & Clear Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-sans">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:inline">
            Syllabus Context:
          </label>
          <div className="relative">
            <select
              value={selectedSubjectContext}
              onChange={(e) => setSelectedSubjectContext(e.target.value)}
              className="appearance-none bg-white border border-[#E5E9F2] rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All Subjects">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={`${s.code} ${s.name}`}>
                  {s.code}: {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={onClearHistory}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Clear conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Answer Style Selector Strip */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="uppercase tracking-wider text-[11px] text-slate-400 font-bold">Answer Style:</span>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setAnswerStyle('quick')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              answerStyle === 'quick'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
            }`}
            title="Short, direct explanations in 1–3 paragraphs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Answer</span>
          </button>

          <button
            type="button"
            onClick={() => setAnswerStyle('exam_ready')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              answerStyle === 'exam_ready'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
            }`}
            title="Structured college-level answers with definitions, points, examples, and takeaways"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exam Ready</span>
          </button>

          <button
            type="button"
            onClick={() => setAnswerStyle('detailed')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              answerStyle === 'detailed'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
            }`}
            title="Step-by-step teaching with examples, applications, comparisons and revision summaries"
          >
            <BookOpenCheck className="w-3.5 h-3.5" />
            <span>Detailed Explanation</span>
          </button>
        </div>
      </div>

      {/* Suggested Academic Prompts Strip */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 shadow-xs font-sans">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-600">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Suggested Academic Inquiries:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs text-slate-600 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all text-left cursor-pointer active:scale-[0.99]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-sans">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Chat Container */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl shadow-xs overflow-hidden flex flex-col h-[580px] font-sans">
        {/* Messages Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <StudentOSLogo size="sm" />
                )}

                <div className={`max-w-2xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Sender & timestamp */}
                  <div className={`flex items-center gap-2 text-[11px] text-slate-400 font-sans ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-display font-semibold text-slate-700">
                      {isUser ? userName : 'StudentOS AI Tutor'}
                    </span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                    {msg.subjectContext && (
                      <>
                        <span>·</span>
                        <span className="font-display font-bold text-indigo-600">{msg.subjectContext}</span>
                      </>
                    )}
                  </div>

                  {/* Bubble Content */}
                  <div 
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs font-sans'
                        : 'bg-slate-50 border border-slate-200/70 text-slate-800 rounded-tl-xs shadow-2xs font-sans'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <RenderMarkdown text={msg.content} />
                    )}

                    {!isUser && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                        <span className="text-[11px] font-sans">StudentOS Groq Engine</span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-indigo-600 transition-colors text-[11px] cursor-pointer"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Follow-up Prompts */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((fu, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(fu)}
                          className="text-[11px] font-medium text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/60 rounded-md px-2.5 py-1 transition-colors cursor-pointer"
                        >
                          {fu} &rarr;
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <User className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3.5 items-start">
              <StudentOSLogo size="sm" />
              <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl rounded-tl-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  <span>
                    Generating {answerStyle === 'quick' ? 'quick answer' : answerStyle === 'detailed' ? 'detailed step-by-step explanation' : 'structured exam-ready answer'}...
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#E5E9F2]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Ask a question grounded in ${selectedSubjectContext}...`}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-60 font-sans"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 text-white font-sans font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs shadow-indigo-600/30 shrink-0 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 text-[11px] font-sans text-slate-400 text-center">
            Mode: <strong className="text-slate-600 font-semibold">{answerStyle === 'quick' ? 'Quick Answer (1-3 paragraphs)' : answerStyle === 'detailed' ? 'Detailed Explanation (Step-by-step teaching)' : 'Exam Ready (College-level structured)'}</strong> · Powered by Groq AI
          </div>
        </div>
      </div>
    </div>
  );
};

