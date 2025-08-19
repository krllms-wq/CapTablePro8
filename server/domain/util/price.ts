/**
 * Server-side price calculation utilities
 */

/**
 * Computes price per share from consideration and quantity
 * @param consideration - Total consideration amount (must be > 0)
 * @param quantity - Number of shares (must be > 0)
 * @returns Rounded price per share (4 decimal places) or undefined if inputs invalid
 */
export function computePpsFromConsideration(
  consideration?: number, 
  quantity?: number
): number | undefined {
  // Validate inputs - both must be positive numbers
  if (!consideration || !quantity || consideration <= 0 || quantity <= 0) {
    return undefined;
  }
  
  // Calculate price per share
  const pps = consideration / quantity;
  
  // Round to 4 decimal places for consistency with client-side math
  return Math.round(pps * 10000) / 10000;
}

/**
 * Validates and ensures price per share is computed when needed
 * @param data - Request data that may contain consideration, quantity, and pricePerShare
 * @returns Data with pricePerShare computed if missing but derivable
 */
export function ensurePricePerShare<T extends {
  consideration?: number;
  quantity?: number;
  pricePerShare?: number;
}>(data: T): T {
  // If PPS already provided, return as-is
  if (data.pricePerShare !== undefined) {
    return data;
  }
  
  // Try to compute PPS from consideration and quantity
  const computedPps = computePpsFromConsideration(data.consideration, data.quantity);
  
  if (computedPps !== undefined) {
    return {
      ...data,
      pricePerShare: computedPps
    };
  }
  
  return data;
}