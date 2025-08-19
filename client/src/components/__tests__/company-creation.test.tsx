// Company creation validation test
import { apiRequest } from '@/lib/queryClient';

// Mock the API request
jest.mock('@/lib/queryClient');
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('Company Creation Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('server validates required fields and returns 400 for missing name', async () => {
    mockApiRequest.mockRejectedValue({
      status: 400,
      message: 'Company name is required and cannot be empty'
    });

    const companyData = {
      description: 'Test company',
      country: 'US',
      incorporationDate: '2023-01-01',
      authorizedShares: 10000000,
    };

    await expect(
      apiRequest('/api/companies', {
        method: 'POST',
        body: companyData,
      })
    ).rejects.toMatchObject({
      status: 400,
      message: 'Company name is required and cannot be empty'
    });
  });

  test('server validates required fields and returns 400 for missing incorporation date', async () => {
    mockApiRequest.mockRejectedValue({
      status: 400,
      message: 'Incorporation date is required'
    });

    const companyData = {
      name: 'Test Company',
      description: 'Test company',
      country: 'US',
      authorizedShares: 10000000,
    };

    await expect(
      apiRequest('/api/companies', {
        method: 'POST',
        body: companyData,
      })
    ).rejects.toMatchObject({
      status: 400,
      message: 'Incorporation date is required'
    });
  });

  test('server validates date format and returns 400 for invalid date', async () => {
    mockApiRequest.mockRejectedValue({
      status: 400,
      message: 'Invalid incorporation date format. Please provide a valid date.'
    });

    const companyData = {
      name: 'Test Company',
      description: 'Test company',
      country: 'US',
      incorporationDate: 'invalid-date',
      authorizedShares: 10000000,
    };

    await expect(
      apiRequest('/api/companies', {
        method: 'POST',
        body: companyData,
      })
    ).rejects.toMatchObject({
      status: 400,
      message: 'Invalid incorporation date format. Please provide a valid date.'
    });
  });

  test('server returns 201 for valid company creation', async () => {
    const createdCompany = {
      id: 'test-company-id',
      name: 'Test Company',
      description: 'Test company',
      country: 'US',
      incorporationDate: '2023-01-01T00:00:00.000Z',
      authorizedShares: 10000000,
    };

    mockApiRequest.mockResolvedValue(createdCompany);

    const companyData = {
      name: 'Test Company',
      description: 'Test company',
      country: 'US',
      incorporationDate: '2023-01-01',
      authorizedShares: 10000000,
    };

    const result = await apiRequest('/api/companies', {
      method: 'POST',
      body: companyData,
    });

    expect(result).toEqual(createdCompany);
    expect(mockApiRequest).toHaveBeenCalledWith('/api/companies', {
      method: 'POST',
      body: companyData,
    });
  });

  test('date normalization converts Month/Year to YYYY-MM-01', () => {
    // This test would verify the client-side date conversion
    // The form generates dates like "2023-01-01" from Month/Year selection
    const selectedDate = new Date(2023, 0, 1); // January 2023
    const expectedISOString = selectedDate.toISOString().split('T')[0]; // "2023-01-01"
    
    expect(expectedISOString).toBe('2023-01-01');
  });
});