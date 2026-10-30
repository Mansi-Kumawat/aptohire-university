import { z } from 'zod';

export const lifeStatusSchema = z.enum(['incoming', 'enrolled', 'dropout', 'alumni']);
export const placementStatusSchema = z.enum(['placed', 'not_placed', 'unknown']);
export const skillSchema = z.object({ id: z.string(), name: z.string(), family: z.string(), verified_students: z.number(), assessed_students: z.number(), avg_score: z.number(), open_jobs: z.number() });
export const studentSchema = z.object({
  id: z.string(), full_name: z.string(), email: z.string().nullable(), program: z.string().nullable(), program_level: z.enum(['ug', 'pg']), year: z.number().nullable(), status: lifeStatusSchema,
  verification: z.enum(['roster', 'student_id', 'unverified']).nullable(), claimed: z.boolean(), verified_skills_count: z.number(), last_activity: z.string().nullable(), placement_status: placementStatusSchema, registered_at: z.string().nullable(),
  // Roster key used by the backend for university-managed outcomes before a student claims the row.
  roster_entry_id: z.string().nullable().optional()
});
export const rosterRowSchema = z.object({
  full_name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  student_id_number: z.string().trim().max(120).optional().or(z.literal('')),
  program: z.string().trim().max(160).optional().or(z.literal('')),
  program_level: z.enum(['ug', 'pg']),
  year: z.number().int().min(1).max(7).optional(),
  status: lifeStatusSchema
}).strict();
export const importReportSchema = z.object({
  total: z.number().int().nonnegative(),
  valid: z.number().int().nonnegative(),
  invalid: z.array(z.object({ row: z.number().int().positive(), field: z.string(), reason: z.string() }).strict()),
  duplicates: z.number().int().nonnegative(),
  created: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  matched_existing: z.number().int().nonnegative(),
  proposals_created: z.number().int().nonnegative()
}).strict();
export const demandSchema = z.object({ id: z.string(), skill_name: z.string(), jobs_count: z.number(), reasons: z.record(z.number()), last_posted_at: z.string() });

export type LifeStatus = z.infer<typeof lifeStatusSchema>;
export type PlacementStatus = z.infer<typeof placementStatusSchema>;
export type Student = z.infer<typeof studentSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type DemandRow = z.infer<typeof demandSchema>;
export type CanonicalRow = z.infer<typeof rosterRowSchema>;
export type ImportReport = z.infer<typeof importReportSchema>;
export type University = { id: string; name: string; short_name: string; kind: string; tier: string; city: string; state: string; status: 'approved' | 'pending' | 'rejected'; reference: string | null; status_note?: string | null };
export type UserRole = 'university' | 'student' | 'organization' | 'admin' | null;
export type UserSession = { email: string; displayName: string; role: UserRole; universityId: string | null };
export type FunnelCounts = { invited: number; registered: number; submitted: number; verified: number };
export type CohortFunnel = FunnelCounts & { year: string | number | null; program: string | null; status: string | null };
export type Placement = { student_id: string | null; roster_entry_id?: string | null; status: PlacementStatus; organization_name_text: string; role_text: string; source: 'university' | 'student'; updated_at: string };
export type Organization = { id: string; name: string; kind: string; size: string; website: string; verified: boolean; open_jobs: number; jobs: { id: string; title: string; mode: string; location: string; status: string; skills: string[] }[] };
export type AppNotification = { id: string; kind: string; title: string; detail: string; created_at: string; read_at: string | null };
export type Overview = { students_total: number; verified_students: number; active_this_month: number; projects_reviewed: number; funnel: FunnelCounts; funnel_rows?: CohortFunnel[]; skills: Skill[]; trends: { week_start: string; verified_total: number; reviews: number; new_registrations: number }[] };
export type StudentsFilter = { search?: string; year?: string; program?: string; status?: string; registered?: string; hasSkill?: boolean; placement?: string };
export type Backend = {
  auth: {
    signIn(input: { email: string; password: string }): Promise<UserSession>;
    signOut(scope?: 'local' | 'global'): Promise<void>;
    getSession(): Promise<UserSession | null>;
    signUp(input: { email: string; password: string; name: string; reference?: string }): Promise<void>;
    completeSignup(input: { reference?: string }): Promise<void>;
    resetPassword(email: string): Promise<void>;
    updatePassword(password: string): Promise<void>;
  };
  university: { getMine(): Promise<University | null>; simulateApproval(): Promise<University>; resetDemo(): Promise<void> };
  students: { list(filters?: StudentsFilter): Promise<Student[]>; detail(id: string): Promise<Student | null>; skills(id: string): Promise<{ skill_name: string; family: string; level: string; score: number; verified_on: string }[]> };
  roster: { list(): Promise<Student[]>; importRows(rows: CanonicalRow[], dryRun?: boolean): Promise<ImportReport>; update(id: string, patch: Partial<Pick<Student, 'year' | 'program' | 'program_level' | 'status'>>): Promise<void>; remove(id: string): Promise<void> };
  analytics: { overview(): Promise<Overview>; trends(): Promise<Overview['trends']> };
  placements: { list(): Promise<Placement[]>; update(row: Placement): Promise<void> };
  demand: { list(): Promise<DemandRow[]> };
  directory: { list(): Promise<Organization[]> };
  notifications: { list(): Promise<AppNotification[]>; markRead(id?: string): Promise<void> };
  config: { getPublic(): Promise<{ passMark: number; borderline: [number, number] }> };
  account: { current(): Promise<{ email: string; name: string }> };
};
