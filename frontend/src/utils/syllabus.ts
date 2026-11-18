import {
  CourseSyllabus,
  CourseTopic,
  CourseUnit,
  ParseSyllabusResult,
  Subject,
  SyllabusSourceType,
  SyllabusStatus,
  SyllabusTopic,
} from '../types';
import { normalizePyqAnalysis } from './pyq';

/**
 * Syllabus Intelligence helpers.
 *
 * A verified syllabus is stored on its own subject record so different subjects
 * never share curriculum data. Subjects created before this feature simply have
 * no `syllabus` field, which means "not provided" rather than fabricated content.
 */

export const SYLLABUS_STATUS_LABELS: Record<SyllabusStatus, string> = {
  not_provided: 'Not provided',
  processing: 'Processing',
  needs_review: 'Needs review',
  verified: 'Verified by student',
};

let idCounter = 0;

export function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function makeEmptyUnit(): CourseUnit {
  return { id: makeId('unit'), unitNumber: null, title: '', topics: [] };
}

export function makeEmptyTopic(): CourseTopic {
  return { id: makeId('ctopic'), name: '', subtopics: [], learningOutcomes: [] };
}

/** Converts the backend parse result into an editable, unverified syllabus draft. */
export function syllabusFromParsed(
  parsed: ParseSyllabusResult,
  meta: {
    sourceType: SyllabusSourceType;
    university?: string;
    degree?: string;
    semester?: string;
    courseCode?: string;
  }
): CourseSyllabus {
  const units: CourseUnit[] = parsed.syllabus.units.map(unit => ({
    id: makeId('unit'),
    unitNumber: unit.unit_number ?? null,
    // Keep unreadable titles obvious instead of inventing a numbered unit.
    title: unit.unit_title || 'Untitled Unit',
    topics: unit.topics.map(topic => ({
      id: makeId('ctopic'),
      name: topic.topic_name,
      subtopics: topic.subtopics ?? [],
      learningOutcomes: topic.learning_outcomes ?? [],
    })),
  }));

  return {
    status: 'needs_review',
    sourceType: meta.sourceType ?? parsed.source_type,
    units,
    warnings: parsed.warnings ?? [],
    university: meta.university?.trim() || undefined,
    degree: meta.degree?.trim() || undefined,
    semester: meta.semester?.trim() || undefined,
    courseCode: meta.courseCode?.trim() || parsed.syllabus.course_code || undefined,
    extractedCharacters: parsed.extracted_characters,
  };
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeUnit(raw: any, index: number): CourseUnit | null {
  if (!raw || typeof raw !== 'object') return null;
  const rawTopics = Array.isArray(raw.topics) ? raw.topics : [];
  const topics: CourseTopic[] = rawTopics
    .map((rawTopic: any, topicIndex: number): CourseTopic | null => {
      if (typeof rawTopic === 'string') {
        const name = rawTopic.trim();
        return name
          ? { id: makeId('ctopic'), name, subtopics: [], learningOutcomes: [] }
          : null;
      }
      if (!rawTopic || typeof rawTopic !== 'object') return null;
      const name = asString(rawTopic.name ?? rawTopic.topic_name).trim();
      if (!name) return null;
      return {
        id: asString(rawTopic.id) || `ctopic-${index}-${topicIndex}`,
        name,
        subtopics: asStringArray(rawTopic.subtopics),
        learningOutcomes: asStringArray(
          rawTopic.learningOutcomes ?? rawTopic.learning_outcomes
        ),
      };
    })
    .filter((topic: CourseTopic | null): topic is CourseTopic => topic !== null);

  const title = asString(raw.title ?? raw.unit_title).trim();
  if (!title && topics.length === 0) return null;

  const rawNumber = raw.unitNumber ?? raw.unit_number;
  const unitNumber =
    typeof rawNumber === 'number' && Number.isFinite(rawNumber) && rawNumber > 0
      ? Math.round(rawNumber)
      : null;

  return {
    id: asString(raw.id) || `unit-${index}`,
    unitNumber,
    title: title || `Unit ${unitNumber ?? index + 1}`,
    topics,
  };
}

export function normalizeSyllabus(raw: any): CourseSyllabus | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const status: SyllabusStatus =
    raw.status === 'verified' || raw.status === 'needs_review'
      ? raw.status
      : raw.status === 'not_provided'
        ? 'not_provided'
        : 'needs_review';

  const units: CourseUnit[] = (Array.isArray(raw.units) ? raw.units : [])
    .map(normalizeUnit)
    .filter((unit: CourseUnit | null): unit is CourseUnit => unit !== null);

  if (units.length === 0 && status === 'verified') {
    // A verified syllabus must contain curriculum. Treat legacy/empty records as unverified.
    return undefined;
  }
  if (units.length === 0 && status !== 'needs_review') {
    return undefined;
  }

  return {
    status: status === 'verified' ? 'verified' : 'needs_review',
    sourceType: raw.sourceType === 'pdf' ? 'pdf' : 'manual',
    units,
    warnings: asStringArray(raw.warnings),
    university: asString(raw.university) || undefined,
    degree: asString(raw.degree) || undefined,
    semester: asString(raw.semester) || undefined,
    courseCode: asString(raw.courseCode) || undefined,
    verifiedAt: asString(raw.verifiedAt) || undefined,
    extractedCharacters:
      typeof raw.extractedCharacters === 'number' ? raw.extractedCharacters : undefined,
  };
}

