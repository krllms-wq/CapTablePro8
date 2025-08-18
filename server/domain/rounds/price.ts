import { roundMoney, roundShares } from '../util/round';

export interface RoundPricingParams {
  investmentAmount: number;
  preMoneyValuation: number;
  poolTopUp?: {
    enabled: boolean;
    targetPercentage: number;
    timing: 'pre' | 'post';
  };
  currentIssuedShares: number;
  currentOptionsOutstanding: number;
  currentUnallocatedPool: number;
}

export interface RoundPricingResult {
  pricePerShare: number;
  sharesIssued: number;
  postMoneyValuation: number;
  poolSharesCreated: number;
  totalSharesPostRound: number;
  dilution: number;
}

export function calculateRoundPricing(params: RoundPricingParams): RoundPricingResult {
  const {
    investmentAmount,
    preMoneyValuation,
    poolTopUp,
    currentIssuedShares,
    currentOptionsOutstanding,
    currentUnallocatedPool
  } = params;

  let preRoundFullyDiluted = currentIssuedShares + currentOptionsOutstanding + currentUnallocatedPool;
  let poolSharesCreated = 0;
  let pricePerShare: number;
  let sharesIssued: number;

  if (poolTopUp?.enabled && poolTopUp.timing === 'pre') {
    // Pool top-up before the round affects pre-money calculation
    const targetPoolSize = (preRoundFullyDiluted * poolTopUp.targetPercentage) / (1 - poolTopUp.targetPercentage);
    poolSharesCreated = Math.max(0, targetPoolSize - currentUnallocatedPool);
    preRoundFullyDiluted += poolSharesCreated;
  }

  // Calculate price per share based on pre-money valuation and pre-round shares
  pricePerShare = preMoneyValuation / preRoundFullyDiluted;
  
  // Calculate shares issued for the investment
  sharesIssued = roundShares(investmentAmount / pricePerShare);
  
  let totalSharesPostRound = preRoundFullyDiluted + sharesIssued;

  if (poolTopUp?.enabled && poolTopUp.timing === 'post') {
    // Pool top-up after the round - doesn't affect investor dilution
    const targetPoolSize = totalSharesPostRound * poolTopUp.targetPercentage / (1 - poolTopUp.targetPercentage);
    poolSharesCreated = Math.max(0, targetPoolSize - currentUnallocatedPool);
    totalSharesPostRound += poolSharesCreated;
  }

  const postMoneyValuation = roundMoney(totalSharesPostRound * pricePerShare);
  const dilution = (sharesIssued + poolSharesCreated) / totalSharesPostRound;

  return {
    pricePerShare: roundMoney(pricePerShare),
    sharesIssued: roundShares(sharesIssued),
    postMoneyValuation,
    poolSharesCreated: roundShares(poolSharesCreated),
    totalSharesPostRound: roundShares(totalSharesPostRound),
    dilution: roundMoney(dilution * 100) // Return as percentage
  };
}

export function calculatePreMoneyValuation(
  postMoneyValuation: number,
  investmentAmount: number
): number {
  return roundMoney(postMoneyValuation - investmentAmount);
}

export function calculateOwnershipPercentage(
  sharesOwned: number,
  totalShares: number
): number {
  if (totalShares === 0) return 0;
  return roundMoney((sharesOwned / totalShares) * 100);
}