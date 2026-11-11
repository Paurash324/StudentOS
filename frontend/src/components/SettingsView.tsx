import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Clock, 
  Bell, 
  GraduationCap, 
  Check, 
  RotateCcw,
  ShieldCheck,
  Download,
  BookOpen
} from 'lucide-react';
import { StudentProfile } from '../types';

interface SettingsViewProps {
  profile: StudentProfile;
  onUpdateProfile: (updated: Partial<StudentProfile>) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onResetData,
}) => {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [university, setUniversity] = useState(profile.university);
  const [major, setMajor] = useState(profile.major);
  const [degree, setDegree] = useState(profile.degree);
  const [targetGpa, setTargetGpa] = useState(profile.targetGpa);
  const [dailyGoalHours, setDailyGoalHours] = useState(profile.dailyGoalHours);
  const [pomodoroWork, setPomodoroWork] = useState(profile.pomodoroWorkMinutes);
  const [pomodoroBreak, setPomodoroBreak] = useState(profile.pomodoroBreakMinutes);
  const [savedMessage, setSavedMessage] = useState(false);

  const [examReminders, setExamReminders] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [adaptiveSchedule, setAdaptiveSchedule] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      email,
      university,
      major,
      degree,
      targetGpa: Number(targetGpa),
      dailyGoalHours: Number(dailyGoalHours),
      pomodoroWorkMinutes: Number(pomodoroWork),
      pomodoroBreakMinutes: Number(pomodoroBreak),
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl font-sans">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="font-sans text-slate-500 text-sm mt-1 leading-relaxed">
          Customize your student profile, study targets, focus session intervals, and study planner behavior.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 font-sans">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 font-sans">
        {/* Section 1: Academic Profile */}
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Student Profile</h2>
              <p className="font-sans text-xs text-slate-500">Academic credentials and institution info</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 pb-2 font-sans">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="w-18 h-18 rounded-2xl object-cover border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-display font-extrabold text-2xl shadow-xs border border-indigo-200">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <div>
              <p className="font-display text-sm font-bold text-slate-900">{profile.name}</p>
              <p className="font-sans text-xs text-slate-500 mt-0.5">{profile.degree} · {profile.university}</p>
              <span className="inline-block mt-2 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md font-sans">
                Verified Student Profile
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-sans shadow-2xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                University Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-sans shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                University / College
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-sans shadow-2xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Academic Degree & Major
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-sans shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 font-sans">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Current GPA
              </label>
              <input
                type="text"
                disabled
                value={profile.currentGpa.toFixed(2)}
                className="w-full text-xs font-display font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-xl p-3 cursor-not-allowed tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Target GPA Goal
              </label>
              <input
                type="number"
                step="0.01"
                min="2.0"
                max="4.0"
                value={targetGpa}
                onChange={(e) => setTargetGpa(parseFloat(e.target.value))}
                className="w-full text-xs font-display font-bold text-indigo-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 tabular-nums shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Study & Focus Session Pacing */}
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">Study & Pacing Controls</h2>
              <p className="text-xs font-sans text-slate-500">Pomodoro intervals and daily target hours</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Daily Study Target
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="12"
                  value={dailyGoalHours}
                  onChange={(e) => setDailyGoalHours(parseFloat(e.target.value))}
                  className="w-full text-xs font-display font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 tabular-nums shadow-2xs"
                />
                <span className="text-xs font-sans text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                  hours
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Focus Session Length
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="15"
                  max="90"
                  value={pomodoroWork}
                  onChange={(e) => setPomodoroWork(parseInt(e.target.value))}
                  className="w-full text-xs font-display font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 tabular-nums shadow-2xs"
                />
                <span className="text-xs font-sans text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                  minutes
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Short Break Interval
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={pomodoroBreak}
                  onChange={(e) => setPomodoroBreak(parseInt(e.target.value))}
                  className="w-full text-xs font-display font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 tabular-nums shadow-2xs"
                />
                <span className="text-xs font-sans text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                  minutes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Smart Notifications & Automation */}
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">Academic Notifications</h2>
              <p className="text-xs font-sans text-slate-500">Autonomous reminders and exam briefings</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-150/80 rounded-xl cursor-pointer transition-colors">
              <div>
                <span className="text-xs font-display font-semibold text-slate-900 block">Upcoming Exam Countdowns</span>
                <span className="text-[11px] font-sans text-slate-500">Alert 7 days, 3 days, and 24 hours prior to assessments</span>
              </div>
              <input
                type="checkbox"
                checked={examReminders}
                onChange={(e) => setExamReminders(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-150/80 rounded-xl cursor-pointer transition-colors">
              <div>
                <span className="text-xs font-display font-semibold text-slate-900 block">Daily Morning Study Briefing</span>
                <span className="text-[11px] font-sans text-slate-500">Receive an optimized timetable preview each morning at 08:00 AM</span>
              </div>
              <input
                type="checkbox"
                checked={dailyBriefing}
                onChange={(e) => setDailyBriefing(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-150/80 rounded-xl cursor-pointer transition-colors">
              <div>
                <span className="text-xs font-display font-semibold text-slate-900 block">Smart Rebalancing Engine</span>
                <span className="text-[11px] font-sans text-slate-500">Automatically adjust study block lengths when confidence drops below 60%</span>
              </div>
              <input
                type="checkbox"
                checked={adaptiveSchedule}
                onChange={(e) => setAdaptiveSchedule(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={onResetData}
            className="flex items-center gap-2 text-xs font-sans font-medium text-rose-600 hover:text-rose-700 py-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Application Data to Defaults</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-sans font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
