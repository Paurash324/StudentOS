import {
  CourseTopic,
  CourseUnit,
  ParsedPyqResult,
  PyqAnalysis,
  PyqPaper,
  PyqQuestion,
  PyqFrequencyItem,
  Subject,
} from '../types';

let idCounter = 0;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

/**
 * PYQ Intelligence helpers.
 *
 * Frequency is always derived from actual classified question occurrences.
 * Duplicate question text inside the same paper is counted once. Historical
 * frequency is descriptive only and is never a prediction of future exams.
 */

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/^[\s(\[]*(\d+|[a-z])[).\]]\s*/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeMarks(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 200) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    if (match) {
      const parsed = Number(match[0]);
      if (parsed >= 0 && parsed <= 200) return parsed;
    }
  }
  return null;
}

function normalizeYear(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1990 && value <= 2100) {
    return value;
  }
  if (typeof value === 'string' && /^\d{4}$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (parsed >= 1990 && parsed <= 2100) return parsed;
  }
  return null;
}

function normalizeQuestion(raw: any): PyqQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const text = asString(raw.text).replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const classification =
    raw.classification === 'syllabus' || raw.classification === 'ai' || raw.classification === 'manual'
      ? raw.classification
      : 'unclassified';
  return {
    id: asString(raw.id) || makeId('pyqq'),
    number: asString(raw.number) || undefined,
    text,
    marks: normalizeMarks(raw.marks),
    unitId: asString(raw.unitId) || undefined,
    unitTitle: asString(raw.unitTitle) || undefined,
    topicId: asString(raw.topicId) || undefined,
    topicName: asString(raw.topicName) || undefined,
    subtopics: Array.isArray(raw.subtopics)
      ? raw.subtopics.filter((s: unknown): s is string => typeof s === 'string').map((s: string) => s.trim()).filter(Boolean).slice(0, 12)
      : [],
    classification,
  };
}

function normalizePaper(raw: any): PyqPaper | null {
  if (!raw || typeof raw !== 'object') return null;
  const questions = (Array.isArray(raw.questions) ? raw.questions : [])
    .map(normalizeQuestion)
    .filter((q: PyqQuestion | null): q is PyqQuestion => q !== null);
  return {
    id: asString(raw.id) || makeId('pyqpaper'),
    fileName: asString(raw.fileName) || 'Question paper',
    year: normalizeYear(raw.year),
    examLabel: asString(raw.examLabel) || undefined,
    sourceType: raw.sourceType === 'manual' ? 'manual' : 'pdf',
    uploadedAt: asString(raw.uploadedAt) || new Date().toISOString(),
    pageCount: typeof raw.pageCount === 'number' ? raw.pageCount : null,
    questions: questions.slice(0, 150),
    warnings: Array.isArray(raw.warnings)
      ? raw.warnings.filter((w: unknown): w is string => typeof w === 'string')
      : [],
    reviewed: Boolean(raw.reviewed),
  };
}

export function normalizePyqAnalysis(raw: any): PyqAnalysis | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const papers = (Array.isArray(raw.papers) ? raw.papers : [])
    .map(normalizePaper)
    .filter((paper: PyqPaper | null): paper is PyqPaper => paper !== null);
  if (papers.length === 0) return undefined;
  return {
    papers,
    lastAnalyzedAt: asString(raw.lastAnalyzedAt) || undefined,
  };
}

function unitLookup(syllabus: Subject['syllabus']): {
  units: CourseUnit[];
  findUnit: (name: string) => CourseUnit | undefined;
  findTopic: (unit: CourseUnit | undefined, name: string) => CourseTopic | undefined;
  findTopicAnywhere: (name: string) => { unit?: CourseUnit; topic?: CourseTopic } | undefined;
} {
  const units = syllabus?.units ?? [];
  const normalize = (value: string) => normalizeQuestionText(value);
  return {
    units,
    findUnit: (name: string) => {
      const key = normalize(name);
      if (!key) return undefined;
      return units.find(unit => normalize(unit.title) === key)
        ?? units.find(unit => normalize(unit.title).includes(key) || key.includes(normalize(unit.title)));
    },
    findTopic: (unit, name) => {
      const key = normalize(name);
      if (!key) return undefined;
      const pool = unit ? unit.topics : units.flatMap(u => u.topics);
      return pool.find(topic => normalize(topic.name) === key)
        ?? pool.find(topic => normalize(topic.name).includes(key) || key.includes(normalize(topic.name)));
    },
    findTopicAnywhere: (name: string) => {
      const key = normalize(name);
      if (!key) return undefined;
      for (const unit of units) {
        const topic = unit.topics.find(t => normalize(t.name) === key);
        if (topic) return { unit, topic };
      }
      return undefined;
    },
  };
}

