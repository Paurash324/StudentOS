import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle, Volume2, Clock } from "lucide-react";
import { useStudent } from "../../context/StudentContext";

export function StudyTimer({ activeSubject = null }) {
  const { subjects, logStudyTime } = useStudent();
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    activeSubject?.id || (subjects.length > 0 ? subjects[0].id : "")
  );

  const [mode, setMode] = useState("focus"); // focus (45m), shortBreak (15m), pomodoro (25m)
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Sync when activeSubject prop changes
  useEffect(() => {
    if (activeSubject?.id) {
      setSelectedSubjectId(activeSubject.id);
    }
  }, [activeSubject]);

  // Handle timer countdown
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      setSessionCompleted(true);
      // Play a subtle notification beep if audio context permitted
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        // audio error ignored
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const switchMode = (newMode, minutes) => {
    setMode(newMode);
    setDurationMinutes(minutes);
    setTimeLeft(minutes * 60);
    setIsRunning(false);
    setSessionCompleted(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
    setSessionCompleted(false);
  };

  const handleLogStudyTime = () => {
    if (selectedSubjectId) {
      logStudyTime(selectedSubjectId, durationMinutes);
      setSessionCompleted(false);
      handleReset();
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const progressPercent = ((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Live Study Focus Timer</h3>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-medium text-slate-600">
            <button
              onClick={() => switchMode("focus", 45)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mode === "focus" ? "bg-white text-indigo-600 font-bold shadow-xs" : "hover:text-slate-900"
              }`}
            >
              45m Deep
            </button>
            <button
              onClick={() => switchMode("pomodoro", 25)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mode === "pomodoro" ? "bg-white text-indigo-600 font-bold shadow-xs" : "hover:text-slate-900"
              }`}
            >
              25m Pomo
            </button>
            <button
              onClick={() => switchMode("shortBreak", 15)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mode === "shortBreak" ? "bg-white text-indigo-600 font-bold shadow-xs" : "hover:text-slate-900"
              }`}
            >
              15m Break
            </button>
          </div>
        </div>

        {/* Subject Selector for logging */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Focus Course Target
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}: {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Circular / Large Time Display */}
        <div className="py-4 flex flex-col items-center justify-center relative">
          <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
            {formattedTime}
          </div>
          <span className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
            {isRunning ? "Session in Progress • Stay Focused" : sessionCompleted ? "Session Finished!" : "Ready to Focus"}
          </span>

          {/* Mini progress line */}
          <div className="w-48 bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="h-1.5 bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Completion alert or Controls */}
      {sessionCompleted ? (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center space-y-2 mt-2">
          <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Great focus session completed!
          </p>
          <button
            onClick={handleLogStudyTime}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Log +{durationMinutes} mins to Course Progress
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-xs transition-all cursor-pointer ${
              isRunning
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Start Focus
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

