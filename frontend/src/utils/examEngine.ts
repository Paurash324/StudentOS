import {
  ExamSchedule,
  ExamScheduleEntry,
  PyqFrequencyItem,
  StudyAvailability,
  StudyWindow,
  Subject,
  TimetableBlock,
} from '../types';
import { computeTopicFrequency, normalizeQuestionText } from './pyq';
import { isIsoDate, matchEntryToSubject, normalizeName, WEEKDAYS } from './dateSheet';

/**
 * Deterministic, explainable exam study-time allocation.
 *
 * No AI is used here. Every number below is derived from student data:
 * exam proximity, syllabus coverage, confidence, difficulty, and historical
 * PYQ question counts/marks. Historical frequency is never treated as a
 * prediction of the next paper.
 */

export const DEFAULT_AVAILABILITY: StudyAvailability = {
  dailyHours: 4,
  preferredWindows: ['morning', 'evening'],
  unavailableDays: [],
  sessionMinutes: 45,
  bufferMinutes: 10,
};

export const STUDY_WINDOW_META: Record<StudyWindow, { label: string; startHour: number; startMinute: number }> = {
  morning: { label: 'Morning (08:30)', startHour: 8, startMinute: 30 },
  afternoon: { label: 'Afternoon (13:30)', startHour: 13, startMinute: 30 },
  evening: { label: 'Evening (17:30)', startHour: 17, startMinute: 30 },
  night: { label: 'Night (20:00)', startHour: 20, startMinute: 0 },
};

export function normalizeAvailability(raw: any): StudyAvailability {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_AVAILABILITY };
  const windows: StudyWindow[] = Array.isArray(raw.preferredWindows)
    ? raw.preferredWindows.filter(
        (w: unknown): w is StudyWindow =>
          w === 'morning' || w === 'afternoon' || w === 'evening' || w === 'night'
      )
    : [];
  const unavailableDays = Array.isArray(raw.unavailableDays)
    ? raw.unavailableDays.filter((d: unknown): d is string => WEEKDAYS.includes(d as any))
    : [];
  const dailyHours =
    typeof raw.dailyHours === 'number' && raw.dailyHours > 0 && raw.dailyHours <= 16
      ? raw.dailyHours
      : DEFAULT_AVAILABILITY.dailyHours;
  const sessionMinutes =
    typeof raw.sessionMinutes === 'number' && raw.sessionMinutes >= 15 && raw.sessionMinutes <= 180
      ? raw.sessionMinutes
      : DEFAULT_AVAILABILITY.sessionMinutes;
  const bufferMinutes =
    typeof raw.bufferMinutes === 'number' && raw.bufferMinutes >= 0 && raw.bufferMinutes <= 60
      ? raw.bufferMinutes
      : DEFAULT_AVAILABILITY.bufferMinutes;

  return {
    dailyHours,
    preferredWindows: windows.length > 0 ? windows : [...DEFAULT_AVAILABILITY.preferredWindows],
    unavailableDays,
    sessionMinutes,
    bufferMinutes,
  };
}

/* ------------------------------- time helpers ------------------------------- */

export function localIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Whole calendar days from today until the exam date (0 = today, negative = past). */
export function daysUntilExam(isoDate: string, now = new Date()): number | null {
  if (!isIsoDate(isoDate)) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const exam = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(exam.getTime())) return null;
  return Math.round((exam.getTime() - today.getTime()) / 86_400_000);
}

