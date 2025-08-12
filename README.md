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

### Secrets

| Name | Description | Required |
|------|-------------|----------|
| `AZURE_AD_TOKEN` | Azure AD access token with User.ReadWrite.All permission | Yes |

### Environment Variables

| Name | Description | Default |
|------|-------------|---------|
| `AZURE_AD_TENANT_URL` | Microsoft Graph API endpoint | `https://graph.microsoft.com/v1.0` |

### Input Parameters

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `userPrincipalName` | string | The user principal name (UPN) of the user whose sessions should be revoked | Yes |

### Output Structure

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

### With Custom Tenant URL

Environment:
```json
{
  "AZURE_AD_TENANT_URL": "https://graph.microsoft.com/beta"
}
```

Input:
```json
{
  "userPrincipalName": "jane.smith@example.com"
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