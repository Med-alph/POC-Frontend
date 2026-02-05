# Session Management System Documentation

## Overview

This EMR system implements a comprehensive, healthcare-grade session management system that aligns with backend server-side session tracking. The system ensures secure token storage, automatic session validation, and provides users with full control over their active sessions.

## Architecture

### Components

1. **Secure Storage (`src/utils/secureStorage.js`)**
   - Memory-based storage for sensitive data (JWT tokens, session IDs)
   - Avoids localStorage for security-sensitive information
   - Uses sessionStorage only for non-sensitive user preferences

2. **Auth Context (`src/contexts/AuthContext.jsx`)**
   - Centralized authentication state management
   - Handles login, logout, and session invalidation
   - Extracts tenant_id and hospital_id from JWT (never user-editable)
   - Provides hooks for components to access auth state

3. **API Interceptor (`src/services/apiInterceptor.js`)**
   - Intercepts all fetch API calls
   - Automatically attaches JWT token and session_id to requests
   - Handles 401/session-invalid responses
   - Automatically logs out users on session expiration/revocation

4. **Session API (`src/api/sessionapi.js`)**
   - Endpoints for managing sessions:
     - `GET /auth/sessions` - Get all active sessions
     - `DELETE /auth/sessions/:sessionId` - Revoke specific session
     - `DELETE /auth/sessions/others` - Revoke all other sessions
     - `POST /auth/sessions/refresh` - Refresh current session

5. **Active Sessions UI (`src/components/ActiveSessions.jsx`)**
   - Displays all active sessions with device, browser, IP, last active time
   - Allows users to revoke individual or all other sessions
   - Available in profile dropdown for all roles

## Security Features

### Token Storage
- **JWT tokens**: Stored in memory only (cleared on page refresh)
- **Session IDs**: Stored in memory only
- **Tenant/Hospital IDs**: Derived from JWT token, never user-editable
- **No localStorage**: Sensitive data never persisted to localStorage

### Session Validation
- Every API request includes both JWT token and session_id
- Backend validates both token signature and session existence
- Automatic logout on session invalidation

### Edge Cases Handled
1. **Token expired but session active**: Backend returns 401 with SESSION_EXPIRED, frontend logs out
2. **Session revoked from another device**: Next API call returns 401 with SESSION_REVOKED, automatic logout
3. **Multiple tabs/windows**: Each tab shares same session_id; logout in one tab detected on next API call

## Usage

### Login Flow

```javascript
// Login response should include:
{
  access_token: "jwt_token_here",
  session_id: "opaque_session_reference",
  user: { ... },
  uiModules: [ ... ]
}

// AuthContext automatically:
// 1. Stores JWT and session_id in secure storage
// 2. Extracts tenant_id and hospital_id from JWT
// 3. Sets up API interceptor
```

### Making API Requests

All API requests automatically include:
- `Authorization: Bearer <JWT_TOKEN>`
- `X-Session-Id: <SESSION_ID>`

No manual header attachment needed - handled by API interceptor.

