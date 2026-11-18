import { ParseDateSheetResult, ParsedPyqResult, Subject } from '../types';
import { buildApiUrl } from './aiService';
import { readErrorDetail } from './syllabusService';
import { toSyllabusContextPayload } from '../utils/syllabus';

/**
 * Clients for Exam Intelligence extraction.
 * PDFs are sent in memory and never stored; only structured text is kept locally.
 */

export const MAX_EXAM_PDF_BYTES = 8 * 1024 * 1024;

export class ExamExtractionError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ExamExtractionError';
    this.status = status;
  }
}

function validatePdf(file: File): void {
  const looksPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
  if (!looksPdf) {
    throw new ExamExtractionError('Unsupported file type. Please upload a PDF document.');
  }
  if (file.size === 0) throw new ExamExtractionError('The selected PDF is empty.');
  if (file.size > MAX_EXAM_PDF_BYTES) {
    throw new ExamExtractionError('The file is too large. Maximum supported size is 8 MB.');
  }
}

async function postForm<T>(endpoint: string, body: FormData): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 180000);
  try {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      body,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ExamExtractionError(await readErrorDetail(response), response.status);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ExamExtractionError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ExamExtractionError(
        'Extraction timed out. Try a smaller document or split the papers.'
      );
    }
    throw new ExamExtractionError(
      'Could not reach the exam extraction service. Check the backend connection and try again.'
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function analyzePyqPdf(subject: Subject, file: File): Promise<ParsedPyqResult> {
  validatePdf(file);
  const body = new FormData();
  body.append('file', file);
  body.append('subject_name', subject.name);
  body.append('course_code', subject.code);
  const syllabus = toSyllabusContextPayload(subject.syllabus);
  if (syllabus) body.append('syllabus', JSON.stringify(syllabus));

  const result = await postForm<ParsedPyqResult>('/api/analyze-pyq', body);
  if (!result || !Array.isArray(result.questions)) {
    throw new ExamExtractionError('The PYQ service returned an unexpected response.');
  }
  return {
    ...result,
    questions: result.questions,
    warnings: Array.isArray(result.warnings) ? result.warnings : [],
  };
}

export async function parseDateSheetPdf(file: File): Promise<ParseDateSheetResult> {
  validatePdf(file);
  const body = new FormData();
  body.append('file', file);
  const result = await postForm<ParseDateSheetResult>('/api/parse-date-sheet', body);
  if (!result || !Array.isArray(result.entries)) {
    throw new ExamExtractionError('The date sheet service returned an unexpected response.');
  }
  return {
    ...result,
    entries: result.entries,
    warnings: Array.isArray(result.warnings) ? result.warnings : [],
  };
}
