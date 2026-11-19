import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageTab, Subject, Deadline, TimetableBlock, ChatMessage, StudentProfile, SubjectPriority, ExamSchedule, StudyAvailability, StudyLogEntry } from './types';
import { initialProfile } from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { ExamIntelligenceView } from './components/ExamIntelligenceView';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SubjectsView } from './components/SubjectsView';
import { SmartPlannerView } from './components/SmartPlannerView';
import { AIAssistantView } from './components/AIAssistantView';
import { QuizGeneratorView } from './components/QuizGeneratorView';
import { SettingsView } from './components/SettingsView';
import { FocusTimerModal } from './components/FocusTimerModal';
import { migrateChatMessages } from './utils/aiContext';
import { normalizeCode, normalizeExamSchedule } from './utils/dateSheet';
import { DEFAULT_AVAILABILITY, localIsoDate, normalizeAvailability } from './utils/examEngine';
import {
  applyRecoveryImport,
  attachSubjectIds,
  bootstrapStudentState,
  buildRecoveryPreview,
  buildUpcomingDeadlines,
  buildWeeklyActivity,
  canOfferRecovery,
  computeStudyStreak,
  deleteSubjectFromPlan,
  getBrowserStorage,
  markRecoveryImported,
  persistSubjectsSafely,
  renameSubjectInExamSchedule,
  renameSubjectInPlan,
  snapshotPlanBeforeReset,
  STUDENT_STATE_STORAGE_KEYS,
  STUDENT_STATE_VERSION_KEY,
  toggleSessionCompletion,
} from './utils/studentState';

// Targeted migration runs once before React reads the store, so stale demo
// records are removed before any view can render them.
const bootstrap = bootstrapStudentState(getBrowserStorage());

