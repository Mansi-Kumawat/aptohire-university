import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBackend } from '../../../backend/src/supabase/backend';

type Operation = { name: string; args: unknown[] };
type Result = { data: unknown; error: null };

class QueryStub {
  operations: Operation[] = [];
  constructor(
    readonly table: string,
    private readonly result: (query: QueryStub, terminal?: string) => Result,
  ) {}
  private add(name: string, ...args: unknown[]) { this.operations.push({ name, args }); return this; }
  select(...args: unknown[]) { return this.add('select', ...args); }
  eq(...args: unknown[]) { return this.add('eq', ...args); }
  is(...args: unknown[]) { return this.add('is', ...args); }
  in(...args: unknown[]) { return this.add('in', ...args); }
  order(...args: unknown[]) { return this.add('order', ...args); }
  range(...args: unknown[]) { return this.add('range', ...args); }
  limit(...args: unknown[]) { return this.add('limit', ...args); }
  insert(...args: unknown[]) { return this.add('insert', ...args); }
  update(...args: unknown[]) { return this.add('update', ...args); }
  delete(...args: unknown[]) { return this.add('delete', ...args); }
  upsert(...args: unknown[]) { return this.add('upsert', ...args); }
  maybeSingle() { return Promise.resolve(this.result(this, 'maybeSingle')); }
  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.result(this)).then(onfulfilled, onrejected);
  }
}

function makeClient(existingPlacement: { id: string } | null = null) {
  const queries: QueryStub[] = [];
  const demoUser = { id: 'user-1', email: 'staff@university.test', user_metadata: { full_name: 'Asha Demo' } };
  const client = {
    auth: {
      signInWithPassword: async () => ({ data: { user: demoUser }, error: null }),
      getSession: async () => ({ data: { session: { user: demoUser } }, error: null }),
      getUser: async () => ({ data: { user: demoUser }, error: null }),
    },
    from(table: string) {
      const query = new QueryStub(table, (current, terminal) => {
        if (current.table === 'my_university_v') {
          return { data: { id: 'uni-1', name: 'Demo University', short_name: 'Demo', kind: 'university', tier: 'tier2', city: 'Jaipur', state: 'Rajasthan', status: 'approved', reference: null }, error: null };
        }
        if (current.table === 'profiles') return { data: { role: 'university' }, error: null };
        if (current.table === 'public_config') return { data: [{ key: 'PASS_MARK', value: 61 }, { key: 'BORDERLINE_LOW', value: 42 }, { key: 'BORDERLINE_HIGH', value: 58 }], error: null };
        if (current.table === 'university_overview_v') return { data: [{ students_total: 2, verified_students: 1, active_this_month: 1, projects_reviewed: 3 }], error: null };
        if (current.table === 'university_funnel_v') return { data: [{ year: 2, program: 'Engineering', status: 'enrolled', invited: 2, registered: 2, submitted: 1, verified: 1 }], error: null };
        if (current.table === 'university_skills_v') return { data: [{ skill_id: 'skill-1', skill_name: 'Testing', family: 'Web', verified_students: 0, assessed_students: 0, avg_score: null, open_jobs: 0 }], error: null };
        if (current.table === 'university_trends_v') return { data: [], error: null };
        if (current.table === 'university_demand_v') return { data: [{ id: 'skill-1', skill_name: 'Testing', jobs_count: 0, reasons: {}, last_posted_at: null }], error: null };
        if (current.table === 'notifications') return { data: [{ id: 'note-1', kind: 'roster_update', payload: { detail: 'Roster updated' }, read_at: null, created_at: '2026-10-30T09:00:00.000Z' }], error: null };
        if (current.table === 'placements' && terminal === 'maybeSingle') {
          return { data: existingPlacement, error: null };
        }
        if (current.table === 'university_students_v') {
          const viewRow = { university_id: 'uni-1', roster_entry_id: 'roster-1', student_id: null, full_name: 'Unclaimed Student', status: 'enrolled', year: 2, program_level: 'ug', program: 'Engineering', verification: null, claimed: false, verified_skills_count: 0, last_activity: null, placement_status: 'unknown' };
          return { data: terminal === 'maybeSingle' ? { roster_entry_id: viewRow.roster_entry_id, claimed: viewRow.claimed } : [viewRow], error: null };
        }
        if (current.table === 'roster_entries') {
          return { data: terminal === 'maybeSingle' ? { id: 'roster-1' } : [{ id: 'roster-1', university_id: 'uni-1', email: 'student@example.test', program_level: 'ug', year: 2, status: 'enrolled' }], error: null };
        }
        return { data: null, error: null };
      });
      queries.push(query);
      return query;
    },
  };
  return { backend: createSupabaseBackend(client as unknown as SupabaseClient), queries };
}

