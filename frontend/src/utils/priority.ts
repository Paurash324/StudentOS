import { Subject } from '../types';

export type FocusGoal = 'exam' | 'balanced' | 'deepWork';

/**
 * Computes an algorithmic priority score for a subject based on:
 * - Exam proximity (0-4 days: 100, 5-7 days: 85, etc.)
 * - Confidence deficit (100 - confidence)
 * - Subject difficulty (Advanced: 100, Intermediate: 60, Foundational: 30)
 * - Credit weight (credits / 6 * 100)
 * - User-assigned priority multiplier (High: 1.3, Medium: 1.0, Low: 0.7)
 *
 * Used identically in Smart Planner and Dashboard Subject Priority.
 */
export function computeSubjectScore(s: Subject, focusGoal: FocusGoal = 'exam'): number {
  const diffScore = s.difficulty === 'Advanced' ? 100 : s.difficulty === 'Intermediate' ? 60 : 30;
  const deficitScore = 100 - s.confidence;

  let examScore = 0;
  if (s.nextExam && s.nextExam.daysLeft !== undefined) {
    const days = s.nextExam.daysLeft;
    if (days <= 4) examScore = 100;
    else if (days <= 7) examScore = 85;
    else if (days <= 14) examScore = 65;
    else if (days <= 30) examScore = 40;
    else examScore = 20;
  }

  const creditsScore = (s.credits / 6) * 100;
  const priorityMultiplier = s.priority === 'High' ? 1.3 : s.priority === 'Medium' ? 1.0 : 0.7;

  let baseScore = 0;
  if (focusGoal === 'exam') {
    baseScore = (0.50 * examScore) + (0.25 * deficitScore) + (0.15 * diffScore) + (0.10 * creditsScore);
  } else if (focusGoal === 'deepWork') {
    baseScore = (0.45 * diffScore) + (0.35 * deficitScore) + (0.10 * examScore) + (0.10 * creditsScore);
  } else {
    const uncompletedCount = s.topics.filter(t => !t.completed).length;
    const syllabusRatio = (uncompletedCount / Math.max(1, s.topics.length)) * 100;
    baseScore = (0.35 * deficitScore) + (0.30 * syllabusRatio) + (0.20 * diffScore) + (0.15 * examScore);
  }

  return baseScore * priorityMultiplier;
}

/**
 * Returns a new array of subjects sorted by priority descending.
 */
export function sortSubjectsByPriority(subjects: Subject[], focusGoal: FocusGoal = 'exam'): Subject[] {
  return [...subjects].sort((a, b) => computeSubjectScore(b, focusGoal) - computeSubjectScore(a, focusGoal));
}

