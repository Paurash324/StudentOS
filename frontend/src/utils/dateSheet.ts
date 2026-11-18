import { ExamSchedule, ExamScheduleEntry, Subject } from '../types';
import { makeId } from './syllabus';

/** Date-sheet validation and subject matching (deterministic, no AI). */

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function normalizeCode(value: string): string {
  return (value || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
}

export function normalizeName(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  // Compare local calendar fields so timezone offsets cannot shift the date.
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function genEntryId(): string {
  return makeId('exam');
}

export function matchEntryToSubject(
  entry: Pick<ExamScheduleEntry, 'subjectId' | 'subjectCode' | 'subjectName'>,
  subjects: Subject[]
): Subject | undefined {
  if (entry.subjectId) {
    const direct = subjects.find(subject => subject.id === entry.subjectId);
    if (direct) return direct;
  }
  const code = normalizeCode(entry.subjectCode);
  if (code) {
    const byCode = subjects.find(subject => normalizeCode(subject.code) === code);
    if (byCode) return byCode;
  }
  const name = normalizeName(entry.subjectName);
  if (name) {
    return (
      subjects.find(subject => normalizeName(subject.name) === name) ??
      subjects.find(
        subject =>
          normalizeName(subject.name).includes(name) || name.includes(normalizeName(subject.name))
      )
    );
  }
  return undefined;
}

function normalizeTime(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return undefined;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    if (hours < 1 || hours > 12) return undefined;
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return undefined;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function normalizeEntry(raw: any): ExamScheduleEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const subjectName = typeof raw.subjectName === 'string' ? raw.subjectName.trim() : '';
  const subjectCode = typeof raw.subjectCode === 'string' ? raw.subjectCode.trim() : '';
  if (!subjectName && !subjectCode) return null;

  const rawDate = typeof raw.examDate === 'string' ? raw.examDate.trim() : '';
  const examDate = isIsoDate(rawDate) ? rawDate : '';

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : genEntryId(),
    subjectId: typeof raw.subjectId === 'string' ? raw.subjectId : undefined,
    subjectCode,
    subjectName: subjectName || subjectCode,
    examDate,
    startTime: normalizeTime(raw.startTime),
    sourceType: raw.sourceType === 'pdf' ? 'pdf' : 'manual',
    verified: Boolean(raw.verified),
    warnings: Array.isArray(raw.warnings)
      ? raw.warnings.filter((item: unknown): item is string => typeof item === 'string')
      : [],
  };
}

export function normalizeExamSchedule(raw: any): ExamSchedule {
  if (!raw || typeof raw !== 'object') return { entries: [] };
  const entries = (Array.isArray(raw.entries) ? raw.entries : [])
    .map(normalizeEntry)
    .filter((entry: ExamScheduleEntry | null): entry is ExamScheduleEntry => entry !== null);
  return {
    entries,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

export function formatExamDate(iso: string): string {
  if (!isIsoDate(iso)) return 'Date not set';
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export interface ScheduleIssues {
  invalidDates: Set<string>;
  ambiguousDates: Set<string>;
  duplicates: Set<string>;
  unmatched: Set<string>;
  unmatchedCount: number;
  validCount: number;
}

/**
 * Detects invalid/ambiguous dates, duplicate exams (same subject + date),
 * and entries that do not map to a StudentOS subject.
 */
export function findScheduleIssues(
  entries: ExamScheduleEntry[],
  subjects: Subject[]
): ScheduleIssues {
  const invalidDates = new Set<string>();
  const ambiguousDates = new Set<string>();
  const duplicates = new Set<string>();
  const unmatched = new Set<string>();
  const seen = new Map<string, string[]>();

  entries.forEach(entry => {
    if (!isIsoDate(entry.examDate)) {
      invalidDates.add(entry.id);
      ambiguousDates.add(entry.id);
    }
    if (entry.warnings.some(warning => warning.toLowerCase().includes('ambiguous'))) {
      ambiguousDates.add(entry.id);
    }

    const subject = matchEntryToSubject(entry, subjects);
    if (!subject) unmatched.add(entry.id);

    const subjectKey = subject?.id || normalizeCode(entry.subjectCode) || normalizeName(entry.subjectName);
    if (subjectKey && entry.examDate) {
      const key = `${subjectKey}|${entry.examDate}`;
      const ids = seen.get(key) ?? [];
      ids.push(entry.id);
      seen.set(key, ids);
    }
  });

  seen.forEach(ids => {
    if (ids.length > 1) ids.forEach(id => duplicates.add(id));
  });

  return {
    invalidDates,
    ambiguousDates,
    duplicates,
    unmatched,
    unmatchedCount: unmatched.size,
    validCount: entries.length - invalidDates.size,
  };
}

export function sortScheduleEntries(entries: ExamScheduleEntry[]): ExamScheduleEntry[] {
  return [...entries].sort((a, b) => {
    if (!a.examDate && !b.examDate) return a.subjectName.localeCompare(b.subjectName);
    if (!a.examDate) return 1;
    if (!b.examDate) return -1;
    return a.examDate.localeCompare(b.examDate) || (a.startTime ?? '').localeCompare(b.startTime ?? '');
  });
}
