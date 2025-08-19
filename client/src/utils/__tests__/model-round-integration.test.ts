import { 
  parseMoneyLoose, 
  derivePpsFromValuation,
  reconcilePps 
} from '../priceMath';

describe('Model Round Price Math Integration', () => {
  describe('Pre-money valuation to PPS derivation', () => {
    test('should derive correct PPS from pre-money valuation', () => {
      const preMoney = 20_000_000;
      const preRoundFD = 10_000_000;
      
      const result = derivePpsFromValuation({ 
        valuation: preMoney, 
        preRoundFD 
      });
      
      expect(result).toEqual({
        pps: 2.0,
        source: 'valuation'
      });
    });

    test('should handle string inputs through parseMoneyLoose', () => {
      const preMoneyStr = "20,000,000";
      const preMoney = parseMoneyLoose(preMoneyStr);
      const preRoundFD = 10_000_000;
      
      const result = derivePpsFromValuation({ 
        valuation: preMoney, 
        preRoundFD 
      });
      
      expect(result).toEqual({
        pps: 2.0,
        source: 'valuation'
      });
    });

    test('should reconcile PPS sources without warnings when aligned', () => {
      const fromValuation = { pps: 2.0, source: 'valuation' as const };
      const fromConsideration = { pps: 2.0, source: 'consideration' as const };
      
      const result = reconcilePps({
        fromValuation,
        fromConsideration,
        toleranceBps: 50
      });
      
      expect(result.pps).toBe(2.0);
      expect(result.source).toBe('valuation');
      expect(result.warningDeltaPct).toBeUndefined();
    });

    test('should show divergence warning when PPS sources differ', () => {
      const fromValuation = { pps: 2.0, source: 'valuation' as const };
      const fromConsideration = { pps: 2.05, source: 'consideration' as const };
      
      const result = reconcilePps({
        fromValuation,
        fromConsideration,
        toleranceBps: 50 // 0.5% tolerance
      });
      
      expect(result.pps).toBe(2.0); // Should use valuation
      expect(result.warningDeltaPct).toBe('2.5'); // 2.5% difference
    });
  });

  describe('Override functionality', () => {
    test('should use override PPS when provided', () => {
      const fromValuation = { pps: 2.0, source: 'valuation' as const };
      const overridePps = 2.25;
      
      const result = reconcilePps({
        fromValuation,
        overridePps,
        toleranceBps: 50
      });
      
      expect(result.pps).toBe(2.25);
      expect(result.source).toBe('override');
    });

    test('should warn when override differs from derived values', () => {
      const fromValuation = { pps: 2.0, source: 'valuation' as const };
      const overridePps = 3.0; // 50% higher
      
      const result = reconcilePps({
        fromValuation,
        overridePps,
        toleranceBps: 50 // 0.5% tolerance
      });
      
      expect(result.pps).toBe(3.0);
      expect(result.source).toBe('override');
      expect(result.warningDeltaPct).toBe('50.0'); // 50% difference
    });
  });
});