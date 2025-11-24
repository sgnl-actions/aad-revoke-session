/**
 * Azure AD Revoke Session Action
 *
 * Revokes all sign-in sessions for a user in Azure Active Directory.
 * This forces the user to re-authenticate for all applications.
 */

/**
 * Helper function to revoke sessions for a user
 * @param {string} userPrincipalName - The user principal name
 * @param {string} tenantUrl - Azure AD tenant URL
 * @param {string} authToken - Azure AD access token
 * @returns {Promise<Object>} API response
 */
async function revokeUserSessions(userPrincipalName, tenantUrl, authToken) {
  // URL encode the user principal name to prevent injection
  const encodedUpn = encodeURIComponent(userPrincipalName);
  const url = new URL(`${tenantUrl}/users/${encodedUpn}/revokeSignInSessions`);

  // Ensure token has proper Bearer prefix
  const authHeader = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  return response;
}

export default {
  /**
   * Main execution handler - revokes all sessions for the specified user
   * @param {Object} params - Job input parameters
   * @param {Object} context - Execution context with env, secrets, outputs
   * @param {string} context.secrets.BEARER_AUTH_TOKEN - Bearer token for Azure AD API authentication
   * @returns {Object} Job results
   */
  invoke: async (params, context) => {
    // Validate required parameters
    if (!params.userPrincipalName) {
      throw new Error('userPrincipalName is required');
    }

    // Get configuration
    const tenantUrl = context.environment?.AZURE_AD_TENANT_URL || 'https://graph.microsoft.com/v1.0';
    const authToken = context.secrets?.BEARER_AUTH_TOKEN;

    if (!authToken) {
      throw new Error('BEARER_AUTH_TOKEN secret is required');
    }

    console.log(`Revoking sessions for user: ${params.userPrincipalName}`);

    // Call Azure AD API to revoke sessions
    const response = await revokeUserSessions(
      params.userPrincipalName,
      tenantUrl,
      authToken
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
   * Error recovery handler - handles retryable errors
   * @param {Object} params - Original params plus error information
   * @param {Object} context - Execution context
   * @returns {Object} Recovery results
   */
  error: async (params, _context) => {
    const { error } = params;

    // Check for rate limiting (429) or temporary server errors (502, 503, 504)
    if (error.message.includes('429') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504')) {
      console.log('Retryable error detected, requesting retry...');
      return { status: 'retry_requested' };
    }

    // Fatal errors (401, 403) should not retry
    if (error.message.includes('401') || error.message.includes('403')) {
      throw error; // Re-throw to mark as fatal
    }

    // Default: let framework retry
    return { status: 'retry_requested' };
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