import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  ArrowUpRight, 
  AlertTriangle,
  Play,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Subject, TodayTask, Deadline, DailyActivity, PageTab } from '../types';

interface DashboardViewProps {
  subjects: Subject[];
  todayTasks: TodayTask[];
  onToggleTask: (taskId: string) => void;
  deadlines: Deadline[];
  onToggleDeadline: (deadlineId: string) => void;
  weeklyActivity: DailyActivity[];
  onNavigateTab: (tab: PageTab) => void;
  onStartFocus: (taskName?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  subjects,
  todayTasks,
  onToggleTask,
  deadlines,
  onToggleDeadline,
  weeklyActivity,
  onNavigateTab,
  onStartFocus,
}) => {
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [hoveredDay, setHoveredDay] = useState<DailyActivity | null>(null);

  // Compute aggregate statistics
  const totalSubjects = subjects.length;
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const totalStudyHoursThisWeek = weeklyActivity.reduce((sum, d) => sum + d.hours, 0).toFixed(1);
  
  // Calculate average syllabus progress
  const allTopics = subjects.flatMap(s => s.topics);
  const completedTopics = allTopics.filter(t => t.completed).length;
  const syllabusProgressPercent = Math.round((completedTopics / Math.max(1, allTopics.length)) * 100);

  // Upcoming exams count
  const upcomingExams = deadlines.filter(d => d.type === 'Exam' && !d.completed);
  const nextExam = upcomingExams[0];

  // Filter tasks
  const filteredTasks = todayTasks.filter(task => {
    if (taskFilter === 'pending') return !task.completed;
    if (taskFilter === 'completed') return task.completed;
    return true;
  });

  const completedTodayTasksCount = todayTasks.filter(t => t.completed).length;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Greeting & Quick Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Good morning, Alex!
          </h1>
          <p className="font-sans text-slate-500 text-sm mt-1 leading-relaxed">
            Let's make today productive. You have 3 high-priority study blocks lined up before your CS 301 midterm.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('planner')}
            className="font-sans px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 active:scale-[0.99] transition-all shadow-2xs whitespace-nowrap cursor-pointer"
          >
            Review Timetable
          </button>
          <button
            onClick={() => onStartFocus("CS 301: Algorithms & Data Structures")}
            className="font-sans flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm shadow-indigo-600/30 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Deep Work</span>
          </button>
        </div>
      </div>

      {/* 2. Four Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Subjects */}
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Subjects
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {totalSubjects}
            </span>
            <span className="font-sans text-xs font-medium text-slate-500">
              Enrolled
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
            <span>{totalCredits} Credit Units</span>
            <button 
              onClick={() => onNavigateTab('subjects')}
              className="text-indigo-600 font-semibold hover:text-indigo-700 inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Stat 2: Study Hours */}
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Study Hours
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {totalStudyHoursThisWeek}
            </span>
            <span className="font-sans text-xs font-medium text-slate-500">
              hrs this week
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-sans">
            <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+4.2 hrs vs last wk</span>
            </span>
            <span className="text-slate-400 font-medium">Goal 35h</span>
          </div>
        </div>

        {/* Stat 3: Syllabus Progress */}
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Syllabus Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {syllabusProgressPercent}%
            </span>
            <span className="font-sans text-xs font-medium text-slate-500">
              Average
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
            <span>{completedTopics} of {allTopics.length} topics</span>
            <span className="text-indigo-600 font-semibold">On Track</span>
          </div>
        </div>

        {/* Stat 4: Upcoming Exams */}
        <div className="bg-white border border-[#E5E9F2] rounded-2xl p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Upcoming Exams
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {upcomingExams.length}
            </span>
            <span className="font-sans text-xs font-medium text-slate-500">
              Scheduled
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
            {nextExam ? (
              <span className="truncate text-amber-700 font-medium">
                {nextExam.subjectCode} in {nextExam.daysRemaining} days
              </span>
            ) : (
              <span>No exams this month</span>
            )}
            <button 
              onClick={() => onNavigateTab('planner')}
              className="text-indigo-600 font-semibold hover:text-indigo-700 text-xs shrink-0 cursor-pointer"
            >
              Prepare
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Today's Study Plan + Weekly Activity (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Today's Study Plan */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Today's Study Plan</h2>
                  <span className="text-xs text-slate-300 font-sans" aria-hidden="true">·</span>
                  <span className="font-sans text-xs font-semibold text-slate-500">
                    <strong className="font-display text-slate-800 tabular-nums">{completedTodayTasksCount}</strong>/{todayTasks.length} Done
                  </span>
                </div>
                <p className="font-sans text-xs text-slate-500 mt-0.5">
                  Algorithmic daily schedule calibrated for your upcoming exams
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl font-sans">
                <button
                  onClick={() => setTaskFilter('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    taskFilter === 'all'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({todayTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('pending')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    taskFilter === 'pending'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending ({todayTasks.length - completedTodayTasksCount})
                </button>
                <button
                  onClick={() => setTaskFilter('completed')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    taskFilter === 'completed'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Done ({completedTodayTasksCount})
                </button>
              </div>
            </div>

            {/* Task Checklist */}
            <div className="divide-y divide-slate-100 mt-2 font-sans">
              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No tasks match this filter.
                </div>
              ) : (
                filteredTasks.map((task) => {
                  return (
                    <div 
                      key={task.id}
                      className="py-3.5 flex items-start justify-between gap-3 group hover:bg-slate-50/70 -mx-2 px-2.5 rounded-xl transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => onToggleTask(task.id)}
                          className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-sm transition-all ${
                            task.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-900 font-medium'
                          }`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-sans">
                            <span className="font-display font-bold text-slate-700">{task.subjectCode}</span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="font-sans font-medium text-slate-600 tabular-nums">{task.timeSlot}</span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span>{task.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!task.completed && (
                          <button
                            onClick={() => onStartFocus(`${task.subjectCode}: ${task.title}`)}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold font-sans text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer"
                            title="Start Focus Timer for this session"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span className="hidden sm:inline">Focus</span>
                          </button>
                        )}
                        <span className="text-xs font-display font-semibold text-slate-500 tabular-nums">
                          {task.durationMinutes}m
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
              <span>Need to adjust today's hours?</span>
              <button
                onClick={() => onNavigateTab('planner')}
                className="text-indigo-600 font-semibold hover:text-indigo-700 cursor-pointer"
              >
                Regenerate Schedule &rarr;
              </button>
            </div>
          </div>

          {/* Weekly Study Activity Chart */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Weekly Study Activity</h2>
                <p className="font-sans text-xs text-slate-500 mt-0.5">
                  Actual hours vs. daily 5.0h baseline target
                </p>
              </div>
              <div className="text-right font-sans">
                <span className="text-xs text-slate-400 block font-medium">Weekly Total</span>
                <span className="font-display text-lg font-bold text-slate-900 tabular-nums">
                  {totalStudyHoursThisWeek} hrs
                </span>
              </div>
            </div>

            {/* Bar Chart Container */}
            <div className="mt-6">
              <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-100">
                {weeklyActivity.map((day) => {
                  const maxChartHours = 7.0;
                  const heightPercent = Math.min(100, (day.hours / maxChartHours) * 100);
                  const isCurrentDay = day.shortDay === 'Wed';

                  return (
                    <div 
                      key={day.shortDay} 
                      className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end cursor-pointer"
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {/* Hours label on hover */}
                      <span className="font-display text-[11px] text-slate-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 tabular-nums">
                        {day.hours}h
                      </span>

                      {/* Bar */}
                      <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-full">
                        {/* Target line watermark indicator */}
                        <div 
                          className="absolute w-full border-b border-dashed border-slate-300 z-10"
                          style={{ bottom: `${(day.target / maxChartHours) * 100}%` }}
                        />
                        <div 
                          className={`w-full transition-all duration-300 rounded-t-lg ${
                            isCurrentDay 
                              ? 'bg-indigo-600' 
                              : day.hours >= day.target 
                                ? 'bg-indigo-400 group-hover:bg-indigo-500' 
                                : 'bg-slate-300 group-hover:bg-slate-400'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day Labels */}
              <div className="flex justify-between gap-2 sm:gap-4 mt-2">
                {weeklyActivity.map((day) => {
                  const isCurrentDay = day.shortDay === 'Wed';
                  return (
                    <div key={day.shortDay} className="flex-1 text-center font-sans">
                      <span className={`text-xs block ${
                        isCurrentDay ? 'font-display text-indigo-600 font-bold' : 'text-slate-500 font-medium'
                      }`}>
                        {day.shortDay}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend & Hover Breakdown */}
              <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100 font-sans">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
                    <span>Today (Active)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-indigo-400 inline-block" />
                    <span>Met Target</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 border-b border-dashed border-slate-400 inline-block" />
                    <span>5.0h Target</span>
                  </div>
                </div>
                {hoveredDay ? (
                  <span className="font-medium text-slate-700">
                    {hoveredDay.day}: <strong className="font-display font-bold text-slate-900 tabular-nums">{hoveredDay.hours}h</strong>
                  </span>
                ) : (
                  <span>Daily Avg: <strong className="font-display font-bold text-slate-900 tabular-nums">5.1 hrs</strong></span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Subject Priority + Upcoming Deadlines (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Subject Priority Section */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Subject Priority</h2>
                <p className="font-sans text-xs text-slate-500 mt-0.5">
                  Ordered by exam proximity and confidence deficit
                </p>
              </div>
              <button 
                onClick={() => onNavigateTab('subjects')}
                className="font-sans text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-3 font-sans">
              {subjects.slice(0, 4).map((sub) => {
                const priorityBadge = 
                  sub.priority === 'High' ? 'text-rose-700 bg-rose-50 border-rose-200' :
                  sub.priority === 'Medium' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                  'text-slate-600 bg-slate-50 border-slate-200';

                return (
                  <div key={sub.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-slate-900">
                            {sub.code}
                          </span>
                          <span className="text-xs text-slate-300" aria-hidden="true">·</span>
                          <span className="font-sans text-xs text-slate-600 truncate max-w-[170px]">
                            {sub.name}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold font-sans px-2 py-0.5 rounded-md border ${priorityBadge}`}>
                        {sub.priority} Priority
                      </span>
                    </div>

                    {/* Progress & Confidence */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-500 font-sans">
                        <span>Confidence</span>
                        <span className="font-display font-bold text-slate-800 tabular-nums">
                          {sub.confidence}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${sub.confidence}%`,
                            backgroundColor: sub.color
                          }} 
                        />
                      </div>
                    </div>

                    {/* Next exam callout */}
                    {sub.nextExam && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 font-sans">
                        <span className="truncate">
                          Next: {sub.nextExam.title}
                        </span>
                        <span className="font-display font-bold text-indigo-600 shrink-0">
                          in {sub.nextExam.daysLeft} days
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Deadlines Section */}
          <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Upcoming Deadlines</h2>
                <p className="font-sans text-xs text-slate-500 mt-0.5">
                  Milestones, problem sets, and exams
                </p>
              </div>
              <span className="font-display text-xs font-bold text-slate-600 tabular-nums">
                {deadlines.filter(d => !d.completed).length} Pending
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 font-sans">
              {deadlines.map((dl) => {
                const urgencyColor = 
                  dl.daysRemaining <= 5 ? 'text-rose-600 bg-rose-50 border border-rose-100' :
                  dl.daysRemaining <= 10 ? 'text-amber-600 bg-amber-50 border border-amber-100' :
                  'text-slate-600 bg-slate-50 border border-slate-200/80';

                return (
                  <div key={dl.id} className="py-3 flex items-start justify-between gap-3 group">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => onToggleDeadline(dl.id)}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                        title={dl.completed ? "Mark incomplete" : "Mark submitted"}
                      >
                        {dl.completed ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-50" />
                        ) : (
                          <Circle className="w-4.5 h-4.5" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className={`text-xs ${
                          dl.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-900 font-medium'
                        }`}>
                          {dl.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-sans">
                          <span className="font-display font-bold text-slate-700">{dl.subjectCode}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span>{dl.dueDate}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-display font-semibold text-slate-600">{dl.weight}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className={`text-[11px] font-display font-bold px-2 py-0.5 rounded-md ${urgencyColor} tabular-nums`}>
                        {dl.daysRemaining}d left
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Assistant Help CTA */}
            <div className="mt-4 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3 font-sans">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs text-indigo-900 font-semibold truncate">
                  Need a revision plan for CS 301?
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('assistant')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                Ask AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
