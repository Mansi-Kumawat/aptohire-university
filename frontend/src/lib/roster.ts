import Papa from 'papaparse';
import { rosterRowSchema, type CanonicalRow } from '@aptohire/university-backend';
export const canonicalHeaders = ['full_name','email','student_id_number','program','program_level','year','status'];
export function guessColumn(headers: string[], field: string) {
  const synonyms: Record<string, string[]> = {
    full_name: ['name','full name','student name','full_name'], email: ['email','e-mail'], student_id_number: ['roll no','roll number','enrollment','enrolment','enrollment no','enrolment no','id','student id','student_id_number'],
    program: ['branch','department','program','course'], year: ['year','semester year','year of study'], status: ['status','lifecycle'], program_level: ['program level','program_level','level','ug pg']
  };
  const normalized = headers.map((header) => header.trim().toLowerCase().replace(/\s+/g, ' '));
  const found = normalized.findIndex((header) => synonyms[field]?.includes(header));
  return found < 0 ? '' : headers[found]!;
}
export function normaliseStatus(raw: string) {
  const value = raw.trim().toLowerCase();
  if (['active','enrolled','current'].includes(value)) return 'enrolled';
  if (['graduated','passed out','alumni'].includes(value)) return 'alumni';
  if (['dropped out','dropout','left'].includes(value)) return 'dropout';
  if (['new','admitted','incoming'].includes(value)) return 'incoming';
  return value;
}
export function parseRosterCsv(text: string, headerMap: Record<string, string>) {
  if (text.includes('\0')) throw new Error('This file contains unreadable binary data. Save it as CSV (UTF-8) and try again.');
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: 'greedy', transformHeader: (header) => header.trim() });
  if (parsed.errors.length) throw new Error('We couldn’t read this CSV. Check the header row and try again.');
  if (parsed.data.length > 10000) throw new Error('This file has too many rows. Split it into smaller files.');
  const rows: CanonicalRow[] = []; const errors: { row: number; field: string; reason: string }[] = [];
  const seenEmails = new Set<string>(); const seenIds = new Set<string>();
  parsed.data.forEach((source, index) => {
    const row: Record<string, unknown> = { full_name: '', program_level: 'ug', status: 'enrolled' };
    for (const [canonical, sourceHeader] of Object.entries(headerMap)) if (sourceHeader) row[canonical] = source[sourceHeader]?.trim() ?? '';
    if (row.year) { const match = String(row.year).trim().match(/^(?:year\s*)?(10|[1-9])$/i); row.year = match ? Number(match[1]) : Number.NaN; }
    row.status = normaliseStatus(String(row.status));
    if (row.program_level) row.program_level = ['pg','postgraduate','masters','master'].includes(String(row.program_level).toLowerCase()) ? 'pg' : 'ug';
    const rowErrors: { row: number; field: string; reason: string }[] = [];
    const result = rosterRowSchema.safeParse(row);
    if (!result.success) result.error.issues.forEach((issue) => rowErrors.push({ row: index + 2, field: String(issue.path[0] ?? 'row'), reason: issue.message }));
    if (!row.email && !row.student_id_number) rowErrors.push({ row: index + 2, field: 'email', reason: 'Add an email or student ID so this student can be matched.' });
    if (row.email) { const email = String(row.email).toLowerCase(); if (seenEmails.has(email)) rowErrors.push({ row: index + 2, field: 'email', reason: 'This email appears more than once in the file.' }); seenEmails.add(email); }
    if (row.student_id_number) { const id = String(row.student_id_number).toLowerCase(); if (seenIds.has(id)) rowErrors.push({ row: index + 2, field: 'student_id_number', reason: 'This student ID appears more than once in the file.' }); seenIds.add(id); }
    errors.push(...rowErrors);
    if (result.success && rowErrors.length === 0) rows.push(result.data);
  });
  return { rows, errors, headers: parsed.meta.fields ?? [] };
}
export function buildCanonicalCsv(rows: CanonicalRow[]) { return Papa.unparse(rows.map((row) => Object.fromEntries(canonicalHeaders.map((header) => [header, row[header as keyof CanonicalRow] ?? '']))), { columns: canonicalHeaders }); }
