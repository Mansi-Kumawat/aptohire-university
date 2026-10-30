import type { AppNotification, DemandRow, Organization, Overview, Placement, Skill, Student, University } from '../types';

const firstNames = ['Aarav', 'Anaya', 'Ishaan', 'Meera', 'Kabir', 'Tara', 'Vihaan', 'Aditi', 'Rohan', 'Naina', 'Dev', 'Riya', 'Arjun', 'Kavya', 'Neil', 'Mira', 'Reyansh', 'Diya', 'Zoya', 'Kian'];
const lastNames = ['Sharma', 'Mehta', 'Kapoor', 'Rao', 'Bose', 'Iyer', 'Sethi', 'Nair', 'Sen', 'Joshi', 'Malik', 'Desai'];

export const universities: University[] = [
  { id: 'uni-a', name: 'Aravalli Institute of Technology', short_name: 'Aravalli', kind: 'University', tier: 'Tier 2', city: 'Jaipur', state: 'Rajasthan', status: 'approved', reference: null },
  { id: 'uni-b', name: 'Bluehaven College of Engineering', short_name: 'Bluehaven', kind: 'College', tier: 'Tier 3', city: 'Udaipur', state: 'Rajasthan', status: 'approved', reference: null },
  { id: 'uni-c', name: 'Cedarfield University', short_name: 'Cedarfield', kind: 'University', tier: 'Tier 2', city: 'Jodhpur', state: 'Rajasthan', status: 'pending', reference: 'AH-7K2Q9F' }
];

const featured: Student[] = [
  { id: 'stu-aman', full_name: 'Aman Verma', email: 'aman@unia.edu.test', program: 'Computer Science', program_level: 'ug', year: 1, status: 'incoming', verification: 'roster', claimed: false, verified_skills_count: 0, last_activity: null, placement_status: 'unknown', registered_at: null },
  { id: 'stu-ajay', full_name: 'Ajay Bhatia', email: 'ajay@unia.edu.test', program: 'Computer Science', program_level: 'ug', year: 1, status: 'enrolled', verification: 'roster', claimed: true, verified_skills_count: 1, last_activity: '2026-10-12T09:00:00Z', placement_status: 'unknown', registered_at: '2026-06-14' },
  { id: 'stu-aarav', full_name: 'Aarav Sharma', email: 'aarav@unia.edu.test', program: 'Computer Science', program_level: 'ug', year: 2, status: 'enrolled', verification: 'student_id', claimed: true, verified_skills_count: 5, last_activity: '2026-10-13T11:00:00Z', placement_status: 'placed', registered_at: '2026-04-02' },
  { id: 'stu-akshit', full_name: 'Akshit Jain', email: 'akshit@unia.edu.test', program: 'Information Technology', program_level: 'ug', year: 3, status: 'enrolled', verification: 'roster', claimed: true, verified_skills_count: 3, last_activity: '2026-10-09T13:00:00Z', placement_status: 'not_placed', registered_at: '2026-03-11' },
  { id: 'stu-aarti', full_name: 'Aarti Soni', email: 'aarti@unia.edu.test', program: 'Electronics', program_level: 'ug', year: 2, status: 'dropout', verification: 'roster', claimed: true, verified_skills_count: 1, last_activity: '2026-08-19T12:00:00Z', placement_status: 'unknown', registered_at: '2026-02-05' },
  { id: 'stu-avi', full_name: 'Avi Rao', email: 'avi@demo.aptohire.test', program: 'Computer Science', program_level: 'pg', year: 1, status: 'alumni', verification: 'student_id', claimed: true, verified_skills_count: 4, last_activity: '2026-10-10T12:00:00Z', placement_status: 'placed', registered_at: '2025-01-12' }
];

export const studentsA: Student[] = [...featured, ...Array.from({ length: 84 }, (_, index): Student => {
  const ix = index + 1;
  const name = `${firstNames[(ix * 7) % firstNames.length]} ${lastNames[(ix * 5) % lastNames.length]}`;
  const claimed = ix <= 52;
  const verified = ix <= 13 ? 1 + (ix % 4) : 0;
  const statuses: Student['status'][] = ['enrolled', 'enrolled', 'enrolled', 'enrolled', 'incoming', 'alumni'];
  return {
    id: `stu-${String(ix).padStart(3, '0')}`, full_name: name, email: `student${ix}@unia.edu.test`, program: ix % 3 === 0 ? 'Information Technology' : ix % 4 === 0 ? 'Data Science' : 'Computer Science', program_level: (ix % 17 === 0 ? 'pg' : 'ug') as 'ug' | 'pg', year: ix % 17 === 0 ? 1 : 1 + (ix % 4), status: statuses[ix % statuses.length], verification: (claimed ? ix % 2 === 0 ? 'roster' : 'student_id' : null) as Student['verification'], claimed, verified_skills_count: verified, last_activity: claimed ? new Date(Date.now() - (ix % 38) * 86400000).toISOString() : null, placement_status: ix % 5 === 0 ? 'placed' : ix % 7 === 0 ? 'not_placed' : 'unknown', registered_at: claimed ? '2026-07-18' : null
  };
})];

