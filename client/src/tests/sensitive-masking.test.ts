// Unit tests for sensitive field masking
import { render, screen, fireEvent } from '@testing-library/react';
import { SensitiveField, SensitiveToggle, useSensitiveFields } from '@/components/ui/help-toggle';

// Mock component to test masking behavior
function TestSensitiveComponent() {
  return (
    <div>
      <SensitiveToggle />
      <SensitiveField>$1,000,000</SensitiveField>
      <SensitiveField fallback="***">Sensitive Data</SensitiveField>
    </div>
  );
}

describe('Sensitive Field Masking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should mask sensitive fields by default', () => {
    render(<TestSensitiveComponent />);
    
    // Should show masked values by default
    expect(screen.getByText('●●●●●')).toBeInTheDocument();
    expect(screen.getByText('***')).toBeInTheDocument();
    
    // Should not show actual values
    expect(screen.queryByText('$1,000,000')).not.toBeInTheDocument();
    expect(screen.queryByText('Sensitive Data')).not.toBeInTheDocument();
  });

  test('should toggle masking on button click', () => {
    render(<TestSensitiveComponent />);
    
    // Click toggle button
    const toggleButton = screen.getByRole('button', { name: /show values/i });
    fireEvent.click(toggleButton);
    
    // Should now show actual values
    expect(screen.getByText('$1,000,000')).toBeInTheDocument();
    expect(screen.getByText('Sensitive Data')).toBeInTheDocument();
    
    // Should not show masked values
    expect(screen.queryByText('●●●●●')).not.toBeInTheDocument();
    expect(screen.queryByText('***')).not.toBeInTheDocument();
  });

  test('should persist masking preference', () => {
    const { rerender } = render(<TestSensitiveComponent />);
    
    // Toggle to show values
    fireEvent.click(screen.getByRole('button', { name: /show values/i }));
    expect(localStorage.getItem('cap-table-mask-sensitive')).toBe('false');
    
    // Rerender and check state is restored
    rerender(<TestSensitiveComponent />);
    expect(screen.getByText('$1,000,000')).toBeInTheDocument();
  });

  test('should update button text based on state', () => {
    render(<TestSensitiveComponent />);
    
    // Initially should show "Show Values"
    expect(screen.getByRole('button', { name: /show values/i })).toBeInTheDocument();
    
    // After clicking, should show "Hide Values"
    fireEvent.click(screen.getByRole('button', { name: /show values/i }));
    expect(screen.getByRole('button', { name: /hide values/i })).toBeInTheDocument();
  });

  test('useSensitiveFields hook works correctly', () => {
    let hookResult: any;
    
    function TestHook() {
      hookResult = useSensitiveFields();
      return null;
    }
    
    render(<TestHook />);
    
    // Should start masked
    expect(hookResult.isMasked).toBe(true);
    
    // Toggle masking
    hookResult.toggleMasking();
    
    // Re-render to get updated hook result
    render(<TestHook />);
    expect(hookResult.isMasked).toBe(false);
  });
});