// Unit tests for help toggle functionality
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpProvider, HelpLabel, HelpToggle, useHelp } from '@/components/ui/help-toggle';

// Mock component to test useHelp hook
function TestComponent() {
  const { isHelpActive, toggleHelp } = useHelp();
  return (
    <div>
      <span data-testid="help-status">{isHelpActive ? 'active' : 'inactive'}</span>
      <button onClick={toggleHelp} data-testid="toggle-help">Toggle</button>
    </div>
  );
}

describe('Help Toggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should start with help mode inactive', () => {
    render(
      <HelpProvider>
        <TestComponent />
      </HelpProvider>
    );
    
    expect(screen.getByTestId('help-status')).toHaveTextContent('inactive');
  });

  test('should toggle help mode', () => {
    render(
      <HelpProvider>
        <TestComponent />
      </HelpProvider>
    );
    
    const toggleButton = screen.getByTestId('toggle-help');
    fireEvent.click(toggleButton);
    
    expect(screen.getByTestId('help-status')).toHaveTextContent('active');
  });

  test('should persist help mode preference', () => {
    const { rerender } = render(
      <HelpProvider>
        <TestComponent />
      </HelpProvider>
    );
    
    // Enable help mode
    fireEvent.click(screen.getByTestId('toggle-help'));
    expect(localStorage.getItem('cap-table-help-mode')).toBe('true');
    
    // Rerender component and check state is restored
    rerender(
      <HelpProvider>
        <TestComponent />
      </HelpProvider>
    );
    
    expect(screen.getByTestId('help-status')).toHaveTextContent('active');
  });

  test('should show tooltip on label click when help active', () => {
    render(
      <HelpProvider>
        <HelpToggle />
        <HelpLabel helpText="This is help text">Test Label</HelpLabel>
      </HelpProvider>
    );
    
    // Enable help mode
    fireEvent.click(screen.getByRole('button', { name: /help mode/i }));
    
    // Click the label
    const label = screen.getByText('Test Label');
    fireEvent.click(label);
    
    // Should show tooltip
    expect(screen.getByText('This is help text')).toBeInTheDocument();
  });

  test('should support keyboard navigation', () => {
    render(
      <HelpProvider>
        <HelpToggle />
        <HelpLabel helpText="Keyboard help">Test Label</HelpLabel>
      </HelpProvider>
    );
    
    // Enable help mode
    fireEvent.click(screen.getByRole('button', { name: /help mode/i }));
    
    // Focus and press Enter on label
    const label = screen.getByText('Test Label');
    fireEvent.keyDown(label, { key: 'Enter' });
    
    expect(screen.getByText('Keyboard help')).toBeInTheDocument();
  });
});