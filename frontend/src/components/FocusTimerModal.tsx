import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudentOSLogo } from './StudentOSLogo';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTaskName?: string;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  initialTaskName = "CS 301: Dynamic Programming Practice",
}) => {
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [duration, setDuration] = useState<number>(45 * 60); // seconds
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [taskName, setTaskName] = useState<string>(initialTaskName);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(3);

  useEffect(() => {
    setTaskName(initialTaskName);
  }, [initialTaskName]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe confetti fallback
      }
      if (mode === 'focus') {
        setSessionsCompleted(prev => prev + 1);
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode]);

  const selectMode = (newMode: 'focus' | 'shortBreak' | 'longBreak', minutes: number) => {
    setMode(newMode);
    setIsRunning(false);
    setDuration(minutes * 60);
    setTimeLeft(minutes * 60);
  };

  const toggleRun = () => {
    setIsRunning(prev => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E5E9F2] rounded-2xl w-full max-w-md p-6 shadow-xl relative overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 font-sans">
          <div className="flex items-center gap-3">
            <StudentOSLogo size="sm" />
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">Focus Deep Work</h3>
              <p className="font-sans text-xs text-slate-500">StudentOS Pomodoro Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl my-5 font-sans">
          <button
            onClick={() => selectMode('focus', 45)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'focus'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Deep Focus (45m)
          </button>
          <button
            onClick={() => selectMode('shortBreak', 10)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'shortBreak'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Short Break (10m)
          </button>
          <button
            onClick={() => selectMode('longBreak', 20)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'longBreak'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Long Break (20m)
          </button>
        </div>

        {/* Active Task Name */}
        <div className="mb-4 font-sans">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Current Target
          </label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-sans shadow-2xs"
            placeholder="What are you studying right now?"
          />
        </div>

        {/* Timer Display */}
        <div className="py-6 text-center font-sans">
          <div className="font-display text-6xl font-extrabold text-slate-900 tracking-tight tabular-nums mb-3">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {mode === 'focus' ? 'Stay in the zone · No social media or tab hopping' : 'Rest your eyes, hydrate, and stretch'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={resetTimer}
            className="p-3 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={toggleRun}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md ${
              isRunning 
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{timeLeft === duration ? 'Start Session' : 'Resume'}</span>
              </>
            )}
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title={soundEnabled ? 'Mute alert' : 'Enable alert'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Footer streak info */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Today's Sessions: <strong className="text-slate-800 tabular-nums">{sessionsCompleted}</strong></span>
          </div>
          <span>Total Deep Work: <strong className="text-slate-800 tabular-nums">2h 15m</strong></span>
        </div>
      </div>
    </div>
  );
};
