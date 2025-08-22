/**
 * Domain logic for handling share issuance with proper round creation and valuation tracking
 */
import { InsertShareLedgerEntry, InsertRound } from "@shared/schema";

export interface IssueSharesParams {
  companyId: string;
  holderId: string;
  classId: string;
  quantity: number;
  pricePerShare?: number;
  consideration?: number;
  valuation?: number;
  issueDate: Date;
  roundName?: string;
  certificateNo?: string;
  considerationType?: string;
}

export interface IssueSharesResult {
  shareLedgerEntry: any;
  round?: any;
  totalValue: number;
  derivedPricePerShare: number;
}

export function calculateIssueSharesMetrics(params: IssueSharesParams): {
  derivedPricePerShare: number;
  derivedValuation: number;
  totalValue: number;
  shouldCreateRound: boolean;
} {
  const { quantity, pricePerShare, consideration, valuation } = params;
  
  let derivedPricePerShare = 0;
  let derivedValuation = 0;
  let totalValue = 0;
  
  // If we have explicit price per share, use it
  if (pricePerShare && pricePerShare > 0) {
    derivedPricePerShare = pricePerShare;
    totalValue = pricePerShare * quantity;
    
    // If we also have valuation, validate consistency
    if (valuation && valuation > 0) {
      // TODO: Add validation logic for consistency
      derivedValuation = valuation;
    }
  } 
  // If we have consideration, derive price per share
  else if (consideration && consideration > 0) {
    derivedPricePerShare = consideration / quantity;
    totalValue = consideration;
    
    // If we have valuation, use it
    if (valuation && valuation > 0) {
      derivedValuation = valuation;
    }
  }
  // If we only have valuation, we can't derive price per share without knowing total shares
  else if (valuation && valuation > 0) {
    derivedValuation = valuation;
    // Price per share would need to be calculated with total outstanding shares
  }

  // Determine if we should create a round entry
  const shouldCreateRound = derivedPricePerShare > 0 && (params.roundName || derivedValuation > 0);

  return {
    derivedPricePerShare,
    derivedValuation,
    totalValue,
    shouldCreateRound
  };
}

export function createRoundFromIssuance(
  params: IssueSharesParams,
  metrics: ReturnType<typeof calculateIssueSharesMetrics>
): InsertRound | null {
  if (!metrics.shouldCreateRound) {
    return null;
  }

  return {
    companyId: params.companyId,
    name: params.roundName || `Share Issuance ${new Date().toLocaleDateString()}`,
    closeDate: params.issueDate,
    preMoneyValuation: metrics.derivedValuation.toString(),
    raiseAmount: metrics.totalValue.toString(),
    pricePerShare: metrics.derivedPricePerShare.toString(),
    roundType: 'priced', // Mark as priced round so valuation calculator can use it
    newSecurityClassId: params.classId,
    optionPoolIncrease: null,
    optionPoolTiming: null,
    antiDilutionProvisions: null,
    payToPlay: false
  };
}