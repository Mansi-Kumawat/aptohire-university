import { describe, expect, it } from 'vitest';
import { guessColumn, normaliseStatus, parseRosterCsv } from './roster';

describe('column mapping', () => {
  it('matches the common headers without casing or whitespace sensitivity', () => {
    expect(guessColumn(['Full Name','E-mail','Enrollment No'], 'full_name')).toBe('Full Name');
    expect(guessColumn(['Full Name','E-mail','Enrollment No'], 'email')).toBe('E-mail');
    expect(guessColumn(['Full Name','E-mail','Enrollment No'], 'student_id_number')).toBe('Enrollment No');
  });
  it('normalizes lifecycle synonyms', () => { expect(normaliseStatus('Passed out')).toBe('alumni'); expect(normaliseStatus('Dropped out')).toBe('dropout'); expect(normaliseStatus('Active')).toBe('enrolled'); });
});
describe('client roster validation', () => {
  const mapping = { full_name: 'Name', email: 'Email', student_id_number: 'Roll No', program: 'Branch', year: 'Year', status: 'Status' };
  it('accepts valid rows and skips invalid rows and duplicates', () => {
    const result = parseRosterCsv('Name,Email,Roll No,Branch,Year,Status\nAsha,asha@example.test,1,CS,1,active\nBad,bad-email,2,IT,9,unknown\nAgain,asha@example.test,3,CS,2,enrolled', mapping);
    expect(result.rows).toHaveLength(1);
    expect(result.errors.some((error) => error.field === 'email' && error.reason.includes('more than once'))).toBe(true);
    expect(result.errors.some((error) => error.field === 'year')).toBe(true);
    expect(result.errors.some((error) => error.field === 'status')).toBe(true);
  });
  it('accepts a year label but rejects calendar years instead of truncating them', () => { const valid=parseRosterCsv('Name,Email,Roll No,Branch,Year,Status\nAsha,asha@example.test,1,CS,Year 4,enrolled',mapping); const invalid=parseRosterCsv('Name,Email,Roll No,Branch,Year,Status\nAsha,asha@example.test,1,CS,2026,enrolled',mapping); expect(valid.rows[0]?.year).toBe(4); expect(invalid.errors.some((error)=>error.field==='year')).toBe(true); });
  it('rejects binary-looking content', () => { expect(() => parseRosterCsv('Name\0,Email', mapping)).toThrow(/binary data/); });
  it('requires an email or student ID on each row', () => { const result=parseRosterCsv('Name,Email\nAsha,', {full_name:'Name',email:'Email'}); expect(result.rows).toHaveLength(0); expect(result.errors[0]?.reason).toContain('Add an email'); });
});
