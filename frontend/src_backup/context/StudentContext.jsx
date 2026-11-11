import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { INITIAL_SUBJECTS, INITIAL_PREFERENCES, INITIAL_ACTIVITY_HISTORY } from "../utils/sampleData";
import { generateDailySchedule } from "../utils/plannerGenerator";
import { rankSubjects } from "../utils/priorityCalculator";
import { checkBackendHealth } from "../services/api";

const StudentContext = createContext(null);

const STORAGE_KEYS = {
  SUBJECTS: "studentos_subjects_v1",
  PREFERENCES: "studentos_prefs_v1",
  SCHEDULE: "studentos_schedule_v1",
  ACTIVITY: "studentos_activity_v1",
  QUIZ_HISTORY: "studentos_quiz_history_v1"
};

export function StudentProvider({ children }) {
  // 1. Subjects State
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load subjects from localStorage:", e);
    }
    return INITIAL_SUBJECTS;
  });

  // 2. Preferences State
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load preferences:", e);
    }
    return INITIAL_PREFERENCES;
  });

  // 3. Activity History
  const [activityHistory, setActivityHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load activity:", e);
    }
    return INITIAL_ACTIVITY_HISTORY;
  });

  // 4. Daily Schedule
  const [dailySchedule, setDailySchedule] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load schedule:", e);
    }
    return generateDailySchedule({
      subjects: INITIAL_SUBJECTS,
      dailyHours: INITIAL_PREFERENCES.dailyTargetHours,
      blockMinutes: INITIAL_PREFERENCES.preferredBlockMinutes,
      breakMinutes: INITIAL_PREFERENCES.breakMinutes,
      startTime: INITIAL_PREFERENCES.startTime
    });
  });

  // 5. Quiz History
  const [quizHistory, setQuizHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load quiz history:", e);
    }
    return [
      {
        id: "sample-quiz-1",
        title: "Distributed Systems - Raft Consensus",
        subject: "Distributed Systems & Cloud",
        score: 4,
        total: 5,
        percentage: 80,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString()
      }
    ];
  });

  // 6. Navigation and context passing
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, subjects, priority, planner, chat, quiz
  const [quizDraftParams, setQuizDraftParams] = useState(null);
  const [chatDraftParams, setChatDraftParams] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 7. Backend health state
  const [backendHealth, setBackendHealth] = useState({
    status: "checking",
    groq_configured: false,
    groq_model: "llama-3.3-70b-versatile"
  });

  // Check health on mount
  useEffect(() => {
    let isMounted = true;
    async function loadHealth() {
      const data = await checkBackendHealth();
      if (isMounted) {
        setBackendHealth(data);
      }
    }
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const refreshHealth = async () => {
    const data = await checkBackendHealth();
    setBackendHealth(data);
    return data;
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
      console.error(e);
    }
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (e) {
      console.error(e);
    }
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(dailySchedule));
    } catch (e) {
      console.error(e);
    }
  }, [dailySchedule]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activityHistory));
    } catch (e) {
      console.error(e);
    }
  }, [activityHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(quizHistory));
    } catch (e) {
      console.error(e);
    }
  }, [quizHistory]);

  // Subject Operations
  const addSubject = (newSubject) => {
    const id = `sub-${Date.now()}`;
    const subjectWithId = {
      ...newSubject,
      id,
      hoursStudied: Number(newSubject.hoursStudied) || 0,
      targetHours: Number(newSubject.targetHours) || 25,
      credits: Number(newSubject.credits) || 3,
      difficulty: Number(newSubject.difficulty) || 3,
      confidence: Number(newSubject.confidence) || 3,
      color: newSubject.color || "#4f46e5"
    };
    setSubjects((prev) => [...prev, subjectWithId]);
    return subjectWithId;
  };

  const updateSubject = (id, updatedFields) => {
    setSubjects((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, ...updatedFields } : sub))
    );
  };

  const deleteSubject = (id) => {
    setSubjects((prev) => prev.filter((sub) => sub.id !== id));
    // Also remove from daily schedule
    setDailySchedule((prev) => prev.filter((block) => block.subjectId !== id));
  };

  const logStudyTime = (subjectId, minutes) => {
    const hours = minutes / 60;
    setSubjects((prev) =>
      prev.map((sub) => {
        if (sub.id === subjectId) {
          return {
            ...sub,
            hoursStudied: Math.round((sub.hoursStudied + hours) * 10) / 10
          };
        }
        return sub;
      })
    );

    // Update today's study activity (last day in array)
    setActivityHistory((prev) => {
      const copy = [...prev];
      if (copy.length > 0) {
        const lastIdx = copy.length - 1;
        copy[lastIdx] = {
          ...copy[lastIdx],
          hours: Math.round((copy[lastIdx].hours + hours) * 10) / 10
        };
      }
      return copy;
    });
  };

  // Schedule Operations
  const toggleTaskCompleted = (blockId) => {
    setDailySchedule((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, completed: !block.completed } : block
      )
    );
  };

  const regenerateSchedule = (customHours = null) => {
    const hours = customHours ?? preferences.dailyTargetHours;
    const newSchedule = generateDailySchedule({
      subjects,
      dailyHours: hours,
      blockMinutes: preferences.preferredBlockMinutes,
      breakMinutes: preferences.breakMinutes,
      startTime: preferences.startTime
    });
    setDailySchedule(newSchedule);
    return newSchedule;
  };

  const saveQuizResult = (result) => {
    const entry = {
      id: `quiz-${Date.now()}`,
      title: result.title,
      subject: result.subject,
      score: result.score,
      total: result.total,
      percentage: Math.round((result.score / result.total) * 100),
      date: new Date().toLocaleDateString()
    };
    setQuizHistory((prev) => [entry, ...prev]);
  };

  const resetToDemoData = () => {
    setSubjects(INITIAL_SUBJECTS);
    setPreferences(INITIAL_PREFERENCES);
    setActivityHistory(INITIAL_ACTIVITY_HISTORY);
    const freshSchedule = generateDailySchedule({
      subjects: INITIAL_SUBJECTS,
      dailyHours: INITIAL_PREFERENCES.dailyTargetHours,
      blockMinutes: INITIAL_PREFERENCES.preferredBlockMinutes,
      breakMinutes: INITIAL_PREFERENCES.breakMinutes,
      startTime: INITIAL_PREFERENCES.startTime
    });
    setDailySchedule(freshSchedule);
    setQuizHistory([
      {
        id: "sample-quiz-1",
        title: "Distributed Systems - Raft Consensus",
        subject: "Distributed Systems & Cloud",
        score: 4,
        total: 5,
        percentage: 80,
        date: new Date().toLocaleDateString()
      }
    ]);
  };

  const clearAllData = () => {
    setSubjects([]);
    setDailySchedule([]);
    setQuizHistory([]);
    localStorage.clear();
  };

  // Memoized Ranked Subjects
  const rankedSubjects = useMemo(() => {
    return rankSubjects(subjects);
  }, [subjects]);

  const value = {
    subjects,
    rankedSubjects,
    preferences,
    dailySchedule,
    activityHistory,
    quizHistory,
    activeTab,
    quizDraftParams,
    chatDraftParams,
    isSettingsOpen,
    backendHealth,
    setActiveTab,
    setQuizDraftParams,
    setChatDraftParams,
    setIsSettingsOpen,
    addSubject,
    updateSubject,
    deleteSubject,
    logStudyTime,
    setPreferences,
    toggleTaskCompleted,
    regenerateSchedule,
    saveQuizResult,
    resetToDemoData,
    clearAllData,
    refreshHealth
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("useStudent must be used within a StudentProvider");
  }
  return context;
}

