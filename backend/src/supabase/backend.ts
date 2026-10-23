import type { SupabaseClient } from '@supabase/supabase-js';
import { demandSchema, importReportSchema, studentSchema, type Backend, type FunnelCounts, type Student, type University } from '../types';

/** Browser-safe adapter: all requests use the signed-in user's client and are scoped by database RLS. */
export function createSupabaseBackend(client: SupabaseClient): Backend {
  const currentUniversity = async (): Promise<University | null> => {
    const { data: member, error: memberError } = await client.from('university_members').select('university_id').limit(1).maybeSingle();
    if (memberError) throw memberError;
    if (!member?.university_id) return null;
    const { data, error } = await client.from('universities').select('id,name,short_name,kind,tier,city,state,status,reference,status_note').eq('id', member.university_id).maybeSingle();
    if (error) throw error;
    return data as University | null;
  };
  const getStudents = async (table: 'university_students_v' | 'roster_entries'): Promise<Student[]> => {
    const uni = await currentUniversity();
    if (!uni) return [];
    const cols = table === 'university_students_v' ? 'roster_entry_id,student_id,full_name,status,year,program_level,program,verification,claimed,verified_skills_count,last_activity,placement_status' : 'id,full_name,email,program,program_level,year,status';
    const { data, error } = await client.from(table).select(cols).order('full_name').limit(1000);
    if (error) throw error;
    const resultRows = (data ?? []) as unknown as Record<string, unknown>[];
    return resultRows.map((row) => studentSchema.parse({ id: String(row.student_id ?? row.roster_entry_id ?? row.id ?? ''), full_name: row.full_name, email: row.email ?? null, program: row.program ?? null, program_level: row.program_level ?? 'ug', year: row.year ?? null, status: row.status, verification: row.verification ?? null, claimed: row.claimed ?? false, verified_skills_count: row.verified_skills_count ?? 0, last_activity: row.last_activity ?? null, placement_status: row.placement_status ?? 'unknown', registered_at: null }));
  };
  const rowsFor = async (table: string, columns: string) => {
    // Always project an explicit, privacy-reviewed column list; never fetch whole rows from analytics or public views.
    const { data, error } = await client.from(table).select(columns);
    if (error) throw error;
    return (data ?? []) as unknown as Record<string, unknown>[];
  };
  const detailPlacement = (studentId: string, row: Record<string, unknown>) => ({ student_id: studentId, status: row.status as 'placed' | 'not_placed' | 'unknown', organization_name_text: String(row.organization_name_text ?? ''), role_text: String(row.role_text ?? ''), source: row.source as 'university' | 'student', updated_at: String(row.updated_at ?? '') });
  return {
    auth: {
      async signIn({ email, password }) {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error || !data.user) throw new Error('We couldn’t sign you in. Check your details and try again.');
        const { data: profile, error: profileError } = await client.from('profiles').select('role,display_name').eq('id', data.user.id).maybeSingle();
        if (profileError) throw profileError;
        const membership = profile?.role === 'university' ? await currentUniversity() : null;
        return { email: data.user.email ?? email, displayName: String(profile?.display_name ?? 'University staff'), role: (profile?.role ?? null) as 'university' | 'student' | 'organization' | 'admin' | null, universityId: membership?.id ?? null };
      },
      async signOut(scope = 'local') { const { error } = await client.auth.signOut({ scope }); if (error) throw error; },
      async getSession() {
        const { data } = await client.auth.getSession();
        if (!data.session?.user) return null;
        const user = data.session.user;
        const { data: profile } = await client.from('profiles').select('role,display_name').eq('id', user.id).maybeSingle();
        const uni = profile?.role === 'university' ? await currentUniversity() : null;
        return { email: user.email ?? '', displayName: String(profile?.display_name ?? 'University staff'), role: (profile?.role ?? null) as 'university' | 'student' | 'organization' | 'admin' | null, universityId: uni?.id ?? null };
      },
      async signUp({ email, password, name, reference }) { const { error } = await client.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback?ref=${encodeURIComponent(reference ?? '')}` } }); if (error) throw error; },
      async completeSignup({ reference }) { const { error } = await client.functions.invoke('complete-signup', { body: { portal: 'university', application_ref: reference || undefined } }); if (error) throw error; },
      async resetPassword(email) { const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) throw error; },
      async updatePassword(password) { const { error } = await client.auth.updateUser({ password }); if (error) throw error; }
    },
    university: {
      getMine: currentUniversity,
      async simulateApproval() { throw new Error('Demo approval is available only in mock mode.'); },
      async resetDemo() { throw new Error('Reset is available only in mock mode.'); }
    },
    students: {
      async list() { return getStudents('university_students_v'); },
      async detail(id) { return (await getStudents('university_students_v')).find((student) => student.id === id) ?? null; },
      async skills(id) { const { data, error } = await client.from('university_student_skills_v').select('skill_name,family,level,score,verified_on').eq('student_id', id); if (error) throw error; return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({ skill_name: String(row.skill_name), family: String(row.family), level: String(row.level), score: Number(row.score), verified_on: String(row.verified_on) })); }
    },
    roster: {
      async list() { return getStudents('roster_entries'); },
      async importRows(rows, dryRun = false) { const uni = await currentUniversity(); if (!uni) throw new Error('No university membership is available.'); const { data, error } = await client.functions.invoke('roster-import', { body: { university_id: uni.id, source: { rows }, dry_run: dryRun } }); if (error) throw error; return importReportSchema.parse(data); },
      async update(id, patch) { const uni = await currentUniversity(); if (!uni) throw new Error('No university membership is available.'); const allowed = { year: patch.year, status: patch.status, program: patch.program, program_level: patch.program_level }; const { error } = await client.from('roster_entries').update(allowed).eq('id', id).eq('university_id', uni.id); if (error) throw error; },
      async remove(id) { const uni = await currentUniversity(); if (!uni) throw new Error('No university membership is available.'); const { error } = await client.from('roster_entries').delete().eq('id', id).eq('university_id', uni.id).is('claimed_student_id', null); if (error) throw error; }
    },
    analytics: {
      async overview() {
        const [overviewRows, funnelRows, skillsRows, trendsRows] = await Promise.all([rowsFor('university_overview_v', 'students_total,verified_students,active_this_month,projects_reviewed'), rowsFor('university_funnel_v', 'year,program,status,invited,registered,submitted,verified'), rowsFor('university_skills_v', 'skill_id,skill_name,family,verified_students,assessed_students,avg_score,open_jobs'), rowsFor('university_trends_v', 'week_start,verified_total,reviews,new_registrations')]);
        const head = (overviewRows[0] ?? {}) as Record<string, unknown>;
        const funnel: FunnelCounts = funnelRows.reduce<FunnelCounts>((total, row) => { const value = row as Record<string, unknown>; total.invited += Number(value.invited ?? 0); total.registered += Number(value.registered ?? 0); total.submitted += Number(value.submitted ?? 0); total.verified += Number(value.verified ?? 0); return total; }, { invited: 0, registered: 0, submitted: 0, verified: 0 });
        return { students_total: Number(head.students_total ?? 0), verified_students: Number(head.verified_students ?? 0), active_this_month: Number(head.active_this_month ?? 0), projects_reviewed: Number(head.projects_reviewed ?? 0), funnel, funnel_rows: funnelRows.map((row) => ({ year: String(row.year ?? ''), program: row.program == null ? null : String(row.program), status: row.status == null ? null : String(row.status), invited: Number(row.invited ?? 0), registered: Number(row.registered ?? 0), submitted: Number(row.submitted ?? 0), verified: Number(row.verified ?? 0) })), skills: skillsRows.map((row) => ({ id: String(row.skill_id), name: String(row.skill_name), family: String(row.family), verified_students: Number(row.verified_students), assessed_students: Number(row.assessed_students), avg_score: Number(row.avg_score ?? 0), open_jobs: Number(row.open_jobs ?? 0) })), trends: trendsRows as { week_start: string; verified_total: number; reviews: number; new_registrations: number }[] };
      },
      async trends() { return (await rowsFor('university_trends_v', 'week_start,verified_total,reviews,new_registrations')) as { week_start: string; verified_total: number; reviews: number; new_registrations: number }[]; }
    },
    placements: {
      async list() { return (await rowsFor('placements', 'student_id,status,organization_name_text,role_text,source,updated_at')).map((row) => detailPlacement(String(row.student_id), row)); },
      async update(row) { const uni = await currentUniversity(); if (!uni) throw new Error('No university membership is available.'); const { error } = await client.from('placements').upsert({ ...row, source: 'university', university_id: uni.id }); if (error) throw error; }
    },
    demand: { async list() { return (await rowsFor('university_demand_v', 'id,skill_name,jobs_count,reasons,last_posted_at')).map((row) => demandSchema.parse({ id: String(row.id), skill_name: String(row.skill_name), jobs_count: Number(row.jobs_count), reasons: row.reasons ?? {}, last_posted_at: String(row.last_posted_at) })); } },
    directory: {
      async list() {
        const [orgRows, jobRows] = await Promise.all([rowsFor('public_organizations', 'id,name,kind,size,website,verified'), rowsFor('public_jobs', 'id,organization_id,title,mode,location,status')]);
        return orgRows.map((org) => { const jobs = jobRows.filter((job) => job.organization_id === org.id).map((job) => ({ id: String(job.id), title: String(job.title), mode: String(job.mode ?? 'Not listed'), location: String(job.location ?? 'Not listed'), status: String(job.status), skills: [] })); return { id: String(org.id), name: String(org.name), kind: String(org.kind ?? 'Organization'), size: String(org.size ?? 'Not listed'), website: String(org.website ?? ''), verified: Boolean(org.verified), open_jobs: jobs.filter((job) => job.status === 'open' || job.status === 'Open').length, jobs }; });
      }
    },
    notifications: {
      async list() { const { data, error } = await client.from('notifications').select('id,kind,payload,read_at,created_at').order('created_at', { ascending: false }).limit(50); if (error) throw error; return (data ?? []).map((row) => ({ id: String(row.id), kind: String(row.kind), title: String((row.payload as Record<string, unknown> | null)?.title ?? row.kind), detail: String((row.payload as Record<string, unknown> | null)?.detail ?? ''), created_at: String(row.created_at), read_at: row.read_at as string | null })); },
      async markRead(id) { let query = client.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null); if (id) query = query.eq('id', id); const { error } = await query; if (error) throw error; }
    },
    config: { async getPublic() { const { data, error } = await client.from('public_config').select('key,value').in('key', ['PASS_MARK', 'BORDERLINE']); if (error) throw error; const config = Object.fromEntries((data ?? []).map((item) => [item.key, item.value])); const boundary = config.BORDERLINE as number[] | undefined; return { passMark: Number(config.PASS_MARK ?? 50), borderline: [Number(boundary?.[0] ?? 40), Number(boundary?.[1] ?? 60)] }; } },
    account: { async current() { const session = await client.auth.getUser(); return { email: session.data.user?.email ?? '', name: String(session.data.user?.user_metadata.full_name ?? '') }; } }
  };
}
