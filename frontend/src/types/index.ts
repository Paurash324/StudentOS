export type PageTab = 
  | 'dashboard' 
  | 'subjects' 
  | 'planner' 
  | 'assistant' 
  | 'quiz' 
  | 'exam'
  | 'settings';

export type SubjectDifficulty = 'Foundational' | 'Intermediate' | 'Advanced';
export type SubjectPriority = 'High' | 'Medium' | 'Low';

export interface SyllabusTopic {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
  estimatedHours: number;
  unitId?: string;
  unitTitle?: string;
}

/** Status of a subject's course syllabus in the Syllabus Intelligence workflow. */
export type SyllabusStatus = 'not_provided' | 'processing' | 'needs_review' | 'verified';
export type SyllabusSourceType = 'pdf' | 'manual';

/** A single topic inside a verified syllabus unit. */
export interface CourseTopic {
  id: string;
  name: string;
  subtopics: string[];
  learningOutcomes: string[];
}

/** A unit (module) inside a verified syllabus. */
export interface CourseUnit {
  id: string;
  unitNumber: number | null;
  title: string;
  topics: CourseTopic[];
}

/** Raw structured syllabus returned by POST /api/parse-syllabus. */
export interface ParsedSyllabusTopic {
  topic_name: string;
  subtopics: string[];
  learning_outcomes: string[];
}

export interface ParsedSyllabusUnit {
  unit_number: number | null;
  unit_title: string;
  topics: ParsedSyllabusTopic[];
}

export interface ParsedSyllabusData {
  subject_name: string;
  course_code: string;
  units: ParsedSyllabusUnit[];
}

export interface ParseSyllabusResult {
  syllabus: ParsedSyllabusData;
  warnings: string[];
  source_type: SyllabusSourceType;
  extracted_characters: number;
  page_count?: number | null;
  truncated: boolean;
}

/** Student-supplied, student-reviewed curriculum for a subject. */
export interface CourseSyllabus {
  status: SyllabusStatus;
  sourceType: SyllabusSourceType;
  units: CourseUnit[];
  warnings: string[];
  university?: string;
  degree?: string;
  semester?: string;
  courseCode?: string;
  verifiedAt?: string;
  extractedCharacters?: number;
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
  syllabus?: CourseSyllabus;
  pyq?: PyqAnalysis;
  nextExam?: {
    title: string;
    date: string;
    daysLeft: number;
    weight: string;
  };
}

/* ============================== Exam Intelligence ============================== */

export type PyqClassification = 'syllabus' | 'ai' | 'unclassified' | 'manual';

/** A single question extracted from one previous-year question paper. */
export interface PyqQuestion {
  id: string;
  number?: string;
  text: string;
  marks: number | null;
  unitId?: string;
  unitTitle?: string;
  topicId?: string;
  topicName?: string;
  subtopics: string[];
  classification: PyqClassification;
}

/** One uploaded previous-year paper, processed in memory and stored as text only. */
export interface PyqPaper {
  id: string;
  fileName: string;
  year: number | null;
  examLabel?: string;
  sourceType: 'pdf' | 'manual';
  uploadedAt: string;
  pageCount?: number | null;
  questions: PyqQuestion[];
  warnings: string[];
  reviewed: boolean;
}

export interface PyqAnalysis {
  papers: PyqPaper[];
  lastAnalyzedAt?: string;
}

export interface PyqQuestionRef {
  paperId: string;
  year: number | null;
  questionId: string;
  questionNumber?: string;
  text: string;
  marks: number | null;
}

/** Derived historical frequency for one syllabus topic (never a prediction). */
export interface PyqFrequencyItem {
  key: string;
  unitId?: string;
  unitTitle?: string;
  topicId?: string;
  topicName: string;
  occurrences: number;
  paperAppearances: number;
  totalPapers: number;
  years: number[];
  marksTotal: number;
  marksKnown: number;
  questions: PyqQuestionRef[];
}

/** Raw response from POST /api/analyze-pyq. */
export interface ParsedPyqQuestion {
  number?: string | null;
  text: string;
  marks: number | null;
  unit_title?: string | null;
  topic_name?: string | null;
  subtopics: string[];
  classification: PyqClassification;
}

export interface ParsedPyqResult {
  year: number | null;
  exam_label?: string | null;
  questions: ParsedPyqQuestion[];
  warnings: string[];
  source_type: 'pdf';
  extracted_characters: number;
  page_count?: number | null;
}

/** A verified examination from the date sheet. */
export interface ExamScheduleEntry {
  id: string;
  subjectId?: string;
  subjectCode: string;
  subjectName: string;
  examDate: string; // YYYY-MM-DD, empty when the source date was ambiguous
  startTime?: string; // HH:MM (24h)
  sourceType: 'pdf' | 'manual';
  verified: boolean;
  warnings: string[];
}

export interface ExamSchedule {
  entries: ExamScheduleEntry[];
  updatedAt?: string;
}

export interface ParsedDateSheetEntry {
  subject_name: string;
  course_code: string;
  exam_date: string | null;
  start_time?: string | null;
  warnings?: string[];
}

export interface ParseDateSheetResult {
  entries: ParsedDateSheetEntry[];
  warnings: string[];
  source_type: 'pdf';
  extracted_characters: number;
  page_count?: number | null;
}

export type StudyWindow = 'morning' | 'afternoon' | 'evening' | 'night';

export interface StudyAvailability {
  dailyHours: number;
  preferredWindows: StudyWindow[];
  unavailableDays: string[];
  sessionMinutes: number;
  bufferMinutes: number;
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
  blockType: 'Deep Work' | 'Problem Solving' | 'Active Recall' | 'Review' | 'PYQ Practice' | 'Break';
  durationMinutes: number;
  completed: boolean;
  unitTitle?: string;
  topicId?: string;
  reason?: string;
  pinned?: boolean;
  generatedBy?: 'exam-engine' | 'planner' | 'manual';
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
