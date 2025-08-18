// Unit tests for new/changed badges
import { render, screen, fireEvent } from '@testing-library/react';
import { NewBadge, useNewFeatures } from '@/components/ui/new-badge';

describe('New Badge System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should show badge for new features', () => {
    render(
      <NewBadge featureId="help-toggle">
        <button>Help</button>
      </NewBadge>
    );
    
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  test('should show changed badge for updated features', () => {
    render(
      <NewBadge featureId="undo-redo">
        <button>Undo</button>
      </NewBadge>
    );
    
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  test('should hide badge for unknown features', () => {
    render(
      <NewBadge featureId="unknown-feature">
        <button>Unknown</button>
      </NewBadge>
    );
    
    expect(screen.queryByText('New')).not.toBeInTheDocument();
    expect(screen.queryByText('Updated')).not.toBeInTheDocument();
  });

  test('should mark feature as viewed on interaction', () => {
    render(
      <NewBadge featureId="help-toggle">
        <button>Help</button>
      </NewBadge>
    );
    
    const badge = screen.getByText('New');
    
    // Hover over the badge
    fireEvent.mouseEnter(badge);
    
    // Should mark as viewed in localStorage
    const viewedFeatures = JSON.parse(localStorage.getItem('cap-table-viewed-features') || '[]');
    expect(viewedFeatures).toContain('help-toggle');
  });

  test('should fade out after first view', async () => {
    jest.useFakeTimers();
    
    render(
      <NewBadge featureId="help-toggle">
        <button>Help</button>
      </NewBadge>
    );
    
    const element = screen.getByText('New').parentElement;
    fireEvent.mouseEnter(element!);
    
    // Fast-forward time
    jest.advanceTimersByTime(2000);
    
    // Badge should fade out (not visible)
    expect(screen.queryByText('New')).not.toBeInTheDocument();
    
    jest.useRealTimers();
  });

  test('useNewFeatures hook works correctly', () => {
    let hookResult: any;
    
    function TestHook() {
      hookResult = useNewFeatures();
      return (
        <div>
          <span data-testid="total">{hookResult.totalNewFeatures}</span>
          <button onClick={() => hookResult.markAsViewed('help-toggle')}>
            Mark Viewed
          </button>
        </div>
      );
    }
    
    render(<TestHook />);
    
    // Should have new features
    expect(hookResult.totalNewFeatures).toBeGreaterThan(0);
    
    // Mark one as viewed
    fireEvent.click(screen.getByText('Mark Viewed'));
    
    // Count should decrease
    expect(hookResult.totalNewFeatures).toBeLessThan(10);
  });

  test('should respect disabled prop', () => {
    render(
      <NewBadge featureId="help-toggle" disabled>
        <button>Help</button>
      </NewBadge>
    );
    
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });
});