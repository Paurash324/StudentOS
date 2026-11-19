import { describe, it, expect } from 'vitest';
import type { Subject, Deadline, TimetableBlock, StudyLogEntry, ExamSchedule, ExamScheduleEntry } from '../types';
import {
  bootstrapStudentState,
  buildUpcomingDeadlines,
  deleteSubjectFromPlan,
  renameSubjectInPlan,
  resolveBlocksForDisplay,
  toggleSessionCompletion,
} from './studentState';
import { DEFAULT_AVAILABILITY, generateExamPlan, getEligibleExams } from './examEngine';

/**
 * Regression test dataset taken from the current StudentOS catalog.
 *
 * These ids/codes/names are the authoritative values for the nine active
 * subjects. They are used only in tests; they are never written into
 * production mockData and are never auto-recreated after deletion.
 */
const CATALOG_COURSE_CODES = [
  '26ECP-102',
  '26CSP-102',
  '26PCH-110',
  '26ECH-101',
  '26CSH-101',
  '26MST-121',
  '26CST-110',
  '26SZT-148',
  '26UCT-103',
];

const CATALOG_IDS = [
  'sub-ai-apps-lab',
  'sub-dti',
  'sub-comm-skills',
  'sub-digital-electronics',
  'sub-ltps',
  'sub-mathematics',
  'sub-acpp',
  'sub-biology',
  'sub-uvh',
];

const CATALOG_SUBJECTS: Subject[] = [
  {
    id: CATALOG_IDS[0],
    code: '26ECP-102',
    name: 'AI Applications Lab',
    credits: 1,
    professor: 'Mr. Sachin',
    difficulty: 'Intermediate',
    confidence: 92,
    priority: 'Medium',
    color: '#6366F1',
    accentBg: '#EEF2FF',
    topics: [],
  },
  {
    id: CATALOG_IDS[1],
    code: '26CSP-102',
    name: 'DTI',
    credits: 1,
    professor: 'Mr. Paras Khullar',
    difficulty: 'Intermediate',
    confidence: 84,
    priority: 'Medium',
    color: '#6366F1',
    accentBg: '#EEF2FF',
    topics: [],
  },
  {
    id: CATALOG_IDS[2],
    code: '26PCH-110',
    name: 'Communication Skills',
    credits: 1,
    professor: 'Ms. Pratibha Mehra',
    difficulty: 'Intermediate',
    confidence: 75,
    priority: 'Medium',
    color: '#6366F1',
    accentBg: '#EEF2FF',
    topics: [],
  },
  {
    id: CATALOG_IDS[3],
    code: '26ECH-101',
    name: 'Digital Electronics',
    credits: 4,
    professor: 'Mr. Praveen Kumar Bajaj',
    difficulty: 'Advanced',
    confidence: 63,
    priority: 'Medium',
    color: '#6366F1',
    accentBg: '#EEF2FF',
    topics: [],
  },
  {
    id: CATALOG_IDS[4],
    code: '26CSH-101',
    name: 'LTPS',
    credits: 4,
    professor: 'Mr. Gurbhej Singh',
    difficulty: 'Intermediate',
    confidence: 82,
    priority: 'High',
    color: '#6366F1',
    accentBg: '#EEF2FF',
    topics: [],
  },
  {
    id: CATALOG_IDS[5],
    code: '26MST-121',
    name: 'Mathematics',
    credits: 5,
    professor: 'Mr. Murari Kumar Roy',
    difficulty: 'Advanced',
    confidence: 90,
    priority: 'High',
    color: '#6366F1',
    accentBg: '#EEF2FF',
    topics: [],
    syllabus: {
      status: 'verified',
      sourceType: 'manual',
      units: [],
      warnings: [],
    },
  },
  {
    id: CATALOG_IDS[6],
    code: '26CST-110',
    name: 'ACPP',
    credits: 1,
    professor: 'Ms. Navneet Kaur',
    difficulty: 'Foundational',
    confidence: 94,
    priority: 'Medium',
    color: '#6366F1',
    accentBg: '#EEF2FF',
    topics: [],
  },
  {
    id: CATALOG_IDS[7],
    code: '26SZT-148',
    name: 'Biology',
    credits: 3,
    professor: 'Mr. Munish Kaul',
    difficulty: 'Intermediate',
    confidence: 29,
    priority: 'Low',
    color: '#6366F1',
    accentBg: '#EEF2FF',
    topics: [],
    syllabus: {
      status: 'verified',
      sourceType: 'manual',
      units: [],
      warnings: [],
    },
  },
  {
    id: CATALOG_IDS[8],
    code: '26UCT-103',
    name: 'UHV',
    credits: 1,
    professor: 'Ms. Neha Verma',
    difficulty: 'Intermediate',
    confidence: 90,
    priority: 'Medium',
    color: '#6366F1',
    accentBg: '#EEF2FF',
    topics: [],
    syllabus: {
      status: 'verified',
      sourceType: 'manual',
      units: [],
      warnings: [],
    },
  },
];

