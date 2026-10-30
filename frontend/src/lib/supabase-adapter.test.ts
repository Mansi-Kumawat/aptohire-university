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
    },
    from(table: string) {
      const query = new QueryStub(table, (current, terminal) => {
        if (current.table === 'my_university_v') {
          return { data: { id: 'uni-1', name: 'Demo University', short_name: 'Demo', kind: 'university', tier: 'tier2', city: 'Jaipur', state: 'Rajasthan', status: 'approved', reference: null }, error: null };
        }
        if (current.table === 'profiles') return { data: { role: 'university' }, error: null };
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
