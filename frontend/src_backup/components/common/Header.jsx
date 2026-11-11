import { useState } from "react";
import { Sparkles, Plus, Settings, RefreshCw, CheckCircle2, AlertTriangle, XCircle, GraduationCap } from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { SubjectFormModal } from "../subjects/SubjectFormModal";

export function Header() {
  const { preferences, backendHealth, setIsSettingsOpen, resetToDemoData } = useStudent();
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleResetDemo = () => {
    if (resetConfirm) {
      resetToDemoData();
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 4000);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 flex items-center justify-between">
      {/* Left: Branding & Student Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base tracking-tight">StudentOS</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                AI Study Suite
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {preferences.studentName} • {preferences.semester}
            </p>
          </div>
        </div>
      </div>

      {/* Right: AI Engine Status & Actions */}
      <div className="flex items-center gap-3">
        {/* Groq AI Status Pill */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:bg-slate-50 cursor-pointer"
          title="Click to configure Groq API Key"
        >
          {backendHealth.status === "unreachable" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-700 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-500" /> Backend Offline
              </span>
            </>
          ) : backendHealth.groq_configured ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Groq AI Ready
                <span className="text-[10px] text-slate-600 font-mono">
                  {backendHealth.groq_model ? backendHealth.groq_model.split('-').slice(0, 2).join('-') : 'Llama'}
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-800 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Configure Groq Key
              </span>
            </>
          )}
        </button>

        {/* Reset Demo Data Button */}
        <button
          onClick={handleResetDemo}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            resetConfirm
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
          }`}
          title="Reset to pre-configured college demo subjects & schedule"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetConfirm ? "animate-spin" : ""}`} />
          {resetConfirm ? "Confirm Reset?" : "Demo Data"}
        </button>

        {/* Add Subject Quick Button */}
        <button
          onClick={() => setIsAddSubjectOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          title="Settings and API Configuration"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Add Subject Modal */}
      <SubjectFormModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
      />
    </header>
  );
}

