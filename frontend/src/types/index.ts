export type PageTab = 
  | 'dashboard' 
  | 'subjects' 
  | 'planner' 
  | 'assistant' 
  | 'quiz' 
  | 'settings';

export type SubjectDifficulty = 'Foundational' | 'Intermediate' | 'Advanced';
export type SubjectPriority = 'High' | 'Medium' | 'Low';

export interface SyllabusTopic {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
  estimatedHours: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  professor: string;
  difficulty: SubjectDifficulty;
  confidence: number; // 0 to 100
  priority: SubjectPriority;
  color: string;
  accentBg: string;
  topics: SyllabusTopic[];
  nextExam?: {
    title: string;
    date: string;
    daysLeft: number;
    weight: string;
  };
}

export interface TodayTask {
  id: string;
  subjectCode: string;
  subjectName: string;
  title: string;
  timeSlot: string;
  durationMinutes: number;
  completed: boolean;
  priority: SubjectPriority;
  category: 'Deep Work' | 'Practice' | 'Revision' | 'Lab Work';
}

export interface Deadline {
  id: string;
  subjectCode: string;
  title: string;
  dueDate: string;
  daysRemaining: number;
  type: 'Exam' | 'Assignment' | 'Lab Report' | 'Project';
  urgency: 'high' | 'medium' | 'normal';
  weight: string;
  completed: boolean;
}

export interface DailyActivity {
  day: string;
  shortDay: string;
  hours: number;
  target: number;
  subjects: { name: string; hours: number; color: string }[];
}

export interface TimetableBlock {
  id: string;
  day: string;
  timeRange: string;
  subjectCode: string;
  subjectName: string;
  topic: string;
  blockType: 'Deep Work' | 'Problem Solving' | 'Active Recall' | 'Review' | 'Break';
  durationMinutes: number;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  subjectContext?: string;
  suggestedFollowUps?: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

export interface QuizConfig {
  subjectId: string;
  topic: string;
  questionCount: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Challenging';
}

export interface StudentProfile {
  name: string;
  email: string;
  university: string;
  major: string;
  degree: string;
  semester: string;
  avatarUrl: string;
  targetGpa: number;
  currentGpa: number;
  dailyGoalHours: number;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
}
