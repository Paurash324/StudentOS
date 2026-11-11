import { useState } from "react";
import { Modal } from "../common/Modal";
import { useStudent } from "../../context/StudentContext";
import { updateGroqKey } from "../../services/api";
import { Key, Sparkles, RefreshCw, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";

export function SettingsModal({ isOpen, onClose }) {
  const { 
    preferences, 
    setPreferences, 
    backendHealth, 
    refreshHealth, 
    resetToDemoData, 
    clearAllData 
  } = useStudent();

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [keyStatus, setKeyStatus] = useState({ state: "idle", message: "" });
  const [localPrefs, setLocalPrefs] = useState({
    studentName: preferences.studentName || "Alex Rivera",
    university: preferences.university || "Institute of Technology",
    semester: preferences.semester || "Fall 2026 • Semester 7",
    dailyTargetHours: preferences.dailyTargetHours || 4
  });

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setKeyStatus({ state: "saving", message: "Connecting to backend..." });
    try {
      await updateGroqKey(apiKeyInput.trim());
      await refreshHealth();
      setKeyStatus({ state: "success", message: "Groq API key updated and verified successfully!" });
      setApiKeyInput("");
      setTimeout(() => setKeyStatus({ state: "idle", message: "" }), 4000);
    } catch (err) {
      setKeyStatus({ state: "error", message: err.message || "Failed to save key" });
    }
  };

  const handleSavePrefs = (e) => {
    e.preventDefault();
    setPreferences((prev) => ({
      ...prev,
      ...localPrefs,
      dailyTargetHours: Number(localPrefs.dailyTargetHours)
    }));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Preferences & System Settings"
      subtitle="Configure Groq AI engine credentials and academic profile"
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {/* Groq Key Section */}
        <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Key className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Groq API Key Setup
              </h4>
            </div>

            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                backendHealth.groq_configured
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {backendHealth.groq_configured ? "Key Configured" : "Missing Key"}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Groq provides ultra-fast Llama 3 inference. Keys are securely stored on your local Python backend in <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-800">backend/.env</code>.
          </p>

          <form onSubmit={handleSaveKey} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={backendHealth.masked_key || "Paste your gsk_... key"}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={!apiKeyInput.trim() || keyStatus.state === "saving"}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                {keyStatus.state === "saving" ? "Saving..." : "Save Key"}
              </button>
            </div>

            {keyStatus.message && (
              <div
                className={`text-xs p-2 rounded-lg flex items-center gap-1.5 ${
                  keyStatus.state === "success"
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                    : "text-rose-700 bg-rose-50 border border-rose-200"
                }`}
              >
                {keyStatus.state === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>{keyStatus.message}</span>
              </div>
            )}
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Model: <strong className="text-slate-700">{backendHealth.groq_model || "llama-3.3-70b-versatile"}</strong></span>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline font-semibold"
            >
              Get Free Groq Key →
            </a>
          </div>
        </div>

        {/* Student Profile Settings */}
        <form onSubmit={handleSavePrefs} className="space-y-3.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Student Profile Details
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student Name
            </label>
            <input
              type="text"
              value={localPrefs.studentName}
              onChange={(e) => setLocalPrefs((p) => ({ ...p, studentName: e.target.value }))}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Semester Info
              </label>
              <input
                type="text"
                value={localPrefs.semester}
                onChange={(e) => setLocalPrefs((p) => ({ ...p, semester: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Study Goal (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="12"
                value={localPrefs.dailyTargetHours}
                onChange={(e) => setLocalPrefs((p) => ({ ...p, dailyTargetHours: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>

        {/* Demo Data Management */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-bold text-slate-800">Demo Data Management</h5>
            <p className="text-[11px] text-slate-500">Reset or purge sample university courses</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetToDemoData();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all subjects, schedules, and quizzes?")) {
                  clearAllData();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

