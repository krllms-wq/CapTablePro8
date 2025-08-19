// Cap table calculation utilities

export interface CapTableCalculation {
  totalSharesOutstanding: number;
  fullyDilutedShares: number;
  optionPoolSize: number;
  ownershipPercentages: Record<string, number>;
}

export function calculateCapTable(
  shareEntries: Array<{ holderId: string; quantity: number }>,
  equityAwards: Array<{ holderId: string; quantityGranted: number; quantityExercised: number; quantityCanceled: number; type?: string }>,
  optionPoolSize: number = 0,
  rsuInclusionMode: 'none' | 'granted' | 'vested' = 'granted'
): CapTableCalculation {
  // Calculate total shares outstanding (issued shares only)
  const totalSharesOutstanding = shareEntries.reduce((sum, entry) => sum + entry.quantity, 0);

  // Calculate outstanding options and RSUs based on type and inclusion mode
  const totalOptionsOutstanding = equityAwards.reduce((sum, award) => {
    const outstanding = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
    
    // Handle RSUs based on inclusion mode
    if (award.type === 'RSU') {
      if (rsuInclusionMode === 'none') return sum;
      if (rsuInclusionMode === 'granted') return sum + outstanding;
      if (rsuInclusionMode === 'vested') {
        // For vested RSUs, would need vesting calculation logic here
        // For now, assume all granted RSUs are included
        return sum + outstanding;
      }
    }
    
    // Include all non-RSU equity awards (options, warrants, etc.)
    return sum + outstanding;
  }, 0);

  // Calculate fully diluted shares 
  // Note: Only add unallocated pool to denominator, never as a holder to prevent double counting
  const unallocatedPool = Math.max(0, optionPoolSize - totalOptionsOutstanding);
  const fullyDilutedShares = totalSharesOutstanding + totalOptionsOutstanding + unallocatedPool;

  // Calculate ownership percentages - prevent double counting
  const ownershipPercentages: Record<string, number> = {};

  // Share-based ownership (As-Issued shares)
  shareEntries.forEach(entry => {
    if (entry.quantity > 0) {
      const current = ownershipPercentages[entry.holderId] || 0;
      ownershipPercentages[entry.holderId] = current + (entry.quantity / fullyDilutedShares) * 100;
    }
  });

  // Equity award-based ownership (options, RSUs based on inclusion mode)
  equityAwards.forEach(award => {
    const outstanding = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
    
    // Skip if no outstanding awards
    if (outstanding <= 0) return;
    
    // Handle RSUs based on inclusion mode
    if (award.type === 'RSU' && rsuInclusionMode === 'none') return;
    
    const current = ownershipPercentages[award.holderId] || 0;
    ownershipPercentages[award.holderId] = current + (outstanding / fullyDilutedShares) * 100;
  });

  return {
    totalSharesOutstanding,
    fullyDilutedShares,
    optionPoolSize: unallocatedPool, // Return only unallocated portion
    ownershipPercentages,
  };
}

export function calculateVestedShares(
  grantDate: Date,
  vestingStartDate: Date,
  cliffMonths: number,
  totalMonths: number,
  quantityGranted: number,
  asOfDate: Date = new Date()
): { vestedShares: number; unvestedShares: number; percentVested: number } {
  const monthsElapsed = Math.floor(
    (asOfDate.getTime() - vestingStartDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
  );

  if (monthsElapsed < cliffMonths) {
    // Before cliff - no shares vested
    return {
      vestedShares: 0,
      unvestedShares: quantityGranted,
      percentVested: 0,
    };
  }

  if (monthsElapsed >= totalMonths) {
    // Fully vested
    return {
      vestedShares: quantityGranted,
      unvestedShares: 0,
      percentVested: 100,
    };
  }

  // Linear vesting after cliff
  const vestedShares = Math.floor((monthsElapsed / totalMonths) * quantityGranted);
  const unvestedShares = quantityGranted - vestedShares;
  const percentVested = (vestedShares / quantityGranted) * 100;

  return {
    vestedShares,
    unvestedShares,
    percentVested,
  };
}

export function calculateAntiDilution(
  originalPrice: number,
  newPrice: number,
  originalShares: number,
  newShares: number,
  type: "broad-based" | "narrow-based" | "full-ratchet"
): number {
  if (type === "full-ratchet") {
    return newPrice;
  }

  // Weighted average (broad-based or narrow-based)
  const a = originalShares;
  const b = (originalShares * originalPrice) / originalPrice; // consideration received / original price
  const c = newShares;

  return originalPrice * ((a + b) / (a + c));
}

export function calculateWaterfall(
  liquidationValue: number,
  sharesByClass: Record<string, { shares: number; liquidationPreference: number; participating: boolean; seniorityTier: number }>,
  pricePerShare: number
): Record<string, { liquidationProceeds: number; asConvertedValue: number; optimalValue: number }> {
  const results: Record<string, { liquidationProceeds: number; asConvertedValue: number; optimalValue: number }> = {};

  // Sort classes by seniority (higher tier = more senior)
  const classEntries = Object.entries(sharesByClass).sort(
    (a, b) => b[1].seniorityTier - a[1].seniorityTier
  );

  let remainingValue = liquidationValue;

  // First pass: liquidation preferences by seniority
  classEntries.forEach(([className, classData]) => {
    const preferenceAmount = classData.shares * classData.liquidationPreference * pricePerShare;
    const liquidationProceeds = Math.min(preferenceAmount, remainingValue);
    remainingValue -= liquidationProceeds;

    results[className] = {
      liquidationProceeds,
      asConvertedValue: classData.shares * pricePerShare,
      optimalValue: 0, // Will be calculated below
    };
  });

  // Second pass: participation rights (if any remaining value)
  if (remainingValue > 0) {
    const totalParticipatingShares = classEntries.reduce((sum, [, classData]) => {
      return sum + (classData.participating ? classData.shares : 0);
    }, 0);

    if (totalParticipatingShares > 0) {
      classEntries.forEach(([className, classData]) => {
        if (classData.participating) {
          const participationAmount = (classData.shares / totalParticipatingShares) * remainingValue;
          results[className].liquidationProceeds += participationAmount;
        }
      });
    }
  }

  // Calculate optimal value (greater of liquidation proceeds or as-converted)
  Object.keys(results).forEach(className => {
    const result = results[className];
    result.optimalValue = Math.max(result.liquidationProceeds, result.asConvertedValue);
  });

  return results;
}
