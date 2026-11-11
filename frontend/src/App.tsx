import React, { useState, useEffect } from 'react';
import { PageTab, Subject, Deadline, TimetableBlock, ChatMessage, StudentProfile, SubjectPriority } from './types';
import { 
  initialSubjects, 
  initialDeadlines, 
  weeklyStudyActivity, 
  initialTimetableBlocks, 
  initialAssistantMessages, 
  initialProfile 
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SubjectsView } from './components/SubjectsView';
import { SmartPlannerView } from './components/SmartPlannerView';
import { AIAssistantView } from './components/AIAssistantView';
import { QuizGeneratorView } from './components/QuizGeneratorView';
import { SettingsView } from './components/SettingsView';
import { FocusTimerModal } from './components/FocusTimerModal';

// Helper for safe localStorage loading
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

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<PageTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // App Data State with localStorage initialization & data cleanup
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const loaded = loadFromStorage<Subject[]>('studentos_subjects', initialSubjects);
    // Remove temporary test subject "Storage Test Updated" if present in storage or state
    return loaded.filter(s => s.name !== "Storage Test Updated" && s.name !== "Storage Test" && s.code !== "TEST");
  });

  const [deadlines, setDeadlines] = useState<Deadline[]>(() => 
    loadFromStorage<Deadline[]>('studentos_deadlines', initialDeadlines)
  );

  const [weeklyActivity, setWeeklyActivity] = useState(() => 
    loadFromStorage('studentos_activity', weeklyStudyActivity)
  );

  // Single unified source of truth for the scheduled focus sessions and breaks
  const [timetableBlocks, setTimetableBlocks] = useState<TimetableBlock[]>(() => {
    const loaded = loadFromStorage<TimetableBlock[]>('studentos_timetable', initialTimetableBlocks);
    // If stored timetable has legacy 90m or 75m mock blocks from old demo data, upgrade to 45m initial blocks
    const hasLegacyDurations = loaded.some(b => b.durationMinutes === 90 || b.durationMinutes === 75);
    if (hasLegacyDurations && loaded.some(b => b.id === 'tt-1' || b.id === 'tt-2')) {
      return initialTimetableBlocks;
    }
    return loaded;
  });

  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>(() => 
    loadFromStorage<ChatMessage[]>('studentos_messages', initialAssistantMessages)
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
  const [focusModalTask, setFocusModalTask] = useState<string>("CS 301: Algorithms & Data Structures");

  // Quiz context
  const [quizSubjectId, setQuizSubjectId] = useState<string>("cs301");

  // One-time cleanup for obsolete parallel tasks storage key if present
  useEffect(() => {
    if (localStorage.getItem('studentos_tasks')) {
      localStorage.removeItem('studentos_tasks');
    }
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('studentos_subjects', JSON.stringify(subjects));
    } catch (e) {
      console.warn("Storage error for subjects:", e);
    }
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem('studentos_deadlines', JSON.stringify(deadlines));
    } catch (e) {
      console.warn("Storage error for deadlines:", e);
    }
  }, [deadlines]);

  useEffect(() => {
    try {
      localStorage.setItem('studentos_activity', JSON.stringify(weeklyActivity));
    } catch (e) {
      console.warn("Storage error for weeklyActivity:", e);
    }
  }, [weeklyActivity]);

  useEffect(() => {
    try {
      localStorage.setItem('studentos_timetable', JSON.stringify(timetableBlocks));
    } catch (e) {
      console.warn("Storage error for timetableBlocks:", e);
    }
  }, [timetableBlocks]);

  useEffect(() => {
    try {
      localStorage.setItem('studentos_messages', JSON.stringify(assistantMessages));
    } catch (e) {
      console.warn("Storage error for messages:", e);
    }
  }, [assistantMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('studentos_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn("Storage error for profile:", e);
    }
  }, [profile]);

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

  const handleEditSubject = (updatedSubject: Subject) => {
    setSubjects(prev => prev.map(s => s.id === updatedSubject.id ? updatedSubject : s));
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
  };

  const handleChangeSubjectPriority = (subjectId: string, newPriority: SubjectPriority) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, priority: newPriority };
      }
      return s;
    }));
  };

  const handleToggleTimetableBlock = (blockId: string) => {
    setTimetableBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return { ...b, completed: !b.completed };
      }
      return b;
    }));
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
    const newBlock: TimetableBlock = {
      id: `weak-review-${Date.now()}`,
      day: "Today",
      timeRange: "04:30 – 05:15 PM",
      subjectCode: subjectCode,
      subjectName: subjects.find(s => s.code === subjectCode)?.name || "Academic Review",
      topic: `Active Recall Drill: ${topicTitle}`,
      blockType: "Active Recall",
      durationMinutes: focusDuration,
      completed: false,
    };

    setTimetableBlocks(prev => [...prev, newBlock]);
  };

  const handleResetData = () => {
    localStorage.removeItem('studentos_subjects');
    localStorage.removeItem('studentos_tasks');
    localStorage.removeItem('studentos_deadlines');
    localStorage.removeItem('studentos_activity');
    localStorage.removeItem('studentos_timetable');
    localStorage.removeItem('studentos_messages');
    localStorage.removeItem('studentos_profile');

    setSubjects(initialSubjects);
    setDeadlines(initialDeadlines);
    setWeeklyActivity(weeklyStudyActivity);
    setTimetableBlocks(initialTimetableBlocks);
    setAssistantMessages(initialAssistantMessages);
    setProfile(initialProfile);
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
              onToggleBlock={handleToggleTimetableBlock}
              deadlines={deadlines}
              onToggleDeadline={handleToggleDeadline}
              weeklyActivity={weeklyActivity}
              profile={profile}
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
              onToggleBlock={handleToggleTimetableBlock}
              onUpdateBlocks={setTimetableBlocks}
              onChangeSubjectPriority={handleChangeSubjectPriority}
              onStartFocus={handleStartFocus}
              onNavigateTab={setCurrentTab}
              defaultFocusDuration={profile.pomodoroWorkMinutes || 45}
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

          {currentTab === 'settings' && (
            <SettingsView
              profile={profile}
              onUpdateProfile={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* Focus Mode Pomodoro Modal */}
      <FocusTimerModal
        isOpen={focusModalOpen}
        onClose={() => setFocusModalOpen(false)}
        initialTaskName={focusModalTask}
      />
    </div>
  );
}
