// Tests for system info page content
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SystemInfo from '@/pages/system-info';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve())
  }
});

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('System Info Page', () => {
  test('renders all system information sections', () => {
    render(<SystemInfo />);
    
    // Check main sections are present
    expect(screen.getByText('Application')).toBeInTheDocument();
    expect(screen.getByText('Browser')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Feature Flags')).toBeInTheDocument();
  });

  test('displays application version information', () => {
    render(<SystemInfo />);
    
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('Build')).toBeInTheDocument();
    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText('1.1.0')).toBeInTheDocument();
  });

  test('shows feature flags with correct status', () => {
    render(<SystemInfo />);
    
    // Check some feature flags are displayed
    expect(screen.getByText('Enhanced Ui')).toBeInTheDocument();
    expect(screen.getByText('Guided Tour')).toBeInTheDocument();
    expect(screen.getByText('Help Mode')).toBeInTheDocument();
    
    // Check ON/OFF badges
    expect(screen.getAllByText('ON')).toHaveLength(6); // Based on enabled flags
    expect(screen.getAllByText('OFF')).toHaveLength(4); // Based on disabled flags
  });

  test('copy diagnostics button works', async () => {
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText');
    
    render(<SystemInfo />);
    
    const copyButton = screen.getByRole('button', { name: /copy diagnostics/i });
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalled();
    });
    
    const copiedText = writeTextSpy.mock.calls[0][0];
    expect(copiedText).toContain('Cap Table System Diagnostics');
    expect(copiedText).toContain('Version: 1.1.0');
    expect(copiedText).toContain('=== Application ===');
    expect(copiedText).toContain('=== Browser ===');
    expect(copiedText).toContain('=== Feature Flags ===');
  });

  test('displays browser information', () => {
    render(<SystemInfo />);
    
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Cookies')).toBeInTheDocument();
  });

  test('shows system details', () => {
    render(<SystemInfo />);
    
    expect(screen.getByText('Timezone')).toBeInTheDocument();
    expect(screen.getByText('Screen')).toBeInTheDocument();
    expect(screen.getByText('Viewport')).toBeInTheDocument();
    expect(screen.getByText('Pixel Ratio')).toBeInTheDocument();
  });

  test('handles copy failure gracefully', async () => {
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValue(new Error('Copy failed'));
    
    render(<SystemInfo />);
    
    const copyButton = screen.getByRole('button', { name: /copy diagnostics/i });
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalled();
    });
    
    // Should handle error gracefully without crashing
  });
});