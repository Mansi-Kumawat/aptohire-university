import { describe, expect, it } from 'vitest';
import { funnelRows, gapLabel, isVerified, largestFunnelDrop, levelFor, placementSummary, proofAriaLabel, safeCsvCell } from './math';

describe('funnel math', () => {
  it('calculates conversion widths and handles zero denominators', () => {
    expect(funnelRows({ invited: 100, registered: 60, submitted: 30, verified: 12 })[1]?.conversion).toBe('60% of invited');
    expect(funnelRows({ invited: 0, registered: 0, submitted: 0, verified: 0 })[1]?.conversion).toBe('— of invited');
    expect(funnelRows({ invited: 0, registered: 0, submitted: 0, verified: 0 })[0]?.width).toBe('0%');
  });
  it('describes the largest drop in the funnel', () => {
    expect(largestFunnelDrop({ invited: 100, registered: 80, submitted: 30, verified: 20 })).toMatchObject({ from: 'Registered', to: 'Submitted', count: 50 });
  });
});
describe('score and placement labels', () => {
  it('maps levels and uses the configured pass mark', () => {
    expect(levelFor(50)).toBe('Emerging'); expect(levelFor(69)).toBe('Competent'); expect(levelFor(70)).toBe('Proficient'); expect(levelFor(85)).toBe('Advanced'); expect(isVerified(51,50)).toBe(true); expect(isVerified(50,50)).toBe(false);
  });
  it('keeps Unknown separate from Not placed', () => {
    expect(placementSummary(['placed','not_placed','unknown','unknown'])).toEqual({ placed: 1, notPlaced: 1, unknown: 2, known: 2, placedPercent: '50%' });
    expect(placementSummary(['unknown']).placedPercent).toBe('—');
  });
  it('labels the Proof Ring accessibly', () => { expect(proofAriaLabel('React',72,'Proficient',true)).toBe('React, score 72 of 100, Proficient, verified'); });
  it('labels skill gaps with a simple supply threshold', () => { expect(gapLabel(0,4)).toBe('No verified students'); expect(gapLabel(2,4)).toBe('Some gap'); expect(gapLabel(4,2)).toBe('Covered'); });
});
describe('CSV export injection guard', () => {
  it.each(['=1+1','+cmd','-10','@SUM(A1)','\tbad','\rbad'])('quotes dangerous leading values: %s', (value) => { expect(safeCsvCell(value)).toBe(`'${value}`); });
  it('leaves ordinary values as-is', () => { expect(safeCsvCell('Aarav Sharma')).toBe('Aarav Sharma'); });
});
