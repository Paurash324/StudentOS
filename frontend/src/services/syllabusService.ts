import { ParseSyllabusResult } from '../types';
import { buildApiUrl } from './aiService';

/**
 * Client for POST /api/parse-syllabus.
 *
 * PDFs are sent as multipart/form-data and are never written to localStorage or
 * persisted anywhere by this app. Only the structured, reviewed curriculum is stored.
 */

export const MAX_SYLLABUS_PDF_BYTES = 8 * 1024 * 1024;

export class SyllabusParseError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SyllabusParseError';
    this.status = status;
  }
}

export async function readErrorDetail(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    if (Array.isArray(data?.detail)) {
      return 'The syllabus could not be processed. Please check the document and try again.';
    }
  } catch {
    // Response body was not JSON; fall through to a generic message.
  }
  if (response.status === 413) {
    return 'The file is too large. Maximum supported size is 8 MB.';
  }
  if (response.status === 422) {
    return 'No readable text was found in this document. If it is a scanned PDF, paste the syllabus text instead.';
  }
  return `Syllabus processing failed (HTTP ${response.status}). Please try again.`;
}

async function postSyllabus(body: FormData): Promise<ParseSyllabusResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(buildApiUrl('/api/parse-syllabus'), {
      method: 'POST',
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new SyllabusParseError(await readErrorDetail(response), response.status);
    }

    const data = (await response.json()) as ParseSyllabusResult;
    if (!data || !data.syllabus || !Array.isArray(data.syllabus.units)) {
      throw new SyllabusParseError(
        'The syllabus service returned an unexpected response. Please try again.'
      );
    }
    return {
      ...data,
      warnings: Array.isArray(data.warnings) ? data.warnings : [],
      source_type: data.source_type === 'pdf' ? 'pdf' : 'manual',
    };
  } catch (error) {
    if (error instanceof SyllabusParseError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new SyllabusParseError(
        'Syllabus processing timed out. Please try a smaller document or paste the text instead.'
      );
    }
    throw new SyllabusParseError(
      'Could not reach the syllabus service. Check the backend connection and try again.'
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function parseSyllabusPdf(file: File): Promise<ParseSyllabusResult> {
  const nameLooksPdf = file.name.toLowerCase().endsWith('.pdf');
  const typeLooksPdf = file.type === 'application/pdf' || file.type === 'application/x-pdf';
  if (!nameLooksPdf && !typeLooksPdf) {
    throw new SyllabusParseError('Unsupported file type. Please upload a .pdf syllabus document.');
  }
  if (file.size === 0) {
    throw new SyllabusParseError('The selected PDF is empty.');
  }
  if (file.size > MAX_SYLLABUS_PDF_BYTES) {
    throw new SyllabusParseError('The file is too large. Maximum supported size is 8 MB.');
  }

  const body = new FormData();
  body.append('file', file);
  return postSyllabus(body);
}

export async function parseSyllabusText(text: string): Promise<ParseSyllabusResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new SyllabusParseError('Paste some syllabus text before processing.');
  }
  if (trimmed.length < 60) {
    throw new SyllabusParseError(
      'That syllabus text is very short. Paste the full unit and topic list for reliable extraction.'
    );
  }

  const body = new FormData();
  body.append('text', trimmed);
  return postSyllabus(body);
}