/** Builds a stored paper from the backend result, matching names to the verified syllabus. */
export function paperFromParsedPyq(
  result: ParsedPyqResult,
  subject: Subject,
  fileName: string
): PyqPaper {
  const lookup = unitLookup(subject.syllabus?.status === 'verified' ? subject.syllabus : undefined);
  const seen = new Set<string>();

  const questions: PyqQuestion[] = [];
  for (const rawQuestion of result.questions ?? []) {
    const text = asString(rawQuestion.text).replace(/\s+/g, ' ').trim();
    const key = normalizeQuestionText(text);
    if (!text || seen.has(key)) continue;
    seen.add(key);

    const unitName = asString(rawQuestion.unit_title);
    const topicName = asString(rawQuestion.topic_name);

    let unit = lookup.findUnit(unitName) ?? lookup.findTopicAnywhere(topicName)?.unit;
    let topic = lookup.findTopic(unit, topicName);

    if (!topic && topicName) {
      const anywhere = lookup.findTopicAnywhere(topicName);
      if (anywhere) {
        unit = anywhere.unit;
        topic = anywhere.topic;
      }
    }

    const matched = Boolean(topic);
    const classification = matched
      ? 'syllabus'
      : rawQuestion.classification === 'ai' && topicName
        ? 'ai'
        : rawQuestion.classification === 'syllabus'
          ? 'ai'
          : 'unclassified';

    questions.push({
      id: makeId('pyqq'),
      number: rawQuestion.number ?? undefined,
      text,
      marks: normalizeMarks(rawQuestion.marks),
      unitId: unit?.id,
      unitTitle: unit?.title ?? (unitName || undefined),
      topicId: topic?.id,
      topicName: topic?.name ?? (topicName || undefined),
      subtopics: Array.isArray(rawQuestion.subtopics)
        ? rawQuestion.subtopics.map(s => s.trim()).filter(Boolean).slice(0, 12)
        : [],
      classification,
    });
  }

  const warnings = [...(result.warnings ?? [])];
  if (lookup.units.length === 0) {
    warnings.push(
      'No verified syllabus was provided, so topics are AI-classified and need student review.'
    );
  } else {
    const unclassified = questions.filter(q => !q.topicId).length;
    if (unclassified > 0) {
      warnings.push(
        `${unclassified} question${unclassified === 1 ? '' : 's'} could not be matched to a verified syllabus topic. Review and correct the classification.`
      );
    }
  }

  return {
    id: makeId('pyqpaper'),
    fileName,
    year: normalizeYear(result.year),
    examLabel: result.exam_label ?? undefined,
    sourceType: result.source_type === 'pdf' ? 'pdf' : 'manual',
    uploadedAt: new Date().toISOString(),
    pageCount: result.page_count ?? null,
    questions,
    warnings,
    reviewed: false,
  };
}

/** Counts real question occurrences, deduplicated within each paper. */
export function computeTopicFrequency(papers: PyqPaper[]): PyqFrequencyItem[] {
  const totalPapers = papers.filter(paper => paper.questions.length > 0).length;
  const buckets = new Map<string, PyqFrequencyItem>();
  const seenByPaper = new Map<string, Set<string>>();
  const papersPerTopic = new Map<string, Set<string>>();

  for (const paper of papers) {
    if (!seenByPaper.has(paper.id)) seenByPaper.set(paper.id, new Set());
    const seen = seenByPaper.get(paper.id)!;

    for (const question of paper.questions) {
      const topicName = (question.topicName || '').trim();
      if (!topicName) continue;
      const dedupeKey = normalizeQuestionText(question.text);
      if (!dedupeKey || seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const key = question.topicId
        ? `topic:${question.topicId}`
        : `name:${normalizeQuestionText(question.unitTitle || '')}|${normalizeQuestionText(topicName)}`;

      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          key,
          unitId: question.unitId,
          unitTitle: question.unitTitle,
          topicId: question.topicId,
          topicName,
          occurrences: 0,
          paperAppearances: 0,
          totalPapers,
          years: [],
          marksTotal: 0,
          marksKnown: 0,
          questions: [],
        };
        buckets.set(key, bucket);
      }

      bucket.occurrences += 1;
      if (!papersPerTopic.has(key)) papersPerTopic.set(key, new Set());
      papersPerTopic.get(key)!.add(paper.id);
      bucket.paperAppearances = papersPerTopic.get(key)!.size;
      if (paper.year !== null && !bucket.years.includes(paper.year)) {
        bucket.years.push(paper.year);
      }
      if (question.marks !== null) {
        bucket.marksTotal += question.marks;
        bucket.marksKnown += 1;
      }
      bucket.questions.push({
        paperId: paper.id,
        year: paper.year,
        questionId: question.id,
        questionNumber: question.number,
        text: question.text,
        marks: question.marks,
      });
    }
  }

  return [...buckets.values()]
    .map(item => ({
      ...item,
      paperAppearances: papersPerTopic.get(item.key)?.size ?? item.paperAppearances,
      years: [...item.years].sort((a, b) => a - b),
    }))
    .sort((a, b) => b.paperAppearances - a.paperAppearances || b.occurrences - a.occurrences);
}

export function subjectPyqStats(subject: Subject): {
  papers: number;
  reviewedPapers: number;
  questions: number;
  classifiedQuestions: number;
  topicsWithPyq: number;
} {
  const papers = subject.pyq?.papers ?? [];
  const questions = papers.flatMap(paper => paper.questions);
  const frequency = computeTopicFrequency(papers);
  return {
    papers: papers.length,
    reviewedPapers: papers.filter(p => p.reviewed).length,
    questions: questions.length,
    classifiedQuestions: questions.filter(q => Boolean(q.topicName)).length,
    topicsWithPyq: frequency.length,
  };
}

/** Share of verified syllabus topics that appear in at least one PYQ, 0-100. */
export function subjectPyqCoverage(subject: Subject): number {
  if (subject.syllabus?.status !== 'verified') return 0;
  const topicCount = subject.syllabus.units.reduce((sum, unit) => sum + unit.topics.length, 0);
  if (topicCount === 0) return 0;
  const covered = computeTopicFrequency(subject.pyq?.papers ?? []).filter(item =>
    subject.syllabus!.units.some(unit => unit.topics.some(topic => topic.id === item.topicId))
  ).length;
  return Math.min(100, Math.round((covered / topicCount) * 100));
}
