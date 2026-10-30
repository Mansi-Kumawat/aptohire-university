import { demandSchema, importReportSchema, rosterRowSchema, studentSchema, type Backend, type CanonicalRow, type Student } from '../types';
import { demandA, demandB, demandC, notificationsSeed, organizations, overviewA, overviewB, overviewC, placementsA, studentsA, studentsB, studentsC, universities } from './seed';

const wait = (ms = 380) => new Promise((resolve) => window.setTimeout(resolve, ms));
const mockAccounts = [
  { email: 'tpo@unia.edu.test', name: 'T. Rao', uni: 'uni-a' },
  { email: 'tpo@unib.edu.test', name: 'K. Mehta', uni: 'uni-b' },
  { email: 'tpo@unic.edu.test', name: 'S. Khanna', uni: 'uni-c' }
];

const initialStudentsA=studentsA.map((row)=>({...row}));const initialStudentsB=studentsB.map((row)=>({...row}));const initialStudentsC=studentsC.map((row)=>({...row}));
const placementForStudent=(student:Student)=>({student_id:student.claimed?student.id:null,roster_entry_id:student.claimed?null:student.id,status:student.placement_status,organization_name_text:'',role_text:'',source:'university' as const,updated_at:new Date().toISOString()});
const placementsB=studentsB.map(placementForStudent);
const placementsC=studentsC.map(placementForStudent);
const initialPlacementsA=placementsA.map((row)=>({...row}));
function restore<T>(target:T[],source:T[]){target.splice(0,target.length,...source.map((row)=>({...row})));}
function activeUniversity() {
  const id = sessionStorage.getItem('aptohire-university-id') ?? 'uni-a';
  return universities.find((uni) => uni.id === id) ?? universities[0]!;
}
function rosterFor(uniId: string): Student[] {
  if (uniId === 'uni-b') return studentsB;
  if (uniId === 'uni-c') return studentsC;
  return studentsA;
}
function overviewFor(uniId: string) { return uniId === 'uni-b' ? overviewB : uniId === 'uni-c' ? overviewC : overviewA; }
function demandsFor(uniId: string) { return uniId === 'uni-b' ? demandB : uniId === 'uni-c' ? demandC : demandA; }
function placementsFor(uniId: string) { return uniId === 'uni-b' ? placementsB : uniId === 'uni-c' ? placementsC : placementsA; }

