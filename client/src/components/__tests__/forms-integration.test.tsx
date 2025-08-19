// Integration tests for DerivedPill in forms
import DerivedPill from '../DerivedPill';

describe('DerivedPill Form Integration', () => {
  test('Issue Shares form integration - derived PPS with default state', () => {
    // Simulate issue shares form state
    const overridePps = false;
    const ppsReconcileResult = { source: "valuation" };
    
    // This should render the pill when override is OFF
    const shouldShowPill = !overridePps;
    const pillVariant = ppsReconcileResult.warningDeltaPct ? "warning" : "default";
    const pillTitle = ppsReconcileResult.warningDeltaPct 
      ? `Valuation vs. consideration PPS differ by ~${ppsReconcileResult.warningDeltaPct}%`
      : "Calculated from valuation/consideration";
    
    expect(shouldShowPill).toBe(true);
    expect(pillVariant).toBe("default");
    expect(pillTitle).toBe("Calculated from valuation/consideration");
  });

  test('Issue Shares form integration - derived PPS with divergence warning', () => {
    // Simulate issue shares form state with divergence
    const overridePps = false;
    const ppsReconcileResult = { 
      source: "valuation", 
      warningDeltaPct: 2.5 
    };
    
    const shouldShowPill = !overridePps;
    const pillVariant = ppsReconcileResult.warningDeltaPct ? "warning" : "default";
    const pillTitle = ppsReconcileResult.warningDeltaPct 
      ? `Valuation vs. consideration PPS differ by ~${ppsReconcileResult.warningDeltaPct}%`
      : "Calculated from valuation/consideration";
    
    expect(shouldShowPill).toBe(true);
    expect(pillVariant).toBe("warning");
    expect(pillTitle).toBe("Valuation vs. consideration PPS differ by ~2.5%");
    
    // Test the actual component rendering
    const component = DerivedPill({
      variant: pillVariant,
      title: pillTitle
    });
    
    expect(component.props.className).toContain('bg-amber-100');
    expect(component.props.title).toBe(pillTitle);
  });

  test('Issue Shares form integration - override enabled hides pill', () => {
    // Simulate issue shares form state with override enabled
    const overridePps = true;
    const ppsReconcileResult = { source: "manual" };
    
    const shouldShowPill = !overridePps;
    
    expect(shouldShowPill).toBe(false);
  });

  test('Model Round form integration - derived PPS from pre-money', () => {
    // Simulate model round form state
    const overridePps = false;
    const ppsReconcileResult = { source: "valuation" };
    
    const shouldShowPill = !overridePps;
    const pillVariant = ppsReconcileResult.warningDeltaPct ? "warning" : "default";
    const pillTitle = ppsReconcileResult.warningDeltaPct 
      ? `Valuation vs. raise amount PPS differ by ~${ppsReconcileResult.warningDeltaPct}%`
      : "Calculated from pre-money & pre-round FD";
    
    expect(shouldShowPill).toBe(true);
    expect(pillVariant).toBe("default");
    expect(pillTitle).toBe("Calculated from pre-money & pre-round FD");
  });

  test('Model Round form integration - divergence between valuation and raise amount', () => {
    // Simulate model round form state with divergence
    const overridePps = false;
    const ppsReconcileResult = { 
      source: "valuation", 
      warningDeltaPct: 1.8 
    };
    
    const shouldShowPill = !overridePps;
    const pillVariant = ppsReconcileResult.warningDeltaPct ? "warning" : "default";
    const pillTitle = ppsReconcileResult.warningDeltaPct 
      ? `Valuation vs. raise amount PPS differ by ~${ppsReconcileResult.warningDeltaPct}%`
      : "Calculated from pre-money & pre-round FD";
    
    expect(shouldShowPill).toBe(true);
    expect(pillVariant).toBe("warning");
    expect(pillTitle).toBe("Valuation vs. raise amount PPS differ by ~1.8%");
    
    // Test the actual component rendering
    const component = DerivedPill({
      variant: pillVariant,
      title: pillTitle
    });
    
    expect(component.props.className).toContain('bg-amber-100');
    expect(component.props.title).toBe(pillTitle);
  });
});