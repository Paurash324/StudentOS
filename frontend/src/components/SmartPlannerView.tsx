import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Coffee, 
  BookOpen, 
  Sliders, 
  Check, 
  RotateCcw, 
  Calendar, 
  AlertCircle, 
  Play,
  Timer
} from 'lucide-react';
import { Subject, TimetableBlock, SubjectPriority, PageTab } from '../types';
import { computeSubjectScore } from '../utils/priority';
import confetti from 'canvas-confetti';

interface SmartPlannerViewProps {
  subjects: Subject[];
  timetableBlocks: TimetableBlock[];
  onToggleBlock: (blockId: string) => void;
  onUpdateBlocks: (newBlocks: TimetableBlock[]) => void;
  onChangeSubjectPriority: (subjectId: string, newPriority: SubjectPriority) => void;
  onStartFocus: (taskName?: string) => void;
  onNavigateTab: (tab: PageTab) => void;
  defaultFocusDuration?: number;
}

// Format 12-hour AM/PM time
function formatTime(d: Date): string {
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? `0${hours}` : `${hours}`;
  const strMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${strHours}:${strMinutes} ${ampm}`;
}

function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

// Calculate starting time strictly in the future relative to current local time
function getInitialScheduleStartTime(): Date {
  const now = new Date();
  
  // Preferred standard morning study start: 08:30 AM today
  const preferredStart = new Date(now);
  preferredStart.setHours(8, 30, 0, 0);

  // If now is earlier than 08:30 AM today, start at 08:30 AM
  if (now.getTime() < preferredStart.getTime()) {
    return preferredStart;
  }

  // Otherwise, start from the next clean 5 or 10-minute slot from now (never in the past!)
  const cursor = new Date(now);
  const minutes = cursor.getMinutes();
  const remainder = minutes % 10;
  const minutesToAdd = remainder === 0 ? 5 : (10 - remainder);
  cursor.setMinutes(minutes + minutesToAdd, 0, 0);
  return cursor;
}


// Distribute subjects across session slots to avoid dedicating all sessions to one subject
function distributeSubjects(rankedSubjects: Subject[], sessionCount: number): Subject[] {
  if (rankedSubjects.length === 0) return [];
  if (rankedSubjects.length === 1) return Array(sessionCount).fill(rankedSubjects[0]);

  const queue: Subject[] = [];
  const top = rankedSubjects[0];
  const second = rankedSubjects[1] || top;
  const third = rankedSubjects[2] || second;
  const fourth = rankedSubjects[3] || third;

  for (let i = 0; i < sessionCount; i++) {
    if (i === 0) queue.push(top);
    else if (i === 1) queue.push(second);
    else if (i === 2) {
      queue.push(sessionCount <= 4 ? top : third);
    } else if (i === 3) {
      queue.push(sessionCount <= 4 ? third : top);
    } else if (i === 4) {
      queue.push(second);
    } else if (i === 5) {
      queue.push(top);
    } else if (i === 6) {
      queue.push(fourth);
    } else {
      queue.push(i % 2 === 0 ? top : third);
    }
  }
  return queue;
}

export const SmartPlannerView: React.FC<SmartPlannerViewProps> = ({
  subjects,
  timetableBlocks,
  onToggleBlock,
  onUpdateBlocks,
  onChangeSubjectPriority,
  onStartFocus,
  onNavigateTab,
  defaultFocusDuration = 45,
}) => {
  // Persisted state in localStorage to preserve selections across page reloads
  const [availableHours, setAvailableHours] = useState<number>(() => {
    const saved = localStorage.getItem('studentos_planner_hours');
    return saved ? parseFloat(saved) : 3.0;
  });

  const [focusGoal, setFocusGoal] = useState<'exam' | 'balanced' | 'deepWork'>(() => {
    const saved = localStorage.getItem('studentos_planner_goal');
    return (saved as 'exam' | 'balanced' | 'deepWork') || 'exam';
  });

  const [focusDuration, setFocusDuration] = useState<number>(() => {
    const saved = localStorage.getItem('studentos_planner_focus_duration');
    return saved ? parseInt(saved, 10) : defaultFocusDuration;
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('studentos_planner_hours', availableHours.toString());
    } catch (e) {
      console.warn("Storage error for planner hours:", e);
    }
  }, [availableHours]);

  useEffect(() => {
    try {
      localStorage.setItem('studentos_planner_goal', focusGoal);
    } catch (e) {
      console.warn("Storage error for planner goal:", e);
    }
  }, [focusGoal]);

  useEffect(() => {
    try {
      localStorage.setItem('studentos_planner_focus_duration', focusDuration.toString());
    } catch (e) {
      console.warn("Storage error for planner focus duration:", e);
    }
  }, [focusDuration]);

  // Group subjects by priority for display
  const highPrioritySubjects = subjects.filter(s => s.priority === 'High');
  const mediumPrioritySubjects = subjects.filter(s => s.priority === 'Medium');
  const lowPrioritySubjects = subjects.filter(s => s.priority === 'Low');

  // Hard maximum budget calculation
  const budgetMinutes = Math.round(availableHours * 60);

  // Filter study sessions vs break intervals
  const studyBlocks = timetableBlocks.filter(b => b.blockType !== 'Break');
  const completedBlocks = studyBlocks.filter(b => b.completed).length;
  const totalStudyBlocks = studyBlocks.length;
  const plannedStudyMinutes = studyBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);

  // Strictly bounded algorithmic schedule generator
  const handleGenerateSchedule = () => {
    setIsGenerating(true);
    setGenerationNotice(null);

    setTimeout(() => {
      // 1. Calculate strictly bounded study session durations
      const sessionDurations: number[] = [];
      let remaining = budgetMinutes;
      while (remaining > 0) {
        const d = Math.min(focusDuration, remaining);
        sessionDurations.push(d);
        remaining -= d;
      }

      // 2. Rank subjects pedagogically
      const rankedSubjects = [...subjects].sort((a, b) => 
        computeSubjectScore(b, focusGoal) - computeSubjectScore(a, focusGoal)
      );

      // 3. Distribute sessions among top subjects
      const assignedSubjects = distributeSubjects(rankedSubjects, sessionDurations.length);

      // Track how many sessions each subject receives
      const subjectSessionCount: Record<string, number> = {};

      // 4. Determine schedule starting time (never in the past!)
      let cursor = getInitialScheduleStartTime();
      let mealBreakAdded = false;

      const newBlocks: TimetableBlock[] = [];
      let totalStudyPlanned = 0;

      for (let i = 0; i < sessionDurations.length; i++) {
        const duration = sessionDurations[i];
        const sub = assignedSubjects[i] || subjects[0];
        const subId = sub.id;

        const countSoFar = subjectSessionCount[subId] || 0;
        subjectSessionCount[subId] = countSoFar + 1;

        const uncompletedTopics = sub.topics.filter(t => !t.completed);
        let topicTitle = "";
        let blockType: TimetableBlock['blockType'] = 'Deep Work';

        if (countSoFar === 0) {
          topicTitle = uncompletedTopics[0]?.title || sub.topics[0]?.title || "Core Foundations & Theory";
          blockType = focusGoal === 'balanced' ? 'Problem Solving' : 'Deep Work';
        } else if (countSoFar === 1) {
          topicTitle = uncompletedTopics[1]?.title || uncompletedTopics[0]?.title || sub.topics[1]?.title || "Applied Proofs & Problem Sets";
          blockType = 'Active Recall';
        } else {
          topicTitle = `Comprehensive Review & Diagnostic Drills (${sub.code})`;
          blockType = 'Review';
        }

        // Shorter remainder session adjustment
        if (duration <= 25 && sessionDurations.length > 1 && i === sessionDurations.length - 1) {
          blockType = 'Review';
          topicTitle = `Targeted Rapid Recall: ${sub.code}`;
        }

        const sessionStart = new Date(cursor);
        const sessionEnd = new Date(cursor.getTime() + duration * 60 * 1000);
        cursor = new Date(sessionEnd);

        newBlocks.push({
          id: `gen-block-${Date.now()}-${i + 1}`,
          day: "Today",
          timeRange: formatTimeRange(sessionStart, sessionEnd),
          subjectCode: sub.code,
          subjectName: sub.name,
          topic: topicTitle,
          blockType,
          durationMinutes: duration,
          completed: false,
        });

        totalStudyPlanned += duration;

        // Add break between sessions (not after the final session)
        if (i < sessionDurations.length - 1) {
          const endHour = sessionEnd.getHours();
          const endMinute = sessionEnd.getMinutes();
          const timeInHours = endHour + endMinute / 60;

          // Recovery break: 5m for <=30m focus, 10m for <=50m, 15m for >50m
          let breakDuration = focusDuration <= 30 ? 5 : focusDuration <= 50 ? 10 : 15;
          let breakName = "Hydration & Eye Rest";
          let breakTopic = "Step away from screen, hydrate, and stretch";
          let breakCode = "REST";

          // Meal break only if schedule is long (>= 3.5 hrs) and crosses lunch (12:00-13:30) or dinner (18:30-20:00)
          const canHaveMeal = availableHours >= 3.5 && !mealBreakAdded;
          const isLunch = timeInHours >= 12.0 && timeInHours <= 13.5;
          const isDinner = timeInHours >= 18.5 && timeInHours <= 20.0;

          if (canHaveMeal && (isLunch || isDinner)) {
            breakDuration = 45;
            breakName = isLunch ? "Lunch & Mental Reset" : "Dinner & Downtime";
            breakTopic = isLunch ? "Nutritious meal away from academic workspace" : "Dinner and cognitive rest";
            breakCode = isLunch ? "LUNCH" : "DINNER";
            mealBreakAdded = true;
          }

          const breakStart = new Date(cursor);
          const breakEnd = new Date(cursor.getTime() + breakDuration * 60 * 1000);
          cursor = new Date(breakEnd);

          newBlocks.push({
            id: `gen-break-${Date.now()}-${i + 1}`,
            day: "Today",
            timeRange: formatTimeRange(breakStart, breakEnd),
            subjectCode: breakCode,
            subjectName: breakName,
            topic: breakTopic,
            blockType: 'Break',
            durationMinutes: breakDuration,
            completed: false,
          });
        }
      }

      onUpdateBlocks(newBlocks);
      setIsGenerating(false);
      setGenerationNotice(
        `Generated ${sessionDurations.length} focus sessions totaling exactly ${totalStudyPlanned} min (${(totalStudyPlanned / 60).toFixed(1)} hrs), perfectly within your ${availableHours} hr budget.`
      );

      try {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    }, 350);
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Smart Planner
          </h1>
          <p className="font-sans text-slate-500 text-sm mt-1 leading-relaxed">
            Algorithmic study scheduling based on your subject priorities, confidence deficits, and exam dates.
          </p>
        </div>

        <button
          onClick={handleGenerateSchedule}
          disabled={isGenerating}
          className="font-sans flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm shadow-indigo-600/30 whitespace-nowrap self-start sm:self-auto disabled:opacity-70 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isGenerating ? "Optimizing Schedule..." : "Generate My Schedule"}</span>
        </button>
      </div>

      {generationNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between font-sans">
          <span>{generationNotice}</span>
          <button 
            onClick={() => setGenerationNotice(null)} 
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Configuration Controls Bar */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs font-sans">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Study hours selector */}
          <div className="space-y-2 flex-1 max-w-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Available Study Time Today</span>
              <span className="font-display font-bold text-indigo-700 text-sm tabular-nums">
                {availableHours} Hours ({budgetMinutes} min max budget)
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="9.0"
              step="0.5"
              value={availableHours}
              onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-sans text-slate-400">
              <span>1.0 hr</span>
              <span>3.0 hrs</span>
              <span>5.5 hrs (Standard)</span>
              <span>9.0 hrs (Cram)</span>
            </div>
          </div>

          {/* Focus Mode Duration Selector */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 block font-sans">Focus Session Duration</span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl font-sans">
              {[25, 45, 60].map(dur => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setFocusDuration(dur)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    focusDuration === dur
                      ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dur} min
                </button>
              ))}
            </div>
          </div>

          {/* Goal Selector */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 block font-sans">Optimization Focus</span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl font-sans">
              <button
                type="button"
                onClick={() => setFocusGoal('exam')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  focusGoal === 'exam'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upcoming Exams
              </button>
              <button
                type="button"
                onClick={() => setFocusGoal('balanced')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  focusGoal === 'balanced'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Balanced Syllabi
              </button>
              <button
                type="button"
                onClick={() => setFocusGoal('deepWork')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  focusGoal === 'deepWork'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Deep Work Focus
              </button>
            </div>
          </div>

          {/* Planned Study Time & Progress Indicator */}
          <div className="text-left lg:text-right border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 font-sans">
            <span className="text-xs text-slate-400 block font-medium">Planned Study Time</span>
            <span className="font-display text-base font-bold text-slate-900 tabular-nums">
              {plannedStudyMinutes} / {budgetMinutes} minutes
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {completedBlocks} of {totalStudyBlocks} Sessions Finished
            </span>
          </div>
        </div>
      </div>

      {/* Priority Groups Section */}
      <div className="space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Subject Priority Distribution</h2>
          <span className="text-xs text-slate-400 font-sans">
            Click dropdown on any subject to adjust study weighting
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* High Priority Group */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span className="font-display text-xs font-bold text-slate-800 uppercase tracking-wider">
                  High Priority ({highPrioritySubjects.length})
                </span>
              </div>
              <span className="text-[11px] font-sans text-slate-400 font-medium">Primary focus</span>
            </div>
            <div className="space-y-2">
              {highPrioritySubjects.map(sub => (
                <div key={sub.id} className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate font-display">{sub.code}: {sub.name}</span>
                    <span className="text-[11px] text-slate-500 font-sans">Confidence: <strong className="font-display text-slate-700">{sub.confidence}%</strong></span>
                  </div>
                  <select
                    value={sub.priority}
                    onChange={(e) => onChangeSubjectPriority(sub.id, e.target.value as SubjectPriority)}
                    className="text-[11px] font-medium bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Medium Priority Group */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="font-display text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Medium Priority ({mediumPrioritySubjects.length})
                </span>
              </div>
              <span className="text-[11px] font-sans text-slate-400 font-medium">Secondary focus</span>
            </div>
            <div className="space-y-2">
              {mediumPrioritySubjects.map(sub => (
                <div key={sub.id} className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate font-display">{sub.code}: {sub.name}</span>
                    <span className="text-[11px] text-slate-500 font-sans">Confidence: <strong className="font-display text-slate-700">{sub.confidence}%</strong></span>
                  </div>
                  <select
                    value={sub.priority}
                    onChange={(e) => onChangeSubjectPriority(sub.id, e.target.value as SubjectPriority)}
                    className="text-[11px] font-medium bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Low Priority Group */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                <span className="font-display text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Low Priority ({lowPrioritySubjects.length})
                </span>
              </div>
              <span className="text-[11px] font-sans text-slate-400 font-medium">Maintained pace</span>
            </div>
            <div className="space-y-2">
              {lowPrioritySubjects.map(sub => (
                <div key={sub.id} className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate font-display">{sub.code}: {sub.name}</span>
                    <span className="text-[11px] text-slate-500 font-sans">Confidence: <strong className="font-display text-slate-700">{sub.confidence}%</strong></span>
                  </div>
                  <select
                    value={sub.priority}
                    onChange={(e) => onChangeSubjectPriority(sub.id, e.target.value as SubjectPriority)}
                    className="text-[11px] font-medium bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Schedule Cards */}
      <div className="space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Today's Optimized Schedule</h2>
            <p className="text-xs text-slate-500 font-sans">
              Strict {plannedStudyMinutes} min study plan · {totalStudyBlocks} focus sessions · Recovery breaks excluded from budget
            </p>
          </div>
          <span className="font-display text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60 tabular-nums self-start sm:self-auto">
            {plannedStudyMinutes} / {budgetMinutes} min planned
          </span>
        </div>

        <div className="space-y-3">
          {timetableBlocks.map((block) => {
            const isBreak = block.blockType === 'Break';

            if (isBreak) {
              return (
                <div 
                  key={block.id}
                  className="p-3.5 bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl flex items-center justify-between gap-4 font-sans"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block font-sans">
                        {block.subjectName} · {block.topic}
                      </span>
                      <span className="text-[11px] text-slate-400 font-sans">
                        <strong className="font-display text-slate-500 font-semibold">{block.timeRange}</strong> ({block.durationMinutes} min break · not counted towards study hours)
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 font-sans">
                    Rest Interval
                  </span>
                </div>
              );
            }

            const typeBadge = 
              block.blockType === 'Deep Work' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' :
              block.blockType === 'Problem Solving' ? 'text-sky-700 bg-sky-50 border-sky-200' :
              block.blockType === 'Active Recall' ? 'text-purple-700 bg-purple-50 border-purple-200' :
              'text-slate-700 bg-slate-50 border-slate-200';

            return (
              <div 
                key={block.id}
                className={`bg-white border border-[#E5E9F2] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  block.completed ? 'bg-slate-50/70 opacity-80' : ''
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => onToggleBlock(block.id)}
                    className="mt-0.5 sm:mt-0 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                    aria-label={block.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {block.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs font-bold text-indigo-600">
                        {block.subjectCode}
                      </span>
                      <span className="text-xs text-slate-300" aria-hidden="true">·</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border font-sans ${typeBadge}`}>
                        {block.blockType}
                      </span>
                      <span className="text-xs text-slate-300 hidden md:inline" aria-hidden="true">·</span>
                      <span className="text-xs text-slate-500 hidden md:inline font-sans">
                        {block.subjectName}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 truncate ${
                      block.completed ? 'line-through text-slate-400 font-normal font-sans' : 'font-display font-bold text-slate-900'
                    }`}>
                      {block.topic}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 font-sans">
                  <span className="text-xs font-display font-semibold text-slate-500 tabular-nums">
                    {block.timeRange} ({block.durationMinutes}m)
                  </span>
                  
                  {!block.completed && (
                    <button
                      onClick={() => onStartFocus(`${block.subjectCode}: ${block.topic}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-lg transition-all shadow-2xs cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
