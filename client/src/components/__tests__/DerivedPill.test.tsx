// Simple test to verify component structure without test dependencies
import DerivedPill from '../DerivedPill';

describe('DerivedPill Component', () => {
  test('component exports correctly', () => {
    expect(typeof DerivedPill).toBe('function');
  });

  test('component has correct default props structure', () => {
    const defaultProps = {
      label: "Derived",
      variant: "default",
      title: undefined,
      className: "",
      "aria-label": undefined,
    };
    
    // This verifies the component accepts the expected props
    expect(() => DerivedPill(defaultProps)).not.toThrow();
  });

  test('warning variant props structure', () => {
    const warningProps = {
      variant: "warning" as const,
      label: "Divergent",
      title: "Test warning message"
    };
    
    // This verifies the component accepts warning variant props
    expect(() => DerivedPill(warningProps)).not.toThrow();
  });
});