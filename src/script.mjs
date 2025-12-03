/**
 * Azure AD Revoke Session Action
 *
 * Revokes all sign-in sessions for a user in Azure Active Directory.
 * This forces the user to re-authenticate for all applications.
 */

import { getBaseUrl, createAuthHeaders } from '@sgnl-actions/utils';

/**
 * Helper function to revoke sessions for a user
 * @param {string} userPrincipalName - The user principal name
 * @param {string} baseUrl - Azure AD base URL
 * @param {Object} headers - Request headers with Authorization
 * @returns {Promise<Object>} API response
 */
async function revokeUserSessions(userPrincipalName, baseUrl, headers) {
  // URL encode the user principal name to prevent injection
  const encodedUpn = encodeURIComponent(userPrincipalName);
  const url = `${baseUrl}/v1.0/users/${encodedUpn}/revokeSignInSessions`;

  const response = await fetch(url, {
    method: 'POST',
    headers
  });

  return response;
}

export default {
  /**
   * Main execution handler - revokes all sessions for the specified user
   * @param {Object} params - Job input parameters
   * @param {string} params.userPrincipalName - User Principal Name (email) to revoke sessions for
   * @param {string} params.address - The Azure AD API base URL (e.g., https://graph.microsoft.com)
   * @param {Object} context - Execution context with env, secrets, outputs
   * @param {string} context.environment.ADDRESS - Default Azure AD API base URL
   *
   * The configured auth type will determine which of the following environment variables and secrets are available
   * @param {string} context.secrets.OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET
   * @param {string} context.environment.OAUTH2_CLIENT_CREDENTIALS_AUDIENCE
   * @param {string} context.environment.OAUTH2_CLIENT_CREDENTIALS_AUTH_STYLE
   * @param {string} context.environment.OAUTH2_CLIENT_CREDENTIALS_CLIENT_ID
   * @param {string} context.environment.OAUTH2_CLIENT_CREDENTIALS_SCOPE
   * @param {string} context.environment.OAUTH2_CLIENT_CREDENTIALS_TOKEN_URL
   *
   * @param {string} context.secrets.OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN
   *
   * @returns {Object} Job results
   */
  invoke: async (params, context) => {
    // Validate required parameters
    if (!params.userPrincipalName) {
      throw new Error('userPrincipalName is required');
    }

    // Get base URL and authentication headers using utilities
    const baseUrl = getBaseUrl(params, context);
    const headers = await createAuthHeaders(context);

    console.log(`Revoking sessions for user: ${params.userPrincipalName}`);

    // Call Azure AD API to revoke sessions
    const response = await revokeUserSessions(
      params.userPrincipalName,
      baseUrl,
      headers
    );

    // Check response status
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to revoke sessions: ${response.status} ${response.statusText}. Details: ${errorText}`);
    }

    // Parse response - API returns { value: true } on success
    const result = await response.json();

    console.log(`Successfully revoked sessions for user: ${params.userPrincipalName}`);

    return {
      status: 'success',
      userPrincipalName: params.userPrincipalName,
      value: result.value || true
    };
  },

  /**
   * Error recovery handler - framework handles retries by default
   * Only implement if custom recovery logic is needed
   * @param {Object} params - Original params plus error information
   * @param {Object} context - Execution context
   * @returns {Object} Recovery results
   */
  error: async (params, _context) => {
    const { error, userPrincipalName } = params;
    console.error(`Session revocation failed for ${userPrincipalName}: ${error.message}`);

    // Framework handles retries for transient errors (429, 502, 503, 504)
    // Just re-throw the error to let the framework handle it
    throw error;
  },

  /**
   * Graceful shutdown handler - cleanup on halt
   * @param {Object} params - Original params plus halt reason
   * @param {Object} context - Execution context
   * @returns {Object} Cleanup results
   */
  halt: async (params, _context) => {
    const { reason } = params;
    console.log(`Session revocation halted: ${reason}`);

    return {
      status: 'halted',
      userPrincipalName: params.userPrincipalName || 'unknown',
      reason: reason
    };
  }
};