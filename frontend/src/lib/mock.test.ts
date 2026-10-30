import { beforeEach, describe, expect, it } from 'vitest';
import { createMockBackend } from '@aptohire/university-backend';

beforeEach(() => { sessionStorage.clear(); });
describe('mock roster import', () => {
  it('does a dry run without creating entries and returns matching counts only on real import', async () => {
    const backend=createMockBackend();await backend.auth.signIn({email:'tpo@unia.edu.test',password:'demo'});
    const rows=[{full_name:'Avi Sample',email:'avi@demo.aptohire.test',student_id_number:'X1',program:'CS',program_level:'ug' as const,year:2,status:'enrolled' as const}];
    const dry=await backend.roster.importRows(rows,true);expect(dry.created).toBe(0);expect(dry.matched_existing).toBe(0);
    const real=await backend.roster.importRows(rows,false);expect(real.matched_existing).toBe(1);expect(real.proposals_created).toBe(1);
  });
  it('does not expose matching counts while the university is pending and retains pending rows', async () => {
    const backend=createMockBackend();await backend.auth.signIn({email:'tpo@unic.edu.test',password:'demo'});
    const row={full_name:'Avi Sample',email:'avi@demo.aptohire.test',student_id_number:'X2',program:'CS',program_level:'ug' as const,year:2,status:'enrolled' as const};
    const report=await backend.roster.importRows([row],false);expect(report.matched_existing).toBe(0);expect(report.proposals_created).toBe(0);expect((await backend.roster.list()).some((student)=>student.full_name==='Avi Sample')).toBe(true);
  });
});

describe('mock placements', () => {
  it('lets university staff update an unclaimed roster placement by roster-entry id', async () => {
    const backend = createMockBackend();
    await backend.university.resetDemo();
    await backend.auth.signIn({ email: 'tpo@unia.edu.test', password: 'demo' });
    const unclaimed = (await backend.students.list()).find((student) => !student.claimed);
    expect(unclaimed).toBeDefined();
    await backend.placements.update({
      student_id: null,
      roster_entry_id: unclaimed!.id,
      status: 'placed',
      organization_name_text: 'Sample employer',
      role_text: 'Graduate engineer',
      source: 'university',
      updated_at: new Date().toISOString()
    });
    const placement = (await backend.placements.list()).find((row) => row.roster_entry_id === unclaimed!.id);
    expect(placement).toMatchObject({
      student_id: null,
      status: 'placed',
      organization_name_text: 'Sample employer',
      role_text: 'Graduate engineer',
      source: 'university'
    });
    await backend.university.resetDemo();
  });
});

describe('mock demo reset', () => {
  it('restores sample roster and pending university approval state', async () => {
    const backend=createMockBackend();await backend.university.resetDemo();await backend.auth.signIn({email:'tpo@unia.edu.test',password:'demo'});
    const initial=(await backend.roster.list()).length;
    await backend.roster.importRows([{full_name:'Temporary Sample',email:'temporary@unia.edu.test',program_level:'ug',status:'enrolled'}]);
    expect((await backend.roster.list()).length).toBe(initial+1);
    await backend.university.resetDemo();
    expect((await backend.roster.list()).length).toBe(initial);
    await backend.auth.signIn({email:'tpo@unic.edu.test',password:'demo'});
    await backend.university.simulateApproval();
    expect((await backend.university.getMine())?.status).toBe('approved');
    await backend.university.resetDemo();
    expect((await backend.university.getMine())?.status).toBe('pending');
  });
});