export function minutesToTwelveHour(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${meridiem}`;
}

export function timeRangeFromStart(startMinutes: number, durationMinutes: number): string {
  return `${minutesToTwelveHour(startMinutes)} – ${minutesToTwelveHour(startMinutes + durationMinutes)}`;
}

function parseTwelveHour(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(match[2]);
}

export function timeRangeEndMinutes(range: string): number | null {
  const parts = range.split('–');
  if (parts.length !== 2) return null;
  return parseTwelveHour(parts[1]);
}

function preferredStartMinutes(availability: StudyAvailability): number {
  const window = availability.preferredWindows[0] ?? 'morning';
  const meta = STUDY_WINDOW_META[window];
  return meta.startHour * 60 + meta.startMinute;
}

export function todayIsUnavailable(availability: StudyAvailability, now = new Date()): boolean {
  return availability.unavailableDays.includes(WEEKDAYS[now.getDay()]);
}

/* ----------------------------- subject context ----------------------------- */

export interface EligibleExam {
  entry: ExamScheduleEntry;
  subject: Subject;
  daysLeft: number;
}

export function getEligibleExams(
  subjects: Subject[],
  schedule: ExamSchedule,
  now = new Date()
): EligibleExam[] {
  const eligible: EligibleExam[] = [];
  schedule.entries.forEach(entry => {
    if (!entry.examDate) return;
    const daysLeft = daysUntilExam(entry.examDate, now);
    if (daysLeft === null || daysLeft < 0) return;
    const subject = matchEntryToSubject(entry, subjects);
    if (!subject) return;
    if (eligible.some(exam => exam.subject.id === subject.id)) return;
    // Do not schedule preparation after today's exam start time.
    if (daysLeft === 0 && entry.startTime) {
      const [hour, minute] = entry.startTime.split(':').map(Number);
      if (Number.isFinite(hour) && Number.isFinite(minute)) {
        if (now.getHours() * 60 + now.getMinutes() >= hour * 60 + minute) return;
      }
    }
    eligible.push({ entry, subject, daysLeft });
  });
  return eligible.sort((a, b) => a.daysLeft - b.daysLeft);
}

/* -------------------------------- allocation -------------------------------- */

export interface TopicAllocation {
  subjectId: string;
  topicId?: string;
  unitId?: string;
  topicName: string;
  unitTitle?: string;
  pending: boolean;
  appearances: number;
  paperAppearances: number;
  totalPapers: number;
  marksTotal: number;
  marksKnown: number;
  years: number[];
  score: number;
  recommendedMinutes: number;
  reason: string;
}

export interface SubjectAllocation {
  subjectId: string;
  code: string;
  name: string;
  examDate: string;
  startTime?: string;
  daysLeft: number;
  weight: number;
  recommendedMinutes: number;
  totalTopics: number;
  pendingTopics: number;
  confidence: number;
  syllabusVerified: boolean;
  pyqCoverage: number;
  reason: string;
  topics: TopicAllocation[];
}

export interface StudyAllocationResult {
  subjects: SubjectAllocation[];
  totalMinutes: number;
  generatedAt: string;
  notes: string[];
}

export type PlannerGoal = 'exam' | 'balanced' | 'deepWork';

interface TopicCandidate {
  topicId?: string;
  unitId?: string;
  topicName: string;
  unitTitle?: string;
  pending: boolean;
  appearances: number;
  paperAppearances: number;
  totalPapers: number;
  marksTotal: number;
  marksKnown: number;
  years: number[];
}

function roundToFive(value: number): number {
  return Math.max(0, Math.round(value / 5) * 5);
}

function difficultyScore(subject: Subject): number {
  return subject.difficulty === 'Advanced' ? 100 : subject.difficulty === 'Intermediate' ? 60 : 30;
}

function urgencyScore(daysLeft: number): number {
  if (daysLeft <= 0) return 100;
  return Math.max(10, 100 - daysLeft * 3);
}

function findFrequency(
  topicName: string,
  topicId: string | undefined,
  frequency: PyqFrequencyItem[]
): PyqFrequencyItem | undefined {
  if (topicId) {
    const byId = frequency.find(item => item.topicId === topicId);
    if (byId) return byId;
  }
  const key = normalizeName(topicName);
  if (!key) return undefined;
  return (
    frequency.find(item => normalizeName(item.topicName) === key) ??
    frequency.find(
      item =>
        normalizeName(item.topicName).includes(key) || key.includes(normalizeName(item.topicName))
    )
  );
}

function buildTopicCandidates(subject: Subject): TopicCandidate[] {
  const frequency = computeTopicFrequency(subject.pyq?.papers ?? []);
  const totalPapers = Math.max(
    1,
    (subject.pyq?.papers ?? []).filter(paper => paper.questions.length > 0).length
  );

  if (subject.syllabus?.status === 'verified' && subject.syllabus.units.length > 0) {
    return subject.syllabus.units.flatMap(unit =>
      unit.topics.map(topic => {
        const tracked = subject.topics.find(
          item => item.title.trim().toLowerCase() === topic.name.trim().toLowerCase()
        );
        const freq = findFrequency(topic.name, topic.id, frequency);
        return {
          topicId: topic.id,
          unitId: unit.id,
          topicName: topic.name,
          unitTitle: unit.unitNumber ? `Unit ${unit.unitNumber}: ${unit.title}` : unit.title,
          pending: !(tracked?.completed ?? false),
          appearances: freq?.paperAppearances ?? 0,
          paperAppearances: freq?.paperAppearances ?? 0,
          totalPapers,
          marksTotal: freq?.marksTotal ?? 0,
          marksKnown: freq?.marksKnown ?? 0,
          years: freq?.years ?? [],
        };
      })
    );
  }

  if (subject.topics.length > 0) {
    return subject.topics.map(topic => {
      const freq = findFrequency(topic.title, topic.id, frequency);
      return {
        topicId: topic.id,
        unitId: topic.unitId,
        topicName: topic.title,
        unitTitle: topic.unitTitle,
        pending: !topic.completed,
        appearances: freq?.paperAppearances ?? 0,
        paperAppearances: freq?.paperAppearances ?? 0,
        totalPapers,
        marksTotal: freq?.marksTotal ?? 0,
        marksKnown: freq?.marksKnown ?? 0,
        years: freq?.years ?? [],
      };
    });
  }

  return [
    {
      topicName: 'General revision (no syllabus topics added)',
      pending: false,
      appearances: 0,
      paperAppearances: 0,
      totalPapers,
      marksTotal: 0,
      marksKnown: 0,
      years: [],
    },
  ];
}

function pyqCoverage(subject: Subject): number {
  if (!subject.syllabus || subject.syllabus.units.length === 0) return 0;
  const frequency = computeTopicFrequency(subject.pyq?.papers ?? []);
  const syllabusTopicIds = new Set(
    subject.syllabus.units.flatMap(unit => unit.topics.map(topic => topic.id))
  );
  const covered = frequency.filter(item => item.topicId && syllabusTopicIds.has(item.topicId)).length;
  return Math.min(
    100,
    Math.round((covered / Math.max(1, syllabusTopicIds.size)) * 100)
  );
}

export function buildStudyAllocations(
  subjects: Subject[],
  schedule: ExamSchedule,
  availability: StudyAvailability,
  goal: PlannerGoal = 'exam',
  now = new Date()
): StudyAllocationResult {
  const notes: string[] = [];
  const eligible = getEligibleExams(subjects, schedule, now);
  if (eligible.length === 0) {
    return {
      subjects: [],
      totalMinutes: 0,
      generatedAt: now.toISOString(),
      notes: ['No upcoming verified examinations match your subjects. Add a date sheet first.'],
    };
  }

  const budgetMinutes = Math.round(availability.dailyHours * 60);
  const weights: Record<string, number> = {};
  const urgencyBySubject: Record<string, number> = {};
  const scoring: Record<string, { urgency: number; gap: number; deficit: number; difficulty: number; pyq: number }> = {};

  eligible.forEach(({ subject, daysLeft }) => {
    const candidates = buildTopicCandidates(subject);
    const totalTopics = candidates.length;
    const pendingTopics = candidates.filter(candidate => candidate.pending).length;
    const gap = (pendingTopics / Math.max(1, totalTopics)) * 100;
    const deficit = 100 - subject.confidence;
    const difficulty = difficultyScore(subject);
    const urgency = urgencyScore(daysLeft);
    const maxAppearances = Math.max(1, ...candidates.map(c => c.paperAppearances));
    const pyqRatio = Math.min(100, (Math.max(0, ...candidates.map(c => c.paperAppearances)) / maxAppearances) * 100);

    let weight: number;
    if (goal === 'balanced') {
      weight = 0.30 * urgency + 0.30 * gap + 0.15 * deficit + 0.10 * difficulty + 0.15 * pyqRatio;
    } else if (goal === 'deepWork') {
      weight = 0.32 * urgency + 0.16 * gap + 0.22 * deficit + 0.15 * difficulty + 0.15 * pyqRatio;
    } else {
      weight = 0.45 * urgency + 0.16 * gap + 0.14 * deficit + 0.10 * difficulty + 0.15 * pyqRatio;
    }

    weights[subject.id] = weight;
    urgencyBySubject[subject.id] = urgency;
    scoring[subject.id] = { urgency, gap, deficit, difficulty, pyq: pyqRatio };
  });

  // Reserve a small minimum per eligible subject so the timetable covers every exam.
  const minimumPerSubject = budgetMinutes >= eligible.length * 20 ? 20 : Math.floor(budgetMinutes / eligible.length);
  const remainingBudget = Math.max(0, budgetMinutes - minimumPerSubject * eligible.length);
  const weightSum = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;

  const allocations: SubjectAllocation[] = eligible.map(({ subject, entry, daysLeft }) => {
    const candidates = buildTopicCandidates(subject);
    const totalTopics = candidates.length;
    const pendingTopics = candidates.filter(c => c.pending).length;
    const coverage = pyqCoverage(subject);
    const subjectMinutes = Math.max(
      0,
      roundToFive(minimumPerSubject + (remainingBudget * (weights[subject.id] || 0)) / weightSum)
    );

    const maxAppearances = Math.max(1, ...candidates.map(c => c.paperAppearances));
    const maxMarks = Math.max(1, ...candidates.map(c => c.marksTotal));
    const scored = candidates
      .map(candidate => {
        const pendingBoost = candidate.pending ? 40 : 0;
        const revisionBoost = !candidate.pending && candidate.paperAppearances > 0 ? 22 : !candidate.pending ? 8 : 0;
        const frequencyBoost = (candidate.paperAppearances / maxAppearances) * 20;
        const marksBoost = (candidate.marksTotal / maxMarks) * 10;
        const score =
          pendingBoost +
          revisionBoost +
          frequencyBoost +
          marksBoost +
          0.10 * (100 - subject.confidence) +
          0.10 * difficultyScore(subject) +
          0.20 * urgencyScore(daysLeft);

        return { candidate, score: Math.min(100, Math.round(score)), maxAppearances };
      })
      .sort((a, b) => b.score - a.score || a.candidate.topicName.localeCompare(b.candidate.topicName));

    const topCount =
      subjectMinutes >= 15
        ? Math.max(1, Math.min(4, Math.ceil(subjectMinutes / 45), scored.length))
        : 0;
    const selected = scored.slice(0, topCount);
    const scoreSum = selected.reduce((sum, item) => sum + item.score, 0) || 1;

    let allocated = 0;
    const topicAllocations: TopicAllocation[] = selected.map((item, index) => {
      const isLast = index === selected.length - 1;
      const proportional = (subjectMinutes * item.score) / scoreSum;
      const minutes = isLast
        ? Math.max(15, subjectMinutes - allocated)
        : Math.max(15, roundToFive(proportional));
      allocated += minutes;
      const { candidate } = item;
      const pyqText = candidate.paperAppearances > 0
        ? `PYQ ${candidate.paperAppearances}/${candidate.totalPapers} paper${candidate.totalPapers === 1 ? '' : 's'}${candidate.marksKnown > 0 ? ` · ${candidate.marksTotal} marks seen` : ''}`
        : 'No PYQ appearances on record';
      return {
        subjectId: subject.id,
        topicId: candidate.topicId,
        unitId: candidate.unitId,
        topicName: candidate.topicName,
        unitTitle: candidate.unitTitle,
        pending: candidate.pending,
        appearances: candidate.appearances,
        paperAppearances: candidate.paperAppearances,
        totalPapers: candidate.totalPapers,
        marksTotal: candidate.marksTotal,
        marksKnown: candidate.marksKnown,
        years: candidate.years,
        score: item.score,
        recommendedMinutes: minutes,
        reason: `${candidate.pending ? 'Incomplete topic' : 'Revision'} · ${pyqText}`,
      };
    });

    // If rounding overshoots, trim the last allocation.
    const overshoot = topicAllocations.reduce((sum, t) => sum + t.recommendedMinutes, 0) - subjectMinutes;
    if (overshoot > 0 && topicAllocations.length > 0) {
      topicAllocations[topicAllocations.length - 1].recommendedMinutes = Math.max(
        15,
        topicAllocations[topicAllocations.length - 1].recommendedMinutes - overshoot
      );
    }

    return {
      subjectId: subject.id,
      code: subject.code,
      name: subject.name,
      examDate: entry.examDate,
      startTime: entry.startTime,
      daysLeft,
      weight: Math.round(weights[subject.id] || 0),
      recommendedMinutes: topicAllocations.reduce((sum, t) => sum + t.recommendedMinutes, 0),
      totalTopics,
      pendingTopics,
      confidence: subject.confidence,
      syllabusVerified: subject.syllabus?.status === 'verified',
      pyqCoverage: coverage,
      reason: `${daysLeft === 0 ? 'Exam today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} to exam`} · ${pendingTopics}/${totalTopics} topics pending · confidence ${subject.confidence}%`,
      topics: topicAllocations,
    };
  });

  allocations.sort(
    (a, b) => a.daysLeft - b.daysLeft || b.recommendedMinutes - a.recommendedMinutes
  );

  const deferred = allocations.filter(a => a.recommendedMinutes === 0);
  if (deferred.length > 0) {
    notes.push(
      `Available time is too low to cover: ${deferred.map(a => a.code).join(', ')}. Increase daily hours or reduce unavailable days.`
    );
  }
  if (budgetMinutes < eligible.length * 20) {
    notes.push(
      `${eligible.length} eligible exams share ${budgetMinutes} minutes today, below the 20-minute minimum per subject.`
    );
  }

  return {
    subjects: allocations,
    totalMinutes: allocations.reduce((sum, item) => sum + item.recommendedMinutes, 0),
    generatedAt: now.toISOString(),
    notes,
  };
}

