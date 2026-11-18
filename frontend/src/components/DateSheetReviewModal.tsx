import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { ExamScheduleEntry, Subject } from '../types';
import {
  findScheduleIssues,
  formatExamDate,
  genEntryId,
  isIsoDate,
  matchEntryToSubject,
  normalizeCode,
  normalizeName,
} from '../utils/dateSheet';

interface DateSheetReviewModalProps {
  entries: ExamScheduleEntry[];
  subjects: Subject[];
  onCreateSubject?: (name: string, code: string) => Subject | undefined;
  onCancel: () => void;
  onSave: (entries: ExamScheduleEntry[]) => void;
}

function cloneEntries(entries: ExamScheduleEntry[]): ExamScheduleEntry[] {
  return entries.map(entry => ({ ...entry, warnings: [...entry.warnings] }));
}

function blankEntry(): ExamScheduleEntry {
  return {
    id: genEntryId(),
    subjectCode: '',
    subjectName: '',
    examDate: '',
    sourceType: 'manual',
    verified: false,
    warnings: [],
  };
}

/** Editable date-sheet review. Nothing is saved until the student verifies it. */
export const DateSheetReviewModal: React.FC<DateSheetReviewModalProps> = ({
  entries,
  subjects,
  onCreateSubject,
  onCancel,
  onSave,
}) => {
  const [rows, setRows] = useState<ExamScheduleEntry[]>(() =>
    entries.length > 0 ? cloneEntries(entries) : [blankEntry()]
  );
  const [localSubjects, setLocalSubjects] = useState<Subject[]>(subjects);

  const issues = useMemo(() => findScheduleIssues(rows, localSubjects), [rows, localSubjects]);

  const updateRow = (id: string, patch: Partial<ExamScheduleEntry>) => {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, ...patch, verified: false } : row)));
  };

  const removeRow = (id: string) => setRows(prev => prev.filter(row => row.id !== id));

  const addRow = () => setRows(prev => [...prev, blankEntry()]);

  const createSubjectForEntry = (row: ExamScheduleEntry) => {
    if (!onCreateSubject) return;
    const name = row.subjectName.trim() || row.subjectCode.trim();
    const code = row.subjectCode.trim() || name;
    if (!name) return;
    const created = onCreateSubject(name, code);
    if (created) {
      setLocalSubjects(prev => [...prev, created]);
      updateRow(row.id, { subjectId: created.id });
    }
  };

  const matchRow = (row: ExamScheduleEntry, subjectId: string) => {
    if (!subjectId) {
      updateRow(row.id, { subjectId: undefined });
      return;
    }
    const subject = localSubjects.find(item => item.id === subjectId);
    updateRow(row.id, {
      subjectId,
      subjectCode: subject?.code || row.subjectCode,
      subjectName: subject?.name || row.subjectName,
    });
  };

  const duplicates = issues.duplicates;
  const canSave =
    rows.length > 0 &&
    issues.invalidDates.size === 0 &&
    issues.unmatched.size === 0 &&
    duplicates.size === 0 &&
    rows.every(row => row.subjectName.trim() || row.subjectCode.trim());

  const handleSave = () => {
    if (!canSave) return;
    onSave(
      rows.map(row => ({
        ...row,
        subjectId: row.subjectId || matchEntryToSubject(row, localSubjects)?.id,
        subjectCode: row.subjectCode.trim().toUpperCase(),
        subjectName: row.subjectName.trim(),
        examDate: row.examDate,
        startTime: row.startTime || undefined,
        verified: true,
      }))
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/45 backdrop-blur-xs font-sans">
      <div className="bg-white border border-[#E5E9F2] rounded-2xl w-full max-w-4xl shadow-xl max-h-[92vh] flex flex-col">
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xs font-bold text-indigo-600">Examination Date Sheet</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border text-amber-700 bg-amber-50 border-amber-200">
                  Needs verification
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border text-slate-600 bg-slate-50 border-slate-200">
                  {rows.some(r => r.sourceType === 'pdf') ? 'Extracted from PDF + manual edits' : 'Manual entry'}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 mt-1">Verify examination dates</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Check every date against the official date sheet. Invalid, ambiguous and duplicate rows block saving.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close date sheet review"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span className="font-display font-semibold text-slate-700">{rows.length} examinations</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{issues.validCount} with a usable date</span>
            {issues.unmatched.size > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-amber-700 font-semibold">{issues.unmatched.size} unmatched</span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3">
          {rows.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              No rows yet. Add an examination to continue.
            </div>
          )}

          {rows.map((row, index) => {
            const invalid = issues.invalidDates.has(row.id);
            const duplicate = duplicates.has(row.id);
            const unmatched = issues.unmatched.has(row.id);
            const ambiguous = issues.ambiguousDates.has(row.id);
            const matchedSubject = matchEntryToSubject(row, localSubjects);

            return (
              <div
                key={row.id}
                className={`rounded-xl border p-3 space-y-2.5 ${
                  invalid || duplicate || unmatched
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-[#E5E9F2] bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-display text-[11px] font-bold text-slate-400">
                      Exam {index + 1}
                    </span>
                    {matchedSubject ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Matched: {matchedSubject.code}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5">
                        No matching subject
                      </span>
                    )}
                    {duplicate && (
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-1.5 py-0.5">
                        Duplicate examination
                      </span>
                    )}
                    {invalid && (
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-1.5 py-0.5">
                        Invalid date
                      </span>
                    )}
                    {ambiguous && !invalid && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5">
                        Ambiguous extraction — verify
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeRow(row.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Remove examination"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Subject</label>
                    <input
                      type="text"
                      value={row.subjectName}
                      onChange={(e) => updateRow(row.id, { subjectName: e.target.value })}
                      placeholder="e.g. Operating Systems"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Course code</label>
                    <input
                      type="text"
                      value={row.subjectCode}
                      onChange={(e) => updateRow(row.id, { subjectCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. CS 401"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Examination date</label>
                    <input
                      type="date"
                      value={row.examDate}
                      onChange={(e) => updateRow(row.id, { examDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Start time (optional)</label>
                    <input
                      type="time"
                      value={row.startTime ?? ''}
                      onChange={(e) => updateRow(row.id, { startTime: e.target.value || undefined })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={row.subjectId ?? ''}
                    onChange={(e) => matchRow(row, e.target.value)}
                    className="text-[11px] font-medium bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
                    aria-label={`Match exam ${index + 1} to subject`}
                  >
                    <option value="">Match to existing subject…</option>
                    {localSubjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code}: {subject.name}
                      </option>
                    ))}
                  </select>

                  {!matchedSubject && onCreateSubject && row.subjectName.trim() && !localSubjects.some(
                    subject =>
                      normalizeCode(subject.code) === normalizeCode(row.subjectCode || row.subjectName) ||
                      normalizeName(subject.name) === normalizeName(row.subjectName)
                  ) && (
                    <button
                      type="button"
                      onClick={() => createSubjectForEntry(row)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Create subject “{row.subjectCode || row.subjectName}”
                    </button>
                  )}

                  {row.examDate && isIsoDate(row.examDate) && (
                    <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {formatExamDate(row.examDate)}
                    </span>
                  )}
                </div>

                {row.warnings.length > 0 && (
                  <div className="text-[10px] text-amber-800 bg-amber-50/80 border border-amber-200 rounded-lg px-2 py-1.5 space-y-0.5">
                    {row.warnings.map((warning, warningIndex) => (
                      <p key={warningIndex} className="flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>{warning}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={addRow}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add examination manually
          </button>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 space-y-3">
          {!canSave && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Resolve invalid or duplicated dates and match every examination to a subject before saving.
              </span>
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">
              Saved locally. No date is shared with the AI after extraction.
            </span>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Save verified date sheet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
