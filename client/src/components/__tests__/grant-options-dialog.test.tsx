/**
 * Grant Options Dialog Tests
 * Tests RSU-specific client-side validation and UI behavior
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GrantOptionsDialog from '../dialogs/grant-options-dialog';

// Mock API requests
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn(),
  queryClient: {
    invalidateQueries: jest.fn(),
  },
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockStakeholders = [
  { id: 'stakeholder-1', name: 'John Doe', type: 'individual' },
  { id: 'stakeholder-2', name: 'Jane Smith', type: 'individual' },
];

describe('Grant Options Dialog - RSU Handling', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Mock stakeholders query
    queryClient.setQueryData(['/api/companies', 'test-company', 'stakeholders'], mockStakeholders);
  });

  const renderDialog = (props = {}) => {
    const defaultProps = {
      open: true,
      onOpenChange: jest.fn(),
      companyId: 'test-company',
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <GrantOptionsDialog {...defaultProps} />
      </QueryClientProvider>
    );
  };

  test('should hide strike price field when RSU is selected', async () => {
    renderDialog();

    // Select RSU type
    const typeSelect = screen.getByRole('combobox');
    fireEvent.click(typeSelect);
    
    const rsuOption = screen.getByText('RSU');
    fireEvent.click(rsuOption);

    // Strike price field should not be visible
    await waitFor(() => {
      expect(screen.queryByText('Strike Price ($) *')).not.toBeInTheDocument();
    });
  });

  test('should show strike price field when stock option is selected', async () => {
    renderDialog();

    // Select ISO type (default might be stock_option)
    const typeSelect = screen.getByRole('combobox');
    fireEvent.click(typeSelect);
    
    const isoOption = screen.getByText('ISO');
    fireEvent.click(isoOption);

    // Strike price field should be visible
    await waitFor(() => {
      expect(screen.getByText('Strike Price ($) *')).toBeInTheDocument();
    });
  });

  test('should validate RSU form without requiring strike price', async () => {
    renderDialog();

    // Fill out RSU form
    const stakeholderSelect = screen.getByRole('combobox');
    fireEvent.click(stakeholderSelect);
    fireEvent.click(screen.getByText('John Doe'));

    const typeSelect = screen.getAllByRole('combobox')[1];
    fireEvent.click(typeSelect);
    fireEvent.click(screen.getByText('RSU'));

    const quantityInput = screen.getByPlaceholderText('100,000');
    fireEvent.change(quantityInput, { target: { value: '1000' } });

    // Form should be valid without strike price
    const submitButton = screen.getByText('Grant Options');
    expect(submitButton).not.toBeDisabled();
  });

  test('should require strike price for stock options', async () => {
    renderDialog();

    // Fill out ISO form without strike price
    const stakeholderSelect = screen.getByRole('combobox');
    fireEvent.click(stakeholderSelect);
    fireEvent.click(screen.getByText('John Doe'));

    const typeSelect = screen.getAllByRole('combobox')[1];
    fireEvent.click(typeSelect);
    fireEvent.click(screen.getByText('ISO'));

    const quantityInput = screen.getByPlaceholderText('100,000');
    fireEvent.change(quantityInput, { target: { value: '5000' } });

    // Submit form without strike price
    const submitButton = screen.getByText('Grant Options');
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Strike price is required for stock options')).toBeInTheDocument();
    });
  });

  test('should send null strike price for RSU in API request', async () => {
    const { apiRequest } = require('@/lib/queryClient');
    apiRequest.mockResolvedValue({ id: 'award-123' });

    renderDialog();

    // Fill out complete RSU form
    const stakeholderSelect = screen.getByRole('combobox');
    fireEvent.click(stakeholderSelect);
    fireEvent.click(screen.getByText('John Doe'));

    const typeSelect = screen.getAllByRole('combobox')[1];
    fireEvent.click(typeSelect);
    fireEvent.click(screen.getByText('RSU'));

    const quantityInput = screen.getByPlaceholderText('100,000');
    fireEvent.change(quantityInput, { target: { value: '2000' } });

    const grantDateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    fireEvent.change(grantDateInput, { target: { value: '2023-06-15' } });

    // Submit form
    const submitButton = screen.getByText('Grant Options');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/companies/test-company/equity-awards', {
        method: 'POST',
        body: expect.objectContaining({
          type: 'RSU',
          quantityGranted: 2000,
          strikePrice: null, // Should be null for RSUs
          holderId: 'stakeholder-1',
        }),
      });
    });
  });

  test('should send strike price for stock options in API request', async () => {
    const { apiRequest } = require('@/lib/queryClient');
    apiRequest.mockResolvedValue({ id: 'award-456' });

    renderDialog();

    // Fill out complete ISO form
    const stakeholderSelect = screen.getByRole('combobox');
    fireEvent.click(stakeholderSelect);
    fireEvent.click(screen.getByText('Jane Smith'));

    const typeSelect = screen.getAllByRole('combobox')[1];
    fireEvent.click(typeSelect);
    fireEvent.click(screen.getByText('ISO'));

    const quantityInput = screen.getByPlaceholderText('100,000');
    fireEvent.change(quantityInput, { target: { value: '5000' } });

    const strikePriceInput = screen.getByPlaceholderText('1.00');
    fireEvent.change(strikePriceInput, { target: { value: '2.50' } });

    const grantDateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    fireEvent.change(grantDateInput, { target: { value: '2023-06-15' } });

    // Submit form
    const submitButton = screen.getByText('Grant Options');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/companies/test-company/equity-awards', {
        method: 'POST',
        body: expect.objectContaining({
          type: 'ISO',
          quantityGranted: 5000,
          strikePrice: 2.50, // Should include strike price for options
          holderId: 'stakeholder-2',
        }),
      });
    });
  });
});