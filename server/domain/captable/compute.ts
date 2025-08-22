import { 
  CapTableView, 
  FullyDilutedOptions, 
  CapTableResult, 
  CapTableEntry,
  ShareLedgerEntry,
  EquityAward,
  ConvertibleInstrument,
  SecurityClass,
  OptionPlan
} from './types';
import { roundShares, calculatePercentage } from '../util/round';
import { 
  calculateOutstandingOptions, 
  calculateOutstandingRSUs,
  calculateGrantedRSUs,
  calculateVestedRSUs 
} from '../instruments/awards';
import { calculateSafeConversion } from '../convertibles/safe';
import { calculateNoteConversion } from '../convertibles/note';

export function computeCapTable(
  shareEntries: ShareLedgerEntry[],
  equityAwards: EquityAward[],
  convertibles: ConvertibleInstrument[],
  securityClasses: SecurityClass[],
  optionPlans: OptionPlan[],
  stakeholders: Map<string, { name: string }>,
  asOf: Date = new Date(),
  view: CapTableView = 'FullyDiluted',
  fdOptions: FullyDilutedOptions = {
    includeUnallocatedPool: true,
    includeRSUs: 'granted',
    includeWarrants: true
  }
): CapTableResult {
  
  const entries: CapTableEntry[] = [];
  const stakeholderShares = new Map<string, number>();
  const stakeholderClasses = new Map<string, string>();
  
  // Process share ledger entries (AsIssued base)
  for (const entry of shareEntries) {
    if (entry.issueDate <= asOf) {
      const current = stakeholderShares.get(entry.holderId) || 0;
      stakeholderShares.set(entry.holderId, current + entry.quantity);
      
      const secClass = securityClasses.find(sc => sc.id === entry.classId);
      stakeholderClasses.set(entry.holderId, secClass?.name || 'Unknown');
    }
  }
  
  let totalShares = 0;
  for (const shares of Array.from(stakeholderShares.values())) {
    totalShares += shares;
  }
  let fullyDilutedShares = totalShares;
  
  // Calculate preRoundFD for conversions
  const outstandingOptions = calculateOutstandingOptions(equityAwards);
  const unallocatedPool = optionPlans.reduce((sum, plan) => sum + plan.availableShares, 0);
  const preRoundFD = totalShares + outstandingOptions + unallocatedPool;
  
  // Add convertibles if AsConverted or FullyDiluted
  console.log(`💰 [COMPUTE] Processing ${convertibles.length} convertibles as of ${asOf.toISOString()}`);
  if (view === 'AsConverted' || view === 'FullyDiluted') {
    for (const convertible of convertibles) {
      console.log(`💰 [COMPUTE] Checking convertible ${convertible.type} for ${convertible.holderId}:`, {
        issueDate: convertible.issueDate?.toISOString()?.split('T')[0],
        conversionDate: convertible.conversionDate?.toISOString()?.split('T')[0] || 'NOT_CONVERTED',
        asOfDate: asOf.toISOString().split('T')[0],
        oldCondition: convertible.issueDate <= asOf,
        newCondition: convertible.conversionDate && convertible.conversionDate <= asOf
      });
      
      // CRITICAL BUG FIX: Check conversionDate, not issueDate!
      if (convertible.conversionDate && convertible.conversionDate <= asOf) {
        console.log(`✅ [COMPUTE] Converting ${convertible.type} - conversion happened on/before asOf date`);
        let sharesFromConversion = 0;
        
        if (convertible.type === 'SAFE') {
          // Use default price for demonstration - in real implementation would come from parameters
          const conversionResult = calculateSafeConversion(convertible, {
            pricePerShare: 1.0, // This would be provided by the calling context
            preRoundFullyDiluted: preRoundFD
          });
          sharesFromConversion = conversionResult.sharesIssued;
        } else if (convertible.type === 'NOTE') {
          const conversionResult = calculateNoteConversion(convertible, {
            pricePerShare: 1.0, // This would be provided by the calling context
            conversionDate: asOf,
            preRoundFullyDiluted: preRoundFD
          });
          sharesFromConversion = conversionResult.sharesIssued;
        }
        
        const current = stakeholderShares.get(convertible.holderId) || 0;
        stakeholderShares.set(convertible.holderId, current + sharesFromConversion);
        fullyDilutedShares += sharesFromConversion;
        console.log(`💰 [COMPUTE] Added ${sharesFromConversion} shares from conversion to ${convertible.holderId}`);
      } else if (convertible.issueDate <= asOf) {
        console.log(`⏳ [COMPUTE] ${convertible.type} issued but not yet converted as of ${asOf.toISOString().split('T')[0]}`);
      } else {
        console.log(`❌ [COMPUTE] ${convertible.type} not yet issued as of ${asOf.toISOString().split('T')[0]}`);
      }
    }
  }
  
  // Add equity awards if FullyDiluted
  if (view === 'FullyDiluted') {
    fullyDilutedShares += outstandingOptions;
    
    // Add options to stakeholder counts
    for (const award of equityAwards) {
      if (award.grantDate <= asOf) {
        const outstanding = award.quantityGranted - award.quantityExercised - award.quantityCanceled - award.quantityExpired;
        if (outstanding > 0) {
          const current = stakeholderShares.get(award.holderId) || 0;
          stakeholderShares.set(award.holderId, current + outstanding);
        }
      }
    }
    
    // Handle RSUs based on fdOptions
    if (fdOptions.includeRSUs !== 'none') {
      let rsuShares = 0;
      if (fdOptions.includeRSUs === 'granted') {
        rsuShares = calculateGrantedRSUs(equityAwards);
      } else if (fdOptions.includeRSUs === 'vested') {
        rsuShares = calculateVestedRSUs(equityAwards, asOf);
      }
      fullyDilutedShares += rsuShares;
      
      // Add RSUs to stakeholder counts
      for (const award of equityAwards.filter(a => a.type === 'RSU')) {
        if (award.grantDate <= asOf) {
          let rsuCount = 0;
          if (fdOptions.includeRSUs === 'granted') {
            rsuCount = award.quantityGranted - award.quantityCanceled; // Remove quantityExercised for RSUs
          } else if (fdOptions.includeRSUs === 'vested') {
            rsuCount = calculateVestedRSUs([award], asOf);
          }
          
          if (rsuCount > 0) {
            const current = stakeholderShares.get(award.holderId) || 0;
            stakeholderShares.set(award.holderId, current + rsuCount);
          }
        }
      }
    }
    
    // Add unallocated pool if requested (don't add as separate holder)
    if (fdOptions.includeUnallocatedPool) {
      fullyDilutedShares += unallocatedPool;
    }
  }
  
  // Create entries for each stakeholder
  for (const [holderId, shares] of Array.from(stakeholderShares.entries())) {
    if (shares > 0) {
      const stakeholder = stakeholders.get(holderId);
      const securityClass = stakeholderClasses.get(holderId) || 'Unknown';
      
      // Calculate investment value from share ledger entries
      const holderShareEntries = shareEntries.filter(entry => entry.holderId === holderId);
      const totalInvestment = holderShareEntries.reduce((sum, entry) => {
        return sum + (entry.consideration ? Number(entry.consideration) : 0);
      }, 0);

      entries.push({
        holderId,
        holderName: stakeholder?.name || 'Unknown',
        securityClass,
        shares: roundShares(shares),
        ownership: calculatePercentage(shares, view === 'FullyDiluted' ? fullyDilutedShares : totalShares),
        value: totalInvestment
      });
    }
  }
  
  // Sort entries by ownership percentage (descending)
  entries.sort((a, b) => b.ownership - a.ownership);
  
  return {
    entries,
    totalShares: roundShares(totalShares),
    totalValue: 0, // Would calculate based on valuation
    fullyDilutedShares: view === 'FullyDiluted' ? roundShares(fullyDilutedShares) : undefined
  };
}

export function validateNoDuplicateCounting(
  result: CapTableResult,
  unallocatedPool: number,
  outstandingAwards: number
): boolean {
  const totalCalculated = result.entries.reduce((sum, entry) => sum + entry.shares, 0);
  const expectedMax = (result.fullyDilutedShares || result.totalShares);
  
  // Allow for minor rounding differences
  return Math.abs(totalCalculated - expectedMax) < 0.000001;
}

export function calculateAntiDilution(
  originalPrice: number,
  newPrice: number,
  outstandingShares: number,
  newShares: number,
  type: 'full-ratchet' | 'broad-based',
  includeOptions: boolean = false,
  includePool: boolean = false,
  optionsOutstanding: number = 0,
  poolSize: number = 0
): number {
  
  if (type === 'full-ratchet') {
    return newPrice;
  }
  
  // Broad-based weighted average
  let baseShares = outstandingShares;
  
  if (includeOptions) {
    baseShares += optionsOutstanding;
  }
  
  if (includePool) {
    baseShares += poolSize;
  }
  
  const consideration = newShares * newPrice;
  const equivalentShares = consideration / originalPrice;
  
  return originalPrice * (baseShares + equivalentShares) / (baseShares + newShares);
}

