import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  HelpCircle, 
  BookOpen, 
  RotateCcw,
  ChevronDown,
  Layers,
  Lightbulb
} from 'lucide-react';
import { Subject, ChatMessage } from '../types';
import { askAcademicAssistant } from '../services/aiService';

interface AIAssistantViewProps {
  subjects: Subject[];
  messages: ChatMessage[];
  onAddMessage: (msg: ChatMessage) => void;
  onClearHistory: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  subjects,
  messages,
  onAddMessage,
  onClearHistory,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [selectedSubjectContext, setSelectedSubjectContext] = useState<string>('All Subjects');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.content
      }));

      const result = await askAcademicAssistant(query, selectedSubjectContext, history);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subjectContext: selectedSubjectContext,
        suggestedFollowUps: result.followUps,
      };

      onAddMessage(assistantMessage);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: "I encountered an issue processing your academic query. Please try asking again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onAddMessage(errorMessage);
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
            <span>AI Study Assistant</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Model" />
          </h1>
          <p className="font-sans text-slate-500 text-sm mt-1 leading-relaxed">
            Personalized academic tutor grounded in your university syllabus, assignments, and exam invariants.
          </p>
        </div>

        {/* Subject Context Selector */}
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
              <option value="All Subjects">All 5 Subjects</option>
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
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-indigo-600/20">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Sender & timestamp */}
                  <div className={`flex items-center gap-2 text-[11px] text-slate-400 font-sans ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-display font-semibold text-slate-700">
                      {isUser ? 'Alex Rivera' : 'StudentOS Academic AI'}
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
                    {/* Format simple markdown: headers, bold, code */}
                    <div className="space-y-3 whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>

                    {!isUser && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                        <span className="text-[11px]">Academic Reference Model</span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-indigo-600 transition-colors text-[11px]"
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
                          className="text-[11px] font-medium text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/60 rounded-md px-2.5 py-1 transition-colors"
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
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl rounded-tl-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  <span>Synthesizing syllabus concept & formulation...</span>
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
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-60"
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
            Provides syllabus-aware explanations, runtime proofs, and exam preparation tips.
          </div>
        </div>
      </div>
    </div>
  );
};