/* --------------------------- timetable generation --------------------------- */

export interface GenerateExamPlanParams {
  subjects: Subject[];
  schedule: ExamSchedule;
  availability: StudyAvailability;
  existingBlocks: TimetableBlock[];
  goal?: PlannerGoal;
  now?: Date;
}

export interface GeneratedExamPlan {
  blocks: TimetableBlock[];
  allocations: StudyAllocationResult;
  notes: string[];
  preservedCount: number;
}

function blockTopicKey(block: TimetableBlock): string {
  return block.topicId ? `id:${block.topicId}` : `name:${normalizeQuestionText(block.topic)}`;
}

export function generateExamPlan({
  subjects,
  schedule,
  availability,
  existingBlocks,
  goal = 'exam',
  now = new Date(),
}: GenerateExamPlanParams): GeneratedExamPlan {
  const preserved = existingBlocks.filter(block => block.completed || block.pinned);
  const preservedKeys = new Set(preserved.map(blockTopicKey));
  const notes: string[] = [];
  const allocations = buildStudyAllocations(subjects, schedule, availability, goal, now);

  if (todayIsUnavailable(availability, now)) {
    return {
      blocks: preserved,
      allocations,
      notes: [`${WEEKDAYS[now.getDay()]} is marked unavailable in your study availability.`],
      preservedCount: preserved.length,
    };
  }

  if (allocations.subjects.length === 0) {
    return {
      blocks: preserved,
      allocations,
      notes: allocations.notes,
      preservedCount: preserved.length,
    };
  }

  interface Descriptor {
    subject: SubjectAllocation;
    topic: TopicAllocation;
    durationMinutes: number;
    repeatIndex: number;
  }

  const queues: Descriptor[][] = allocations.subjects.map(allocation => {
    const descriptors: Descriptor[] = [];
    allocation.topics.forEach(topic => {
      const key = topic.topicId ? `id:${topic.topicId}` : `name:${normalizeQuestionText(topic.topicName)}`;
      if (preservedKeys.has(key)) return;
      let remaining = topic.recommendedMinutes;
      let repeatIndex = 0;
      while (remaining >= 15 && descriptors.length < 12) {
        let duration = Math.min(availability.sessionMinutes, remaining);
        if (remaining - duration > 0 && remaining - duration < 15) duration = remaining;
        descriptors.push({ subject: allocation, topic, durationMinutes: duration, repeatIndex });
        remaining -= duration;
        repeatIndex += 1;
      }
    });
    return descriptors;
  });

  const ordered: Descriptor[] = [];
  let added = true;
  while (added) {
    added = false;
    queues.forEach(queue => {
      const next = queue.shift();
      if (next) {
        ordered.push(next);
        added = true;
      }
    });
  }

  const preferred = preferredStartMinutes(availability);
  const preservedEnd = preserved.reduce((max, block) => {
    if (block.blockType === 'Break') return max;
    const end = timeRangeEndMinutes(block.timeRange);
    return end !== null ? Math.max(max, end) : max;
  }, 0);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let cursor = Math.max(preferred, preservedEnd, nowMinutes + 5);
  cursor = Math.ceil(cursor / 5) * 5;

  const generated: TimetableBlock[] = [];
  ordered.forEach((descriptor, index) => {
    const { topic, subject } = descriptor;
    const type: TimetableBlock['blockType'] = topic.pending
      ? topic.paperAppearances > 0
        ? 'PYQ Practice'
        : goal === 'balanced'
          ? 'Problem Solving'
          : descriptor.repeatIndex > 0
            ? 'Active Recall'
            : 'Deep Work'
      : descriptor.repeatIndex > 0
        ? 'Active Recall'
        : 'Review';

    generated.push({
      id: `exam-block-${Date.now()}-${index + 1}`,
      day: 'Today',
      timeRange: timeRangeFromStart(cursor, descriptor.durationMinutes),
      subjectCode: subject.code,
      subjectName: subject.name,
      topic: topic.topicName,
      unitTitle: topic.unitTitle,
      topicId: topic.topicId,
      blockType: type,
      durationMinutes: descriptor.durationMinutes,
      completed: false,
      pinned: false,
      generatedBy: 'exam-engine',
      reason: `${subject.daysLeft === 0 ? 'Exam today' : `${subject.daysLeft}d to exam`} · ${topic.reason}`,
    });

    cursor += descriptor.durationMinutes;

    if (index < ordered.length - 1 && availability.bufferMinutes > 0) {
      generated.push({
        id: `exam-buffer-${Date.now()}-${index + 1}`,
        day: 'Today',
        timeRange: timeRangeFromStart(cursor, availability.bufferMinutes),
        subjectCode: 'BUFFER',
        subjectName: 'Study buffer',
        topic: 'Short reset between sessions',
        blockType: 'Break',
        durationMinutes: availability.bufferMinutes,
        completed: false,
        generatedBy: 'exam-engine',
      });
      cursor += availability.bufferMinutes;
    }
  });

  if (preserved.length > 0) {
    notes.push(
      `${preserved.length} completed or pinned session${preserved.length === 1 ? '' : 's'} kept unchanged.`
    );
  }
  notes.push(
    `Allocated ${allocations.totalMinutes} minutes across ${allocations.subjects.length} examination subject${allocations.subjects.length === 1 ? '' : 's'} using deterministic exam weighting.`
  );
  notes.push(...allocations.notes);

  return { blocks: [...preserved, ...generated], allocations, notes, preservedCount: preserved.length };
}
