import {
  DailyActivity,
  Deadline,
  ExamSchedule,
  StudyLogEntry,
  Subject,
  TimetableBlock,
} from '../types';
import {
  formatExamDate,
  isIsoDate,
  matchEntryToSubject,
  normalizeCode,
  WEEKDAYS,
} from './dateSheet';
import { getEligibleExams, localIsoDate } from './examEngine';
import { migrateSubjects } from './syllabus';
import {
  buildRecoverySubjects,
  RECOVERY_SYLLABUS_NEEDS_REVERIFICATION,
} from '../data/recoverySubjects';

/**
 * Student-state helpers.
 *
 * Active subjects are the single source of truth. Timetable sessions and
 * deadlines hold a stable subjectId and are resolved against the current
 * subject catalog every time they are rendered, so renames and deletions do
 * not leave stale demo codes behind.
 */

/* ------------------------------ localStorage ------------------------------ */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STUDENT_STATE_STORAGE_KEYS = {
  subjects: 'studentos_subjects',
  deadlines: 'studentos_deadlines',
  timetable: 'studentos_timetable',
  studyLog: 'studentos_study_log',
  messages: 'studentos_messages',
  profile: 'studentos_profile',
  examSchedule: 'studentos_exam_schedule',
  availability: 'studentos_study_availability',
} as const;

export const STUDENT_STATE_VERSION_KEY = 'studentos_schema_version';
export const STUDENT_STATE_VERSION = 2;

/** Activity was only ever seeded from the demo dataset; no real writer exists. */
const LEGACY_ACTIVITY_KEY = 'studentos_activity';
/** Pre-unification task list storage. */
const LEGACY_TASKS_KEY = 'studentos_tasks';

export function getBrowserStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/* ------------------------------ demo records ------------------------------ */

const LEGACY_DEMO_SUBJECT_IDS = ['cs301', 'cs320', 'math240', 'cs280', 'phys150'];
const LEGACY_DEMO_SUBJECT_CODES = ['CS 301', 'CS 320', 'MATH 240', 'CS 280', 'PHYS 150'];
const LEGACY_DEMO_BLOCK_IDS = [
  'tt-1',
  'tt-2',
  'tt-3',
  'tt-4',
  'tt-break-1',
  'tt-break-2',
  'tt-break-3',
];
const LEGACY_DEMO_DEADLINE_IDS = ['dl-1', 'dl-2', 'dl-3', 'dl-4', 'dl-5'];

const demoSubjectIds = new Set(LEGACY_DEMO_SUBJECT_IDS);
const demoSubjectCodes = new Set(LEGACY_DEMO_SUBJECT_CODES.map(normalizeCode));
const demoBlockIds = new Set(LEGACY_DEMO_BLOCK_IDS);
const demoDeadlineIds = new Set(LEGACY_DEMO_DEADLINE_IDS);

function isLegacyDemoSubject(subject: Subject): boolean {
  // Require both the seeded id and the seeded code so a genuine CS 301 subject
  // created by the student is never removed.
  return demoSubjectIds.has(subject.id) && demoSubjectCodes.has(normalizeCode(subject.code));
}

function isLegacyDemoBlock(block: TimetableBlock): boolean {
  return demoBlockIds.has(block.id);
}

function isLegacyDemoDeadline(deadline: Deadline): boolean {
  return demoDeadlineIds.has(deadline.id);
}

/** The fabricated exam earlier versions attached to every newly added subject. */
function isLegacyDemoNextExam(exam: Subject['nextExam']): boolean {
  return Boolean(
    exam &&
      exam.title === 'Module Examination' &&
      exam.date === 'Dec 15, 2026' &&
      exam.daysLeft === 34 &&
      exam.weight === '30% of grade'
  );
}

/* --------------------------------- helpers -------------------------------- */

function safeGet(storage: StorageLike | null, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function readJson(storage: StorageLike | null, key: string): unknown {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[StudentOS] Could not parse localStorage key ${key}`, err);
    return null;
  }
}

function writeJson(storage: StorageLike | null, key: string, value: unknown): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[StudentOS] Could not persist localStorage key ${key}`, err);
  }
}

function isStoredBlock(value: unknown): value is TimetableBlock {
  if (!value || typeof value !== 'object') return false;
  const block = value as Record<string, unknown>;
  return (
    typeof block.id === 'string' &&
    block.id.length > 0 &&
    typeof block.subjectCode === 'string' &&
    typeof block.blockType === 'string' &&
    typeof block.durationMinutes === 'number'
  );
}

