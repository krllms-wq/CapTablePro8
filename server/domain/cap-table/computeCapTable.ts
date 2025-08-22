/**
 * Deterministic server-side cap table computation with stable inputs/outputs
 */
import { storage } from "../../storage";
import type { Stakeholder, SecurityClass, ShareLedgerEntry, EquityAward, ConvertibleInstrument, Round } from "@shared/schema";

export type CapTableView = 'OUTSTANDING' | 'FULLY_DILUTED';
export type RSUInclusionPolicy = 'none' | 'granted' | 'vested';

export interface CapTableParams {
  companyId: string;
  asOf?: string; // YYYY-MM-DD date-only UTC
  view: CapTableView;
  rsuPolicy?: RSUInclusionPolicy;
}

export interface CapTableRow {
  stakeholderId: string;
  stakeholderName: string;
  securityClass: string;
  sharesOutstanding: number;
  sharesFD: number;
  pctOutstanding: number;
  pctFD: number;
  value?: number;
  costBasis?: number;
  badges?: string[];
}

export interface CapTableTotals {
  outstandingShares: number;
  fullyDilutedShares: number;
  optionPoolAvailable: number;
  pricePerShare?: number;
  currentValuation?: number;
}

export interface CapTableResult {
  totals: CapTableTotals;
  rows: CapTableRow[];
  meta: {
    rules: {
      includeUnallocatedPoolInDenominator: boolean;
      rsuPolicy: RSUInclusionPolicy;
    };
  };
}

/**
 * Pure function to compute cap table with deterministic results
 */
export async function computeCapTable(params: CapTableParams): Promise<CapTableResult> {
  const { companyId, asOf, view, rsuPolicy = 'granted' } = params;
  const asOfDate = asOf ? new Date(asOf + 'T23:59:59.999Z') : new Date();

  // Fetch all data needed for computation
  const [
    stakeholders,
    securityClasses,
    shareLedger,
    equityAwards,
    convertibles,
    rounds
  ] = await Promise.all([
    storage.getStakeholders(companyId),
    storage.getSecurityClasses(companyId),
    storage.getShareLedgerEntries(companyId),
    storage.getEquityAwards(companyId),
    storage.getConvertibleInstruments(companyId),
    storage.getRounds(companyId)
  ]);

  // Filter data by asOf date
  const filteredShareLedger = shareLedger.filter(entry => 
    new Date(entry.issueDate) <= asOfDate
  );
  const filteredEquityAwards = equityAwards.filter(award => 
    new Date(award.grantDate) <= asOfDate
  );
  const filteredConvertibles = convertibles.filter(convertible => 
    new Date(convertible.issueDate) <= asOfDate
  );
  const filteredRounds = rounds.filter(round => 
    round.closeDate && new Date(round.closeDate) <= asOfDate
  );

  // Calculate price per share and valuation from latest round
  const pricedRounds = filteredRounds
    .filter(round => round.pricePerShare && parseFloat(round.pricePerShare) > 0)
    .sort((a, b) => new Date(b.closeDate!).getTime() - new Date(a.closeDate!).getTime());
  
  const latestRound = pricedRounds[0];
  const pricePerShare = latestRound ? parseFloat(latestRound.pricePerShare!) : undefined;

  // Calculate outstanding shares by stakeholder and security class
  const outstandingMap = new Map<string, Map<string, number>>();
  
  filteredShareLedger.forEach(entry => {
    const stakeholderMap = outstandingMap.get(entry.holderId) || new Map();
    const currentShares = stakeholderMap.get(entry.classId) || 0;
    stakeholderMap.set(entry.classId, currentShares + entry.quantity);
    outstandingMap.set(entry.holderId, stakeholderMap);
  });

  // Calculate total outstanding shares
  const totalOutstandingShares = filteredShareLedger.reduce((sum, entry) => sum + entry.quantity, 0);

  // Calculate option pool data
  const totalOptionsGranted = filteredEquityAwards.reduce((sum, award) => {
    const outstanding = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
    return sum + Math.max(0, outstanding);
  }, 0);

  // Define option pool size (10M default, could be configurable)
  const optionPoolSize = 10000000;
  const optionPoolAvailable = Math.max(0, optionPoolSize - totalOptionsGranted);

  // Calculate RSU inclusion based on policy
  const includeRSUs = rsuPolicy !== 'none';
  const rsuShares = includeRSUs ? filteredEquityAwards
    .filter(award => award.type === 'RSU')
    .reduce((sum, award) => {
      if (rsuPolicy === 'granted') {
        return sum + (award.quantityGranted - award.quantityExercised - award.quantityCanceled);
      } else if (rsuPolicy === 'vested') {
        const vestedQuantity = calculateVestedQuantity(award, asOfDate);
        return sum + (vestedQuantity - award.quantityExercised - award.quantityCanceled);
      }
      return sum;
    }, 0) : 0;

  // Calculate convertible shares (as-converted for FD view)
  const convertibleShares = view === 'FULLY_DILUTED' ? 
    calculateConvertibleShares(filteredConvertibles, pricePerShare) : 0;

  // Calculate totals based on view
  const fullyDilutedShares = totalOutstandingShares + totalOptionsGranted + rsuShares + convertibleShares + optionPoolAvailable;
  const currentValuation = pricePerShare ? pricePerShare * totalOutstandingShares : undefined;

  // Build rows for each stakeholder-security class combination
  const rows: CapTableRow[] = [];
  const stakeholderMap = new Map(stakeholders.map(s => [s.id, s]));
  const securityClassMap = new Map(securityClasses.map(sc => [sc.id, sc]));

  outstandingMap.forEach((securityClassMap_local, stakeholderId) => {
    const stakeholder = stakeholderMap.get(stakeholderId);
    if (!stakeholder) return;

    securityClassMap_local.forEach((shares, classId) => {
      if (shares <= 0) return;

      const securityClass = securityClassMap.get(classId);
      const className = securityClass?.name || 'Unknown';
      
      // Calculate FD shares for this stakeholder (includes their options/RSUs)
      const stakeholderOptions = filteredEquityAwards
        .filter(award => award.holderId === stakeholderId)
        .reduce((sum, award) => {
          const outstanding = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
          return sum + Math.max(0, outstanding);
        }, 0);

      const stakeholderRSUs = rsuPolicy !== 'none' ? filteredEquityAwards
        .filter(award => award.holderId === stakeholderId && award.type === 'RSU')
        .reduce((sum, award) => {
          if (rsuPolicy === 'granted') {
            return sum + (award.quantityGranted - award.quantityExercised - award.quantityCanceled);
          } else if (rsuPolicy === 'vested') {
            const vestedQuantity = calculateVestedQuantity(award, asOfDate);
            return sum + (vestedQuantity - award.quantityExercised - award.quantityCanceled);
          }
          return sum;
        }, 0) : 0;

      const stakeholderConvertibles = view === 'FULLY_DILUTED' ?
        calculateStakeholderConvertibleShares(filteredConvertibles, stakeholderId, pricePerShare) : 0;

      const sharesFD = shares + stakeholderOptions + stakeholderRSUs + stakeholderConvertibles;
      
      const pctOutstanding = totalOutstandingShares > 0 ? (shares / totalOutstandingShares) * 100 : 0;
      const pctFD = fullyDilutedShares > 0 ? (sharesFD / fullyDilutedShares) * 100 : 0;

      const value = pricePerShare ? shares * pricePerShare : undefined;
      
      // Calculate cost basis from share ledger
      const costBasis = filteredShareLedger
        .filter(entry => entry.holderId === stakeholderId && entry.classId === classId)
        .reduce((sum, entry) => sum + (entry.consideration || 0), 0);

      const badges: string[] = [];
      if (stakeholderOptions > 0) badges.push('Options');
      if (stakeholderRSUs > 0) badges.push('RSUs');
      if (stakeholderConvertibles > 0) badges.push('Convertibles');

      rows.push({
        stakeholderId,
        stakeholderName: stakeholder.name,
        securityClass: className,
        sharesOutstanding: shares,
        sharesFD,
        pctOutstanding: Math.round(pctOutstanding * 100) / 100, // 2 decimal places
        pctFD: Math.round(pctFD * 100) / 100, // 2 decimal places
        value,
        costBasis: costBasis > 0 ? costBasis : undefined,
        badges: badges.length > 0 ? badges : undefined
      });
    });
  });

  // Sort rows by percentage ownership (descending)
  rows.sort((a, b) => b.pctFD - a.pctFD);

  return {
    totals: {
      outstandingShares: totalOutstandingShares,
      fullyDilutedShares,
      optionPoolAvailable,
      pricePerShare,
      currentValuation
    },
    rows,
    meta: {
      rules: {
        includeUnallocatedPoolInDenominator: true,
        rsuPolicy
      }
    }
  };
}

