import { ChatMessage, Subject, SyllabusStatus } from '../types';

/**
 * Builds every piece of AI Tutor context from the live subject list in App state.
 *
 * Nothing in this file contains subject names, exam dates, or demo content: the
 * tutor must always reflect exactly what the student has in My Subjects.
 */

/** A unit/topic summary sent to the backend. Only included for verified syllabi. */
export interface AISubjectUnit {
  unit_number: number | null;
  unit_title: string;
  topics: string[];
}

/** Compact description of one current subject for the AI tutor. */
export interface AISubjectContext {
  name: string;
  code: string;
  credits: number;
  syllabus_status: SyllabusStatus | 'not_provided';
  units?: AISubjectUnit[];
}

const MAX_CONTEXT_SUBJECTS = 20;
const MAX_CONTEXT_UNITS = 10;
const MAX_CONTEXT_TOPICS_PER_UNIT = 12;
const MAX_CONTEXT_TOTAL_TOPICS = 80;

function hasVerifiedSyllabus(subject: Subject): boolean {
  return (
    subject.syllabus?.status === 'verified' &&
    Array.isArray(subject.syllabus.units) &&
    subject.syllabus.units.length > 0
  );
}

function formatSubjectLabel(subject: Subject): string {
  const name = subject.name.trim();
  const code = subject.code.trim();
  if (!code || code.toLowerCase() === name.toLowerCase()) return name;
  return `${name} (${code})`;
}

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/**
 * Resolves the subjects the tutor should describe for the current selection.
 * A selected subject is matched by stable id; deleted ids fall back to all subjects.
 */
export function resolveTutorSubjects(subjects: Subject[], selectedSubjectId: string): Subject[] {
  if (selectedSubjectId === 'all') return subjects;
  const selected = subjects.find(subject => subject.id === selectedSubjectId);
  return selected ? [selected] : subjects;
}

/**
 * Current, size-limited subject context for POST /api/chat.
 * Verified syllabus units/topics are included; unverified subjects only expose status.
 */
export function buildSubjectContexts(
  subjects: Subject[],
  selectedSubjectId: string = 'all'
): AISubjectContext[] {
  const targets = resolveTutorSubjects(subjects, selectedSubjectId).slice(0, MAX_CONTEXT_SUBJECTS);
  let remainingTopics = MAX_CONTEXT_TOTAL_TOPICS;

  return targets.map(subject => {
    const context: AISubjectContext = {
      name: subject.name.trim(),
      code: subject.code.trim(),
      credits: subject.credits,
      syllabus_status: subject.syllabus?.status ?? 'not_provided',
    };

    if (!hasVerifiedSyllabus(subject) || remainingTopics <= 0) return context;

    const units: AISubjectUnit[] = [];
    for (const unit of subject.syllabus!.units.slice(0, MAX_CONTEXT_UNITS)) {
      if (remainingTopics <= 0) break;
      const topics = unit.topics
        .slice(0, Math.min(MAX_CONTEXT_TOPICS_PER_UNIT, remainingTopics))
        .map(topic => topic.name.trim())
        .filter(Boolean);
      remainingTopics -= topics.length;
      units.push({
        unit_number: unit.unitNumber,
        unit_title: unit.title.trim(),
        topics,
      });
    }

    if (units.length > 0) context.units = units;
    return context;
  });
}

/** Dynamic greeting that never claims access to external portals or invented courses. */
export function buildWelcomeMessage(subjects: Subject[]): string {
  if (subjects.length === 0) {
    return (
      "Hello! I'm your **StudentOS Academic Assistant**.\n\n" +
      "You haven't added any subjects yet. Add a subject in **My Subjects** and I'll use your own course list to guide explanations and revision.\n\n" +
      "I can use the data you enter in StudentOS, but I cannot access external university portals."
    );
  }

  const subjectList = joinWithAnd(
    subjects.map(subject => `**${formatSubjectLabel(subject)}**`)
  );
  const verified = subjects.filter(hasVerifiedSyllabus);
  const grounding = verified.length
    ? `Verified syllabi are available for ${joinWithAnd(
        verified.map(subject => `**${subject.code}**`)
      )}, so I can ground explanations in your own curriculum.`
    : 'Add verified syllabi in **My Subjects** to enable syllabus-grounded explanations.';

  return (
    "Hello! I'm your **StudentOS Academic Assistant**.\n\n" +
    `I can help you study ${subjectList} using the subject information you've added to StudentOS. ${grounding}\n\n` +
    "I can use the data you enter in StudentOS, but I cannot access external university portals."
  );
}

export interface SuggestedPromptGroups {
  /** Prompts built from topics in a student-verified syllabus. */
  grounded: string[];
  /** General learning prompts for the current subjects (no invented curriculum). */
  general: string[];
}

/**
 * Suggestions are derived from the current subjects and verified syllabus topics.
 * When no verified syllabus exists, only clearly-general prompts are offered.
 */
export function buildSuggestedPrompts(
  subjects: Subject[],
  selectedSubjectId: string = 'all'
): SuggestedPromptGroups {
  const targets = resolveTutorSubjects(subjects, selectedSubjectId);
  const grounded: string[] = [];

  for (const subject of targets) {
    if (!hasVerifiedSyllabus(subject)) continue;
    const topics = subject.syllabus!.units
      .flatMap(unit => unit.topics.map(topic => topic.name.trim()))
      .filter(Boolean);
    for (const topic of topics.slice(0, 2)) {
      if (grounded.length >= 3) break;
      grounded.push(`Explain "${topic}" from ${subject.code} ${subject.name}`);
    }
    if (grounded.length >= 3) break;
  }

  const general: string[] = [];
  if (targets.length > 0) {
    const primary = targets[0];
    general.push(`Explain the core concepts of ${primary.code} ${primary.name}`);
    general.push(`Give me a 5-question practice quiz on ${primary.code} ${primary.name}`);
    general.push(
      targets.length > 1
        ? 'Summarise the key ideas across my current subjects'
        : `Create an active-recall revision plan for ${primary.code} ${primary.name}`
    );
  } else {
    general.push(
      'How do I add my subjects to StudentOS?',
      'What study techniques improve active recall?'
    );
  }

  return { grounded: grounded.slice(0, 3), general: general.slice(0, 3) };
}

const LEGACY_STARTER_IDS = new Set(['msg-1']);
const LEGACY_STARTER_MARKERS = [
  'studentos academic assistant',
  'i have access to your syllabus across',
  'midterm ii is in 4 days',
];

function isLegacyStarterMessage(message: ChatMessage): boolean {
  if (message.sender !== 'assistant') return false;
  if (LEGACY_STARTER_IDS.has(message.id)) return true;
  const content = message.content.toLowerCase();
  const markerHits = LEGACY_STARTER_MARKERS.filter(marker => content.includes(marker)).length;
  return markerHits >= 2;
}

/**
 * Removes only the outdated hardcoded starter greeting from persisted history.
 * Genuine user/assistant conversation turns are preserved. A dynamic welcome is
 * rendered by the tutor whenever the resulting conversation is empty.
 */
export function migrateChatMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ChatMessage => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as ChatMessage;
    if (typeof candidate.content !== 'string' || typeof candidate.id !== 'string') return false;
    if (candidate.sender !== 'user' && candidate.sender !== 'assistant') return false;
    return !isLegacyStarterMessage(candidate);
  });
}
