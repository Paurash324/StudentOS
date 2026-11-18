import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { CourseSyllabus, SyllabusStatus } from '../types';
import { parseSyllabusPdf, parseSyllabusText, MAX_SYLLABUS_PDF_BYTES } from '../services/syllabusService';
import { SYLLABUS_STATUS_LABELS, countSyllabusTopics, syllabusFromParsed } from '../utils/syllabus';

interface SyllabusInputPanelProps {
  syllabus: CourseSyllabus | null;
  meta: {
    university?: string;
    degree?: string;
    semester?: string;
    courseCode?: string;
  };
  onChange: (syllabus: CourseSyllabus) => void;
  onRequestReview: (syllabus: CourseSyllabus) => void;
  onSuggestedFields?: (fields: { subjectName?: string; courseCode?: string }) => void;
}

function statusStyle(status: SyllabusStatus): string {
  if (status === 'verified') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (status === 'needs_review') return 'text-amber-700 bg-amber-50 border-amber-200';
  if (status === 'processing') return 'text-indigo-700 bg-indigo-50 border-indigo-200';
  return 'text-slate-600 bg-slate-50 border-slate-200';
}

export const SyllabusInputPanel: React.FC<SyllabusInputPanelProps> = ({
  syllabus,
  meta,
  onChange,
  onRequestReview,
  onSuggestedFields,
}) => {
  const [mode, setMode] = useState<'pdf' | 'text'>('pdf');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string>('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status: SyllabusStatus = isBusy ? 'processing' : syllabus?.status ?? 'not_provided';
  const sourceLabel = syllabus
    ? syllabus.sourceType === 'pdf'
      ? 'Uploaded PDF'
      : 'Manually entered text'
    : 'No file or text added yet';
  const topicCount = countSyllabusTopics(syllabus ?? undefined);

  const handleParsed = (result: Awaited<ReturnType<typeof parseSyllabusText>>, source: 'pdf' | 'manual') => {
    const draft = syllabusFromParsed(result, {
      sourceType: source,
      university: meta.university,
      degree: meta.degree,
      semester: meta.semester,
      courseCode: meta.courseCode,
    });
    onChange(draft);
    onSuggestedFields?.({
      subjectName: result.syllabus.subject_name || undefined,
      courseCode: result.syllabus.course_code || undefined,
    });
    onRequestReview(draft);
  };

  const handlePdfSelected = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setFileName(file.name);
    setIsBusy(true);
    try {
      const result = await parseSyllabusPdf(file);
      handleParsed(result, 'pdf');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The PDF could not be processed.');
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTextParse = async () => {
    setError(null);
    setIsBusy(true);
    try {
      const result = await parseSyllabusText(pastedText);
      handleParsed(result, 'manual');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The syllabus text could not be processed.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-[#E5E9F2] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-display text-xs font-bold text-slate-900">Course Syllabus</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Use the syllabus your university provided. Nothing is assumed from the subject name.
          </p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${statusStyle(status)}`}>
          {SYLLABUS_STATUS_LABELS[status]}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="truncate">Source: {sourceLabel}</span>
        {syllabus && topicCount > 0 && (
          <span className="shrink-0 font-display font-semibold text-slate-700">
            {syllabus.units.length} units · {topicCount} topics
          </span>
        )}
      </div>

      {/* Input method selector */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100/90 rounded-xl">
        <button
          type="button"
          onClick={() => setMode('pdf')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            mode === 'pdf' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload syllabus PDF</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('text')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            mode === 'text' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span>Paste syllabus text</span>
        </button>
      </div>

      {mode === 'pdf' ? (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handlePdfSelected(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="w-full flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-300 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {isBusy ? (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-[11px] font-semibold text-slate-700">
              {isBusy ? 'Extracting and structuring syllabus…' : fileName ? 'Choose a different PDF' : 'Choose a text-based PDF'}
            </span>
            <span className="text-[10px] text-slate-400">
              {fileName && !isBusy ? fileName : `PDF up to ${MAX_SYLLABUS_PDF_BYTES / (1024 * 1024)} MB · processed in memory, never stored`}
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            rows={5}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={'Paste the unit and topic list, e.g.\nUnit 1: Introduction to Thermodynamics\n- System and surroundings\n- Zeroth law'}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
          />
          <button
            type="button"
            onClick={handleTextParse}
            disabled={isBusy || !pastedText.trim()}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all cursor-pointer"
          >
            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isBusy ? 'Structuring syllabus…' : 'Structure with AI'}</span>
          </button>
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {syllabus && syllabus.warnings.length > 0 && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Extraction notes ({syllabus.warnings.length})
            </span>
            <button
              type="button"
              onClick={() => onChange({ ...syllabus, warnings: [] })}
              className="text-amber-700 hover:text-amber-900 cursor-pointer"
              title="Dismiss notes"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <ul className="list-disc ml-4 space-y-0.5">
            {syllabus.warnings.slice(0, 3).map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
          {syllabus.warnings.length > 3 && (
            <p className="text-[10px]">+{syllabus.warnings.length - 3} more shown in review</p>
          )}
        </div>
      )}

      {syllabus ? (
        <button
          type="button"
          onClick={() => onRequestReview(syllabus)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>{syllabus.status === 'verified' ? 'Review or edit verified syllabus' : 'Review and confirm curriculum'}</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Syllabus is optional. You can add it later from Edit Subject.</span>
        </div>
      )}

      {syllabus?.status === 'verified' && syllabus.verifiedAt && (
        <p className="text-[10px] text-emerald-700 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Verified {new Date(syllabus.verifiedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};