export function createMockBackend(): Backend {
  let notices = [...notificationsSeed];
  return {
    auth: {
      async signIn({ email, password }) {
        await wait();
        if (!password.trim()) throw new Error('Enter your password.');
        const account = mockAccounts.find((item) => item.email.toLowerCase() === email.toLowerCase());
        if (account) {
          const user = { email: account.email, displayName: account.name, role: 'university' as const, universityId: account.uni };
          sessionStorage.setItem('aptohire-university-session', JSON.stringify(user));
          sessionStorage.setItem('aptohire-university-id', account.uni);
          return user;
        }
        const roleFixtures:Record<string,'student'|'organization'|'admin'>={'student@demo.aptohire.test':'student','hiring@org.demo.test':'organization','admin@demo.aptohire.test':'admin'};
        const wrongRole=roleFixtures[email.toLowerCase()];if(!wrongRole)throw new Error('We couldn’t sign you in. Check your details and try again.');
        const user = { email, displayName: 'Demo account', role: wrongRole, universityId: null };
        sessionStorage.setItem('aptohire-university-session', JSON.stringify(user));
        return user;
      },
      async signOut() { sessionStorage.removeItem('aptohire-university-session'); await wait(120); },
      async getSession() {
        try { const raw = sessionStorage.getItem('aptohire-university-session'); return raw ? JSON.parse(raw) as Awaited<ReturnType<Backend['auth']['getSession']>> : null; } catch { return null; }
      },
      async signUp({ email, password, name }) { await wait(); if (password.length < 10) throw new Error('Use at least 10 characters for your password.'); sessionStorage.setItem('signup-email', email); sessionStorage.setItem('signup-name', name); },
      async completeSignup() { await wait(120); },
      async resetPassword() { await wait(); },
      async updatePassword() { await wait(); }
    },
    university: {
      async getMine() { await wait(); return activeUniversity(); },
      async simulateApproval() { await wait(); const uni = activeUniversity(); uni.status = 'approved'; notices = [{ id: `approval-${Date.now()}`, kind: 'application_decided', title: 'Your university is approved', detail: 'Your full portal access is now available.', created_at: new Date().toISOString(), read_at: null }, ...notices]; return uni; },
      async resetDemo() { await wait(); restore(studentsA,initialStudentsA); restore(studentsB,initialStudentsB); restore(studentsC,initialStudentsC); restore(placementsA,initialPlacementsA); restore(placementsB,initialStudentsB.map(placementForStudent)); restore(placementsC,initialStudentsC.map(placementForStudent)); for(const uni of universities)if(uni.id==='uni-c')uni.status='pending';notices=[...notificationsSeed]; }
    },
    students: {
      async list(filters = {}) {
        await wait(280); let result = rosterFor(activeUniversity().id).map((s) => studentSchema.parse(s));
        const search = filters.search?.toLowerCase().trim();
        if (search) result = result.filter((s) => s.full_name.toLowerCase().includes(search) || (s.email ?? '').toLowerCase().includes(search));
        if (filters.year) result = result.filter((s) => String(s.year ?? '') === filters.year);
        if (filters.program) result = result.filter((s) => s.program === filters.program);
        if (filters.status) result = result.filter((s) => s.status === filters.status);
        if (filters.registered === 'yes') result = result.filter((s) => s.claimed);
        if (filters.registered === 'no') result = result.filter((s) => !s.claimed);
        if (filters.hasSkill) result = result.filter((s) => s.verified_skills_count > 0);
        if (filters.placement) result = result.filter((s) => s.placement_status === filters.placement);
        return result;
      },
      async detail(id) { await wait(220); return rosterFor(activeUniversity().id).find((s) => s.id === id) ?? null; },
      async skills(id) { await wait(220); if (!rosterFor(activeUniversity().id).some((s) => s.id === id)) return []; return id === 'stu-aarav' ? [{ skill_name: 'React', family: 'Web development', level: 'Proficient', score: 78, verified_on: '2026-10-12' }, { skill_name: 'JavaScript', family: 'Web development', level: 'Proficient', score: 74, verified_on: '2026-10-08' }, { skill_name: 'Accessibility', family: 'Web development', level: 'Competent', score: 64, verified_on: '2026-09-30' }] : []; }
    },
    roster: {
      async list() { await wait(260); return rosterFor(activeUniversity().id); },
      async importRows(rows: CanonicalRow[], dryRun = false) {
        await wait(500); const clean = rows.map((row) => rosterRowSchema.parse(row));
        const current = rosterFor(activeUniversity().id); const known = new Set(current.map((student) => student.email?.toLowerCase()).filter((email): email is string => Boolean(email)));
        const canonical = clean.map((row)=>({...row,email:row.email?.toLowerCase()}));
        const incomingEmails = new Set<string>(); let duplicates = 0;
        for (const row of canonical) { if (row.email && (known.has(row.email) || incomingEmails.has(row.email))) duplicates++; if (row.email) incomingEmails.add(row.email); }
        const valid = Math.max(0, clean.length - duplicates);
        const uni = activeUniversity();
        const matchCount = uni.status === 'approved' ? canonical.filter((row) => row.email === 'avi@demo.aptohire.test' || row.email === 'niya@demo.aptohire.test').length : 0;
        const report = importReportSchema.parse({ total: clean.length, valid, invalid: [], duplicates, created: dryRun ? 0 : valid, updated: 0, matched_existing: dryRun ? 0 : matchCount, proposals_created: dryRun ? 0 : matchCount });
        if (!dryRun) {
          for (const [index, row] of clean.slice(0, valid).entries()) current.push({ id: `import-${Date.now()}-${index}`, full_name: row.full_name, email: row.email ?? null, program: row.program ?? null, program_level: row.program_level, year: row.year ?? null, status: row.status, verification: null, claimed: false, verified_skills_count: 0, last_activity: null, placement_status: 'unknown', registered_at: null });
        }
        return report;
      },
      async update(id, patch) { await wait(220); const student = rosterFor(activeUniversity().id).find((s) => s.id === id); if (student) Object.assign(student, patch); },
      async remove(id) { await wait(220); const list = rosterFor(activeUniversity().id); const index = list.findIndex((s) => s.id === id && !s.claimed); if (index >= 0) list.splice(index, 1); }
    },
    analytics: { async overview() { await wait(240); return overviewFor(activeUniversity().id); }, async trends() { await wait(220); return overviewFor(activeUniversity().id).trends; } },
    placements: {
      async list() { await wait(280); return placementsFor(activeUniversity().id); },
      async update(row) {
        await wait(240);
        const key = row.student_id ?? row.roster_entry_id;
        const target = placementsFor(activeUniversity().id);
        const found = target.find((placement) => (placement.student_id ?? placement.roster_entry_id) === key);
        if (found) Object.assign(found, row);
        else target.push({ ...row });
      }
    },
    demand: { async list() { await wait(260); return demandsFor(activeUniversity().id).map((row) => demandSchema.parse(row)); } },
    directory: { async list() { await wait(260); return organizations; } },
    notifications: { async list() { await wait(220); return notices; }, async markRead(id) { notices = notices.map((note) => !id || note.id === id ? { ...note, read_at: new Date().toISOString() } : note); } },
    config: { async getPublic() { await wait(100); return { passMark: 50, borderline: [40, 60] }; } },
    account: { async current() { try { const session = JSON.parse(sessionStorage.getItem('aptohire-university-session') ?? 'null') as { email?: string; displayName?: string } | null; return { email: session?.email ?? '', name: session?.displayName ?? '' }; } catch { return { email: '', name: '' }; } } }
  };
}