/**
 * Safe migration for subjects stored by earlier versions of StudentOS.
 * Adds nothing that the student did not enter; only fills structural defaults.
 */
export function migrateSubjects(raw: unknown, fallback: Subject[]): Subject[] {
  if (!Array.isArray(raw)) return fallback;

  const subjects = raw
    .map((item: any): Subject | null => {
      if (!item || typeof item !== 'object') return null;
      const id = asString(item.id);
      const code = asString(item.code);
      const name = asString(item.name);
      if (!id || !code || !name) return null;

      const rawTopics = Array.isArray(item.topics) ? item.topics : [];
      const topics: SyllabusTopic[] = rawTopics
        .map((topic: any, index: number): SyllabusTopic | null => {
          if (!topic || typeof topic !== 'object') return null;
          const title = asString(topic.title ?? topic.name).trim();
          if (!title) return null;
          return {
            id: asString(topic.id) || `topic-${id}-${index}`,
            title,
            completed: Boolean(topic.completed),
            notes: typeof topic.notes === 'string' ? topic.notes : undefined,
            estimatedHours:
              typeof topic.estimatedHours === 'number' && topic.estimatedHours > 0
                ? topic.estimatedHours
                : 5,
            unitId: asString(topic.unitId) || undefined,
            unitTitle: asString(topic.unitTitle) || undefined,
          };
        })
        .filter((topic: SyllabusTopic | null): topic is SyllabusTopic => topic !== null);

      const difficulty =
        item.difficulty === 'Foundational' ||
        item.difficulty === 'Intermediate' ||
        item.difficulty === 'Advanced'
          ? item.difficulty
          : 'Intermediate';
      const priority =
        item.priority === 'High' || item.priority === 'Medium' || item.priority === 'Low'
          ? item.priority
          : 'Medium';
      const confidence =
        typeof item.confidence === 'number'
          ? Math.min(100, Math.max(0, item.confidence))
          : 70;

      return {
        ...item,
        id,
        code,
        name,
        credits:
          typeof item.credits === 'number' && item.credits > 0 ? item.credits : 3,
        professor: asString(item.professor) || 'Faculty Instructor',
        difficulty,
        confidence,
        priority,
        color: asString(item.color) || '#6366F1',
        accentBg: asString(item.accentBg) || '#EEF2FF',
        topics,
        syllabus: normalizeSyllabus(item.syllabus),
        pyq: normalizePyqAnalysis(item.pyq),
      };
    })
    .filter((subject: Subject | null): subject is Subject => subject !== null);

  return subjects.length > 0 ? subjects : fallback;
}

/**
 * Derives the milestone topic list used by the dashboard, planner, and tutor
 * from a verified syllabus, preserving completion status of matching topics.
 */
