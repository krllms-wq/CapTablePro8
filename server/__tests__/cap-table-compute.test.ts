/**
 * Unit tests for deterministic cap table computation
 */
import { describe, test, expect, beforeAll } from '@jest/globals';
import { computeCapTable } from '../domain/cap-table/computeCapTable';
import { storage } from '../storage';

describe('Cap Table Computation', () => {
  const mockCompanyId = 'test-company-id';
  const fixedDate = '2025-01-15';

  // Mock storage with deterministic data
  beforeAll(() => {
    (storage as any).getStakeholders = jest.fn().mockResolvedValue([
      { id: 'stakeholder-1', name: 'Alice Founder', type: 'individual' },
      { id: 'stakeholder-2', name: 'Bob Founder', type: 'individual' },
      { id: 'stakeholder-3', name: 'Charlie Employee', type: 'individual' }
    ]);

    (storage as any).getSecurityClasses = jest.fn().mockResolvedValue([
      { id: 'class-common', name: 'Common', sharePrice: null }
    ]);

    (storage as any).getShareLedgerEntries = jest.fn().mockResolvedValue([
      { holderId: 'stakeholder-1', classId: 'class-common', quantity: 3000000, issueDate: '2024-01-01T00:00:00.000Z', consideration: 100 },
      { holderId: 'stakeholder-2', classId: 'class-common', quantity: 2000000, issueDate: '2024-01-01T00:00:00.000Z', consideration: 100 }
    ]);

    (storage as any).getEquityAwards = jest.fn().mockResolvedValue([
      {
        id: 'award-1',
        holderId: 'stakeholder-3',
        type: 'ISO',
        quantityGranted: 200000,
        quantityExercised: 0,
        quantityCanceled: 0,
        grantDate: '2024-06-01T00:00:00.000Z',
        vestingStartDate: '2024-06-01T00:00:00.000Z',
        vestingPeriodMonths: 48,
        cliffPeriodMonths: 12
      }
    ]);

    (storage as any).getConvertibleInstruments = jest.fn().mockResolvedValue([
      {
        id: 'safe-1',
        holderId: 'stakeholder-2',
        type: 'SAFE',
        principal: '500000',
        discountRate: '20',
        issueDate: '2024-03-01T00:00:00.000Z'
      }
    ]);

    (storage as any).getRounds = jest.fn().mockResolvedValue([
      {
        id: 'round-1',
        name: 'Seed Round',
        pricePerShare: '2.00',
        closeDate: '2024-12-01T00:00:00.000Z'
      }
    ]);
  });

  test('deterministic results on fixed inputs', async () => {
    const result1 = await computeCapTable({
      companyId: mockCompanyId,
      asOf: fixedDate,
      view: 'FULLY_DILUTED',
      rsuPolicy: 'granted'
    });

    const result2 = await computeCapTable({
      companyId: mockCompanyId,
      asOf: fixedDate,
      view: 'FULLY_DILUTED',
      rsuPolicy: 'granted'
    });

    expect(result1).toEqual(result2);
    expect(result1.totals.outstandingShares).toBe(5000000);
    expect(result1.totals.pricePerShare).toBe(2.00);
    expect(result1.totals.currentValuation).toBe(10000000);
  });

  test('FD includes unallocated pool in denominator only', async () => {
    const fdResult = await computeCapTable({
      companyId: mockCompanyId,
      asOf: fixedDate,
      view: 'FULLY_DILUTED'
    });

    const osResult = await computeCapTable({
      companyId: mockCompanyId,
      asOf: fixedDate,
      view: 'OUTSTANDING'
    });

    expect(fdResult.totals.fullyDilutedShares).toBeGreaterThan(osResult.totals.outstandingShares);
    expect(fdResult.meta.rules.includeUnallocatedPoolInDenominator).toBe(true);
    expect(fdResult.totals.optionPoolAvailable).toBeGreaterThan(0);
  });

  test('RSU policy switches affect totals', async () => {
    // Mock RSUs
    (storage as any).getEquityAwards = jest.fn().mockResolvedValue([
      {
        id: 'rsu-1',
        holderId: 'stakeholder-3',
        type: 'RSU',
        quantityGranted: 100000,
        quantityExercised: 0,
        quantityCanceled: 0,
        grantDate: '2024-06-01T00:00:00.000Z',
        vestingStartDate: '2024-06-01T00:00:00.000Z',
        vestingPeriodMonths: 48,
        cliffPeriodMonths: 12
      }
    ]);

    const noneResult = await computeCapTable({
      companyId: mockCompanyId,
      asOf: fixedDate,
      view: 'FULLY_DILUTED',
      rsuPolicy: 'none'
    });

    const grantedResult = await computeCapTable({
      companyId: mockCompanyId,
      asOf: fixedDate,
      view: 'FULLY_DILUTED',
      rsuPolicy: 'granted'
    });

    expect(grantedResult.totals.fullyDilutedShares).toBeGreaterThan(noneResult.totals.fullyDilutedShares);
    expect(noneResult.meta.rules.rsuPolicy).toBe('none');
    expect(grantedResult.meta.rules.rsuPolicy).toBe('granted');
  });

  test('valuation is nullable', async () => {
    // Mock no rounds
    (storage as any).getRounds = jest.fn().mockResolvedValue([]);

    const result = await computeCapTable({
      companyId: mockCompanyId,
      asOf: fixedDate,
      view: 'FULLY_DILUTED'
    });

    expect(result.totals.pricePerShare).toBeUndefined();
    expect(result.totals.currentValuation).toBeUndefined();
  });

  test('rows have required fields', async () => {
    const result = await computeCapTable({
      companyId: mockCompanyId,
      asOf: fixedDate,
      view: 'FULLY_DILUTED'
    });

    expect(result.rows.length).toBeGreaterThan(0);
    
    const row = result.rows[0];
    expect(row).toHaveProperty('stakeholderId');
    expect(row).toHaveProperty('stakeholderName');
    expect(row).toHaveProperty('securityClass');
    expect(row).toHaveProperty('sharesOutstanding');
    expect(row).toHaveProperty('sharesFD');
    expect(row).toHaveProperty('pctOutstanding');
    expect(row).toHaveProperty('pctFD');
    
    // Percentages should be rounded to 2 decimal places
    expect(row.pctOutstanding % 0.01).toBeCloseTo(0, 10);
    expect(row.pctFD % 0.01).toBeCloseTo(0, 10);
  });
});