### Accessing Auth State

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { 
    isAuthenticated,
    user,
    getToken,
    getTenantId,
    getHospitalId,
    logout 
  } = useAuth();
  
  // Use auth state...
}
```

### Active Sessions UI

The Active Sessions component is automatically available in the profile dropdown. Users can:
- View all active sessions
- See device, browser, IP, and last active time
- Revoke individual sessions
- Revoke all other sessions (keep current)

## Backend Requirements

### Login Endpoint
`POST /auth/staff/login` or `POST /auth/admin/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "session_id": "session_opaque_reference_123",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "tenant_id": "tenant_123",
    "hospital_id": "hospital_456",
    ...
  },
  "uiModules": [...]
}
```

### Session Management Endpoints

1. **Get Active Sessions**
   - `GET /auth/sessions`
   - Headers: `Authorization: Bearer <token>`, `X-Session-Id: <session_id>`
   - Response: Array of session objects

2. **Revoke Session**
   - `DELETE /auth/sessions/:sessionId`
   - Headers: `Authorization: Bearer <token>`, `X-Session-Id: <session_id>`

3. **Revoke All Other Sessions**
   - `DELETE /auth/sessions/others`
   - Headers: `Authorization: Bearer <token>`, `X-Session-Id: <session_id>`

### Error Responses

When session is invalid:
```json
{
  "code": "SESSION_INVALID" | "SESSION_EXPIRED" | "SESSION_REVOKED",
  "message": "Your session has expired or been revoked"
}
```

Status code: `401 Unauthorized`

## Session Management Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LOGIN                               │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend returns:                                            │
│  - access_token (JWT)                                       │
│  - session_id (opaque reference)                           │
│  - user object                                               │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  AuthContext.setAuthCredentials()                           │
│  - Store JWT in memory (secureStorage)                      │
│  - Store session_id in memory                               │
│  - Extract tenant_id/hospital_id from JWT                   │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              API REQUEST (via fetch interceptor)            │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Interceptor adds headers:                                   │
│  - Authorization: Bearer <JWT>                               │
│  - X-Session-Id: <session_id>                                │
└──────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND VALIDATES                          │
│  - JWT signature & expiration                                │
│  - Session exists & is active                                 │
│  - Session matches user                                       │
└──────────────────────┬──────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                      │
            ▼                      ▼
┌──────────────────┐   ┌──────────────────────────────┐
│   SUCCESS (200)   │   │   SESSION ERROR (401)        │
│                  │   │  - SESSION_INVALID            │
│  Return data     │   │  - SESSION_EXPIRED            │
│                  │   │  - SESSION_REVOKED            │
└──────────────────┘   └──────────┬───────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │  Interceptor detects 401      │
                    │  + session error code         │
                    └──────────┬───────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────┐
                    │  Call sessionInvalidationHandler│
                    │  - Clear secure storage        │
                    │  - Clear Redux state          │
                    │  - Redirect to login           │
                    └──────────────────────────────┘
```

## Migration Notes

The system maintains backward compatibility with localStorage during migration:
- New logins use secure storage (memory)
- Existing localStorage tokens are migrated on first access
- After migration period, localStorage usage can be removed

## Testing

### Manual Testing Checklist

1. **Login**
   - [ ] Login stores JWT and session_id in memory
   - [ ] Tenant/hospital IDs extracted from token
   - [ ] API requests include both Authorization and X-Session-Id headers

2. **Session Management**
   - [ ] Active Sessions UI displays all sessions
   - [ ] Current session is marked
   - [ ] Can revoke individual sessions
   - [ ] Can revoke all other sessions
   - [ ] Revoked sessions disappear from list

3. **Session Invalidation**
   - [ ] 401 with SESSION_EXPIRED logs out user
   - [ ] 401 with SESSION_REVOKED logs out user
   - [ ] User redirected to login page
   - [ ] Secure storage cleared

4. **Edge Cases**
   - [ ] Token expired but session active → logout
   - [ ] Session revoked from another device → logout on next API call
   - [ ] Multiple tabs → logout in one tab affects others on next API call

## Security Best Practices

✅ **Implemented:**
- JWT tokens in memory only
- Session IDs in memory only
- Tenant/hospital IDs derived from token (never user-editable)
- Automatic session validation on every request
- Automatic logout on session invalidation
- No sensitive data in localStorage

✅ **Recommended for Production:**
- Enable HTTPS only
- Implement CSRF protection
- Add rate limiting on login endpoint
- Monitor for suspicious session activity
- Implement session timeout warnings
- Consider implementing refresh tokens for long-lived sessions

## Troubleshooting

### Issue: Sessions not appearing
- Check backend endpoint `/auth/sessions` returns correct format
- Verify session_id is being sent in requests
- Check browser console for API errors

### Issue: Automatic logout not working
- Verify API interceptor is initialized (check `window.__fetchIntercepted`)
- Check backend returns correct error codes (SESSION_INVALID, etc.)
- Verify sessionInvalidationHandler is set in AuthContext

### Issue: Token not persisting
- This is expected - tokens are in memory only
- On page refresh, user must login again
- For persistence, consider implementing refresh tokens

## Future Enhancements

- [ ] Refresh token support for long-lived sessions
- [ ] Session timeout warnings
- [ ] Real-time session sync across tabs (BroadcastChannel)
- [ ] Session activity monitoring
- [ ] Suspicious activity detection
- [ ] Remember device option



