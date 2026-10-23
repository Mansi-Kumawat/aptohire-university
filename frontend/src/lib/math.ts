import type { FunnelCounts, PlacementStatus } from '@aptohire/university-backend';
// Mirror of app_config. Keep in sync when the public config view is unavailable.
export const PASS_MARK_FALLBACK = 50;
export const BORDERLINE_FALLBACK: [number, number] = [40, 60];
export function levelFor(score: number): 'Emerging' | 'Competent' | 'Proficient' | 'Advanced' {
  if (score <= 50) return 'Emerging'; if (score <= 69) return 'Competent'; if (score <= 84) return 'Proficient'; return 'Advanced';
}
export function isVerified(score: number, passMark: number): boolean { return score > passMark; }
export function funnelRows(counts: FunnelCounts) {
  const rows = [
    { label: 'Invited', count: counts.invited, color: 'var(--verdant-100)', conversion: 'Starting cohort' },
    { label: 'Registered', count: counts.registered, color: 'var(--verdant-300)', conversion: `${ratio(counts.registered, counts.invited)} of invited` },
    { label: 'Submitted', count: counts.submitted, color: 'var(--verdant-600)', conversion: `${ratio(counts.submitted, counts.registered)} of registered` },
    { label: 'Verified', count: counts.verified, color: 'var(--verdant-800)', conversion: `${ratio(counts.verified, counts.submitted)} of submitted` }
  ];
  return rows.map((row) => ({ ...row, width: counts.invited ? `${Math.max(0, Math.min(100, row.count / counts.invited * 100))}%` : '0%' }));
}
function ratio(part: number, whole: number) { return whole === 0 ? '—' : `${Math.round(part / whole * 100)}%`; }
export function largestFunnelDrop(counts: FunnelCounts) {
  const drops = [
    { from: 'Invited', to: 'Registered', count: counts.invited - counts.registered, next: 'registered' },
    { from: 'Registered', to: 'Submitted', count: counts.registered - counts.submitted, next: 'submitted a project' },
    { from: 'Submitted', to: 'Verified', count: counts.submitted - counts.verified, next: 'reached a verified result' }
  ];
  return drops.reduce((largest, row) => row.count > largest.count ? row : largest, drops[0]!);
}
export function placementSummary(values: PlacementStatus[]) {
  const placed = values.filter((value) => value === 'placed').length;
  const notPlaced = values.filter((value) => value === 'not_placed').length;
  const unknown = values.filter((value) => value === 'unknown').length;
  const known = placed + notPlaced;
  return { placed, notPlaced, unknown, known, placedPercent: known === 0 ? '—' : `${Math.round(placed / known * 100)}%` };
}
export function gapLabel(supply: number, openJobs: number) {
  // TODO(decision): compare distinct verified students with open job count as a simple signal, not a score.
  if (supply === 0) return 'No verified students';
  if (supply < openJobs) return 'Some gap';
  return 'Covered';
}
export function safeCsvCell(value: unknown) { const text = String(value ?? ''); return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text; }
export function proofAriaLabel(skill: string, score: number, level: string, verified: boolean) { return `${skill}, score ${score} of 100, ${level}, ${verified ? 'verified' : 'not verified'}`; }
