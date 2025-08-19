// Basic E2E logout functionality test
import { logout } from '@/hooks/useAuth';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.location.href
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

describe('Logout Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  test('logout function calls server endpoint and redirects to login', async () => {
    // Setup
    const mockToken = 'test-jwt-token';
    mockLocalStorage.getItem.mockReturnValue(mockToken);
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    });

    // Execute logout
    await logout();

    // Verify server API call
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Verify localStorage cleanup
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');

    // Verify redirect to login
    expect(window.location.href).toBe('/login');
  });

  test('logout continues with client cleanup even if server call fails', async () => {
    // Setup
    const mockToken = 'test-jwt-token';
    mockLocalStorage.getItem.mockReturnValue(mockToken);
    mockFetch.mockRejectedValue(new Error('Network error'));

    // Execute logout
    await logout();

    // Verify server API call was attempted
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Verify localStorage cleanup still happens
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');

    // Verify redirect still happens
    expect(window.location.href).toBe('/login');
  });

  test('logout handles missing token gracefully', async () => {
    // Setup - no token in localStorage
    mockLocalStorage.getItem.mockReturnValue(null);
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    });

    // Execute logout
    await logout();

    // Verify server API call with null token
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer null',
        'Content-Type': 'application/json'
      }
    });

    // Verify cleanup and redirect
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    expect(window.location.href).toBe('/login');
  });
});