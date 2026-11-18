import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  ExamSchedule,
  ExamScheduleEntry,
  PageTab,
  StudyAvailability,
  Subject,
} from '../types';
import { parseDateSheetPdf } from '../services/examService';
import {
  daysUntilExam,
  buildStudyAllocations,
  localIsoDate,
} from '../utils/examEngine';
import {
  formatExamDate,
  genEntryId,
  matchEntryToSubject,
  sortScheduleEntries,
} from '../utils/dateSheet';
import { DateSheetReviewModal } from './DateSheetReviewModal';
import { PyqIntelligencePanel } from './PyqIntelligencePanel';
import { StudyAvailabilityPanel } from './StudyAvailabilityPanel';

interface ExamIntelligenceViewProps {
  subjects: Subject[];
  examSchedule: ExamSchedule;
  availability: StudyAvailability;
  onSaveSchedule: (schedule: ExamSchedule) => void;
  onSaveAvailability: (availability: StudyAvailability) => void;
  onUpdateSubject: (subject: Subject) => void;
  onCreateSubject: (name: string, code: string) => Subject;
  onNavigateTab: (tab: PageTab) => void;
}

export const ExamIntelligenceView: React.FC<ExamIntelligenceViewProps> = ({
  subjects,
  examSchedule,
  availability,
  onSaveSchedule,
  onSaveAvailability,
  onUpdateSubject,
  onCreateSubject,
  onNavigateTab,
}) => {
  const [dateSheetBusy, setDateSheetBusy] = useState(false);
  const [dateSheetError, setDateSheetError] = useState<string | null>(null);
  const [reviewEntries, setReviewEntries] = useState<ExamScheduleEntry[] | null>(null);
  const dateSheetInputRef = useRef<HTMLInputElement>(null);

  const savedEntries = useMemo(() => sortScheduleEntries(examSchedule.entries), [examSchedule.entries]);
  const allocations = useMemo(
    () => buildStudyAllocations(subjects, examSchedule, availability, 'exam'),
    [subjects, examSchedule, availability]
  );

  const handleDateSheetFile = async (file: File | undefined) => {
    if (!file) return;
    setDateSheetError(null);
    setDateSheetBusy(true);
    try {
      const result = await parseDateSheetPdf(file);
      const entries: ExamScheduleEntry[] = result.entries.map((entry, index) => {
        const subject = matchEntryToSubject(
          { subjectCode: entry.course_code, subjectName: entry.subject_name },
          subjects
        );
        return {
          id: genEntryId(),
          subjectId: subject?.id,
          subjectCode: entry.course_code || subject?.code || '',
          subjectName: entry.subject_name || subject?.name || '',
          examDate: entry.exam_date ?? '',
          startTime: entry.start_time ?? undefined,
          sourceType: 'pdf',
          verified: false,
          warnings: [
            ...(entry.warnings ?? []),
            ...(index === 0 ? result.warnings : []),
          ],
        };
      });
      setReviewEntries(entries);
    } catch (err) {
      setDateSheetError(err instanceof Error ? err.message : 'The date sheet could not be processed.');
    } finally {
      setDateSheetBusy(false);
      if (dateSheetInputRef.current) dateSheetInputRef.current.value = '';
    }
  };

  const handleSaveDateSheet = (entries: ExamScheduleEntry[]) => {
    onSaveSchedule({ entries, updatedAt: new Date().toISOString() });
    setReviewEntries(null);
  };

  const handleDeleteEntry = (entry: ExamScheduleEntry) => {
    if (!window.confirm(`Remove the ${entry.subjectCode || entry.subjectName} examination date?`)) return;
    onSaveSchedule({
      entries: examSchedule.entries.filter(item => item.id !== entry.id),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Exam Intelligence
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed max-w-2xl">
            Verified examination dates, previous-year question analysis, and deterministic study-time allocation
            across every exam you have scheduled.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('planner')}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm shadow-indigo-600/30 whitespace-nowrap self-start"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Exam Timetable</span>
        </button>
      </div>

      {/* Date Sheet */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">Examination Date Sheet</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload the official date sheet PDF or enter dates manually. Dates are reviewed before saving.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <input
              ref={dateSheetInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handleDateSheetFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => dateSheetInputRef.current?.click()}
              disabled={dateSheetBusy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 rounded-xl transition-colors"
            >
              {dateSheetBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{dateSheetBusy ? 'Extracting dates…' : 'Upload PDF'}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setReviewEntries([
                  {
                    id: genEntryId(),
                    subjectCode: '',
                    subjectName: '',
                    examDate: '',
                    sourceType: 'manual',
                    verified: false,
                    warnings: [],
                  },
                ])
              }
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enter manually</span>
            </button>
            {savedEntries.length > 0 && (
              <button
                type="button"
                onClick={() => setReviewEntries(savedEntries)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Manage dates</span>
              </button>
            )}
          </div>
        </div>

        {dateSheetError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{dateSheetError}</span>
          </div>
        )}

        {savedEntries.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
            <CalendarRange className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No verified examination dates yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Without a date sheet, the exam allocation engine cannot prioritise by proximity.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E9F2]">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-display font-semibold">Course</th>
                  <th className="px-3 py-2 font-display font-semibold">Date</th>
                  <th className="px-3 py-2 font-display font-semibold">Time</th>
                  <th className="px-3 py-2 font-display font-semibold">Countdown</th>
                  <th className="px-3 py-2 font-display font-semibold">Match</th>
                  <th className="px-3 py-2 font-display font-semibold">Source</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedEntries.map(entry => {
                  const subject = matchEntryToSubject(entry, subjects);
                  const days = daysUntilExam(entry.examDate);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2">
                        <span className="font-display font-bold text-slate-800 block">{entry.subjectCode || '—'}</span>
                        <span className="text-[10px] text-slate-500">{entry.subjectName}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatExamDate(entry.examDate)}</td>
                      <td className="px-3 py-2 text-slate-600">{entry.startTime || '—'}</td>
                      <td className="px-3 py-2">
                        {days === null ? (
                          <span className="text-rose-600 font-semibold">Invalid</span>
                        ) : days < 0 ? (
                          <span className="text-slate-400">Completed</span>
                        ) : (
                          <span className={`font-display font-bold ${days <= 3 ? 'text-rose-600' : days <= 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {days === 0 ? 'Today' : `${days}d`}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {subject ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            {subject.code}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold">Unmatched</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {entry.sourceType === 'pdf' ? 'PDF' : 'Manual'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDeleteEntry(entry)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Remove examination"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PyqIntelligencePanel subjects={subjects} onUpdateSubject={onUpdateSubject} />

      <StudyAvailabilityPanel value={availability} onChange={onSaveAvailability} />

      {/* Allocation preview */}
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">
              Recommended Exam-Time Allocation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic weighting from exam proximity, syllabus gaps, confidence, difficulty, and historical PYQ counts.
            </p>
          </div>
          {allocations.subjects.length > 0 && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60 self-start">
              {allocations.totalMinutes} min today · {allocations.subjects.length} exams
            </span>
          )}
        </div>

        {allocations.notes.length > 0 && (
          <div className="space-y-1">
            {allocations.notes.map((note, index) => (
              <p key={index} className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{note}</span>
              </p>
            ))}
          </div>
        )}

        {allocations.subjects.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
            <CalendarDays className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Add verified exam dates to see allocations</p>
            <p className="text-xs text-slate-500 mt-1">
              Allocations are calculated only for subjects with a verified future examination date.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {allocations.subjects.map(allocation => (
              <div key={allocation.subjectId} className="rounded-xl border border-[#E5E9F2] p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-display text-xs font-bold text-indigo-600">{allocation.code}</span>
                    <h3 className="font-display text-sm font-bold text-slate-900 truncate">{allocation.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{allocation.reason}</p>
                  </div>
                  <span className="font-display text-sm font-extrabold text-slate-900 tabular-nums shrink-0">
                    {allocation.recommendedMinutes} min
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded-md border font-semibold ${
                    allocation.daysLeft <= 3
                      ? 'text-rose-700 bg-rose-50 border-rose-200'
                      : 'text-slate-600 bg-slate-50 border-slate-200'
                  }`}>
                    {allocation.daysLeft === 0 ? 'Exam today' : `${allocation.daysLeft}d to exam`}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md border text-slate-600 bg-slate-50 border-slate-200">
                    {allocation.pendingTopics}/{allocation.totalTopics} pending
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md border text-slate-600 bg-slate-50 border-slate-200">
                    PYQ coverage {allocation.pyqCoverage}%
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md border text-slate-600 bg-slate-50 border-slate-200">
                    weight {allocation.weight}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {allocation.topics.map(topic => (
                    <div key={`${allocation.subjectId}-${topic.topicId ?? topic.topicName}`} className="flex items-start justify-between gap-2 text-[11px]">
                      <div className="min-w-0">
                        <span className="text-slate-800 font-medium block truncate">{topic.topicName}</span>
                        <span className="text-[10px] text-slate-400">
                          {topic.unitTitle ? `${topic.unitTitle} · ` : ''}{topic.reason}
                        </span>
                      </div>
                      <span className="font-display font-bold text-slate-700 tabular-nums shrink-0">
                        {topic.recommendedMinutes}m
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {allocation.syllabusVerified ? 'Verified syllabus' : 'No verified syllabus — tracked topics used'}
                  </span>
                  <button
                    onClick={() => onNavigateTab('planner')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-800"
                  >
                    <span>Build timetable</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-slate-400">
          Recommendations are deterministic and explainable, not AI-generated. You remain in control: change availability,
          study hours, session length, and regenerate. Completed and pinned sessions are preserved.
        </p>
      </div>

      {reviewEntries && (
        <DateSheetReviewModal
          entries={reviewEntries}
          subjects={subjects}
          onCreateSubject={onCreateSubject}
          onCancel={() => setReviewEntries(null)}
          onSave={handleSaveDateSheet}
        />
      )}
    </div>
  );
};
