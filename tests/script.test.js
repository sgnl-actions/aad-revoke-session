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

    test('should throw error when userPrincipalName is missing', async () => {
      const params = {};

      await expect(script.invoke(params, mockContext))
        .rejects.toThrow('userPrincipalName is required');

      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should throw error when OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN is missing', async () => {
      const params = {
        userPrincipalName: 'user@example.com'
      };

      const contextNoToken = {
        ...mockContext,
        secrets: {}
      };

      await expect(script.invoke(params, contextNoToken))
        .rejects.toThrow('OAuth2 authentication is required');

      expect(global.fetch).not.toHaveBeenCalled();
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
    test('should request retry on rate limiting (429)', async () => {
      const params = {
        userPrincipalName: 'user@example.com',
        error: {
          message: 'Failed to revoke sessions: 429 Too Many Requests'
        }
      };

      const result = await script.error(params, mockContext);

      expect(result.status).toBe('retry_requested');
    });

    test('should request retry on temporary server errors', async () => {
      const serverErrors = ['502', '503', '504'];

      for (const errorCode of serverErrors) {
        const params = {
          userPrincipalName: 'user@example.com',
          error: {
            message: `Server error: ${errorCode} Bad Gateway`
          }
        };

        const result = await script.error(params, mockContext);
        expect(result.status).toBe('retry_requested');
      }
    });

    test('should throw on authentication errors (401, 403)', async () => {
      const authErrors = ['401', '403'];

      for (const errorCode of authErrors) {
        const errorMessage = `Authentication failed: ${errorCode} Forbidden`;
        const params = {
          userPrincipalName: 'user@example.com',
          error: new Error(errorMessage)
        };

        await expect(script.error(params, mockContext))
          .rejects.toThrow(errorMessage);
      }
    });

    test('should request retry for unknown errors', async () => {
      const params = {
        userPrincipalName: 'user@example.com',
        error: {
          message: 'Unknown error occurred'
        }
      };

      const result = await script.error(params, mockContext);
      expect(result.status).toBe('retry_requested');
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