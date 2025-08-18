import { 
  updatePlanForGrant, 
  updatePlanForExercise, 
  updatePlanForCancellation,
  calculateOutstandingOptions,
  calculateOutstandingRSUs,
  calculateVestedShares
} from './awards';
import { OptionPlan, EquityAward } from '../captable/types';

describe('Awards Management', () => {
  const mockPlan: OptionPlan = {
    id: '1',
    name: 'Test Plan',
    totalShares: 1000000,
    allocatedShares: 200000,
    availableShares: 800000
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

  test('Grant consumes plan available shares', () => {
    const updatedPlan = updatePlanForGrant(mockPlan, 100000);
    
    expect(updatedPlan.allocatedShares).toBe(300000);
    expect(updatedPlan.availableShares).toBe(700000);
    expect(updatedPlan.totalShares).toBe(1000000);
  });

  test('Grant fails when insufficient shares available', () => {
    expect(() => {
      updatePlanForGrant(mockPlan, 900000);
    }).toThrow('Insufficient shares available');
  });

  test('Exercise does not affect plan accounting', () => {
    const updatedPlan = updatePlanForExercise(mockPlan, 50000);
    
    expect(updatedPlan).toEqual(mockPlan);
  });

  test('Cancellation returns shares to available', () => {
    const updatedPlan = updatePlanForCancellation(mockPlan, 50000);
    
    expect(updatedPlan.allocatedShares).toBe(150000);
    expect(updatedPlan.availableShares).toBe(850000);
    expect(updatedPlan.totalShares).toBe(1000000);
  });

  test('Outstanding options calculation', () => {
    const awards = [mockAward];
    const outstanding = calculateOutstandingOptions(awards);
    
    // 100000 granted - 25000 exercised - 10000 canceled - 0 expired = 65000
    expect(outstanding).toBe(65000);
  });

  test('Vesting calculation before cliff', () => {
    const award = { ...mockAward, vestingStartDate: new Date('2024-01-01') };
    const asOf = new Date('2024-06-01'); // 5 months, before 12-month cliff
    
    const vested = calculateVestedShares(award, asOf);
    expect(vested).toBe(0);
  });

  test('Vesting calculation after cliff', () => {
    const award = { ...mockAward, vestingStartDate: new Date('2024-01-01') };
    const asOf = new Date('2024-07-01'); // 18 months
    
    const vested = calculateVestedShares(award, asOf);
    // 18/48 * 100000 = 37500, minus 25000 exercised and 10000 canceled = 2500
    expect(vested).toBeCloseTo(2500, 0);
  });

  test('Full vesting calculation', () => {
    const award = { ...mockAward, vestingStartDate: new Date('2020-01-01') };
    const asOf = new Date('2024-07-01'); // Well past 48 months
    
    const vested = calculateVestedShares(award, asOf);
    // All granted minus exercised and canceled = 65000
    expect(vested).toBe(65000);
  });

  test('RSU outstanding calculation', () => {
    const rsuAward: EquityAward = {
      ...mockAward,
      type: 'RSU',
      quantityExercised: 20000, // For RSUs this means "released"
    };
    
    const outstanding = calculateOutstandingRSUs([rsuAward]);
    // 100000 granted - 20000 released - 10000 canceled = 70000
    expect(outstanding).toBe(70000);
  });

  test('Complete grant-exercise-cancel flow', () => {
    let plan = mockPlan;
    
    // 1. Grant 100K options
    plan = updatePlanForGrant(plan, 100000);
    expect(plan.availableShares).toBe(700000);
    expect(plan.allocatedShares).toBe(300000);
    
    // 2. Exercise 25K options (no plan change)
    plan = updatePlanForExercise(plan, 25000);
    expect(plan.availableShares).toBe(700000);
    expect(plan.allocatedShares).toBe(300000);
    
    // 3. Cancel 30K options
    plan = updatePlanForCancellation(plan, 30000);
    expect(plan.availableShares).toBe(730000);
    expect(plan.allocatedShares).toBe(270000);
    
    // Plan integrity check
    expect(plan.totalShares).toBe(plan.allocatedShares + plan.availableShares);
  });
});