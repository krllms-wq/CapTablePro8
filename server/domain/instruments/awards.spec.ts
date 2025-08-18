import { 
  updatePlanForGrant, 
  updatePlanForExercise, 
  updatePlanForCancellation,
  calculateOutstandingOptions,
  calculateOutstandingRSUs,
  calculateVestedShares,
  calculateVestedRSUs
} from './awards';
import { OptionPlan, EquityAward } from '../captable/types';

describe('Awards Management - Fixed Implementation', () => {
  const mockPlan: OptionPlan = {
    id: '1',
    name: 'Test Plan',
    totalShares: 1000000,
    allocatedShares: 200000,
    availableShares: 800000,
    issuedShares: 0
  };

  const mockAward: EquityAward = {
    id: '1',
    holderId: 'emp1',
    type: 'ISO',
    quantityGranted: 100000,
    quantityExercised: 25000,
    quantityCanceled: 10000,
    quantityExpired: 0,
    grantDate: new Date('2024-01-01'),
    vestingStartDate: new Date('2024-01-01'),
    cliffMonths: 12,
    totalMonths: 48,
    strikePrice: 1.0
  };

  test('Grant allocates shares and reduces available', () => {
    const updatedPlan = updatePlanForGrant(mockPlan, 100000);
    
    expect(updatedPlan.allocatedShares).toBe(300000);
    expect(updatedPlan.availableShares).toBe(700000);
    expect(updatedPlan.totalShares).toBe(1000000);
    expect(updatedPlan.issuedShares).toBe(0); // Unchanged
  });

  test('Grant fails when insufficient shares available', () => {
    expect(() => {
      updatePlanForGrant(mockPlan, 900000);
    }).toThrow('Insufficient shares available');
  });

  test('Exercise reduces allocated and increases issued', () => {
    const updatedPlan = updatePlanForExercise(mockPlan, 50000);
    
    expect(updatedPlan.allocatedShares).toBe(150000);
    expect(updatedPlan.availableShares).toBe(800000); // Unchanged
    expect(updatedPlan.issuedShares).toBe(50000);
    expect(updatedPlan.totalShares).toBe(1000000);
  });

  test('Cancellation reduces allocated and increases available', () => {
    const updatedPlan = updatePlanForCancellation(mockPlan, 50000);
    
    expect(updatedPlan.allocatedShares).toBe(150000);
    expect(updatedPlan.availableShares).toBe(850000);
    expect(updatedPlan.totalShares).toBe(1000000);
    expect(updatedPlan.issuedShares).toBe(0); // Unchanged
  });

  test('Outstanding options calculation excludes RSUs', () => {
    const awards = [
      mockAward,
      {
        ...mockAward,
        id: '2',
        type: 'RSU',
        quantityExercised: 0 // RSUs don't get exercised
      }
    ];
    
    const outstanding = calculateOutstandingOptions(awards);
    
    // Only ISO: 100000 - 25000 - 10000 - 0 = 65000
    expect(outstanding).toBe(65000);
  });

  test('Outstanding RSUs calculation excludes exercised (released)', () => {
    const rsuAward: EquityAward = {
      ...mockAward,
      type: 'RSU',
      quantityExercised: 20000, // For RSUs this means "released"
    };
    
    const outstanding = calculateOutstandingRSUs([rsuAward]);
    
    // 100000 - 10000 canceled (NOT subtracting exercised) = 90000
    expect(outstanding).toBe(90000);
  });

  test('Vesting calculation using calendar months - before cliff', () => {
    const award = { ...mockAward, vestingStartDate: new Date('2024-01-01') };
    const asOf = new Date('2024-06-01'); // 5 months, before 12-month cliff
    
    const vested = calculateVestedShares(award, asOf);
    expect(vested).toBe(0);
  });

  test('Vesting calculation using calendar months - after cliff', () => {
    const award = { ...mockAward, vestingStartDate: new Date('2024-01-01') };
    const asOf = new Date('2025-07-01'); // 18 months
    
    const vested = calculateVestedShares(award, asOf);
    // 18/48 * 100000 = 37500, minus 25000 exercised and 10000 canceled = 2500
    expect(vested).toBe(2500);
  });

  test('Vesting calculation - fully vested', () => {
    const award = { ...mockAward, vestingStartDate: new Date('2020-01-01') };
    const asOf = new Date('2024-07-01'); // Well past 48 months
    
    const vested = calculateVestedShares(award, asOf);
    // All granted minus exercised and canceled = 65000
    expect(vested).toBe(65000);
  });

  test('RSU vesting calculation excludes exercised quantities', () => {
    const rsuAward: EquityAward = {
      ...mockAward,
      type: 'RSU',
      vestingStartDate: new Date('2020-01-01'), // Fully vested
      quantityExercised: 0, // RSUs track releases separately
    };
    
    const vested = calculateVestedRSUs([rsuAward], new Date('2024-07-01'));
    
    // Fully vested: 100000 - 10000 canceled = 90000
    expect(vested).toBe(90000);
  });

  test('Complete grant-exercise-cancel flow preserves plan integrity', () => {
    let plan = mockPlan;
    
    // 1. Grant 100K options
    plan = updatePlanForGrant(plan, 100000);
    expect(plan.availableShares).toBe(700000);
    expect(plan.allocatedShares).toBe(300000);
    expect(plan.issuedShares).toBe(0);
    
    // 2. Exercise 25K options
    plan = updatePlanForExercise(plan, 25000);
    expect(plan.availableShares).toBe(700000);
    expect(plan.allocatedShares).toBe(275000);
    expect(plan.issuedShares).toBe(25000);
    
    // 3. Cancel 30K options
    plan = updatePlanForCancellation(plan, 30000);
    expect(plan.availableShares).toBe(730000);
    expect(plan.allocatedShares).toBe(245000);
    expect(plan.issuedShares).toBe(25000);
    
    // Plan integrity check
    expect(plan.totalShares).toBe(plan.allocatedShares + plan.availableShares + plan.issuedShares);
  });

  test('Multiple award types in outstanding calculations', () => {
    const awards: EquityAward[] = [
      { ...mockAward, type: 'ISO' },
      { ...mockAward, id: '2', type: 'NSO' },
      { ...mockAward, id: '3', type: 'RSU', quantityExercised: 0 }
    ];

    const options = calculateOutstandingOptions(awards);
    const rsus = calculateOutstandingRSUs(awards);

    // Two option awards: 2 * (100000 - 25000 - 10000) = 130000
    expect(options).toBe(130000);
    
    // One RSU award: 100000 - 10000 = 90000
    expect(rsus).toBe(90000);
  });
});