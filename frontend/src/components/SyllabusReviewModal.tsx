import React, { useState } from 'react';
import {
  AlertCircle,
  FileText,
  Info,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { CourseSyllabus, CourseUnit } from '../types';
import { makeEmptyTopic, makeEmptyUnit } from '../utils/syllabus';

interface SyllabusReviewModalProps {
  syllabus: CourseSyllabus;
  subjectName: string;
  courseCode: string;
  onCancel: () => void;
  onConfirm: (syllabus: CourseSyllabus) => void;
}

function linesToArray(value: string): string[] {
  // Keep blank lines while typing so the "one per line" textarea behaves normally.
  // Empty entries are stripped in cleanUnits() when the syllabus is confirmed.
  return value
    .split('\n')
    .map(line => line.replace(/^[-•*]\s*/, '').trim());
}

function cleanUnits(units: CourseUnit[]): CourseUnit[] {
  return units.map(unit => ({
    ...unit,
    title: unit.title.trim(),
    topics: unit.topics
      .map(topic => ({
        ...topic,
        name: topic.name.trim(),
        subtopics: topic.subtopics.map(item => item.trim()).filter(Boolean),
        learningOutcomes: topic.learningOutcomes.map(item => item.trim()).filter(Boolean),
      }))
      .filter(topic => topic.name.length > 0),
  }));
}

/**
 * Student review step for an AI-structured syllabus.
 * Nothing is saved as an authoritative curriculum until this screen is confirmed.
 */
export const SyllabusReviewModal: React.FC<SyllabusReviewModalProps> = ({
  syllabus,
  subjectName,
  courseCode,
  onCancel,
  onConfirm,
}) => {
  const [units, setUnits] = useState<CourseUnit[]>(() =>
    syllabus.units.length > 0
      ? syllabus.units.map(unit => ({
          ...unit,
          topics: unit.topics.map(topic => ({ ...topic })),
        }))
      : [makeEmptyUnit()]
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const topicCount = units.reduce((sum, unit) => sum + unit.topics.length, 0);

  const updateUnit = (unitId: string, patch: Partial<CourseUnit>) => {
    setUnits(prev => prev.map(unit => (unit.id === unitId ? { ...unit, ...patch } : unit)));
  };

  const removeUnit = (unitId: string) => {
    setUnits(prev => prev.filter(unit => unit.id !== unitId));
  };

  const addUnit = () => {
    setUnits(prev => [...prev, makeEmptyUnit()]);
  };

  const addTopic = (unitId: string) => {
    setUnits(prev =>
      prev.map(unit =>
        unit.id === unitId ? { ...unit, topics: [...unit.topics, makeEmptyTopic()] } : unit
      )
    );
  };

  const removeTopic = (unitId: string, topicId: string) => {
    setUnits(prev =>
      prev.map(unit =>
        unit.id === unitId
          ? { ...unit, topics: unit.topics.filter(topic => topic.id !== topicId) }
          : unit
      )
    );
  };

  const updateTopic = (
    unitId: string,
    topicId: string,
    patch: { name?: string; subtopics?: string[]; learningOutcomes?: string[] }
  ) => {
    setUnits(prev =>
      prev.map(unit =>
        unit.id === unitId
          ? {
              ...unit,
              topics: unit.topics.map(topic =>
                topic.id === topicId ? { ...topic, ...patch } : topic
              ),
            }
          : unit
      )
    );
  };

  const handleConfirm = () => {
    const cleaned = cleanUnits(units);
    if (cleaned.length === 0) {
      setValidationError('Add at least one unit before confirming the syllabus.');
      return;
    }
    if (cleaned.some(unit => !unit.title)) {
      setValidationError('Every unit needs a title. Fill in or remove the empty unit.');
      return;
    }
    if (cleaned.every(unit => unit.topics.length === 0)) {
      setValidationError('Add at least one topic to the curriculum before confirming.');
      return;
    }
    setValidationError(null);
    onConfirm({
      ...syllabus,
      units: cleaned,
      status: 'verified',
      verifiedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/45 backdrop-blur-xs font-sans">
      <div className="bg-white border border-[#E5E9F2] rounded-2xl w-full max-w-3xl shadow-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xs font-bold text-indigo-600">
                  {courseCode || 'COURSE'} {subjectName ? `· ${subjectName}` : ''}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border text-amber-700 bg-amber-50 border-amber-200">
                  Needs review
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border text-slate-600 bg-slate-50 border-slate-200">
                  {syllabus.sourceType === 'pdf' ? 'Uploaded PDF' : 'Manually entered text'}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 mt-1">
                Review extracted curriculum
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Check every unit and topic against your syllabus. Edits here become your verified syllabus.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close review"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
            <span className="font-display font-semibold text-slate-700">{units.length} units</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-display font-semibold text-slate-700">{topicCount} topics</span>
            {typeof syllabus.extractedCharacters === 'number' && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{syllabus.extractedCharacters.toLocaleString()} characters extracted</span>
              </>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {syllabus.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Extraction warnings — please verify</span>
              </div>
              <ul className="list-disc ml-5 space-y-0.5">
                {syllabus.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              AI extraction can miss or misread content. Compare with your official syllabus document before confirming.
            </span>
          </div>

          {units.map((unit, unitIndex) => (
            <div key={unit.id} className="rounded-xl border border-[#E5E9F2] bg-white">
              <div className="flex items-center gap-2 p-3 border-b border-slate-100">
                <div className="space-y-1 w-16 shrink-0">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Unit</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={unit.unitNumber ?? ''}
                    onChange={(e) =>
                      updateUnit(unit.id, {
                        unitNumber: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="–"
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    aria-label={`Unit ${unitIndex + 1} number`}
                  />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Unit title</label>
                  <input
                    type="text"
                    value={unit.title}
                    onChange={(e) => updateUnit(unit.id, { title: e.target.value })}
                    placeholder="e.g. Kinematics and Newton's Laws"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                    aria-label={`Unit ${unitIndex + 1} title`}
                  />
                </div>
                <button
                  onClick={() => removeUnit(unit.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 mt-4"
                  title="Remove unit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 space-y-2.5">
                {unit.topics.length === 0 && (
                  <p className="text-[11px] text-slate-400">
                    No topics in this unit yet. Add the topics listed in your syllabus.
                  </p>
                )}

                {unit.topics.map((topic, topicIndex) => (
                  <div key={topic.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={topic.name}
                        onChange={(e) => updateTopic(unit.id, topic.id, { name: e.target.value })}
                        placeholder={`Topic ${topicIndex + 1}`}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                        aria-label={`Unit ${unitIndex + 1} topic ${topicIndex + 1}`}
                      />
                      <button
                        onClick={() => removeTopic(unit.id, topic.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
                        title="Remove topic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Subtopics</label>
                        <textarea
                          rows={2}
                          value={topic.subtopics.join('\n')}
                          onChange={(e) =>
                            updateTopic(unit.id, topic.id, {
                              subtopics: linesToArray(e.target.value),
                            })
                          }
                          placeholder="One per line (optional)"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Learning outcomes</label>
                        <textarea
                          rows={2}
                          value={topic.learningOutcomes.join('\n')}
                          onChange={(e) =>
                            updateTopic(unit.id, topic.id, {
                              learningOutcomes: linesToArray(e.target.value),
                            })
                          }
                          placeholder="One per line (optional)"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addTopic(unit.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add topic</span>
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addUnit}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add another unit</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 space-y-3">
          {validationError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              The original PDF is not saved.
            </span>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Confirm verified syllabus</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
