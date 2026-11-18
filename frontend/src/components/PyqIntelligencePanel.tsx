import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  History,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { PyqPaper, Subject } from '../types';
import { analyzePyqPdf, MAX_EXAM_PDF_BYTES } from '../services/examService';
import { computeTopicFrequency, paperFromParsedPyq, subjectPyqStats } from '../utils/pyq';
import { PyqReviewModal } from './PyqReviewModal';

interface PyqIntelligencePanelProps {
  subjects: Subject[];
  onUpdateSubject: (subject: Subject) => void;
}

/**
 * PYQ Intelligence: multi-paper upload, classification review, and historical
 * topic frequency. Frequency counts real question occurrences only.
 */
export const PyqIntelligencePanel: React.FC<PyqIntelligencePanelProps> = ({
  subjects,
  onUpdateSubject,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id ?? '');
  const [isBusy, setIsBusy] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [reviewPaperId, setReviewPaperId] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subject = subjects.find(item => item.id === selectedSubjectId) ?? subjects[0];
  const papers = subject?.pyq?.papers ?? [];
  const stats = subject ? subjectPyqStats(subject) : null;
  const frequency = useMemo(() => computeTopicFrequency(papers), [papers]);

  const reviewPaper = papers.find(paper => paper.id === reviewPaperId) ?? null;

  const persistPapers = (papersNext: PyqPaper[], target: Subject) => {
    onUpdateSubject({
      ...target,
      pyq: { papers: papersNext, lastAnalyzedAt: new Date().toISOString() },
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !subject) return;
    setError(null);
    setIsBusy(true);

    let workingSubject = subject;
    let workingPapers = [...papers];
    const failures: string[] = [];
    let lastPaperId: string | null = null;
    const fileArray = Array.from(files).slice(0, 10);

    for (let index = 0; index < fileArray.length; index += 1) {
      const file = fileArray[index];
      setProgress(`Processing ${index + 1} of ${fileArray.length}: ${file.name}`);
      try {
        const result = await analyzePyqPdf(workingSubject, file);
        const paper = paperFromParsedPyq(result, workingSubject, file.name);
        workingPapers = [...workingPapers, paper];
        workingSubject = {
          ...workingSubject,
          pyq: { papers: workingPapers, lastAnalyzedAt: new Date().toISOString() },
        };
        lastPaperId = paper.id;
      } catch (err) {
        failures.push(`${file.name}: ${err instanceof Error ? err.message : 'extraction failed'}`);
      }
    }

    if (workingPapers.length !== papers.length) {
      persistPapers(workingPapers, subject);
    }
    setIsBusy(false);
    setProgress('');
    if (lastPaperId) setReviewPaperId(lastPaperId);
    if (failures.length > 0) setError(failures.join(' · '));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveReview = (updated: PyqPaper) => {
    if (!subject) return;
    persistPapers(papers.map(paper => (paper.id === updated.id ? updated : paper)), subject);
    setReviewPaperId(null);
  };

  const handleRemovePaper = (paper: PyqPaper) => {
    if (!subject) return;
    if (!window.confirm(`Remove ${paper.fileName} from ${subject.code}? This cannot be undone.`)) return;
    persistPapers(papers.filter(item => item.id !== paper.id), subject);
    if (reviewPaperId === paper.id) setReviewPaperId(null);
  };

  if (!subject) {
    return (
      <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs text-sm text-slate-500">
        Add a subject first to analyse previous-year question papers.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs font-sans space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">PYQ Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload previous-year papers. Questions are extracted, classified, and counted as real occurrences.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <select
            value={subject.id}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setExpandedTopic(null);
              setError(null);
            }}
            className="text-xs font-semibold bg-white border border-[#E5E9F2] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
            aria-label="PYQ subject"
          >
            {subjects.map(item => (
              <option key={item.id} value={item.id}>
                {item.code}: {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-2xs cursor-pointer"
        >
          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>{isBusy ? 'Analysing papers…' : 'Upload PYQ PDFs'}</span>
        </button>
        <span className="text-[11px] text-slate-400">
          Up to 10 PDFs · {MAX_EXAM_PDF_BYTES / (1024 * 1024)} MB each · processed in memory
        </span>
        {isBusy && progress && (
          <span className="text-[11px] text-indigo-700 font-medium">{progress}</span>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="font-display font-semibold text-slate-700">{stats?.papers ?? 0} papers</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>{stats?.questions ?? 0} questions</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>{stats?.reviewedPapers ?? 0} reviewed</span>
        {subject.syllabus?.status !== 'verified' && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border text-amber-700 bg-amber-50 border-amber-200">
            No verified syllabus — AI classification needs review
          </span>
        )}
      </div>

      {papers.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
          <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No previous-year papers yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Upload text-based PDFs to build a historical topic-frequency picture.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {papers.map(paper => (
            <div
              key={paper.id}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 truncate">{paper.fileName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-slate-200 bg-white text-slate-600 font-semibold">
                    {paper.year ?? 'Year unknown'}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${
                      paper.reviewed
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}
                  >
                    {paper.reviewed ? 'Reviewed' : 'Needs review'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {paper.questions.length} questions · {paper.questions.filter(q => q.topicName).length} classified
                  {paper.warnings.length > 0 ? ` · ${paper.warnings.length} extraction notes` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setReviewPaperId(paper.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  Review
                </button>
                <button
                  onClick={() => handleRemovePaper(paper)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove paper"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {frequency.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              Historical topic frequency
            </h3>
            <span className="text-[10px] text-slate-400">{frequency.length} topics observed</span>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
            Historical frequency describes these uploaded papers only. It is <strong>not a prediction</strong> of the next examination.
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E5E9F2]">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-display font-semibold">Topic</th>
                  <th className="px-3 py-2 font-display font-semibold whitespace-nowrap">Papers</th>
                  <th className="px-3 py-2 font-display font-semibold whitespace-nowrap">Questions</th>
                  <th className="px-3 py-2 font-display font-semibold whitespace-nowrap">Years</th>
                  <th className="px-3 py-2 font-display font-semibold whitespace-nowrap">Marks seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {frequency.map(item => {
                  const expanded = expandedTopic === item.key;
                  const percent = Math.round((item.paperAppearances / Math.max(1, item.totalPapers)) * 100);
                  return (
                    <React.Fragment key={item.key}>
                      <tr
                        onClick={() => setExpandedTopic(expanded ? null : item.key)}
                        className="hover:bg-slate-50/70 cursor-pointer"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-start gap-1.5">
                            {expanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 block">{item.topicName}</span>
                              {item.unitTitle && (
                                <span className="text-[10px] text-slate-400">{item.unitTitle}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                          {item.paperAppearances}/{item.totalPapers}
                          <span className="text-slate-400"> ({percent}%)</span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{item.occurrences}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {item.years.length > 0 ? item.years.join(', ') : '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {item.marksKnown > 0 ? `${item.marksTotal} (${item.marksKnown} known)` : '—'}
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={5} className="px-3 py-2">
                            <ul className="space-y-1">
                              {item.questions.map(question => (
                                <li key={`${question.paperId}-${question.questionId}`} className="text-[11px] text-slate-600 flex gap-1.5">
                                  <span className="text-slate-400 shrink-0">
                                    {question.year ?? 'Year unknown'}{question.questionNumber ? ` · Q${question.questionNumber}` : ''}
                                  </span>
                                  <span>{question.text}</span>
                                  {question.marks !== null && (
                                    <span className="text-slate-400 shrink-0">({question.marks}m)</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reviewPaper && (
        <PyqReviewModal
          subject={subject}
          paper={reviewPaper}
          onCancel={() => setReviewPaperId(null)}
          onSave={handleSaveReview}
        />
      )}
    </div>
  );
};