function isStoredDeadline(value: unknown): value is Deadline {
  if (!value || typeof value !== 'object') return false;
  const deadline = value as Record<string, unknown>;
  return (
    typeof deadline.id === 'string' &&
    typeof deadline.subjectCode === 'string' &&
    typeof deadline.title === 'string' &&
    typeof deadline.daysRemaining === 'number'
  );
}

function normalizeStudyLogEntry(value: unknown): StudyLogEntry | null {
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  if (typeof entry.date !== 'string' || !isIsoDate(entry.date)) return null;
  if (typeof entry.minutes !== 'number' || !Number.isFinite(entry.minutes) || entry.minutes <= 0) {
    return null;
  }
  if (typeof entry.subjectCode !== 'string' || !entry.subjectCode) return null;
  return {
    id: typeof entry.id === 'string' && entry.id ? entry.id : `log-${entry.date}-${entry.subjectCode}`,
    date: entry.date,
    subjectId: typeof entry.subjectId === 'string' ? entry.subjectId : undefined,
    subjectCode: entry.subjectCode,
    subjectName: typeof entry.subjectName === 'string' ? entry.subjectName : entry.subjectCode,
    minutes: entry.minutes,
    blockId: typeof entry.blockId === 'string' ? entry.blockId : undefined,
    completedAt:
      typeof entry.completedAt === 'string' ? entry.completedAt : `${entry.date}T00:00:00.000Z`,
  };
}

export function findBlockSubject(
  block: Pick<TimetableBlock, 'subjectId' | 'subjectCode' | 'subjectName'>,
  subjects: Subject[]
): Subject | undefined {
  return matchEntryToSubject(
    { subjectId: block.subjectId, subjectCode: block.subjectCode, subjectName: block.subjectName },
    subjects
  );
}

export function findDeadlineSubject(
  deadline: Pick<Deadline, 'subjectId' | 'subjectCode'>,
  subjects: Subject[]
): Subject | undefined {
  return matchEntryToSubject(
    { subjectId: deadline.subjectId, subjectCode: deadline.subjectCode, subjectName: '' },
    subjects
  );
}

/**
 * Links blocks to their subject and refreshes the cached code/name from the
 * current subject record. Completed sessions for subjects that no longer exist
 * are kept (history) but removed from active display elsewhere.
 */
export function attachSubjectIds(
  blocks: TimetableBlock[],
  subjects: Subject[]
): TimetableBlock[] {
  return blocks.flatMap((block): TimetableBlock[] => {
    if (block.blockType === 'Break') return [block];
    const subject = findBlockSubject(block, subjects);
    if (!subject) {
      return block.completed ? [block] : [];
    }
    return [
      {
        ...block,
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
      },
    ];
  });
}

/**
 * The only block list the Dashboard and Smart Planner render. Deleted-subject
 * sessions (pending or historical) never appear in the active plan, and every
 * visible label comes from the current subject catalog.
 */
export function resolveBlocksForDisplay(
  blocks: TimetableBlock[],
  subjects: Subject[]
): TimetableBlock[] {
  const resolved: TimetableBlock[] = [];
  blocks.forEach(block => {
    if (block.blockType === 'Break') {
      resolved.push(block);
      return;
    }
    const subject = findBlockSubject(block, subjects);
    if (!subject) return;
    resolved.push({
      ...block,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
    });
  });
  // Orphaned break rows should not survive when no study session is left.
  return resolved.some(block => block.blockType !== 'Break') ? resolved : [];
}

/* ------------------------------- migrations ------------------------------- */

export interface MigrationReport {
  previousVersion: number | null;
  ranMigration: boolean;
  /** How the stored subject list was classified before anything was written. */
  subjectStore: SubjectStoreState;
  preservedSubjectRecords: number;
  droppedSubjectRecords: number;
  archivedCorruptSubjects: boolean;
  removedDemoSubjects: string[];
  removedDemoNextExams: number;
  removedDemoBlocks: number;
  removedOrphanBlocks: number;
  removedDemoDeadlines: string[];
  removedOrphanDeadlines: number;
  removedLegacyActivity: boolean;
  removedLegacyTasks: boolean;
}

