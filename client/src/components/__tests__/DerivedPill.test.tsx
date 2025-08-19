import { render, screen } from '@testing-library/react';
import DerivedPill from '../DerivedPill';

// Mock render function for basic testing without full React Testing Library setup
const mockRender = (element: any) => {
  // Basic structural validation
  return {
    container: element,
    getByRole: (role: string) => ({ getAttribute: () => null, textContent: '' }),
    queryByText: (text: string) => null,
  };
};

describe('DerivedPill Component', () => {
  test('renders with default props', () => {
    const component = DerivedPill({});
    
    // Verify component structure
    expect(component.props.children).toContain('Derived');
    expect(component.props.role).toBe('note');
    expect(component.props['aria-label']).toBe('Derived');
    expect(component.props.className).toContain('bg-gray-100');
    expect(component.props.className).toContain('text-gray-700');
    expect(component.props.className).toContain('border-gray-200');
  });

  test('renders with warning variant', () => {
    const component = DerivedPill({ variant: "warning" });
    
    // Verify warning styles
    expect(component.props.className).toContain('bg-amber-100');
    expect(component.props.className).toContain('text-amber-800');
    expect(component.props.className).toContain('border-amber-200');
    
    // Verify warning glyph is present
    const warningGlyph = component.props.children[0];
    expect(warningGlyph.props.children).toBe('!');
    expect(warningGlyph.props['aria-hidden']).toBe(true);
  });

  test('accepts custom label and title', () => {
    const customTitle = "Calculated from valuation/consideration";
    const customLabel = "Auto-calc";
    
    const component = DerivedPill({ 
      label: customLabel,
      title: customTitle,
      "aria-label": "Custom accessibility label"
    });
    
    expect(component.props.title).toBe(customTitle);
    expect(component.props['aria-label']).toBe("Custom accessibility label");
    expect(component.props.children).toContain(customLabel);
  });

  test('warning variant with custom title shows divergence message', () => {
    const warningTitle = "Valuation vs. consideration PPS differ by ~2.50%";
    
    const component = DerivedPill({
      variant: "warning",
      title: warningTitle,
      label: "Divergent"
    });
    
    expect(component.props.title).toBe(warningTitle);
    expect(component.props.className).toContain('bg-amber-100');
    
    // Verify warning glyph and label
    const warningGlyph = component.props.children[0];
    expect(warningGlyph.props.children).toBe('!');
    expect(component.props.children).toContain('Divergent');
  });

  test('applies custom className', () => {
    const component = DerivedPill({ className: "ml-2 custom-class" });
    
    expect(component.props.className).toContain('ml-2 custom-class');
    expect(component.props.className).toContain('inline-flex');
    expect(component.props.className).toContain('rounded-full');
  });

  test('has proper accessibility attributes', () => {
    const component = DerivedPill({});
    
    expect(component.props.role).toBe('note');
    expect(component.props.className).toContain('select-none');
    expect(component.props['aria-label']).toBe('Derived');
  });
});