export function syllabusToTopics(
  syllabus: CourseSyllabus | undefined,
  previousTopics: SyllabusTopic[] = []
): SyllabusTopic[] {
  if (!syllabus || syllabus.units.length === 0) return previousTopics;

  const previousByTitle = new Map(
    previousTopics.map(topic => [topic.title.trim().toLowerCase(), topic])
  );

  const derived: SyllabusTopic[] = [];
  syllabus.units.forEach(unit => {
    unit.topics.forEach(topic => {
      const previous = previousByTitle.get(topic.name.trim().toLowerCase());
      derived.push({
        id: `syl-${unit.id}-${topic.id}`,
        title: topic.name,
        completed: previous?.completed ?? false,
        notes: previous?.notes,
        estimatedHours: previous?.estimatedHours ?? 5,
        unitId: unit.id,
        unitTitle: unit.title,
      });
    });
  });

  return derived.length > 0 ? derived : previousTopics;
}

export function countSyllabusTopics(syllabus: CourseSyllabus | undefined): number {
  if (!syllabus) return 0;
  return syllabus.units.reduce((sum, unit) => sum + unit.topics.length, 0);
}

/** Compact syllabus payload for the AI tutor. The backend caps it again. */
export interface SyllabusContextPayload {
  course_code?: string;
  university?: string;
  degree?: string;
  semester?: string;
  units: {
    unit_number: number | null;
    unit_title: string;
    topics: {
      topic_name: string;
      subtopics: string[];
      learning_outcomes: string[];
    }[];
  }[];
}

export function toSyllabusContextPayload(
  syllabus: CourseSyllabus | undefined
): SyllabusContextPayload | null {
  if (!syllabus || syllabus.status !== 'verified' || syllabus.units.length === 0) {
    return null;
  }
  return {
    course_code: syllabus.courseCode,
    university: syllabus.university,
    degree: syllabus.degree,
    semester: syllabus.semester,
    units: syllabus.units.map(unit => ({
      unit_number: unit.unitNumber,
      unit_title: unit.title,
      topics: unit.topics.map(topic => ({
        topic_name: topic.name,
        subtopics: topic.subtopics,
        learning_outcomes: topic.learningOutcomes,
      })),
    })),
  };
}

/**
 * Builds the syllabus excerpt a quiz must be grounded in.
 * Returns null when the subject has no verified syllabus.
 */
export function buildQuizSyllabusExcerpt(
  subject: Subject | undefined,
  unitId?: string,
  topicId?: string
): { excerpt: string; label: string } | null {
  const syllabus = subject?.syllabus;
  if (!subject || !syllabus || syllabus.status !== 'verified' || syllabus.units.length === 0) {
    return null;
  }

  const units = unitId
    ? syllabus.units.filter(unit => unit.id === unitId)
    : syllabus.units;

  const lines: string[] = [`Course: ${subject.code} - ${subject.name}`];
  units.forEach(unit => {
    const topics = topicId ? unit.topics.filter(topic => topic.id === topicId) : unit.topics;
    if (topics.length === 0) return;
    lines.push(
      `${unit.unitNumber ? `Unit ${unit.unitNumber}` : 'Unit'}: ${unit.title}`
    );
    topics.forEach(topic => {
      lines.push(`- Topic: ${topic.name}`);
      if (topic.subtopics.length > 0) {
        lines.push(`  Subtopics: ${topic.subtopics.join(', ')}`);
      }
      if (topic.learningOutcomes.length > 0) {
        lines.push(`  Learning outcomes: ${topic.learningOutcomes.join('; ')}`);
      }
    });
  });

  const excerpt = lines.join('\n');
  if (excerpt.trim().length <= `Course: ${subject.code} - ${subject.name}`.length) {
    return null;
  }

  const selectedTopic = topicId
    ? syllabus.units.flatMap(unit => unit.topics).find(topic => topic.id === topicId)
    : undefined;
  const selectedUnit = unitId
    ? syllabus.units.find(unit => unit.id === unitId)
    : undefined;

  const label = selectedTopic
    ? selectedTopic.name
    : selectedUnit
      ? selectedUnit.title
      : 'Entire verified syllabus';

  return { excerpt: excerpt.slice(0, 4000), label };
}
