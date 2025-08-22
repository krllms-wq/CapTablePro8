/**
 * Server-side valuation calculation utilities
 */
import { Round, ShareLedgerEntry, EquityAward, ConvertibleInstrument } from "@shared/schema";

export interface ValuationResult {
  currentValuation: number | null;
  pricePerShare: number | null;
  source: 'latest_round' | 'explicit_valuation' | 'none';
  lastRoundDate?: Date;
  lastRoundName?: string;
  sourceDescription?: string;
}

/**
 * Calculate current company valuation from latest priced round or explicit valuation
 * Returns null if no valuation data available (never returns $0)
 */
export function calculateCurrentValuation(
  rounds: Round[],
  shareEntries: ShareLedgerEntry[],
  explicitValuation?: number
): ValuationResult {
  // If explicit valuation is set, use that
  if (explicitValuation && explicitValuation > 0) {
    return {
      currentValuation: explicitValuation,
      pricePerShare: null, // Would need shares outstanding to calculate
      source: 'explicit_valuation',
      sourceDescription: 'Explicit company valuation'
    };
  }

  // Find latest priced round - be more flexible with round types
  const pricedRounds = rounds
    .filter(round => {
      // Accept any round with a valid pricePerShare, regardless of roundType
      const hasValidPrice = round.pricePerShare && Number(round.pricePerShare) > 0;
      
      console.log(`Round ${round.name}: type=${round.roundType}, pricePerShare=${round.pricePerShare}, valid=${hasValidPrice}`);
      
      return hasValidPrice;
    })
    .sort((a, b) => new Date(b.closeDate).getTime() - new Date(a.closeDate).getTime());

  console.log('Valuation Calculator - Total rounds:', rounds.length);
  console.log('Valuation Calculator - Priced rounds:', pricedRounds.length);
  if (pricedRounds.length > 0) {
    console.log('Valuation Calculator - Latest round:', pricedRounds[0]);
  }

  if (pricedRounds.length === 0) {
    return {
      currentValuation: null,
      pricePerShare: null,
      source: 'none',
      sourceDescription: 'No priced rounds available'
    };
  }

  const latestRound = pricedRounds[0];
  
  // Calculate current shares outstanding
  const totalSharesOutstanding = shareEntries.reduce((sum, entry) => sum + Number(entry.quantity), 0);
  
  if (totalSharesOutstanding <= 0) {
    return {
      currentValuation: null,
      pricePerShare: latestRound.pricePerShare,
      source: 'latest_round',
      lastRoundDate: latestRound.closeDate,
      lastRoundName: latestRound.name,
      sourceDescription: `Price from ${latestRound.name} round (no shares outstanding)`
    };
  }

  // Current valuation = price per share * total shares outstanding
  const currentValuation = Number(latestRound.pricePerShare) * totalSharesOutstanding;

  return {
    currentValuation,
    pricePerShare: latestRound.pricePerShare,
    source: 'latest_round',
    lastRoundDate: latestRound.closeDate,
    lastRoundName: latestRound.name,
    sourceDescription: `Based on ${latestRound.name} round at $${Number(latestRound.pricePerShare).toFixed(2)}/share`
  };
}

/**
 * Calculate fully diluted valuation with proper RSU handling and no double counting
 */
export function calculateFullyDilutedValuation(
  rounds: Round[],
  shareEntries: ShareLedgerEntry[],
  equityAwards: EquityAward[],
  convertibles: ConvertibleInstrument[],
  rsuInclusionMode: 'none' | 'granted' | 'vested' = 'granted',
  optionPoolSize: number = 0
): {
  currentValuation: number | null;
  fullyDilutedValuation: number | null;
  pricePerShare: number | null;
  sharesOutstanding: number;
  fullyDilutedShares: number;
} {
  const valuationResult = calculateCurrentValuation(rounds, shareEntries);
  
  if (!valuationResult.pricePerShare) {
    return {
      currentValuation: null,
      fullyDilutedValuation: null,
      pricePerShare: null,
      sharesOutstanding: 0,
      fullyDilutedShares: 0
    };
  }

  // Calculate shares outstanding
  const sharesOutstanding = shareEntries.reduce((sum, entry) => sum + Number(entry.quantity), 0);

  // Calculate outstanding equity awards based on RSU inclusion mode
  let totalEquityAwardsOutstanding = 0;
  
  equityAwards.forEach(award => {
    const outstanding = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
    
    if (outstanding <= 0) return;
    
    // Handle RSUs based on inclusion mode
    if (award.type === 'RSU') {
      if (rsuInclusionMode === 'none') return;
      if (rsuInclusionMode === 'granted') {
        totalEquityAwardsOutstanding += outstanding;
        return;
      }
      if (rsuInclusionMode === 'vested') {
        // Calculate vested portion - simplified for now
        // In production, would use proper vesting schedule calculation
        const now = new Date();
        const grantDate = new Date(award.grantDate);
        const monthsElapsed = Math.max(0, 
          (now.getTime() - grantDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
        );
        
        if (monthsElapsed >= award.cliffMonths) {
          const vestedMonths = Math.min(monthsElapsed, award.totalMonths);
          const vestedPortion = vestedMonths / award.totalMonths;
          totalEquityAwardsOutstanding += Math.floor(outstanding * vestedPortion);
        }
        return;
      }
    }
    
    // Include all other equity awards (options, warrants, etc.)
    totalEquityAwardsOutstanding += outstanding;
  });

  // Add unallocated option pool only (never double count)
  const unallocatedPool = Math.max(0, optionPoolSize - totalEquityAwardsOutstanding);
  
  // Calculate fully diluted shares
  const fullyDilutedShares = sharesOutstanding + totalEquityAwardsOutstanding + unallocatedPool;

  // Calculate valuations
  const pricePerShare = Number(valuationResult.pricePerShare);
  const currentValuation = sharesOutstanding * pricePerShare;
  const fullyDilutedValuation = fullyDilutedShares * pricePerShare;

  return {
    currentValuation,
    fullyDilutedValuation,
    pricePerShare,
    sharesOutstanding,
    fullyDilutedShares
  };
}