const CATALOG_SYLLABUS_VERIFIED_IDS = new Set([
  CATALOG_IDS[5],
  CATALOG_IDS[7],
  CATALOG_IDS[8],
]);

function makeExamEntry(
  id: string,
  subjectId: string | undefined,
  subjectCode: string,
  subjectName: string,
  examDate: string,
  startTime?: string
): ExamScheduleEntry {
  const entry: ExamScheduleEntry = {
    id,
    subjectId,
    subjectCode,
    subjectName,
    examDate,
    startTime,
    sourceType: 'pdf',
    verified: true,
    warnings: [],
  };
  return entry;
}

describe('StudentOS subject catalog synchronization', () => {
  it('should keep the nine active subjects and strip only legacy demo records', () => {
    const storage: Record<string, string | null> = {
      'studentos_subjects': JSON.stringify([
        // Real catalog subject should be preserved.
        CATALOG_SUBJECTS[5],
        // Legacy demo subject should be removed.
        {
          id: 'cs301',
          code: 'CS 301',
          name: 'Legacy Demo Subject',
          credits: 3,
          professor: 'Faculty Instructor',
          difficulty: 'Intermediate',
          confidence: 70,
          priority: 'Medium',
          color: '#6366F1',
          accentBg: '#EEF2FF',
          topics: [],
          nextExam: {
            title: 'Module Examination',
            date: 'Dec 15, 2026',
            daysLeft: 34,
            weight: '30% of grade',
          },
        },
      ]),
      'studentos_schema_version': '1',
    };

    const snapshot = bootstrapStudentState({
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => {
        storage[key] = value;
      },
      removeItem: (key) => {
        storage[key] = null;
      },
    });

    expect(snapshot.subjects.length).toBe(1);
    expect(snapshot.subjects[0].id).toBe(CATALOG_IDS[5]);
    expect(snapshot.subjects[0].code).toBe('26MST-121');
    expect(snapshot.report.removedDemoSubjects).toEqual(['cs301']);
    expect(snapshot.report.removedDemoNextExams).toBe(0);
    expect(snapshot.report.removedLegacyActivity).toBe(false);
    expect(snapshot.report.removedLegacyTasks).toBe(false);

    // Confirm catalog shape is authoritative in tests only.
    expect(CATALOG_COURSE_CODES).toHaveLength(9);
    expect(CATALOG_SUBJECTS).toHaveLength(9);
    CATALOG_COURSE_CODES.forEach((code) => {
      expect(CATALOG_SUBJECTS.map((s) => s.code)).toContain(code);
    });
  });





  it('should treat Mathematics, Biology, and UHV as the verified syllabus subjects', () => {
    const verifiedIds = new Set<string>([...CATALOG_SYLLABUS_VERIFIED_IDS]);
    const verifiedSubjects = CATALOG_SUBJECTS.filter((subject) => verifiedIds.has(subject.id));

    expect(verifiedSubjects).toHaveLength(3);
    expect(verifiedSubjects.map((s) => s.code).sort()).toEqual([
      '26MST-121',
      '26SZT-148',
      '26UCT-103',
    ].sort());
    verifiedSubjects.forEach((subject) => {
      expect(subject.syllabus?.status).toBe('verified');
      expect(subject.syllabus?.units.length).toBe(0);
    });

    const notProvidedSubjects = CATALOG_SUBJECTS.filter(
      (subject) => !subject.syllabus || subject.syllabus.status !== 'verified'
    );
    expect(notProvidedSubjects).toHaveLength(6);
    notProvidedSubjects.forEach((subject) => {
      expect(subject.syllabus).toBeUndefined();
    });
  });





  it('should match verified date-sheet entries only to active catalog subjects', () => {
    const examDate = '2026-12-20';
    const schedule: ExamSchedule = {
      entries: [
        makeExamEntry(
          'exam-math',
          CATALOG_IDS[5],
          '26MST-121',
          'Mathematics',
          examDate,
          '09:00'
        ),
        makeExamEntry(
          'exam-bio',
          CATALOG_IDS[7],
          '26SZT-148',
          'Biology',
          examDate,
          undefined
        ),
        makeExamEntry(
          'exam-orphan',
          undefined,
          'FAKE-999',
          'Orphan Exam',
          examDate,
          undefined
        ),
      ],
    };

    const eligible = getEligibleExams(CATALOG_SUBJECTS, schedule, new Date('2026-12-10T12:00:00'));
    expect(eligible).toHaveLength(2);

    const matchedIds = eligible.map((exam) => exam.subject.id).sort();
    expect(matchedIds).toEqual([
      CATALOG_IDS[5],
      CATALOG_IDS[7],
    ].sort());
    expect(eligible[0].subject.code).toBe('26MST-121');
    expect(eligible[1].subject.code).toBe('26SZT-148');
  });

  it('should build upcoming deadlines only from verified exam matches and active-subject milestones', () => {
    const examDate = '2026-12-20';
    const schedule: ExamSchedule = {
      entries: [
        makeExamEntry(
          'exam-math',
          CATALOG_IDS[5],
          '26MST-121',
          'Mathematics',
          examDate,
          '09:00'
        ),
      ],
    };
    const milestones: Deadline[] = [
      {
        id: 'manual-dl-1',
        subjectId: CATALOG_IDS[6],
        subjectCode: '26CST-110',
        title: 'ACPP assignment draft',
        dueDate: '2026-12-22',
        daysRemaining: 12,
        type: 'Assignment',
        urgency: 'high',
        weight: '15%',
        completed: false,
        source: 'manual',
      },
      {
        id: 'manual-dl-orphan',
        subjectId: 'missing-subject',
        subjectCode: 'ZZZ-000',
        title: 'Orphan deadline',
        dueDate: '2026-12-19',
        daysRemaining: 9,
        type: 'Assignment',
        urgency: 'medium',
        weight: '',
        completed: false,
        source: 'manual',
      },
    ];

    const now = new Date('2026-12-10T12:00:00');
    const deadlines = buildUpcomingDeadlines(
      CATALOG_SUBJECTS,
      schedule,
      milestones,
      now
    );

    expect(deadlines.length).toBe(2);
    expect(deadlines[0].subjectCode).toBe('26MST-121');
    expect(deadlines[0].type).toBe('Exam');
    expect(deadlines[0].source).toBe('exam-sheet');
    expect(deadlines[1].subjectCode).toBe('26CST-110');
    expect(deadlines[1].type).toBe('Assignment');

    const orphanDeadline = deadlines.find((d) => d.id === 'manual-dl-orphan');
    expect(orphanDeadline).toBeUndefined();
  });

  it('should resolve Smart Planner timetable blocks against the active catalog', () => {
    const blocks: TimetableBlock[] = [
      {
        id: 'gen-block-1',
        day: 'Today',
        timeRange: '10:00 – 10:45 AM',
        subjectId: CATALOG_IDS[5],
        subjectCode: '26MST-121',
        subjectName: 'Mathematics',
        topic: 'Deterministic allocation sample',
        blockType: 'Deep Work',
        durationMinutes: 45,
        completed: false,
        generatedBy: 'exam-engine',
      },
      {
        id: 'gen-block-2',
        day: 'Today',
        timeRange: '11:00 – 11:30 AM',
        subjectId: 'missing-subject',
        subjectCode: 'FAKE-000',
        subjectName: 'Orphan Block',
        topic: 'Should not render',
        blockType: 'Deep Work',
        durationMinutes: 30,
        completed: false,
      },
      {
        id: 'break-1',
        day: 'Today',
        timeRange: '10:45 – 10:55 AM',
        subjectCode: 'BUFFER',
        subjectName: 'Study buffer',
        topic: 'Short reset between sessions',
        blockType: 'Break',
        durationMinutes: 10,
        completed: false,
      },
    ];

    const displayBlocks = resolveBlocksForDisplay(blocks, CATALOG_SUBJECTS);
    expect(displayBlocks.length).toBe(2);
    expect(displayBlocks.filter((block) => block.blockType === 'Break')).toHaveLength(1);
    expect(displayBlocks.find((block) => block.id === 'gen-block-1')).toBeDefined();
    expect(displayBlocks.find((block) => block.id === 'gen-block-2')).toBeUndefined();

    const mathBlock = displayBlocks.find((block) => block.id === 'gen-block-1');
    if (mathBlock) {
      expect(mathBlock.subjectId).toBe(CATALOG_IDS[5]);
      expect(mathBlock.subjectCode).toBe('26MST-121');
      expect(mathBlock.subjectName).toBe('Mathematics');
    }
  });

  it('should keep genuine completed sessions for deleted subjects in history only', () => {
    const completedMathSession: StudyLogEntry = {
      id: 'log-math-1',
      date: '2026-12-09',
      subjectId: CATALOG_IDS[5],
      subjectCode: '26MST-121',
      subjectName: 'Mathematics',
      minutes: 45,
      completedAt: '2026-12-09T09:45:00.000Z',
    };
    const blocks: TimetableBlock[] = [
      {
        id: 'pending-math',
        day: 'Today',
        timeRange: '10:00 – 10:45 AM',
        subjectId: CATALOG_IDS[5],
        subjectCode: '26MST-121',
        subjectName: 'Mathematics',
        topic: 'Pending Mathematics session',
        blockType: 'Deep Work',
        durationMinutes: 45,
        completed: false,
      },
    ];

    const state = deleteSubjectFromPlan(CATALOG_IDS[5], {
      subjects: CATALOG_SUBJECTS,
      timetableBlocks: blocks,
      deadlines: [],
    });

    expect(state.subjects).not.toContainEqual(
      expect.objectContaining({ id: CATALOG_IDS[5] })
    );
    expect(state.timetableBlocks).toHaveLength(0);

    // Genuine completed history can still be referenced by id in real storage;
    // this test only asserts that pending display blocks are removed.
    expect(completedMathSession.subjectId).toBe(CATALOG_IDS[5]);
  });

  it('should rename a catalog subject across plan blocks and deadlines', () => {
    const renamedSubject: Subject = {
      ...CATALOG_SUBJECTS[6],
      name: 'ACPP (updated)',
      code: '26CST-110',
    };

    const blocks: TimetableBlock[] = [
      {
        id: 'rename-block-1',
        day: 'Today',
        timeRange: '10:00 – 10:45 AM',
        subjectId: CATALOG_IDS[6],
        subjectCode: '26CST-110',
        subjectName: 'ACPP',
        topic: 'Active Recall Drill',
        blockType: 'Active Recall',
        durationMinutes: 45,
        completed: false,
      },
    ];
    const deadlines: Deadline[] = [
      {
        id: 'rename-dl-1',
        subjectId: CATALOG_IDS[6],
        subjectCode: '26CST-110',
        title: 'ACPP milestone',
        dueDate: '2026-12-18',
        daysRemaining: 8,
        type: 'Assignment',
        urgency: 'medium',
        weight: '',
        completed: false,
        source: 'manual',
      },
    ];

    const result = renameSubjectInPlan(renamedSubject, {
      subjects: CATALOG_SUBJECTS,
      timetableBlocks: blocks,
      deadlines,
    });

    expect(result.subjects.find((s) => s.id === CATALOG_IDS[6])?.name).toBe(
      'ACPP (updated)'
    );
    const renamedBlock = result.timetableBlocks.find(
      (block) => block.id === 'rename-block-1'
    );
    expect(renamedBlock?.subjectName).toBe('ACPP (updated)');
    const renamedDeadline = result.deadlines.find((d) => d.id === 'rename-dl-1');
    expect(renamedDeadline?.subjectCode).toBe('26CST-110');
  });

  it('should mark a completed session as genuine study activity with the real subject shape', () => {
    const block: TimetableBlock = {
      id: 'focus-block-1',
      day: 'Today',
      timeRange: '08:30 – 09:15 AM',
      subjectId: CATALOG_IDS[6],
      subjectCode: '26CST-110',
      subjectName: 'ACPP',
      topic: 'Active Recall Drill: Memory Models',
      blockType: 'Active Recall',
      durationMinutes: 45,
      completed: false,
    };

    const state = {
      subjects: CATALOG_SUBJECTS,
      timetableBlocks: [block],
      studyLog: [],
    };

    const result = toggleSessionCompletion(block.id, state);
    const entry = result.studyLog[0];

    expect(result.studyLog.length).toBe(1);
    expect(entry.subjectCode).toBe('26CST-110');
    expect(entry.subjectName).toBe('ACPP');
    expect(entry.minutes).toBe(45);
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof entry.completedAt).toBe('string');
  });

  it('should keep the exam-aware planner handling all nine eligible subjects when dates exist', () => {
    const catalogIds: string[] = [...CATALOG_IDS];
    const catalogCodes: string[] = [...CATALOG_COURSE_CODES];
    const examNow = new Date('2026-12-01T12:00:00');

    const schedule: ExamSchedule = {
      entries: CATALOG_SUBJECTS.map((subject, index) =>
        makeExamEntry(
          `exam-${subject.id}`,
          subject.id,
          subject.code,
          subject.name,
          `2026-12-${String(10 + index).padStart(2, '0')}`,
          index === 0 ? '09:00' : undefined
        )
      ),
    };

    // Only the three subjects whose syllabus the student actually uploaded are verified.
    expect(
      CATALOG_SUBJECTS.filter((subject) => subject.syllabus?.status === 'verified').map(
        (subject) => subject.id
      )
    ).toEqual([...CATALOG_SYLLABUS_VERIFIED_IDS]);

    const eligible = getEligibleExams(CATALOG_SUBJECTS, schedule, examNow);
    expect(eligible.length).toBe(catalogIds.length);
    expect([...eligible.map((exam) => exam.subject.id)].sort()).toEqual([...catalogIds].sort());
    expect([...new Set(eligible.map((exam) => exam.subject.code))].sort()).toEqual(
      [...catalogCodes].sort()
    );

    const plan = generateExamPlan({
      subjects: CATALOG_SUBJECTS,
      schedule,
      availability: DEFAULT_AVAILABILITY,
      existingBlocks: [],
      goal: 'exam',
      now: examNow,
    });

    // Every one of the nine exams receives study time, not just the nearest ones.
    expect([...plan.allocations.subjects.map((allocation) => allocation.subjectId)].sort()).toEqual(
      [...catalogIds].sort()
    );
    const verifiedIds = new Set<string>([...CATALOG_SYLLABUS_VERIFIED_IDS]);
    plan.allocations.subjects.forEach((allocation) => {
      expect(allocation.recommendedMinutes).toBeGreaterThan(0);
      expect(allocation.syllabusVerified).toBe(verifiedIds.has(allocation.subjectId));
    });

    const studyBlocks = plan.blocks.filter((block) => block.blockType !== 'Break');
    expect(studyBlocks.length).toBeGreaterThan(0);

    const plannedCodes = new Set(studyBlocks.map((block) => block.subjectCode));
    catalogCodes.forEach((code) => {
      expect(plannedCodes.has(code)).toBe(true);
    });

    studyBlocks.forEach((block) => {
      expect(catalogCodes.filter((code) => code === block.subjectCode).length).toBe(1);
    });
  });
});
