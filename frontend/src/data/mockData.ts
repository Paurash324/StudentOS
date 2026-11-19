import { StudentProfile } from '../types';

/**
 * Neutral first-run profile only.
 *
 * StudentOS intentionally ships no demo subjects, deadlines, timetable blocks
 * or study activity: the student's own subjects are the single source of truth,
 * and empty states are shown until real data exists.
 */
export const initialProfile: StudentProfile = {
  name: "Student",
  email: "student@university.edu",
  university: "University",
  major: "Computer Science",
  degree: "B.S. in Computer Science",
  semester: "Semester 4",
  avatarUrl: "",
  targetGpa: 3.90,
  currentGpa: 3.82,
  dailyGoalHours: 5.0,
  pomodoroWorkMinutes: 45,
  pomodoroBreakMinutes: 10,
};
