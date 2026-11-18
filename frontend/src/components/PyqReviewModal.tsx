import React, { useState } from 'react';
import {
  AlertCircle,
  FileText,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { PyqPaper, PyqQuestion, Subject } from '../types';

interface PyqReviewModalProps {
  subject: Subject;
  paper: PyqPaper;
  onCancel: () => void;
  onSave: (paper: PyqPaper) => void;
}

function clonePaper(paper: PyqPaper): PyqPaper {
  return {
    ...paper,
    warnings: [...paper.warnings],
    questions: paper.questions.map(question => ({
      ...question,
      subtopics: [...question.subtopics],
    })),
  };
}

/** Manual classification review for one PYQ paper. */
export const PyqReviewModal: React.FC<PyqReviewModalProps> = ({
  subject,
  paper,
  onCancel,
  onSave,
}) => {
  const [draft, setDraft] = useState<PyqPaper>(() => clonePaper(paper));
  const [yearInput, setYearInput] = useState(paper.year ? String(paper.year) : '');
  const units = subject.syllabus?.status === 'verified' ? subject.syllabus.units : [];

  const updateQuestion = (id: string, patch: Partial<PyqQuestion>) => {
    setDraft(prev => ({
      ...prev,
      questions: prev.questions.map(question =>
        question.id === id ? { ...question, ...patch } : question
      ),
    }));
  };

  const removeQuestion = (id: string) => {
    setDraft(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== id) }));
  };

  const handleUnitChange = (question: PyqQuestion, unitId: string) => {
    if (!unitId) {
      updateQuestion(question.id, {
        unitId: undefined,
        unitTitle: undefined,
        topicId: undefined,
        topicName: undefined,
        classification: 'manual',
      });
      return;
    }
    const unit = units.find(item => item.id === unitId);
    updateQuestion(question.id, {
      unitId,
      unitTitle: unit?.title,
      topicId: undefined,
      topicName: undefined,
      classification: 'manual',
    });
  };

  const handleTopicChange = (question: PyqQuestion, topicId: string) => {
    if (!topicId) {
      updateQuestion(question.id, {
        topicId: undefined,
        topicName: undefined,
        classification: 'manual',
      });
      return;
    }
    const unit = units.find(item => item.id === question.unitId);
    const topic = unit?.topics.find(item => item.id === topicId);
    updateQuestion(question.id, {
      topicId,
      topicName: topic?.name,
      unitTitle: unit?.title,
      classification: 'manual',
    });
  };

  const handleSave = () => {
    const parsedYear = /^\d{4}$/.test(yearInput.trim()) ? Number(yearInput.trim()) : null;
    onSave({
      ...draft,
      year: parsedYear && parsedYear >= 1990 && parsedYear <= 2100 ? parsedYear : null,
      reviewed: true,
      warnings: draft.warnings,
      questions: draft.questions,
    });
  };

  const classified = draft.questions.filter(q => q.topicName).length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/45 backdrop-blur-xs font-sans">
      <div className="bg-white border border-[#E5E9F2] rounded-2xl w-full max-w-4xl shadow-xl max-h-[92vh] flex flex-col">
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xs font-bold text-indigo-600">
                  {subject.code} · PYQ Review
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border text-slate-600 bg-slate-50 border-slate-200">
                  {paper.fileName}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border text-amber-700 bg-amber-50 border-amber-200">
                  Needs review
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 mt-1">
                Correct question classification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {units.length > 0
                  ? 'Match each question to a verified syllabus topic. Manual edits are marked as student-corrected.'
                  : 'No verified syllabus: AI-proposed topics are unverified. Edit or clear any topic you disagree with.'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close PYQ review"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span className="font-display font-semibold text-slate-700">{draft.questions.length} questions</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{classified} classified</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <label className="flex items-center gap-1.5">
              <span>Exam year</span>
              <input
                type="text"
                inputMode="numeric"
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="Not available"
                className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-700 focus:outline-none focus:border-indigo-500"
                aria-label="Exam year"
              />
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-2.5">
          {draft.warnings.length > 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Extraction notes
              </div>
              <ul className="list-disc ml-4 space-y-0.5">
                {draft.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {draft.questions.map((question, index) => {
            const selectedUnit = units.find(unit => unit.id === question.unitId);
            return (
              <div key={question.id} className="rounded-xl border border-[#E5E9F2] p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[11px] font-bold text-slate-400">
                        Q{question.number || index + 1}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                          question.classification === 'syllabus'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : question.classification === 'manual'
                              ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                              : question.classification === 'ai'
                                ? 'text-amber-700 bg-amber-50 border-amber-200'
                                : 'text-slate-500 bg-slate-50 border-slate-200'
                        }`}
                      >
                        {question.classification === 'syllabus'
                          ? 'Syllabus topic'
                          : question.classification === 'manual'
                            ? 'Student-corrected'
                            : question.classification === 'ai'
                              ? 'AI-classified — review'
                              : 'Unclassified'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 mt-1 leading-relaxed">{question.text}</p>
                  </div>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
                    title="Remove question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Marks</label>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={question.marks ?? ''}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          marks: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      placeholder="—"
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {units.length > 0 ? (
                    <>
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Syllabus unit</label>
                        <select
                          value={question.unitId ?? ''}
                          onChange={(e) => handleUnitChange(question, e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="">Unclassified</option>
                          {units.map(unit => (
                            <option key={unit.id} value={unit.id}>
                              {unit.unitNumber ? `Unit ${unit.unitNumber}: ` : ''}{unit.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Topic</label>
                        <select
                          value={question.topicId ?? ''}
                          onChange={(e) => handleTopicChange(question, e.target.value)}
                          disabled={!selectedUnit}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none disabled:opacity-60 cursor-pointer"
                        >
                          <option value="">{selectedUnit ? 'Select topic…' : 'Select a unit first'}</option>
                          {selectedUnit?.topics.map(topic => (
                            <option key={topic.id} value={topic.id}>{topic.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-10 space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">
                        Topic (AI-proposed, editable)
                      </label>
                      <input
                        type="text"
                        value={question.topicName ?? ''}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            topicName: e.target.value,
                            classification: 'manual',
                          })
                        }
                        placeholder="Leave empty if no topic is identifiable"
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {question.subtopics.length > 0 && (
                  <p className="text-[10px] text-slate-400">
                    Subtopics: {question.subtopics.join(' · ')}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Only extracted questions are stored. The PDF is not saved.
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Save reviewed paper</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
