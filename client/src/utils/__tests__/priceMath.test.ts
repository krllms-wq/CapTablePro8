/**
 * Tests for Price Math Helper utilities
 */

import {
  parseMoneyLoose,
  parseSharesLoose,
  roundMoney,
  roundShares,
  derivePpsFromValuation,
  derivePpsFromConsideration,
  deriveValuationFromPps,
  reconcilePps,
  reconcileValuation,
  formatReconcileResult
} from '../priceMath';

describe('priceMath utilities', () => {
  
  describe('deriveValuationFromPps', () => {
    it('should calculate valuation from PPS and pre-round FD shares', () => {
      expect(deriveValuationFromPps({ pps: 1, preRoundFD: 10_000_000 })).toBe(10_000_000);
      expect(deriveValuationFromPps({ pps: 0.5, preRoundFD: 20_000_000 })).toBe(10_000_000);
      expect(deriveValuationFromPps({ pps: 2.5, preRoundFD: 4_000_000 })).toBe(10_000_000);
    });

    it('should return undefined for invalid inputs', () => {
      expect(deriveValuationFromPps({ pps: 0, preRoundFD: 10_000_000 })).toBeUndefined();
      expect(deriveValuationFromPps({ pps: 1, preRoundFD: 0 })).toBeUndefined();
      expect(deriveValuationFromPps({ pps: undefined, preRoundFD: 10_000_000 })).toBeUndefined();
      expect(deriveValuationFromPps({ pps: 1, preRoundFD: undefined })).toBeUndefined();
    });

    it('should handle decimal precision correctly', () => {
      expect(deriveValuationFromPps({ pps: 0.1234, preRoundFD: 1_000_000 })).toBe(123400);
      expect(deriveValuationFromPps({ pps: 1.5678, preRoundFD: 2_000_000 })).toBe(3135600);
    });
  });

  describe('reconcileValuation', () => {
    it('should prefer override valuation when provided', () => {
      const result = reconcileValuation({
        fromPps: 10_000_000,
        fromConsiderationPps: 9_500_000,
        overrideValuation: 12_000_000,
        toleranceBps: 50
      });

      expect(result.valuation).toBe(12_000_000);
      expect(result.source).toBe('override');
      expect(result.warningDeltaPct).toBeUndefined();
    });

    it('should prefer PPS-derived valuation when both sources exist', () => {
      const result = reconcileValuation({
        fromPps: 10_000_000,
        fromConsiderationPps: 9_500_000,
        toleranceBps: 50
      });

      expect(result.valuation).toBe(10_000_000);
      expect(result.source).toBe('pps');
    });

    it('should warn when PPS vs consideration diverge beyond tolerance', () => {
      // 10M vs 9M = ~10.5% difference, well above 0.5% tolerance
      const result = reconcileValuation({
        fromPps: 10_000_000,
        fromConsiderationPps: 9_000_000,
        toleranceBps: 50
      });

      expect(result.valuation).toBe(10_000_000);
      expect(result.source).toBe('pps');
      expect(result.warningDeltaPct).toBeCloseTo(10.53, 1);
    });

    it('should not warn when difference is within tolerance', () => {
      // 10M vs 9.99M = ~0.1% difference, within 0.5% tolerance
      const result = reconcileValuation({
        fromPps: 10_000_000,
        fromConsiderationPps: 9_990_000,
        toleranceBps: 50
      });

      expect(result.valuation).toBe(10_000_000);
      expect(result.source).toBe('pps');
      expect(result.warningDeltaPct).toBeUndefined();
    });

    it('should use single source when only one is available', () => {
      const ppsResult = reconcileValuation({
        fromPps: 10_000_000,
        toleranceBps: 50
      });
      expect(ppsResult.valuation).toBe(10_000_000);
      expect(ppsResult.source).toBe('pps');

      const consResult = reconcileValuation({
        fromConsiderationPps: 9_500_000,
        toleranceBps: 50
      });
      expect(consResult.valuation).toBe(9_500_000);
      expect(consResult.source).toBe('consideration');
    });

    it('should return unknown source when no valid sources', () => {
      const result = reconcileValuation({
        toleranceBps: 50
      });

      expect(result.valuation).toBeUndefined();
      expect(result.source).toBe('unknown');
      expect(result.warningDeltaPct).toBeUndefined();
    });

    it('should handle custom tolerance levels', () => {
      // 10M vs 9.8M = ~2% difference
      const strictResult = reconcileValuation({
        fromPps: 10_000_000,
        fromConsiderationPps: 9_800_000,
        toleranceBps: 100 // 1%
      });
      expect(strictResult.warningDeltaPct).toBeCloseTo(2.02, 1);

      const lenientResult = reconcileValuation({
        fromPps: 10_000_000,
        fromConsiderationPps: 9_800_000,
        toleranceBps: 300 // 3%
      });
      expect(lenientResult.warningDeltaPct).toBeUndefined();
    });
  });

  describe('integration with existing PPS functions', () => {
    it('should work correctly with existing derivePpsFromValuation', () => {
      const pps = derivePpsFromValuation({ valuation: 10_000_000, preRoundFD: 5_000_000 });
      expect(pps).toBe(2);

      const backToValuation = deriveValuationFromPps({ pps, preRoundFD: 5_000_000 });
      expect(backToValuation).toBe(10_000_000);
    });

    it('should work correctly with derivePpsFromConsideration', () => {
      const pps = derivePpsFromConsideration({ consideration: 50_000, quantity: 25_000 });
      expect(pps).toBe(2);

      const valuation = deriveValuationFromPps({ pps, preRoundFD: 5_000_000 });
      expect(valuation).toBe(10_000_000);
    });
  });

  describe('existing functionality preserved', () => {
    it('should maintain existing parseMoneyLoose behavior', () => {
      expect(parseMoneyLoose('$1,234.56')).toBe(1234.56);
      expect(parseMoneyLoose('1,000')).toBe(1000);
      expect(parseMoneyLoose('')).toBeUndefined();
    });

    it('should maintain existing reconcilePps behavior', () => {
      const result = reconcilePps({
        fromValuation: 2,
        fromConsideration: 1.9,
        toleranceBps: 50
      });
      expect(result.pps).toBe(2);
      expect(result.source).toBe('valuation');
      expect(result.warningDeltaPct).toBeCloseTo(5.13, 1);
    });
  });
});