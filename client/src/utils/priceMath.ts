/**
 * Centralized Price Math Helper
 * Provides consistent parsing, rounding, and reconciliation for money/shares calculations
 */

export type ReconcileResult = {
  pps?: number;
  source: "valuation" | "consideration" | "override" | "unknown";
  warningDeltaPct?: number;
  hasConflict?: boolean;
  conflictMessage?: string;
};

export type ReconcileValuationResult = {
  valuation?: number;
  source: "pps" | "consideration" | "override" | "unknown";
  warningDeltaPct?: number;
};

export type DerivedPpsSource = {
  pps: number;
  source: "valuation" | "consideration";
};

export type ReconcileOptions = {
  fromValuation?: number;
  fromConsideration?: number;
  overridePps?: number;
  toleranceBps?: number; // basis points (100 = 1%)
};

/**
 * Parse money input loosely - strips spaces, commas, currency symbols
 * @param input - String, number, null, or undefined input
 * @returns Positive number or undefined
 */
export function parseMoneyLoose(input: string | number | null | undefined): number | undefined {
  if (input === null || input === undefined) {
    return undefined;
  }

  if (typeof input === 'number') {
    return input > 0 ? input : undefined;
  }

  if (typeof input === 'string') {
    // Strip spaces, commas, and common currency symbols
    const cleaned = input
      .replace(/\s/g, '') // Remove all whitespace
      .replace(/,/g, '') // Remove commas
      .replace(/[$£€¥₹]/g, '') // Remove common currency symbols
      .trim();

    if (cleaned === '') {
      return undefined;
    }

    const parsed = parseFloat(cleaned);
    return !isNaN(parsed) && parsed > 0 ? parsed : undefined;
  }

  return undefined;
}

/**
 * Parse shares input loosely - allows up to 6 decimals
 * @param input - String, number, null, or undefined input
 * @returns Positive number or undefined
 */
export function parseSharesLoose(input: string | number | null | undefined): number | undefined {
  if (input === null || input === undefined) {
    return undefined;
  }

  if (typeof input === 'number') {
    return input > 0 ? input : undefined;
  }

  if (typeof input === 'string') {
    // Strip spaces and commas, but preserve decimal points
    const cleaned = input
      .replace(/\s/g, '') // Remove all whitespace
      .replace(/,/g, '') // Remove commas
      .trim();

    if (cleaned === '') {
      return undefined;
    }

    const parsed = parseFloat(cleaned);
    return !isNaN(parsed) && parsed > 0 ? parsed : undefined;
  }

  return undefined;
}

/**
 * Round money to specified decimal places using half-up rounding
 * @param n - Number to round
 * @param dp - Decimal places (default 4)
 * @returns Rounded number
 */
export function roundMoney(n: number, dp: number = 4): number {
  const factor = Math.pow(10, dp);
  return Math.round((n + Number.EPSILON) * factor) / factor;
}

/**
 * Round shares to specified decimal places using half-up rounding
 * @param n - Number to round
 * @param dp - Decimal places (default 6)
 * @returns Rounded number
 */
export function roundShares(n: number, dp: number = 6): number {
  const factor = Math.pow(10, dp);
  return Math.round((n + Number.EPSILON) * factor) / factor;
}

/**
 * Derive price-per-share from valuation and pre-round fully diluted shares
 * @param args - Object with valuation and preRoundFD
 * @returns Rounded PPS or undefined
 */
export function derivePpsFromValuation(args: { 
  valuation?: number; 
  preRoundFD?: number; 
}): number | undefined {
  const { valuation, preRoundFD } = args;
  
  if (!valuation || !preRoundFD || valuation <= 0 || preRoundFD <= 0) {
    return undefined;
  }

  return roundMoney(valuation / preRoundFD);
}

/**
 * Derive price-per-share from consideration and quantity
 * @param args - Object with consideration and quantity
 * @returns Rounded PPS or undefined
 */
export function derivePpsFromConsideration(args: { 
  consideration?: number; 
  quantity?: number; 
}): number | undefined {
  const { consideration, quantity } = args;
  
  if (!consideration || !quantity || consideration <= 0 || quantity <= 0) {
    return undefined;
  }

  return roundMoney(consideration / quantity);
}

/**
 * Reconcile price-per-share from multiple sources with conflict detection
 * @param args - Object with potential PPS sources and tolerance
 * @returns ReconcileResult with chosen PPS, source, and warning if applicable
 */
