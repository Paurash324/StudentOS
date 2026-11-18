import React from 'react';
import { CalendarOff, Check, Clock, Coffee, Moon, Sun, Sunset, Sunrise } from 'lucide-react';
import { StudyAvailability, StudyWindow } from '../types';
import { WEEKDAYS } from '../utils/dateSheet';

interface StudyAvailabilityPanelProps {
  value: StudyAvailability;
  onChange: (next: StudyAvailability) => void;
}

const WINDOWS: { id: StudyWindow; label: string; icon: React.ElementType }[] = [
  { id: 'morning', label: 'Morning', icon: Sunrise },
  { id: 'afternoon', label: 'Afternoon', icon: Sun },
  { id: 'evening', label: 'Evening', icon: Sunset },
  { id: 'night', label: 'Night', icon: Moon },
];

export const StudyAvailabilityPanel: React.FC<StudyAvailabilityPanelProps> = ({ value, onChange }) => {
  const toggleWindow = (windowId: StudyWindow) => {
    const has = value.preferredWindows.includes(windowId);
    const next = has
      ? value.preferredWindows.filter(item => item !== windowId)
      : [...value.preferredWindows, windowId];
    onChange({ ...value, preferredWindows: next.length > 0 ? next : [windowId] });
  };

  const toggleDay = (day: string) => {
    const has = value.unavailableDays.includes(day);
    onChange({
      ...value,
      unavailableDays: has
        ? value.unavailableDays.filter(item => item !== day)
        : [...value.unavailableDays, day],
    });
  };

  return (
    <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs font-sans space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Study Availability</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic scheduling inputs. The Smart Planner uses these for exam-aware generation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Available study hours / day
            </span>
            <span className="font-display font-bold text-indigo-700 tabular-nums">{value.dailyHours} h</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={value.dailyHours}
            onChange={(e) => onChange({ ...value, dailyHours: parseFloat(e.target.value) })}
            className="w-full accent-indigo-600 cursor-pointer"
            aria-label="Available study hours per day"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1 h</span>
            <span>5 h</span>
            <span>10 h</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700 block">Preferred study windows</span>
          <div className="grid grid-cols-2 gap-1.5">
            {WINDOWS.map(window => {
              const Icon = window.icon;
              const selected = value.preferredWindows.includes(window.id);
              return (
                <button
                  key={window.id}
                  type="button"
                  onClick={() => toggleWindow(window.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                    selected
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{window.label}</span>
                  {selected && <Check className="w-3 h-3 ml-auto" />}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400">First selected window sets the study start time.</p>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700 block">Preferred session duration</span>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl w-fit">
            {[25, 45, 60, 90].map(minutes => (
              <button
                key={minutes}
                type="button"
                onClick={() => onChange({ ...value, sessionMinutes: minutes })}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  value.sessionMinutes === minutes
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            Buffer between sessions
          </span>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl w-fit">
            {[0, 5, 10, 15].map(minutes => (
              <button
                key={minutes}
                type="button"
                onClick={() => onChange({ ...value, bufferMinutes: minutes })}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  value.bufferMinutes === minutes
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {minutes === 0 ? 'None' : `${minutes} min`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <CalendarOff className="w-3.5 h-3.5 text-rose-500" />
          Weekly unavailable days
        </span>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map(day => {
            const unavailable = value.unavailableDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                  unavailable
                    ? 'bg-rose-50 border-rose-200 text-rose-700 line-through'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
