import { EquityAward, OptionPlan } from '../captable/types';
import { roundShares } from '../util/round';
import { differenceInMonths } from 'date-fns';

export interface PlanAccounting {
  totalShares: number;
  allocatedShares: number;
  availableShares: number;
  outstandingOptions: number;
  outstandingRSUs: number;
}

export function updatePlanForGrant(
  plan: OptionPlan, 
  grantQuantity: number
): OptionPlan {
  const newAllocated = plan.allocatedShares + grantQuantity;
  const newAvailable = plan.availableShares - grantQuantity;
  
  if (newAvailable < 0) {
    throw new Error(`Insufficient shares available in plan. Available: ${plan.availableShares}, Requested: ${grantQuantity}`);
  }
  
  return {
    ...plan,
    allocatedShares: roundShares(newAllocated),
    availableShares: roundShares(newAvailable)
  };
}

export function updatePlanForExercise(
  plan: OptionPlan,
  exerciseQuantity: number
): OptionPlan {
  const newAllocated = plan.allocatedShares - exerciseQuantity;
  const newIssued = plan.issuedShares + exerciseQuantity;
  
  return {
    ...plan,
    allocatedShares: roundShares(newAllocated),
    issuedShares: roundShares(newIssued)
  };
}

export function updatePlanForCancellation(
  plan: OptionPlan,
  cancelQuantity: number
): OptionPlan {
  const newAllocated = plan.allocatedShares - cancelQuantity;
  const newAvailable = plan.availableShares + cancelQuantity;
  
  return {
    ...plan,
    allocatedShares: roundShares(newAllocated),
    availableShares: roundShares(newAvailable)
  };
}

export function calculateOutstandingOptions(awards: EquityAward[]): number {
  return roundShares(
    awards
      .filter(award => award.type === 'ISO' || award.type === 'NSO')
      .reduce((sum, award) => {
        return sum + (award.quantityGranted - award.quantityExercised - award.quantityCanceled - award.quantityExpired);
      }, 0)
  );
}

export function calculateOutstandingRSUs(awards: EquityAward[]): number {
  return roundShares(
    awards
      .filter(award => award.type === 'RSU')
      .reduce((sum, award) => {
        return sum + (award.quantityGranted - award.quantityCanceled);
      }, 0)
  );
}

export function calculateVestedShares(
  award: EquityAward,
  asOfDate: Date = new Date()
): number {
  const monthsElapsed = differenceInMonths(asOfDate, award.vestingStartDate);

  if (monthsElapsed < award.cliffMonths) {
    return 0;
  }

  if (monthsElapsed >= award.totalMonths) {
    return award.quantityGranted - award.quantityExercised - award.quantityCanceled;
  }

  const vestedShares = Math.floor((monthsElapsed / award.totalMonths) * award.quantityGranted);
  return Math.max(0, vestedShares - award.quantityExercised - award.quantityCanceled);
}

export function calculateGrantedRSUs(awards: EquityAward[]): number {
  return roundShares(
    awards
      .filter(award => award.type === 'RSU')
      .reduce((sum, award) => sum + award.quantityGranted, 0)
  );
}

export function calculateVestedRSUs(awards: EquityAward[], asOfDate: Date = new Date()): number {
  return roundShares(
    awards
      .filter(award => award.type === 'RSU')
      .reduce((sum, award) => {
        const monthsElapsed = differenceInMonths(asOfDate, award.vestingStartDate);
        
        if (monthsElapsed < award.cliffMonths) {
          return sum;
        }
        
        if (monthsElapsed >= award.totalMonths) {
          return sum + (award.quantityGranted - award.quantityCanceled);
        }
        
        const vestedShares = Math.floor((monthsElapsed / award.totalMonths) * award.quantityGranted);
        return sum + Math.max(0, vestedShares - award.quantityCanceled);
      }, 0)
  );
}