// Helper for safe localStorage loading of keys not owned by the plan state.
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Failed to parse localStorage key ${key}:`, err);
    return fallback;
  }
}

function persist(key: string, value: unknown, label: string): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Storage error for ${label}:`, err);
  }
}

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<PageTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Active subjects are the single source of truth for every dependent view.
  const [subjects, setSubjects] = useState<Subject[]>(bootstrap.subjects);
  const [deadlines, setDeadlines] = useState<Deadline[]>(bootstrap.deadlines);

  // Single unified source of truth for the scheduled focus sessions and breaks
  const [timetableBlocks, setTimetableBlocks] = useState<TimetableBlock[]>(
    bootstrap.timetableBlocks
  );

  // Genuine completed-session history powering the weekly activity chart.
  const [studyLog, setStudyLog] = useState<StudyLogEntry[]>(bootstrap.studyLog);

  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>(() =>
    // Drop the outdated hardcoded starter greeting but keep genuine conversation history.
    migrateChatMessages(loadFromStorage<ChatMessage[]>('studentos_messages', []))
  );

  // Phase 2 Exam Intelligence state (safe, version-tolerant loaders)
  const [examSchedule, setExamSchedule] = useState<ExamSchedule>(() =>
    normalizeExamSchedule(loadFromStorage('studentos_exam_schedule', { entries: [] }))
  );

  const [availability, setAvailability] = useState<StudyAvailability>(() =>
    normalizeAvailability(loadFromStorage('studentos_study_availability', DEFAULT_AVAILABILITY))
  );

  const [profile, setProfile] = useState<StudentProfile>(() => {
    const loaded = loadFromStorage<StudentProfile>('studentos_profile', initialProfile);
    // Remove legacy demo identity "Alex Rivera" if stored from previous sessions
    if (loaded.name === "Alex Rivera" || loaded.email === "alex.rivera@cs.stanford.edu") {
      return initialProfile;
    }
    return loaded;
  });

  // Focus Timer Modal State
  const [focusModalOpen, setFocusModalOpen] = useState<boolean>(false);
  const [focusModalTask, setFocusModalTask] = useState<string>(
    bootstrap.subjects[0]
      ? `${bootstrap.subjects[0].code}: ${bootstrap.subjects[0].name}`
      : 'Deep Work Session'
  );

  // Quiz context
  const [quizSubjectId, setQuizSubjectId] = useState<string>(bootstrap.subjects[0]?.id ?? '');

  // Derived, honest data: deadlines only from verified dates / saved milestones,
  // activity only from completed sessions.
  const upcomingDeadlines = useMemo(
    () => buildUpcomingDeadlines(subjects, examSchedule, deadlines, new Date()),
    [subjects, examSchedule, deadlines]
  );

  const weeklyActivity = useMemo(
    () => buildWeeklyActivity(studyLog, subjects, profile.dailyGoalHours || 5, new Date()),
    [studyLog, subjects, profile.dailyGoalHours]
  );

  // Genuine totals for the focus timer's footer.
  const todayStudyEntries = useMemo(
    () => studyLog.filter(entry => entry.date === localIsoDate(new Date())),
    [studyLog]
  );
  const todayStudyMinutes = todayStudyEntries.reduce((sum, entry) => sum + entry.minutes, 0);
  const studyStreak = useMemo(() => computeStudyStreak(studyLog), [studyLog]);

  // Keep the quiz subject valid as subjects are added, renamed or deleted.
  useEffect(() => {
    if (!subjects.some(subject => subject.id === quizSubjectId)) {
      setQuizSubjectId(subjects[0]?.id ?? '');
    }
  }, [subjects, quizSubjectId]);

  // Subjects are written only through the guarded writer: an empty list can
  // never overwrite a stored catalog unless the student deleted the last one.
  const allowEmptySubjectsWrite = useRef(false);
  useEffect(() => {
    persistSubjectsSafely(getBrowserStorage(), subjects, {
      allowEmpty: allowEmptySubjectsWrite.current,
    });
    allowEmptySubjectsWrite.current = false;
  }, [subjects]);

  useEffect(() => {
    persist('studentos_deadlines', deadlines, 'deadlines');
  }, [deadlines]);

  useEffect(() => {
    persist(STUDENT_STATE_STORAGE_KEYS.studyLog, studyLog, 'study log');
  }, [studyLog]);

  useEffect(() => {
    persist('studentos_timetable', timetableBlocks, 'timetable');
  }, [timetableBlocks]);

  useEffect(() => {
    persist('studentos_messages', assistantMessages, 'messages');
  }, [assistantMessages]);

  useEffect(() => {
    persist('studentos_profile', profile, 'profile');
  }, [profile]);

  useEffect(() => {
    persist('studentos_exam_schedule', examSchedule, 'exam schedule');
  }, [examSchedule]);

  useEffect(() => {
    persist('studentos_study_availability', availability, 'study availability');
  }, [availability]);

  // Handlers
  const handleToggleDeadline = (deadlineId: string) => {
    setDeadlines(prev => prev.map(d => {
      if (d.id === deadlineId) {
        return { ...d, completed: !d.completed };
      }
      return d;
    }));
  };

  const handleToggleTopic = (subjectId: string, topicId: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const updatedTopics = s.topics.map(t => {
          if (t.id === topicId) {
            return { ...t, completed: !t.completed };
          }
          return t;
        });
        // Dynamically adjust confidence based on syllabus completion
        const completedCount = updatedTopics.filter(t => t.completed).length;
        const newConfidence = Math.min(98, Math.max(30, Math.round((completedCount / updatedTopics.length) * 90) + 10));
        return { ...s, topics: updatedTopics, confidence: newConfidence };
      }
      return s;
    }));
  };

  const handleAddSubject = (newSubject: Subject) => {
    setSubjects(prev => [newSubject, ...prev]);
  };

  // Creates a missing subject from a date-sheet entry and returns it for matching.
  const handleCreateSubjectFromExam = (name: string, code: string): Subject => {
    const subject: Subject = {
      id: `sub-${Date.now()}`,
      code: (code || name).trim().toUpperCase(),
      name: name.trim() || code.trim().toUpperCase(),
      credits: 3,
      professor: 'Faculty Instructor',
      difficulty: 'Intermediate',
      confidence: 70,
      priority: 'Medium',
      color: '#6366F1',
      accentBg: '#EEF2FF',
      topics: [],
    };
    setSubjects(prev => [subject, ...prev]);
    return subject;
  };

  const handleEditSubject = (updatedSubject: Subject) => {
    const previous = subjects.find(s => s.id === updatedSubject.id);
    const next = renameSubjectInPlan(updatedSubject, { subjects, timetableBlocks, deadlines });
    setSubjects(next.subjects);
    setTimetableBlocks(next.timetableBlocks);
    setDeadlines(next.deadlines);
    setExamSchedule(prev => renameSubjectInExamSchedule(prev, updatedSubject, previous));
  };

  const handleDeleteSubject = (subjectId: string) => {
    const removed = subjects.find(s => s.id === subjectId);
    const next = deleteSubjectFromPlan(subjectId, { subjects, timetableBlocks, deadlines });
    // Deleting the final subject is the one legitimate way to persist an empty list.
    allowEmptySubjectsWrite.current = next.subjects.length === 0;
    setSubjects(next.subjects);
    setTimetableBlocks(next.timetableBlocks);
    setDeadlines(next.deadlines);
    if (removed && quizSubjectId === removed.id) {
      setQuizSubjectId(next.subjects[0]?.id ?? '');
    }
    if (removed && focusModalTask.startsWith(removed.code)) {
      setFocusModalTask(
        next.subjects[0] ? `${next.subjects[0].code}: ${next.subjects[0].name}` : 'Deep Work Session'
      );
    }
  };

  const handleChangeSubjectPriority = (subjectId: string, newPriority: SubjectPriority) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, priority: newPriority };
      }
      return s;
    }));
  };

  const handleToggleBlock = (blockId: string) => {
    const next = toggleSessionCompletion(blockId, { subjects, timetableBlocks, studyLog });
    setTimetableBlocks(next.timetableBlocks);
    setStudyLog(next.studyLog);
  };

  // Every writer of the timetable links sessions to the current subject IDs.
  const handleUpdateBlocks = (blocks: TimetableBlock[]) => {
    setTimetableBlocks(attachSubjectIds(blocks, subjects));
  };

  const handleStartFocus = (taskTitle?: string) => {
    if (taskTitle) {
      setFocusModalTask(taskTitle);
    }
    setFocusModalOpen(true);
  };

  const handleLaunchQuizForSubject = (subjectId: string) => {
    setQuizSubjectId(subjectId);
    setCurrentTab('quiz');
  };

  const handleAddWeakTopicToPlanner = (topicTitle: string, subjectCode: string) => {
    const focusDuration = profile.pomodoroWorkMinutes || 45;
    const subject = subjects.find(s => normalizeCode(s.code) === normalizeCode(subjectCode));
    const newBlock: TimetableBlock = {
      id: `weak-review-${Date.now()}`,
      day: "Today",
      timeRange: "04:30 – 05:15 PM",
      subjectId: subject?.id,
      subjectCode: subject?.code ?? subjectCode,
      subjectName: subject?.name ?? "Academic Review",
      topic: `Active Recall Drill: ${topicTitle}`,
      blockType: "Active Recall",
      durationMinutes: focusDuration,
      completed: false,
    };

    setTimetableBlocks(prev => [...prev, newBlock]);
  };

  // One-time, user-triggered recovery of the confirmed subject catalog.
  const recoveryPreview = useMemo(() => buildRecoveryPreview(), []);
  const recoveryAvailable = useMemo(
    () => canOfferRecovery(getBrowserStorage(), subjects.length),
    [subjects.length]
  );

  const handleImportRecovery = () => {
    const merged = applyRecoveryImport(subjects, recoveryPreview.subjects);
    allowEmptySubjectsWrite.current = merged.length === 0;
    setSubjects(merged);
    markRecoveryImported(getBrowserStorage());
  };

  const handleResetData = () => {
    const confirmed = window.confirm(
      'Reset all StudentOS data to defaults? A local snapshot is saved first, but the current plan will be cleared.'
    );
    if (!confirmed) return;
    snapshotPlanBeforeReset(getBrowserStorage(), {
      subjects,
      deadlines,
      timetableBlocks,
      studyLog,
      assistantMessages,
      examSchedule,
      availability,
    });
    allowEmptySubjectsWrite.current = true;
    localStorage.removeItem('studentos_subjects');
    localStorage.removeItem('studentos_tasks');
    localStorage.removeItem('studentos_deadlines');
    localStorage.removeItem('studentos_activity');
    localStorage.removeItem('studentos_timetable');
    localStorage.removeItem('studentos_messages');
    localStorage.removeItem('studentos_profile');
    localStorage.removeItem('studentos_exam_schedule');
    localStorage.removeItem('studentos_study_availability');
    localStorage.removeItem(STUDENT_STATE_STORAGE_KEYS.studyLog);
    localStorage.removeItem(STUDENT_STATE_VERSION_KEY);

    // Defaults are an empty, honest workspace — never the demo dataset.
    setSubjects([]);
    setDeadlines([]);
    setTimetableBlocks([]);
    setStudyLog([]);
    setAssistantMessages([]);
    setProfile(initialProfile);
    setExamSchedule({ entries: [] });
    setAvailability({ ...DEFAULT_AVAILABILITY });
    setQuizSubjectId('');
    setFocusModalTask('Deep Work Session');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex text-slate-900 font-sans antialiased">
      {/* 1. Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        todayStudyMinutes={todayStudyMinutes}
        studyStreak={studyStreak}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 md:pl-72 flex flex-col min-w-0">
        {/* Header */}
        <Header
          currentTab={currentTab}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenFocusTimer={() => handleStartFocus()}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              subjects={subjects}
              timetableBlocks={timetableBlocks}
              onToggleBlock={handleToggleBlock}
              deadlines={upcomingDeadlines}
              onToggleDeadline={handleToggleDeadline}
              weeklyActivity={weeklyActivity}
              profile={profile}
              examSchedule={examSchedule}
              availability={availability}
              onNavigateTab={setCurrentTab}
              onStartFocus={handleStartFocus}
            />
          )}

          {currentTab === 'subjects' && (
            <SubjectsView
              subjects={subjects}
              onAddSubject={handleAddSubject}
              onEditSubject={handleEditSubject}
              onDeleteSubject={handleDeleteSubject}
              onToggleTopic={handleToggleTopic}
              onLaunchQuizForSubject={handleLaunchQuizForSubject}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'planner' && (
            <SmartPlannerView
              subjects={subjects}
              timetableBlocks={timetableBlocks}
              onToggleBlock={handleToggleBlock}
              onUpdateBlocks={handleUpdateBlocks}
              onChangeSubjectPriority={handleChangeSubjectPriority}
              onStartFocus={handleStartFocus}
              onNavigateTab={setCurrentTab}
              defaultFocusDuration={profile.pomodoroWorkMinutes || 45}
              examSchedule={examSchedule}
              availability={availability}
            />
          )}

          {currentTab === 'assistant' && (
            <AIAssistantView
              subjects={subjects}
              messages={assistantMessages}
              onAddMessage={(msg) => setAssistantMessages(prev => [...prev, msg])}
              onClearHistory={() => setAssistantMessages([])}
              userName={profile.name}
            />
          )}

          {currentTab === 'quiz' && (
            <QuizGeneratorView
              subjects={subjects}
              initialSubjectId={quizSubjectId}
              onNavigateTab={setCurrentTab}
              onAddWeakTopicToPlanner={handleAddWeakTopicToPlanner}
            />
          )}

          {currentTab === 'exam' && (
            <ExamIntelligenceView
              subjects={subjects}
              examSchedule={examSchedule}
              availability={availability}
              onSaveSchedule={setExamSchedule}
              onSaveAvailability={setAvailability}
              onUpdateSubject={handleEditSubject}
              onCreateSubject={handleCreateSubjectFromExam}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              profile={profile}
              onUpdateProfile={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
              onResetData={handleResetData}
              recoveryAvailable={recoveryAvailable}
              recoverySubjects={recoveryPreview.subjects}
              recoverySyllabi={recoveryPreview.syllabiNeedingReverification}
              onImportRecovery={handleImportRecovery}
            />
          )}
        </main>
      </div>

      {/* Focus Mode Pomodoro Modal */}
      <FocusTimerModal
        isOpen={focusModalOpen}
        onClose={() => setFocusModalOpen(false)}
        initialTaskName={focusModalTask}
        sessionsCompletedToday={todayStudyEntries.length}
        minutesToday={todayStudyMinutes}
      />
    </div>
  );
}