export function reconcilePps(options: ReconcileOptions): ReconcileResult {
  const { fromValuation, fromConsideration, overridePps, toleranceBps = 50 } = options;

  // Override takes precedence
  if (overridePps !== undefined && overridePps > 0) {
    return {
      pps: roundMoney(overridePps),
      source: "override"
    };
  }

  // If both valuation and consideration sources exist
  if (fromValuation !== undefined && fromValuation > 0 && 
      fromConsideration !== undefined && fromConsideration > 0) {
    
    // Calculate divergence percentage
    const avg = (fromValuation + fromConsideration) / 2;
    const delta = Math.abs(fromValuation - fromConsideration);
    const deltaPct = (delta / avg) * 100;
    
    // Use tolerance in basis points (50 bps = 0.50%)
    const tolerancePct = toleranceBps / 100;
    
    const result: ReconcileResult = {
      pps: roundMoney(fromValuation), // Prefer valuation
      source: "valuation"
    };

    if (deltaPct > tolerancePct) {
      result.warningDeltaPct = Math.round(deltaPct * 100) / 100; // Round to 2 decimal places
      result.hasConflict = true;
      result.conflictMessage = `Price mismatch: Valuation suggests $${fromValuation.toFixed(4)}, but consideration/quantity suggests $${fromConsideration.toFixed(4)} (${deltaPct.toFixed(1)}% difference)`;
    }

    return result;
  }

  // Use whichever single source exists
  if (fromValuation !== undefined && fromValuation > 0) {
    return {
      pps: roundMoney(fromValuation),
      source: "valuation"
    };
  }

  if (fromConsideration !== undefined && fromConsideration > 0) {
    return {
      pps: roundMoney(fromConsideration),
      source: "consideration"
    };
  }

  // No valid sources
  return { source: "unknown" };
}

/**
 * Derive valuation from price-per-share and pre-round fully diluted shares
 * @param args - Object with pps and preRoundFD
 * @returns Rounded valuation or undefined
 */
export function deriveValuationFromPps(args: { 
  pps?: number; 
  preRoundFD?: number; 
}): number | undefined {
  const { pps, preRoundFD } = args;
  
  if (!pps || !preRoundFD || pps <= 0 || preRoundFD <= 0) {
    return undefined;
  }

  return roundMoney(pps * preRoundFD);
}

/**
 * Reconcile valuation from multiple sources with conflict detection
 * @param args - Object with potential valuation sources and tolerance
 * @returns ReconcileValuationResult with chosen valuation, source, and warning if applicable
 */
export function reconcileValuation(args: {
  fromPps?: number;                // valuation via pps * preRoundFD
  fromConsiderationPps?: number;   // valuation via (consideration/qty)*preRoundFD
  overrideValuation?: number;
  toleranceBps?: number;           // default 50 (0.50%)
}): ReconcileValuationResult {
  const { fromPps, fromConsiderationPps, overrideValuation, toleranceBps = 50 } = args;

  // Override takes precedence
  if (overrideValuation !== undefined && overrideValuation > 0) {
    return {
      valuation: roundMoney(overrideValuation),
      source: "override"
    };
  }

  // If both sources exist
  if (fromPps !== undefined && fromPps > 0 && 
      fromConsiderationPps !== undefined && fromConsiderationPps > 0) {
    
    // Calculate divergence percentage
    const avg = (fromPps + fromConsiderationPps) / 2;
    const delta = Math.abs(fromPps - fromConsiderationPps);
    const deltaPct = (delta / avg) * 100;
    
    // Use tolerance in basis points (50 bps = 0.50%)
    const tolerancePct = toleranceBps / 100;
    
    const result: ReconcileValuationResult = {
      valuation: roundMoney(fromPps), // Prefer PPS-derived valuation
      source: "pps"
    };

    if (deltaPct > tolerancePct) {
      result.warningDeltaPct = Math.round(deltaPct * 100) / 100; // Round to 2 decimal places
    }

    return result;
  }

  // Use whichever single source exists
  if (fromPps !== undefined && fromPps > 0) {
    return {
      valuation: roundMoney(fromPps),
      source: "pps"
    };
  }

  if (fromConsiderationPps !== undefined && fromConsiderationPps > 0) {
    return {
      valuation: roundMoney(fromConsiderationPps),
      source: "consideration"
    };
  }

  // No valid sources
  return { source: "unknown" };
}

/**
 * Format PPS reconcile result for display
 * @param result - ReconcileResult from reconcilePps
 * @returns Human-readable description
 */
export function formatReconcileResult(result: ReconcileResult): string {
  if (result.source === "override") {
    return "Manual override";
  }
  
  if (result.source === "valuation") {
    if (result.hasConflict) {
      return `From valuation (conflict detected: ${result.warningDeltaPct?.toFixed(1)}% difference)`;
    }
    return result.warningDeltaPct ? `From valuation (${result.warningDeltaPct.toFixed(1)}% variance)` : "From valuation";
  }
  
  if (result.source === "consideration") {
    return "From consideration";
  }
  
  return "Unable to determine";
}