describe('University Supabase adapter contract alignment', () => {
  it('looks up only the role column and derives the staff name from Auth metadata', async () => {
    const { backend, queries } = makeClient();
    const signedIn = await backend.auth.signIn({ email: 'staff@university.test', password: 'demo-password' });
    const profileQuery = queries.find((query) => query.table === 'profiles');
    expect(profileQuery?.operations.find((operation) => operation.name === 'select')?.args[0]).toBe('role');
    expect(String(profileQuery?.operations.find((operation) => operation.name === 'select')?.args[0])).not.toContain('display_name');
    expect(signedIn).toMatchObject({ displayName: 'Asha Demo', role: 'university', universityId: 'uni-1' });
  });

  it('reads configured public threshold keys from the frozen public_config view', async () => {
    const { backend, queries } = makeClient();
    const config = await backend.config.getPublic();
    const query = queries.find((item) => item.table === 'public_config');
    expect(config).toEqual({ passMark: 61, borderline: [42, 58] });
    expect(query?.operations.find((operation) => operation.name === 'in')).toEqual({ name: 'in', args: ['key', ['PASS_MARK', 'BORDERLINE_LOW', 'BORDERLINE_HIGH']] });
  });

  it('preserves null averages instead of displaying zero for a skill with no verified scores', async () => {
    const { backend } = makeClient();
    const overview = await backend.analytics.overview();
    expect(overview.skills[0]?.avg_score).toBeNull();
  });

  it('omits demand rows with no open approved-organization jobs', async () => {
    const { backend } = makeClient();
    expect(await backend.demand.list()).toEqual([]);
  });

  it('scopes placement reads to the current university', async () => {
    const { backend, queries } = makeClient();
    await backend.placements.list();
    const query = queries.find((item) => item.table === 'placements');
    expect(query?.operations).toContainEqual({ name: 'eq', args: ['university_id', 'uni-1'] });
  });

  it('reads notifications only for the signed-in user and does not attempt unsupported writes', async () => {
    const { backend, queries } = makeClient();
    const notes = await backend.notifications.list();
    const query = queries.find((item) => item.table === 'notifications');
    expect(notes[0]).toMatchObject({ id: 'note-1', title: 'roster_update', detail: 'Roster updated' });
    expect(query?.operations).toContainEqual({ name: 'eq', args: ['user_id', 'user-1'] });
    await expect(backend.notifications.markRead()).rejects.toThrow(/not available in the current backend contract/i);
    expect(query?.operations.some((operation) => operation.name === 'update')).toBe(false);
  });

  it('uses the authorized student projection and only granted direct roster columns', async () => {
    const { backend, queries } = makeClient();
    const roster = await backend.roster.list();
    const projectionQuery = queries.find((query) => query.table === 'university_students_v');
    const rosterQuery = queries.find((query) => query.table === 'roster_entries');
    expect(projectionQuery?.operations.find((operation) => operation.name === 'select')?.args[0]).toContain('full_name');
    expect(rosterQuery?.operations.find((operation) => operation.name === 'select')?.args[0]).toBe('id,university_id,email,program_level,year,status');
    expect(rosterQuery?.operations.find((operation) => operation.name === 'select')?.args[0]).not.toContain('full_name');
    expect(rosterQuery?.operations.find((operation) => operation.name === 'select')?.args[0]).not.toContain('program,');
    expect(roster[0]).toMatchObject({ id: 'roster-1', full_name: 'Unclaimed Student', email: 'student@example.test', program: 'Engineering' });
  });

  it('deletes only an unclaimed roster entry without querying the protected student_id column', async () => {
    const { backend, queries } = makeClient();
    await backend.roster.remove('roster-1');
    const deleteQuery = queries.find((query) => query.table === 'roster_entries');
    const guardQuery = queries.find((query) => query.table === 'university_students_v' && query.operations.some((operation) => operation.name === 'select' && operation.args[0] === 'roster_entry_id,claimed'));
    expect(guardQuery?.operations).toContainEqual({ name: 'select', args: ['roster_entry_id,claimed'] });
    expect(deleteQuery?.operations.some((operation) => operation.name === 'is' || operation.args.includes('student_id'))).toBe(false);
    expect(deleteQuery?.operations).toContainEqual({ name: 'select', args: ['id'] });
  });

  it('inserts university outcomes against roster_entry_id without fabricating a student_id', async () => {
    const { backend, queries } = makeClient();
    await backend.placements.update({
      student_id: null,
      roster_entry_id: 'roster-1',
      status: 'placed',
      organization_name_text: 'Example employer',
      role_text: 'Graduate engineer',
      source: 'university',
      updated_at: new Date().toISOString(),
    });
    const placementQueries = queries.filter((query) => query.table === 'placements');
    const insert = placementQueries.find((query) => query.operations.some((operation) => operation.name === 'insert'));
    expect(insert?.operations.find((operation) => operation.name === 'insert')?.args[0]).toMatchObject({
      university_id: 'uni-1',
      roster_entry_id: 'roster-1',
      source: 'university',
    });
    expect(insert?.operations.find((operation) => operation.name === 'insert')?.args[0]).not.toHaveProperty('student_id');
    expect(placementQueries.some((query) => query.operations.some((operation) => operation.name === 'upsert'))).toBe(false);
  });

  it('updates the existing university outcome instead of adding duplicate rows', async () => {
    const { backend, queries } = makeClient({ id: 'placement-1' });
    await backend.placements.update({
      student_id: null,
      roster_entry_id: 'roster-1',
      status: 'not_placed',
      organization_name_text: '',
      role_text: '',
      source: 'university',
      updated_at: new Date().toISOString(),
    });
    const placementQueries = queries.filter((query) => query.table === 'placements');
    expect(placementQueries.some((query) => query.operations.some((operation) => operation.name === 'update'))).toBe(true);
    expect(placementQueries.some((query) => query.operations.some((operation) => operation.name === 'insert'))).toBe(false);
  });
});
