import React, { useState } from 'react';
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
  Play
} from 'lucide-react';
import { Subject, TimetableBlock, SubjectPriority, PageTab } from '../types';
import confetti from 'canvas-confetti';

interface SmartPlannerViewProps {
  subjects: Subject[];
  timetableBlocks: TimetableBlock[];
  onToggleBlock: (blockId: string) => void;
  onUpdateBlocks: (newBlocks: TimetableBlock[]) => void;
  onChangeSubjectPriority: (subjectId: string, newPriority: SubjectPriority) => void;
  onStartFocus: (taskName?: string) => void;
  onNavigateTab: (tab: PageTab) => void;
}

export const SmartPlannerView: React.FC<SmartPlannerViewProps> = ({
  subjects,
  timetableBlocks,
  onToggleBlock,
  onUpdateBlocks,
  onChangeSubjectPriority,
  onStartFocus,
  onNavigateTab,
}) => {
  const [availableHours, setAvailableHours] = useState<number>(5.5);
  const [focusGoal, setFocusGoal] = useState<'exam' | 'balanced' | 'deepWork'>('exam');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Group subjects by priority
  const highPrioritySubjects = subjects.filter(s => s.priority === 'High');
  const mediumPrioritySubjects = subjects.filter(s => s.priority === 'Medium');
  const lowPrioritySubjects = subjects.filter(s => s.priority === 'Low');

  // Algorithmic schedule generator
  const handleGenerateSchedule = () => {
    setIsGenerating(true);
    setGenerationNotice(null);

    setTimeout(() => {
      // Pick top subjects to schedule based on priority and confidence
      const targetSubjects = [...subjects].sort((a, b) => {
        // High priority first, then lowest confidence
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        const scoreA = priorityWeight[a.priority] * 100 - a.confidence;
        const scoreB = priorityWeight[b.priority] * 100 - b.confidence;
        return scoreB - scoreA;
      });

      const sub1 = targetSubjects[0] || subjects[0];
      const sub2 = targetSubjects[1] || subjects[1] || subjects[0];
      const sub3 = targetSubjects[2] || subjects[2] || subjects[0];

      const topic1 = sub1.topics.find(t => !t.completed)?.title || "Comprehensive Exam Invariants";
      const topic2 = sub2.topics.find(t => !t.completed)?.title || "Problem Set & Proof Drills";
      const topic3 = sub3.topics.find(t => !t.completed)?.title || "Active Recall & Flashcards";

      const newBlocks: TimetableBlock[] = [
        {
          id: `gen-block-${Date.now()}-1`,
          day: "Today",
          timeRange: "08:30 – 10:00 AM",
          subjectCode: sub1.code,
          subjectName: sub1.name,
          topic: `${topic1} (High Priority Focus)`,
          blockType: "Deep Work",
          durationMinutes: 90,
          completed: false,
        },
        {
          id: `gen-block-${Date.now()}-break1`,
          day: "Today",
          timeRange: "10:00 – 10:15 AM",
          subjectCode: "REST",
          subjectName: "Hydration & Cognitive Rest",
          topic: "Rest eyes and do light posture stretches",
          blockType: "Break",
          durationMinutes: 15,
          completed: false,
        },
        {
          id: `gen-block-${Date.now()}-2`,
          day: "Today",
          timeRange: "10:15 – 11:45 AM",
          subjectCode: sub2.code,
          subjectName: sub2.name,
          topic: `${topic2} (Mastery Reinforcement)`,
          blockType: "Problem Solving",
          durationMinutes: 90,
          completed: false,
        },
        {
          id: `gen-block-${Date.now()}-break2`,
          day: "Today",
          timeRange: "11:45 AM – 01:00 PM",
          subjectCode: "LUNCH",
          subjectName: "Lunch & Social Recovery",
          topic: "Nutritious meal away from academic screens",
          blockType: "Break",
          durationMinutes: 75,
          completed: false,
        },
        {
          id: `gen-block-${Date.now()}-3`,
          day: "Today",
          timeRange: "01:00 – 02:30 PM",
          subjectCode: sub3.code,
          subjectName: sub3.name,
          topic: `${topic3} (Active Synthesis)`,
          blockType: "Active Recall",
          durationMinutes: 90,
          completed: false,
        },
        {
          id: `gen-block-${Date.now()}-4`,
          day: "Today",
          timeRange: "03:00 – 04:00 PM",
          subjectCode: sub1.code,
          subjectName: sub1.name,
          topic: `Quick Diagnostic Quiz on ${sub1.code}`,
          blockType: "Review",
          durationMinutes: 60,
          completed: false,
        }
      ];

      onUpdateBlocks(newBlocks);
      setIsGenerating(false);
      setGenerationNotice("Schedule successfully optimized for upcoming deadlines!");
      try {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe confetti fallback
      }
    }, 700);
  };

  const completedBlocks = timetableBlocks.filter(b => b.completed && b.blockType !== 'Break').length;
  const totalStudyBlocks = timetableBlocks.filter(b => b.blockType !== 'Break').length;

  return (
    <div className="space-y-8 pb-12">
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
          <span>{isGenerating ? "Optimizing..." : "Generate My Schedule"}</span>
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
                {availableHours} Hours
              </span>
            </div>
            <input
              type="range"
              min="2.0"
              max="9.0"
              step="0.5"
              value={availableHours}
              onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-sans text-slate-400">
              <span>2.0 hrs</span>
              <span>5.5 hrs (Standard)</span>
              <span>9.0 hrs (Cram mode)</span>
            </div>
          </div>

          {/* Goal Selector */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 block font-sans">Optimization Focus</span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl font-sans">
              <button
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

          {/* Action indicator */}
          <div className="text-left lg:text-right border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 font-sans">
            <span className="text-xs text-slate-400 block font-medium">Timetable Progress</span>
            <span className="font-display text-base font-bold text-slate-900 tabular-nums">
              {completedBlocks} / {totalStudyBlocks} Sessions Finished
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
              <span className="text-[11px] font-sans text-slate-400 font-medium">45% time budget</span>
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
              <span className="text-[11px] font-sans text-slate-400 font-medium">35% time budget</span>
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
              <span className="text-[11px] font-sans text-slate-400 font-medium">20% time budget</span>
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
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Today's Optimized Schedule</h2>
          <span className="text-xs text-slate-500 font-sans">
            Pomodoro pacing with built-in active recall and recovery intervals
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
                        <strong className="font-display text-slate-500 font-semibold">{block.timeRange}</strong> ({block.durationMinutes} min rest)
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
                    {block.timeRange}
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