function calculateVestedQuantity(award: EquityAward, asOfDate: Date): number {
  if (!award.vestingStartDate) return 0;
  
  const vestingStart = new Date(award.vestingStartDate);
  const monthsElapsed = Math.max(0, 
    (asOfDate.getTime() - vestingStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  
  // For RSUs, assume 12 months cliff and 48 months vesting by default
  const cliffMonths = 12;
  const vestingPeriodMonths = 48;
  
  if (monthsElapsed < cliffMonths) return 0;
  
  const vestingProgress = Math.min(1, monthsElapsed / vestingPeriodMonths);
  return Math.floor(award.quantityGranted * vestingProgress);
}

function calculateConvertibleShares(convertibles: ConvertibleInstrument[], pricePerShare?: number): number {
  if (!pricePerShare) return 0;
  
  return convertibles.reduce((sum, convertible) => {
    if (!convertible.principal) return sum;
    
    const principal = typeof convertible.principal === 'string' ? parseFloat(convertible.principal) : convertible.principal;
    let conversionPrice = pricePerShare;
    
    // Apply discount if SAFE
    if (convertible.type === 'SAFE' || convertible.type === 'safe') {
      if (convertible.discountRate) {
        const discountRate = parseFloat(convertible.discountRate.toString()) / 100;
        conversionPrice = pricePerShare * (1 - discountRate);
      }
    }
    
    // Apply valuation cap if exists
    if (convertible.valuationCap) {
      const capPrice = parseFloat(convertible.valuationCap.toString()) / 10000000; // Assuming 10M shares
      conversionPrice = Math.min(conversionPrice, capPrice);
    }
    
    return sum + Math.floor(principal / conversionPrice);
  }, 0);
}

function calculateStakeholderConvertibleShares(
  convertibles: ConvertibleInstrument[], 
  stakeholderId: string, 
  pricePerShare?: number
): number {
  const stakeholderConvertibles = convertibles.filter(c => c.holderId === stakeholderId);
  return calculateConvertibleShares(stakeholderConvertibles, pricePerShare);
}