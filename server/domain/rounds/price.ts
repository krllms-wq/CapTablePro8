import { roundMoney } from '../util/round';

export interface RoundPricing {
  pricePerShare: number;
  preMoneyValuation: number;
  postMoneyValuation: number;
  sharesSold: number;
  proceedsRaised: number;
}

export function calculateRoundPricing(
  preMoneyValuation: number,
  proceedsToRaise: number,
  preRoundShares: number
): RoundPricing {
  const postMoneyValuation = preMoneyValuation + proceedsToRaise;
  const pricePerShare = roundMoney(preMoneyValuation / preRoundShares);
  const sharesSold = Math.round(proceedsToRaise / pricePerShare);
  
  return {
    pricePerShare,
    preMoneyValuation: roundMoney(preMoneyValuation),
    postMoneyValuation: roundMoney(postMoneyValuation),
    sharesSold,
    proceedsRaised: roundMoney(proceedsToRaise)
  };
}

export function calculatePriceFromShares(
  preMoneyValuation: number,
  preRoundShares: number
): number {
  return roundMoney(preMoneyValuation / preRoundShares);
}

export function calculateSharesFromProceeds(
  proceedsToRaise: number,
  pricePerShare: number
): number {
  return Math.round(proceedsToRaise / pricePerShare);
}

export function calculatePostMoneyFromPreMoney(
  preMoneyValuation: number,
  proceedsRaised: number
): number {
  return roundMoney(preMoneyValuation + proceedsRaised);
}

export function calculateOwnershipDilution(
  preRoundShares: number,
  newSharesIssued: number
): number {
  const postRoundShares = preRoundShares + newSharesIssued;
  return roundMoney((newSharesIssued / postRoundShares) * 100);
}