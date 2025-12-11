# Azure AD Revoke Session Action

Revoke all sign-in sessions for a user in Azure Active Directory (Azure AD/Microsoft Entra ID), forcing them to re-authenticate for all applications.

## Overview

This action calls the Microsoft Graph API to revoke all refresh tokens and session cookies for a specified user. This is useful for:
- Immediate access termination when a user leaves the organization
- Security incident response
- Forcing re-authentication after password changes
- Compliance with security policies

## Prerequisites

- Azure AD tenant with Microsoft Graph API access
- Application registration with appropriate permissions
- Access token with `User.ReadWrite.All` or `Directory.ReadWrite.All` permission

## Configuration

### Authentication

This action supports two OAuth2 authentication methods:

#### Option 1: OAuth2 Client Credentials
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET` | Secret | Yes | OAuth2 client secret |
| `OAUTH2_CLIENT_CREDENTIALS_CLIENT_ID` | Environment | Yes | OAuth2 client ID |
| `OAUTH2_CLIENT_CREDENTIALS_TOKEN_URL` | Environment | Yes | OAuth2 token endpoint URL |
| `OAUTH2_CLIENT_CREDENTIALS_SCOPE` | Environment | No | OAuth2 scope |
| `OAUTH2_CLIENT_CREDENTIALS_AUDIENCE` | Environment | No | OAuth2 audience |
| `OAUTH2_CLIENT_CREDENTIALS_AUTH_STYLE` | Environment | No | OAuth2 auth style |

#### Option 2: OAuth2 Authorization Code
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN` | Secret | Yes | OAuth2 access token |

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ADDRESS` | Yes | Default Azure AD API base URL | `https://graph.microsoft.com` |

### Input Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `userPrincipalName` | string | Yes | User Principal Name (UPN) of the user whose sessions should be revoked | `user@example.com` |
| `address` | string | No | Optional Azure AD API base URL override | `https://graph.microsoft.com` |

### Output Structure

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Operation result (success, failed, etc.) |
| `userPrincipalName` | string | User Principal Name whose sessions were revoked |
| `value` | boolean | True if the revocation was successful |
| `address` | string | The Azure AD API base URL used |

**Example Output:**
```json
{
  "status": "success",
  "userPrincipalName": "user@example.com",
  "value": true
}
```

## Usage Examples

### Basic Usage

```json
{
  "userPrincipalName": "john.doe@example.com"
}
```

### With OAuth2 Client Credentials

```json
{
  "script_inputs": {
    "userPrincipalName": "john.doe@example.com",
    "address": "https://graph.microsoft.com"
  },
  "environment": {
    "ADDRESS": "https://graph.microsoft.com",
    "OAUTH2_CLIENT_CREDENTIALS_TOKEN_URL": "https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token",
    "OAUTH2_CLIENT_CREDENTIALS_CLIENT_ID": "your-client-id",
    "OAUTH2_CLIENT_CREDENTIALS_SCOPE": "https://graph.microsoft.com/.default"
  },
  "secrets": {
    "OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET": "your-client-secret"
  }
}
```

### With OAuth2 Authorization Code

```json
{
  "script_inputs": {
    "userPrincipalName": "john.doe@example.com",
    "address": "https://graph.microsoft.com"
  },
  "environment": {
    "ADDRESS": "https://graph.microsoft.com"
  },
  "secrets": {
    "OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN": "your-access-token"
  }
}
```

## Error Handling

The action implements intelligent error handling with automatic retry logic:

### Retryable Errors
- **429 Too Many Requests**: Waits 5 seconds before retry
- **502 Bad Gateway**: Waits 3 seconds before retry  
- **503 Service Unavailable**: Waits 3 seconds before retry
- **504 Gateway Timeout**: Waits 3 seconds before retry

### Fatal Errors (No Retry)
- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: User does not exist

## Security Considerations

1. **Token Security**: Never log or expose the Azure AD access token
2. **URL Encoding**: User principal names are automatically URL-encoded to prevent injection attacks
3. **HTTPS Only**: All API calls use HTTPS
4. **Minimal Permissions**: Request only the permissions needed (User.ReadWrite.All)
5. **Token Expiration**: Ensure tokens are refreshed before expiration

## API Details

This action uses the Microsoft Graph API endpoint:
```
POST /users/{userPrincipalName}/revokeSignInSessions
```

The API returns:
```json
{
  "value": true
}
```

This indicates that the revocation was successful. The user's refresh tokens are immediately invalidated, and they must re-authenticate on their next access attempt.

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Verify the access token is valid and not expired
   - Ensure the token includes the "Bearer " prefix

2. **403 Forbidden**
   - Verify the application has `User.ReadWrite.All` or `Directory.ReadWrite.All` permission
   - Check that admin consent has been granted for the permission

3. **404 Not Found**
   - Verify the user principal name is correct
   - Ensure the user exists in the Azure AD tenant

4. **429 Too Many Requests**
   - The action will automatically retry after a delay
   - Consider implementing request throttling if this occurs frequently

## Development

### Running Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

### Local Development
```bash
npm run dev -- --params '{"userPrincipalName": "test@example.com"}'
```

## Migration Notes

This action was migrated from Go to JavaScript as part of the SGNL's CAEP Hub modernization effort. The JavaScript version maintains feature parity with the original Go implementation while leveraging the Node.js 22 runtime capabilities.

## License

MIT

## Support

For issues or questions, please contact the SGNL Engineering team or create an issue in the repository.