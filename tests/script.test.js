import { jest } from '@jest/globals';
import script from '../src/script.mjs';

// Mock fetch globally
global.fetch = jest.fn();
global.URL = URL;

describe('Azure AD Revoke Session Action', () => {
  const mockContext = {
    environment: {
      ADDRESS: 'https://graph.microsoft.com'
    },
    secrets: {
      OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN: 'test-bearer-token'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.console.log = jest.fn();
    global.console.error = jest.fn();
  });

  describe('invoke handler', () => {
    test('should successfully revoke sessions for a user', async () => {
      const params = {
        userPrincipalName: 'user@example.com'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ value: true })
      });

      const result = await script.invoke(params, mockContext);

      expect(result.status).toBe('success');
      expect(result.userPrincipalName).toBe('user@example.com');
      expect(result.value).toBe(true);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/users/user%40example.com/revokeSignInSessions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-bearer-token',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    test('should handle Bearer prefix in token', async () => {
      const params = {
        userPrincipalName: 'user@example.com'
      };

      const contextWithBearer = {
        ...mockContext,
        secrets: {
          OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN: 'Bearer existing-token'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ value: true })
      });

      await script.invoke(params, contextWithBearer);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer existing-token'
          })
        })
      );
    });

    test('should URL encode user principal name', async () => {
      const params = {
        userPrincipalName: 'user+test@example.com'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ value: true })
      });

      await script.invoke(params, mockContext);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/users/user%2Btest%40example.com/revokeSignInSessions',
        expect.any(Object)
      );
    });



    test('should handle API error responses', async () => {
      const params = {
        userPrincipalName: 'user@example.com'
      };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'User not found'
      });

      await expect(script.invoke(params, mockContext))
        .rejects.toThrow('Failed to revoke sessions: 404 Not Found. Details: User not found');
    });

    test('should use custom tenant URL from environment', async () => {
      const params = {
        userPrincipalName: 'user@example.com'
      };

      const customContext = {
        ...mockContext,
        environment: {
          ADDRESS: 'https://custom.graph.microsoft.com'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ value: true })
      });

      await script.invoke(params, customContext);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom.graph.microsoft.com/v1.0/users/user%40example.com/revokeSignInSessions',
        expect.any(Object)
      );
    });

  });

  describe('error handler', () => {
    test('should re-throw error and let framework handle retries', async () => {
      const errorObj = new Error('Failed to revoke sessions: 429 Too Many Requests');
      const params = {
        userPrincipalName: 'user@example.com',
        error: errorObj
      };

      await expect(script.error(params, mockContext)).rejects.toThrow(errorObj);
      expect(console.error).toHaveBeenCalledWith(
        'Session revocation failed for user@example.com: Failed to revoke sessions: 429 Too Many Requests'
      );
    });

    test('should re-throw server errors', async () => {
      const errorObj = new Error('Server error: 502 Bad Gateway');
      const params = {
        userPrincipalName: 'user@example.com',
        error: errorObj
      };

      await expect(script.error(params, mockContext)).rejects.toThrow(errorObj);
    });

    test('should re-throw authentication errors', async () => {
      const errorObj = new Error('Authentication failed: 401 Forbidden');
      const params = {
        userPrincipalName: 'user@example.com',
        error: errorObj
      };

      await expect(script.error(params, mockContext)).rejects.toThrow(errorObj);
    });

    test('should re-throw any error', async () => {
      const errorObj = new Error('Unknown error occurred');
      const params = {
        userPrincipalName: 'user@example.com',
        error: errorObj
      };

      await expect(script.error(params, mockContext)).rejects.toThrow(errorObj);
    });

  });

  describe('halt handler', () => {
    test('should handle graceful shutdown', async () => {
      const params = {
        userPrincipalName: 'user@example.com',
        reason: 'timeout'
      };

      const result = await script.halt(params, mockContext);

      expect(result.status).toBe('halted');
      expect(result.userPrincipalName).toBe('user@example.com');
      expect(result.reason).toBe('timeout');
    });

    test('should handle halt without userPrincipalName', async () => {
      const params = {
        reason: 'system_shutdown'
      };

      const result = await script.halt(params, mockContext);

      expect(result.status).toBe('halted');
      expect(result.userPrincipalName).toBe('unknown');
      expect(result.reason).toBe('system_shutdown');
    });
  });
});