export const studentsB: Student[] = Array.from({ length: 40 }, (_, ix) => ({
  id: `b-${ix + 1}`, full_name: `${firstNames[(ix + 3) % firstNames.length]} ${lastNames[(ix + 2) % lastNames.length]}`, email: `learner${ix + 1}@unib.edu.test`, program: 'Information Technology', program_level: 'ug', year: 1 + (ix % 4), status: ix === 0 ? 'alumni' : 'enrolled', verification: ix % 3 === 0 ? 'student_id' : ix % 2 === 0 ? 'roster' : null, claimed: ix < 24, verified_skills_count: ix < 8 ? ix % 3 + 1 : 0, last_activity: ix < 24 ? new Date(Date.now() - ix * 86400000).toISOString() : null, placement_status: ix % 8 === 0 ? 'placed' : 'unknown', registered_at: ix < 24 ? '2026-08-01' : null
}));

export const studentsC: Student[] = ['Sumit','Sourav','Sam','Shiva','Shruti','Sohan'].map((name, ix) => ({ id: `c-${ix}`, full_name: `${name} ${lastNames[ix]}`, email: `${name.toLowerCase()}@unic.edu.test`, program: 'Computer Science', program_level: 'ug', year: ix % 4 + 1, status: 'enrolled', verification: null, claimed: false, verified_skills_count: 0, last_activity: null, placement_status: 'unknown', registered_at: null }));

export const skillsA: Skill[] = [
  ['React','Web development',14,29,74,12], ['JavaScript','Web development',18,34,69,15], ['TypeScript','Web development',11,22,68,8], ['HTML/CSS','Web development',20,38,72,9], ['SQL','Data',8,19,71,7], ['Accessibility','Web development',6,13,76,4], ['Testing','Quality',5,16,66,11], ['Python','Data',9,24,73,10], ['Node.js','Backend',4,13,64,18], ['Data visualization','Data',3,12,62,5]
].map(([name, family, verified_students, assessed_students, avg_score, open_jobs], index) => ({ id: `skill-${index}`, name: String(name), family: String(family), verified_students: Number(verified_students), assessed_students: Number(assessed_students), avg_score: Number(avg_score), open_jobs: Number(open_jobs) }));

