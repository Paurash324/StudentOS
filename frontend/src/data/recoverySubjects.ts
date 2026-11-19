import { Subject } from '../types';

/**
 * The student's confirmed recovery catalog.
 *
 * This list exists only for the explicit, one-time recovery import shown in
 * Settings after a storage loss. It is never seeded on startup, never overrides
 * an existing subject, and contains no examination dates, syllabus units or
 * topics, PYQ statistics or assignments, because none of those were recovered.
 */
export interface RecoverySubjectSeed {
  code: string;
  name: string;
  professor: string;
  credits: number;
  confidence: number;
  /** The subject previously had a verified syllabus that this recovery cannot restore. */
  syllabusNeedsReverification: boolean;
}

export const RECOVERY_SUBJECT_SEEDS: RecoverySubjectSeed[] = [
  {
    code: '26ECP-102',
    name: 'AI Applications Lab',
    professor: 'Mr. Sachin',
    credits: 1,
    confidence: 92,
    syllabusNeedsReverification: false,
  },
  {
    code: '26CSP-102',
    name: 'DTI',
    professor: 'Mr. Paras Khullar',
    credits: 1,
    confidence: 84,
    syllabusNeedsReverification: false,
  },
  {
    code: '26PCH-110',
    name: 'Communication Skills',
    professor: 'Ms. Pratibha Mehra',
    credits: 1,
    confidence: 75,
    syllabusNeedsReverification: false,
  },
  {
    code: '26ECH-101',
    name: 'Digital Electronics',
    professor: 'Mr. Praveen Kumar Bajaj',
    credits: 4,
    confidence: 63,
    syllabusNeedsReverification: false,
  },
  {
    code: '26CSH-101',
    name: 'LTPS',
    professor: 'Mr. Gurbhej Singh',
    credits: 4,
    confidence: 82,
    syllabusNeedsReverification: false,
  },
  {
    code: '26MST-121',
    name: 'Mathematics',
    professor: 'Mr. Murari Kumar Roy',
    credits: 5,
    confidence: 90,
    syllabusNeedsReverification: true,
  },
  {
    code: '26CST-110',
    name: 'ACPP',
    professor: 'Ms. Navneet Kaur',
    credits: 1,
    confidence: 94,
    syllabusNeedsReverification: false,
  },
  {
    code: '26SZT-148',
    name: 'Biology',
    professor: 'Mr. Munish Kaul',
    credits: 3,
    confidence: 29,
    syllabusNeedsReverification: true,
  },
  {
    code: '26UCT-103',
    name: 'UHV',
    professor: 'Ms. Neha Verma',
    credits: 1,
    confidence: 90,
    syllabusNeedsReverification: true,
  },
];

/** Course codes whose verified syllabus could not be recovered from storage. */
export const RECOVERY_SYLLABUS_NEEDS_REVERIFICATION: string[] = RECOVERY_SUBJECT_SEEDS.filter(
  seed => seed.syllabusNeedsReverification
).map(seed => seed.code);

/** Builds fresh subject records with stable ids so a repeat import never duplicates. */
export function buildRecoverySubjects(): Subject[] {
  return RECOVERY_SUBJECT_SEEDS.map(seed => ({
    // Stable, code-derived id: importing twice merges instead of appending.
    id: `recovered-${seed.code.replace(/[^a-z0-9]/gi, '').toLowerCase()}`,
    code: seed.code,
    name: seed.name,
    credits: seed.credits,
    professor: seed.professor,
    difficulty: 'Intermediate',
    confidence: seed.confidence,
    priority: 'Medium',
    color: '#6366F1',
    accentBg: '#EEF2FF',
    // No curriculum is invented: the student re-verifies the syllabus if it existed.
    topics: [],
    ...(seed.syllabusNeedsReverification ? { syllabusNeedsReverification: true } : {}),
  }));
}