export interface StudentStateSnapshot {
  subjects: Subject[];
  deadlines: Deadline[];
  timetableBlocks: TimetableBlock[];
  studyLog: StudyLogEntry[];
  report: MigrationReport;
}

/**
 * How the stored subject list was found. These states are deliberately distinct:
 * a missing key and an explicitly empty array mean there is nothing to protect,
 * while an unreadable payload may still hold real records that must not be
 * rewritten.
 */
export type SubjectStoreState = 'missing' | 'empty' | 'valid' | 'unreadable';

/** Preserved copy of any stored subject payload that could not be fully used. */
export const SUBJECTS_CORRUPT_BACKUP_KEY = 'studentos_subjects_corrupt_backup';

interface SubjectReadResult {
  state: SubjectStoreState;
  subjects: Subject[];
  sourceRecords: number;
  droppedRecords: number;
}

/** Classifies the stored subject list without modifying it. */
function readStoredSubjects(storage: StorageLike | null): SubjectReadResult {
  const rawText = safeGet(storage, STUDENT_STATE_STORAGE_KEYS.subjects);
  if (rawText === null) {
    return { state: 'missing', subjects: [], sourceRecords: 0, droppedRecords: 0 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    console.warn('[StudentOS] Stored subjects are not valid JSON; keeping them untouched', err);
    return { state: 'unreadable', subjects: [], sourceRecords: 0, droppedRecords: 0 };
  }

  if (!Array.isArray(parsed)) {
    console.warn('[StudentOS] Stored subjects are not an array; keeping them untouched');
    return { state: 'unreadable', subjects: [], sourceRecords: 0, droppedRecords: 0 };
  }

  if (parsed.length === 0) {
    return { state: 'empty', subjects: [], sourceRecords: 0, droppedRecords: 0 };
  }

  const migrated = migrateSubjects(parsed, []);
  const droppedRecords = parsed.length - migrated.length;
  if (migrated.length === 0) {
    console.warn('[StudentOS] Stored subjects contain no usable records; keeping them untouched');
    return { state: 'unreadable', subjects: [], sourceRecords: parsed.length, droppedRecords };
  }

  return { state: 'valid', subjects: migrated, sourceRecords: parsed.length, droppedRecords };
}

/** Keeps the original text of a partially unusable payload before it is cleaned. */
function archiveCorruptSubjects(storage: StorageLike | null): boolean {
  const rawText = safeGet(storage, STUDENT_STATE_STORAGE_KEYS.subjects);
  if (rawText === null) return false;
  try {
    storage?.setItem(SUBJECTS_CORRUPT_BACKUP_KEY, rawText);
    return true;
  } catch (err) {
    console.warn('[StudentOS] Could not archive the unreadable subject payload', err);
    return false;
  }
}

/**
 * Targeted, idempotent migration. It only removes records that can be
 * identified as the original demo dataset (or records whose subject no longer
 * exists) and never clears the whole store. A subject list that cannot be read
 * is left exactly as it is, so a later recovery can still use it.
 */
export function bootstrapStudentState(
  storage: StorageLike | null = getBrowserStorage()
): StudentStateSnapshot {
  const rawVersion = safeGet(storage, STUDENT_STATE_VERSION_KEY);
  const parsedVersion = rawVersion === null ? Number.NaN : Number.parseInt(rawVersion, 10);
  const previousVersion = Number.isFinite(parsedVersion) ? parsedVersion : null;

  /* Subjects: classified first, then only the seeded demo records are removed. */
  const storedSubjects = readStoredSubjects(storage);
  const subjectStore = storedSubjects.state;
  const migratedSubjects = storedSubjects.subjects;
  const removedDemoSubjects = migratedSubjects
    .filter(isLegacyDemoSubject)
    .map(subject => subject.id);
  const keptSubjects = migratedSubjects.filter(subject => !isLegacyDemoSubject(subject));
  const removedDemoNextExams = keptSubjects.filter(subject =>
    isLegacyDemoNextExam(subject.nextExam)
  ).length;
  const subjects = keptSubjects.map(subject =>
    isLegacyDemoNextExam(subject.nextExam) ? { ...subject, nextExam: undefined } : subject
  );
  const archivedCorruptSubjects =
    subjectStore === 'valid' && storedSubjects.droppedRecords > 0
      ? archiveCorruptSubjects(storage)
      : false;

  /*
   * Timetable and deadlines are only reconciled against a subject list that was
   * actually readable. Reconciling against an unknown catalog would classify
   * genuine sessions and milestones as orphans and delete them.
   */
  const canReconcilePlan = subjectStore !== 'unreadable';

  /* Timetable: demo blocks, then orphaned pending blocks of deleted subjects. */
  const blocksRaw = readJson(storage, STUDENT_STATE_STORAGE_KEYS.timetable);
  const storedBlocks = Array.isArray(blocksRaw) ? blocksRaw.filter(isStoredBlock) : [];
  const withoutDemoBlocks = canReconcilePlan
    ? storedBlocks.filter(block => !isLegacyDemoBlock(block))
    : storedBlocks;
  const reconciledBlocks = canReconcilePlan
    ? attachSubjectIds(withoutDemoBlocks, subjects)
    : withoutDemoBlocks;
  const removedDemoBlocks = storedBlocks.length - withoutDemoBlocks.length;
  const removedOrphanBlocks = withoutDemoBlocks.length - reconciledBlocks.length;

  /* Deadlines: demo records and records for subjects that no longer exist. */
  const deadlinesRaw = readJson(storage, STUDENT_STATE_STORAGE_KEYS.deadlines);
  const storedDeadlines = Array.isArray(deadlinesRaw) ? deadlinesRaw.filter(isStoredDeadline) : [];
  const withoutDemoDeadlines = canReconcilePlan
    ? storedDeadlines.filter(deadline => !isLegacyDemoDeadline(deadline))
    : storedDeadlines;
  const reconciledDeadlines = canReconcilePlan
    ? withoutDemoDeadlines.filter(deadline => Boolean(findDeadlineSubject(deadline, subjects)))
    : withoutDemoDeadlines;
  const removedDemoDeadlines = storedDeadlines
    .filter(isLegacyDemoDeadline)
    .map(deadline => deadline.id);
  const removedOrphanDeadlines = withoutDemoDeadlines.length - reconciledDeadlines.length;

  /* Genuine completed-session history. */
  const logRaw = readJson(storage, STUDENT_STATE_STORAGE_KEYS.studyLog);
  const studyLog = Array.isArray(logRaw)
    ? logRaw
        .map(normalizeStudyLogEntry)
        .filter((entry): entry is StudyLogEntry => entry !== null)
    : [];

  /* Demo-only activity chart data (no real writer ever populated this key). */
  let removedLegacyActivity = false;
  if (storage && safeGet(storage, LEGACY_ACTIVITY_KEY) !== null) {
    storage.removeItem(LEGACY_ACTIVITY_KEY);
    removedLegacyActivity = true;
  }
  let removedLegacyTasks = false;
  if (storage && safeGet(storage, LEGACY_TASKS_KEY) !== null) {
    storage.removeItem(LEGACY_TASKS_KEY);
    removedLegacyTasks = true;
  }

  const ranMigration =
    previousVersion === null ||
    previousVersion < STUDENT_STATE_VERSION ||
    removedDemoSubjects.length > 0 ||
    removedDemoNextExams > 0 ||
    removedDemoBlocks > 0 ||
    removedOrphanBlocks > 0 ||
    removedDemoDeadlines.length > 0 ||
    removedOrphanDeadlines > 0 ||
    removedLegacyActivity ||
    removedLegacyTasks;

  /*
   * Only a readable subject list is ever rewritten. A missing key, an
   * explicitly empty array and an unreadable payload are all left exactly as
   * the student's browser has them, so no startup can turn real data into [].
   */
  if (subjectStore === 'valid') {
    writeJson(storage, STUDENT_STATE_STORAGE_KEYS.subjects, subjects);
  }
  if (canReconcilePlan) {
    writeJson(storage, STUDENT_STATE_STORAGE_KEYS.deadlines, reconciledDeadlines);
    writeJson(storage, STUDENT_STATE_STORAGE_KEYS.timetable, reconciledBlocks);
  }
  writeJson(storage, STUDENT_STATE_STORAGE_KEYS.studyLog, studyLog);
  try {
    storage?.setItem(STUDENT_STATE_VERSION_KEY, String(STUDENT_STATE_VERSION));
  } catch (err) {
    console.warn('[StudentOS] Could not persist schema version', err);
  }

  const report: MigrationReport = {
    previousVersion,
    ranMigration,
    subjectStore,
    preservedSubjectRecords: subjects.length,
    droppedSubjectRecords: storedSubjects.droppedRecords,
    archivedCorruptSubjects,
    removedDemoSubjects,
    removedDemoNextExams,
    removedDemoBlocks,
    removedOrphanBlocks,
    removedDemoDeadlines,
    removedOrphanDeadlines,
    removedLegacyActivity,
    removedLegacyTasks,
  };

  if (subjectStore === 'unreadable') {
    console.warn(
      '[StudentOS] Stored subjects could not be read; local storage was left untouched',
      report
    );
  }

  if (
    removedDemoSubjects.length > 0 ||
    removedDemoNextExams > 0 ||
    removedDemoBlocks > 0 ||
    removedOrphanBlocks > 0 ||
    removedDemoDeadlines.length > 0 ||
    removedOrphanDeadlines > 0 ||
    removedLegacyActivity
  ) {
    console.info('[StudentOS] Removed stale demo records from local state', report);
  }

  return { subjects, deadlines: reconciledDeadlines, timetableBlocks: reconciledBlocks, studyLog, report };
}

/* --------------------------- subject mutations ---------------------------- */

export interface PlanCollections {
  subjects: Subject[];
  timetableBlocks: TimetableBlock[];
  deadlines: Deadline[];
}

function blockBelongsToSubject(block: TimetableBlock, subject: Subject | undefined): boolean {
  if (!subject || block.blockType === 'Break') return false;
  if (block.subjectId) return block.subjectId === subject.id;
  return normalizeCode(block.subjectCode) === normalizeCode(subject.code);
}

function deadlineBelongsToSubject(deadline: Deadline, subject: Subject | undefined): boolean {
  if (!subject) return false;
  if (deadline.subjectId) return deadline.subjectId === subject.id;
  return normalizeCode(deadline.subjectCode) === normalizeCode(subject.code);
}

/**
 * Deleting a subject removes its pending study sessions and its deadlines.
 * Completed sessions stay in storage as history but are excluded from the
 * active plan by resolveBlocksForDisplay.
 */
export function deleteSubjectFromPlan(subjectId: string, state: PlanCollections): PlanCollections {
  const subject = state.subjects.find(item => item.id === subjectId);
  return {
    subjects: state.subjects.filter(item => item.id !== subjectId),
    timetableBlocks: state.timetableBlocks.filter(block => {
      if (block.blockType === 'Break') return true;
      if (!blockBelongsToSubject(block, subject)) return true;
      return block.completed;
    }),
    deadlines: state.deadlines.filter(deadline => !deadlineBelongsToSubject(deadline, subject)),
  };
}

/** Keeps verified date-sheet labels aligned with the renamed subject. */
export function renameSubjectInExamSchedule(
  schedule: ExamSchedule,
  updated: Subject,
  previous?: Subject
): ExamSchedule {
  return {
    ...schedule,
    entries: schedule.entries.map(entry => {
      const matchesId = entry.subjectId === updated.id;
      const matchesLegacyCode =
        !entry.subjectId &&
        Boolean(previous) &&
        normalizeCode(entry.subjectCode) === normalizeCode(previous!.code);
      if (!matchesId && !matchesLegacyCode) return entry;
      return {
        ...entry,
        subjectId: updated.id,
        subjectCode: updated.code,
        subjectName: updated.name,
      };
    }),
  };
}

/** Renaming a subject rewrites every dependent block and deadline immediately. */
export function renameSubjectInPlan(updated: Subject, state: PlanCollections): PlanCollections {
  const previous = state.subjects.find(item => item.id === updated.id);
  return {
    subjects: state.subjects.map(item => (item.id === updated.id ? updated : item)),
    timetableBlocks: state.timetableBlocks.map(block => {
      if (!blockBelongsToSubject(block, previous)) return block;
      return {
        ...block,
        subjectId: updated.id,
        subjectCode: updated.code,
        subjectName: updated.name,
      };
    }),
    deadlines: state.deadlines.map(deadline => {
      if (!deadlineBelongsToSubject(deadline, previous)) return deadline;
      return { ...deadline, subjectId: updated.id, subjectCode: updated.code };
    }),
  };
}

/* ----------------------------- session history ---------------------------- */

export interface SessionToggleInput {
  subjects: Subject[];
  timetableBlocks: TimetableBlock[];
  studyLog: StudyLogEntry[];
}

export interface SessionToggleResult {
  timetableBlocks: TimetableBlock[];
  studyLog: StudyLogEntry[];
}

let logIdCounter = 0;

/** Marks a session complete/incomplete and records genuine study activity. */
export function toggleSessionCompletion(
  blockId: string,
  state: SessionToggleInput,
  now: Date = new Date()
): SessionToggleResult {
  const block = state.timetableBlocks.find(item => item.id === blockId);
  if (!block) return { timetableBlocks: state.timetableBlocks, studyLog: state.studyLog };

  const completed = !block.completed;
  const timetableBlocks = state.timetableBlocks.map(item =>
    item.id === blockId ? { ...item, completed } : item
  );

  if (block.blockType === 'Break') {
    return { timetableBlocks, studyLog: state.studyLog };
  }

  if (completed) {
    const subject = findBlockSubject(block, state.subjects);
    logIdCounter += 1;
    const entry: StudyLogEntry = {
      id: `log-${now.getTime()}-${logIdCounter}`,
      date: localIsoDate(now),
      subjectId: subject?.id ?? block.subjectId,
      subjectCode: subject?.code ?? block.subjectCode,
      subjectName: subject?.name ?? block.subjectName,
      minutes: block.durationMinutes,
      blockId,
      completedAt: now.toISOString(),
    };
    return { timetableBlocks, studyLog: [...state.studyLog, entry] };
  }

  // Un-completing removes the most recent matching record for the same day.
  const today = localIsoDate(now);
  const index = [...state.studyLog]
    .map((entry, originalIndex) => ({ entry, originalIndex }))
    .reverse()
    .find(item => item.entry.blockId === blockId && item.entry.date === today)?.originalIndex;

  return {
    timetableBlocks,
    studyLog:
      index === undefined
        ? state.studyLog
        : state.studyLog.filter((_, originalIndex) => originalIndex !== index),
  };
}

/* ------------------------------- deadlines -------------------------------- */

/**
 * Upcoming deadlines are genuine saved records only:
 * - verified date-sheet examinations that match an active subject
 * - saved milestones that still belong to an active subject
 */
export function buildUpcomingDeadlines(
  subjects: Subject[],
  schedule: ExamSchedule,
  stored: Deadline[],
  now: Date = new Date()
): Deadline[] {
  const eligible = getEligibleExams(subjects, schedule, now);
  const examDeadlines: Deadline[] = eligible.map(({ entry, subject, daysLeft }) => ({
    id: `exam-dl-${entry.id}`,
    subjectId: subject.id,
    subjectCode: subject.code,
    title: `${subject.name} Examination`,
    dueDate: formatExamDate(entry.examDate),
    daysRemaining: daysLeft,
    type: 'Exam',
    urgency: daysLeft <= 5 ? 'high' : daysLeft <= 10 ? 'medium' : 'normal',
    weight: entry.startTime ? `Starts ${entry.startTime}` : 'Verified date sheet',
    completed: false,
    source: 'exam-sheet',
  }));

  const examSubjectIds = new Set(eligible.map(exam => exam.subject.id));
  const manual: Deadline[] = [];
  stored.forEach(deadline => {
    const subject = findDeadlineSubject(deadline, subjects);
    if (!subject) return;
    // A verified date-sheet entry already represents this subject's exam.
    if (deadline.type === 'Exam' && examSubjectIds.has(subject.id)) return;
    manual.push({ ...deadline, subjectId: subject.id, subjectCode: subject.code });
  });

  return [...examDeadlines, ...manual].sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/* ---------------------------- weekly activity ----------------------------- */

/** Consecutive active days ending today or yesterday (0 when none). */
export function computeStudyStreak(studyLog: StudyLogEntry[], now: Date = new Date()): number {
  const activeDays = new Set(studyLog.map(entry => entry.date));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!activeDays.has(localIsoDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (activeDays.has(localIsoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Weekly activity is derived from genuine completion records only, so it can
 * never show fabricated demo hours. Days without records are zero.
 */
export function buildWeeklyActivity(
  studyLog: StudyLogEntry[],
  subjects: Subject[],
  dailyGoalHours: number,
  now: Date = new Date()
): DailyActivity[] {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOffset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOffset);
  const todayIso = localIsoDate(now);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const iso = localIsoDate(date);
    const dayName = WEEKDAYS[date.getDay()];
    const entries = studyLog.filter(entry => entry.date === iso);

    const bySubject = new Map<string, { name: string; minutes: number; color: string }>();
    entries.forEach(entry => {
      const subject = matchEntryToSubject(
        {
          subjectId: entry.subjectId,
          subjectCode: entry.subjectCode,
          subjectName: entry.subjectName,
        },
        subjects
      );
      const key = subject?.id ?? entry.subjectCode ?? entry.subjectName;
      const current = bySubject.get(key);
      bySubject.set(key, {
        name: subject?.code ?? entry.subjectCode,
        minutes: (current?.minutes ?? 0) + entry.minutes,
        color: subject?.color ?? current?.color ?? '#94A3B8',
      });
    });

    const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);

    return {
      day: iso === todayIso ? `${dayName} (Today)` : dayName,
      shortDay: dayName.slice(0, 3),
      hours: Math.round((totalMinutes / 60) * 10) / 10,
      target: dailyGoalHours,
      subjects: [...bySubject.entries()].map(([key, value]) => ({
        name: value.name,
        hours: Math.round((value.minutes / 60) * 10) / 10,
        color: value.color || subjects.find(subject => subject.id === key)?.color || '#94A3B8',
      })),
    };
  });
}

/* -------------------------------- recovery -------------------------------- */

export const RECOVERY_IMPORT_KEY = 'studentos_recovery_import_v1';
export const PRE_RESET_BACKUP_KEY = 'studentos_pre_reset_backup';

export interface RecoveryPreview {
  subjects: Subject[];
  /** Subjects whose verified syllabus was not part of the recovered data. */
  syllabiNeedingReverification: string[];
}

/** "Search my dates": the catalog the student confirmed, never auto-seeded. */
export function buildRecoveryPreview(): RecoveryPreview {
  return {
    subjects: buildRecoverySubjects(),
    syllabiNeedingReverification: [...RECOVERY_SYLLABUS_NEEDS_REVERIFICATION],
  };
}

/** Recovery is offered only while there are no active subjects and only once. */
export function canOfferRecovery(
  storage: StorageLike | null,
  activeSubjectCount: number
): boolean {
  if (!storage || activeSubjectCount > 0) return false;
  return safeGet(storage, RECOVERY_IMPORT_KEY) === null;
}

/** Marks the one-time recovery as used so deleted subjects never come back. */
export function markRecoveryImported(storage: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.setItem(RECOVERY_IMPORT_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('[StudentOS] Could not record the recovery import', err);
  }
}

/**
 * Merges recovered subjects into the current catalog by course code, so a
 * second import can never duplicate records and existing edits always win.
 */
export function applyRecoveryImport(existing: Subject[], recovered: Subject[]): Subject[] {
  const codes = new Set(existing.map(subject => normalizeCode(subject.code)));
  const additions = recovered.filter(subject => !codes.has(normalizeCode(subject.code)));
  return [...existing, ...additions];
}

/**
 * Guarded subject writer. An empty list is never allowed to replace a stored
 * non-empty (or unreadable) catalog unless the student asked for it, which makes
 * a silent wipe impossible even if a future effect mounts with empty state.
 */
export function persistSubjectsSafely(
  storage: StorageLike | null,
  subjects: Subject[],
  options: { allowEmpty: boolean }
): boolean {
  if (!storage) return false;
  if (subjects.length === 0 && !options.allowEmpty) {
    const current = readStoredSubjects(storage);
    if (current.state === 'valid' || current.state === 'unreadable') {
      console.warn(
        '[StudentOS] Refused to overwrite stored subjects with an empty list; reload will keep them'
      );
      return false;
    }
  }
  writeJson(storage, STUDENT_STATE_STORAGE_KEYS.subjects, subjects);
  return true;
}

/** Copies the current plan into a local snapshot before a user-requested reset. */
export function snapshotPlanBeforeReset(
  storage: StorageLike | null,
  data: Record<string, unknown>
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(
      PRE_RESET_BACKUP_KEY,
      JSON.stringify({ createdAt: new Date().toISOString(), data })
    );
    return true;
  } catch (err) {
    console.warn('[StudentOS] Could not save the pre-reset snapshot', err);
    return false;
  }
}