export const demandA: DemandRow[] = [
  { id: 'demand-visualization', skill_name: 'Data visualization', jobs_count: 1, reasons: { no_eligible: 12, incomplete_assessments: 4, insufficient_evidence: 3, skills_mismatch: 5, opted_out: 2, not_assessed: 40 }, last_posted_at: '2026-10-12' },
  { id: 'demand-node', skill_name: 'Node.js', jobs_count: 2, reasons: { no_eligible: 8, incomplete_assessments: 5, insufficient_evidence: 1, skills_mismatch: 9, opted_out: 1, not_assessed: 17 }, last_posted_at: '2026-10-11' }
];
export const overviewA: Overview = {
  students_total: 90, verified_students: 19, active_this_month: 31, projects_reviewed: 46,
  funnel: { invited: 90, registered: 58, submitted: 31, verified: 19 }, funnel_rows: [
    { year: '1', program: 'Computer Science', status: 'enrolled', invited: 28, registered: 18, submitted: 10, verified: 6 },
    { year: '2', program: 'Computer Science', status: 'enrolled', invited: 25, registered: 16, submitted: 8, verified: 5 },
    { year: '3', program: 'Information Technology', status: 'enrolled', invited: 22, registered: 14, submitted: 7, verified: 4 },
    { year: '4', program: 'Data Science', status: 'alumni', invited: 15, registered: 10, submitted: 6, verified: 4 }
  ], skills: skillsA,
  trends: Array.from({ length: 26 }, (_, ix) => ({ week_start: new Date(Date.now() - (25 - ix) * 7 * 86400000).toISOString().slice(0, 10), verified_total: Math.max(2, Math.round(19 * (ix + 3) / 29)), reviews: 4 + (ix * 7) % 11, new_registrations: 1 + (ix * 3) % 7 }))
};
export const placementsA: Placement[] = studentsA.map((student, ix) => ({
  student_id: student.claimed ? student.id : null,
  roster_entry_id: student.claimed ? null : student.id,
  status: student.placement_status,
  organization_name_text: student.placement_status === 'placed' ? ['Northwind Labs','Brightlane'][ix % 2] : '',
  role_text: student.placement_status === 'placed' ? ['Frontend intern','Junior developer'][ix % 2] : '',
  source: student.claimed && ix % 4 === 0 ? 'student' : 'university',
  updated_at: new Date(Date.now() - ix % 28 * 86400000).toISOString()
}));
export const demandB: DemandRow[] = [{ id: 'b-demand', skill_name: 'Testing', jobs_count: 1, reasons: { no_eligible: 2, incomplete_assessments: 1, insufficient_evidence: 0, skills_mismatch: 4, opted_out: 0, not_assessed: 7 }, last_posted_at: '2026-10-04' }];
export const overviewB: Overview = { students_total: 40, verified_students: 6, active_this_month: 9, projects_reviewed: 11, funnel: { invited: 40, registered: 24, submitted: 10, verified: 6 }, funnel_rows: [{year:'1',program:'Information Technology',status:'enrolled',invited:20,registered:12,submitted:5,verified:3},{year:'2',program:'Information Technology',status:'alumni',invited:20,registered:12,submitted:5,verified:3}], skills: skillsA.slice(0, 4).map((s) => ({ ...s, verified_students: Math.min(s.verified_students, 4), assessed_students: Math.min(s.assessed_students, 8), open_jobs: 2 })), trends: overviewA.trends.slice(-4) };
export const overviewC: Overview = { ...overviewB, students_total: 6, verified_students: 2, active_this_month: 1, projects_reviewed: 3, funnel: { invited: 6, registered: 3, submitted: 2, verified: 1 }, funnel_rows: [{year:'1',program:'Computer Science',status:'enrolled',invited:2,registered:1,submitted:1,verified:0},{year:'2',program:'Computer Science',status:'enrolled',invited:2,registered:1,submitted:1,verified:1},{year:'3',program:'Computer Science',status:'enrolled',invited:2,registered:1,submitted:0,verified:0}] };
export const demandC: DemandRow[] = [{ id: 'c-demand', skill_name: 'React', jobs_count: 1, reasons: { no_eligible: 1, incomplete_assessments: 0, insufficient_evidence: 1, skills_mismatch: 0, opted_out: 0, not_assessed: 4 }, last_posted_at: '2026-10-01' }];
export const organizations: Organization[] = [
  { id: 'org-northwind', name: 'Northwind Labs', kind: 'Technology', size: 'Mid-size', website: 'https://northwind.example', verified: true, open_jobs: 2, jobs: [{ id: 'job-nw-1', title: 'Frontend Developer (React)', mode: 'Hybrid', location: 'Jaipur', status: 'Open', skills: ['React','TypeScript','Accessibility'] }, { id: 'job-nw-2', title: 'Data Visualization Analyst', mode: 'Remote', location: 'India', status: 'Open', skills: ['SQL','Data visualization'] }] },
  { id: 'org-brightlane', name: 'Brightlane', kind: 'Start-up', size: 'Small', website: 'https://brightlane.example', verified: true, open_jobs: 2, jobs: [{ id: 'job-bl-1', title: 'Junior Full-stack Intern', mode: 'On-site', location: 'Jaipur', status: 'Open', skills: ['React','Node.js','SQL'] }, { id: 'job-bl-2', title: 'UI Engineer (React)', mode: 'Remote', location: 'India', status: 'Open', skills: ['React','HTML/CSS'] }] }
];
export const notificationsSeed: AppNotification[] = [
  { id: 'n-1', kind: 'student_registered', title: 'A student registered', detail: 'A new student claimed a place on your roster.', created_at: new Date(Date.now() - 2 * 3600000).toISOString(), read_at: null },
  { id: 'n-2', kind: 'demand_alert', title: 'New skills demand', detail: 'A Data visualization role could not find enough verified candidates.', created_at: new Date(Date.now() - 27 * 3600000).toISOString(), read_at: null },
  { id: 'n-3', kind: 'roster_matched', title: 'Roster updated', detail: 'Your latest roster changes are ready to review.', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), read_at: '2026-10-10T09:00:00Z' }
];
