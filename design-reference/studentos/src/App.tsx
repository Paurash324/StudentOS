import React, { useState } from 'react';
import { PageTab, Subject, TodayTask, Deadline, TimetableBlock, ChatMessage, StudentProfile, SubjectPriority } from './types';
import { 
  initialSubjects, 
  initialTodayTasks, 
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

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<PageTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // App Data State
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>(initialTodayTasks);
  const [deadlines, setDeadlines] = useState<Deadline[]>(initialDeadlines);
  const [weeklyActivity, setWeeklyActivity] = useState(weeklyStudyActivity);
  const [timetableBlocks, setTimetableBlocks] = useState<TimetableBlock[]>(initialTimetableBlocks);
  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>(initialAssistantMessages);
  const [profile, setProfile] = useState<StudentProfile>(initialProfile);

  // Focus Timer Modal State
  const [focusModalOpen, setFocusModalOpen] = useState<boolean>(false);
  const [focusModalTask, setFocusModalTask] = useState<string>("CS 301: Algorithms & Data Structures");

  // Quiz context
  const [quizSubjectId, setQuizSubjectId] = useState<string>("cs301");

  // Handlers
  const handleToggleTask = (taskId: string) => {
    setTodayTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

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
        // Dynamically adjust confidence slightly based on syllabus completion
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
    const newBlock: TimetableBlock = {
      id: `weak-review-${Date.now()}`,
      day: "Today",
      timeRange: "05:00 – 06:00 PM",
      subjectCode: subjectCode,
      subjectName: subjects.find(s => s.code === subjectCode)?.name || "Academic Review",
      topic: `Active Recall Drill: ${topicTitle}`,
      blockType: "Active Recall",
      durationMinutes: 60,
      completed: false,
    };

    setTimetableBlocks(prev => [...prev, newBlock]);

    // Also add to today's study plan
    const newTask: TodayTask = {
      id: `task-weak-${Date.now()}`,
      subjectCode: subjectCode,
      subjectName: subjects.find(s => s.code === subjectCode)?.name || "Academic Review",
      title: `Recall Drill: ${topicTitle}`,
      timeSlot: "05:00 – 06:00 PM",
      durationMinutes: 60,
      completed: false,
      priority: "High",
      category: "Revision",
    };

    setTodayTasks(prev => [...prev, newTask]);
  };

  const handleResetData = () => {
    setSubjects(initialSubjects);
    setTodayTasks(initialTodayTasks);
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
              todayTasks={todayTasks}
              onToggleTask={handleToggleTask}
              deadlines={deadlines}
              onToggleDeadline={handleToggleDeadline}
              weeklyActivity={weeklyActivity}
              onNavigateTab={setCurrentTab}
              onStartFocus={handleStartFocus}
            />
          )}

          {currentTab === 'subjects' && (
            <SubjectsView
              subjects={subjects}
              onAddSubject={handleAddSubject}
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
            />
          )}

          {currentTab === 'assistant' && (
            <AIAssistantView
              subjects={subjects}
              messages={assistantMessages}
              onAddMessage={(msg) => setAssistantMessages(prev => [...prev, msg])}
              onClearHistory={() => setAssistantMessages([])}
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
