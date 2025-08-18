// Cap table calculation utilities

export interface CapTableCalculation {
  totalSharesOutstanding: number;
  fullyDilutedShares: number;
  optionPoolSize: number;
  ownershipPercentages: Record<string, number>;
}

export function calculateCapTable(
  shareEntries: Array<{ holderId: string; quantity: number }>,
  equityAwards: Array<{ holderId: string; quantityGranted: number; quantityExercised: number; quantityCanceled: number }>,
  optionPoolSize: number = 0
): CapTableCalculation {
  // Calculate total shares outstanding (issued shares only)
  const totalSharesOutstanding = shareEntries.reduce((sum, entry) => sum + entry.quantity, 0);

  // Calculate outstanding options
  const totalOptionsOutstanding = equityAwards.reduce((sum, award) => {
    return sum + (award.quantityGranted - award.quantityExercised - award.quantityCanceled);
  }, 0);

  // Calculate fully diluted shares (shares + options + available pool)
  const fullyDilutedShares = totalSharesOutstanding + totalOptionsOutstanding + optionPoolSize;

  // Calculate ownership percentages
  const ownershipPercentages: Record<string, number> = {};

  // Share-based ownership
  shareEntries.forEach(entry => {
    const current = ownershipPercentages[entry.holderId] || 0;
    ownershipPercentages[entry.holderId] = current + (entry.quantity / fullyDilutedShares) * 100;
  });

  // Option-based ownership
  equityAwards.forEach(award => {
    const outstandingOptions = award.quantityGranted - award.quantityExercised - award.quantityCanceled;
    if (outstandingOptions > 0) {
      const current = ownershipPercentages[award.holderId] || 0;
      ownershipPercentages[award.holderId] = current + (outstandingOptions / fullyDilutedShares) * 100;
    }
  });

  return {
    totalSharesOutstanding,
    fullyDilutedShares,
    optionPoolSize,
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
