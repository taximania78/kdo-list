# Plan: Robust Session Management Fix

## Overview

Fix critical authentication bugs causing premature user disconnections and implement robust session management across the application. The current system disconnects users after 15 minutes due to Nav.tsx incorrectly deleting refresh tokens. This plan addresses all token management issues, updates token lifetimes to 30 minutes (access) and 7 days (refresh), and ensures consistent authentication behavior across all pages.

## Goals

1. Fix Nav.tsx bug that prematurely deletes refresh tokens
2. Update token expiration times (30 min access, 7 days refresh)
3. Centralize authentication logic to eliminate code duplication
4. Fix hardcoded API URL in token refresh function
5. Remove redundant manual auth checks from individual pages
6. Ensure automatic token refresh works seamlessly across the app

## Files to Modify

### Backend Files (Server)
1. `/server/config.py` - Update default token expiration values
2. `/server/dev/config.json` - Update development token configuration (if exists)

### Frontend Files (Next.js)
1. `/src/lib/api.ts` - Fix hardcoded localhost URL in refresh function
2. `/src/components/Nav.tsx` - Remove token deletion logic, fix auth check
3. `/src/app/page.tsx` - Remove redundant auth logic
4. `/src/app/admin/page.tsx` - Remove redundant auth logic
5. `/src/lib/auth.ts` - **NEW FILE** - Centralized auth utilities
6. `/src/hooks/useAuth.ts` - **NEW FILE** - Custom hook for authentication state

## Implementation Plan

### Phase 1: Backend Configuration Updates

#### File: `/server/config.py`

**Changes:**
- Update `ACCESS_TOKEN_EXPIRE_MINUTES` default from 15 to 30
- Keep `REFRESH_TOKEN_EXPIRE_DAYS` at 7 (already correct)
- Update both production and development config sections

**Lines to modify:**
- Line 15: Production default for ACCESS_TOKEN_EXPIRE_MINUTES
- Line 36: Development default for ACCESS_TOKEN_EXPIRE_MINUTES

### Phase 2: Fix Critical API Bug

#### File: `/src/lib/api.ts`

**Function: `refreshAccessToken()`** (lines 43-76)
- Fix hardcoded `http://localhost:8000` to use `ApiAdress` variable
- This bug causes refresh to fail in production environments

**Current issue:** Line 57 hardcodes localhost instead of using environment variable

### Phase 3: Create Centralized Auth Utilities

#### New File: `/src/lib/auth.ts`

**Purpose:** Centralize all token-related operations and validation logic

**Functions to create:**

1. `getTokenFromStorage(): string | null`
   - Retrieves authToken from localStorage safely
   - Returns null if not found or if running on server

2. `getRefreshTokenFromStorage(): string | null`
   - Retrieves refreshToken from localStorage safely
   - Returns null if not found or if running on server

3. `isTokenValid(token: string): boolean`
   - Decodes JWT and checks if not expired
   - Returns false for invalid or expired tokens
   - Does NOT delete tokens (read-only check)

4. `decodeToken(token: string): DecodedToken | null`
   - Safely decodes JWT token
   - Returns null on decode errors
   - Exports DecodedToken interface

5. `clearAuthStorage(): void`
   - Safely removes all auth-related localStorage items
   - Single source of truth for storage cleanup

6. `getUserInfo(): { username: string; isAdmin: boolean; isMegaAdmin: boolean } | null`
   - Reads and decodes current token to get user info
   - Returns null if no valid token exists

**Exports:**
- DecodedToken interface
- All utility functions above

### Phase 4: Create Authentication Hook

#### New File: `/src/hooks/useAuth.ts`

**Purpose:** React hook for managing authentication state across components

**Hook: `useAuth()`**

**Returns:**
- `isAuthenticated: boolean` - Whether user has valid token
- `user: DecodedToken | null` - Current user information
- `isLoading: boolean` - Auth check in progress
- `logout: () => void` - Function to logout user

**Behavior:**
- Checks token validity on mount
- Does NOT check expiration (lets api.ts handle refresh)
- Only checks if token exists and is decodable
- Updates on pathname changes
- Provides logout function that clears storage and redirects

### Phase 5: Fix Nav Component

#### File: `/src/components/Nav.tsx`

**Changes to `checkToken()` function** (lines 48-74)

**Current problematic logic:**
```
if (!isExpired) {
  setIsUserLoggedIn(true)
} else {
  // DELETES refresh token! ❌
  localStorage.removeItem('refreshToken')
}
```

**New logic:**
- Import `getUserInfo` and `getTokenFromStorage` from `/src/lib/auth`
- Simply check if token exists (don't check expiration)
- Let api.ts handle token refresh automatically
- Never delete tokens in Nav component

**Simplified approach:**
1. Check if token exists
2. If yes, set isUserLoggedIn to true and extract user info
3. If no, set isUserLoggedIn to false
4. No expiration checking, no token deletion

### Phase 6: Fix Login Page

#### File: `/src/app/page.tsx`

**Remove redundant `checkAuth()` function** (lines 27-77)

**Current issues:**
- Duplicates token expiration check logic
- Has duplicate `isExpired` check (lines 42-43, same check twice)
- Manually attempts refresh instead of using api.ts
- Uses inconsistent token key (`accessToken` vs `authToken`)

**New approach:**
- Use `useAuth()` hook from `/src/hooks/useAuth.ts`
- On mount, if already authenticated, redirect based on role
- Remove manual token refresh logic
- Keep only the login form submission handler

**Updated flow:**
1. Component mounts
2. `useAuth()` hook checks authentication
3. If authenticated, redirect to `/admin` or `/list` based on role
4. Otherwise show login form

### Phase 7: Fix Admin Page

#### File: `/src/app/admin/page.tsx`

**Remove redundant `checkAuth()` function** (lines 49-101)

**Current issues:**
- Same duplication as login page
- Has duplicate `isExpired` check (lines 64-65)
- Manually attempts refresh

**New approach:**
- Use `useAuth()` hook
- Check if user is authenticated AND is admin
- If not admin, redirect to `/list`
- If not authenticated, redirect to `/`
- Remove all manual token checking logic

### Phase 8: Update Other Protected Pages

#### Files to update:
- `/src/app/list/page.tsx`
- `/src/app/first-connection/page.tsx`
- `/src/app/admin/add/page.tsx`
- `/src/app/admin/change-password/page.tsx`
- `/src/app/admin/superadmin/page.tsx`
- `/src/app/admin/superadmin/add-user/page.tsx`
- `/src/app/admin/superadmin/password/[id]/page.tsx`

**For each page:**
- Add `useAuth()` hook at component start
- Check authentication state
- Redirect if not authenticated
- For admin pages, also check `user.isAdmin`
- For superadmin pages, check `user.isMegaAdmin` or `user.username === 'Mathieu'`

**Pages that need auth:**
- `/list` - Regular users (just needs authentication)
- `/admin/*` - Admin users only
- `/admin/superadmin/*` - Super admin only

### Phase 9: Update Components Using Token

#### File: `/src/components/KdosList.tsx`

**Function: `fetchUsername()`** (lines 61-70)

**Current approach:**
- Manually gets token from localStorage
- Manually decodes and checks expiration
- Duplicates logic

**New approach:**
- Import `getUserInfo` from `/src/lib/auth`
- Simply call `getUserInfo()` to get username
- Remove manual token handling

### Phase 10: Update Add Item Page

#### File: `/src/app/admin/add/page.tsx`

**Issue:** Line 39 manually gets token from localStorage

**Fix:**
- The `api` instance from `/src/lib/api.ts` automatically adds tokens
- Change fetch call to use `api.post()` instead of manual fetch
- Remove line 39 (`const token = localStorage.getItem('authToken')`)
- Remove Authorization header from fetch (api.ts adds it)

## Testing Requirements

### Unit Tests

**File: `/src/lib/auth.test.ts`**

Tests for auth utilities:
1. `getTokenFromStorage` returns token when exists
2. `getTokenFromStorage` returns null when missing
3. `isTokenValid` returns true for valid unexpired token
4. `isTokenValid` returns false for expired token
5. `isTokenValid` returns false for malformed token
6. `decodeToken` successfully decodes valid JWT
7. `decodeToken` returns null for invalid JWT
8. `getUserInfo` returns user data from valid token
9. `clearAuthStorage` removes all auth items

### Integration Tests

**File: `/src/lib/api.test.ts`**

Tests for API interceptors:
1. Request interceptor adds Bearer token to headers
2. Request interceptor refreshes token when expiring soon
3. Response interceptor catches 401 and refreshes token
4. Response interceptor retries failed request after refresh
5. Refresh uses correct API URL (not hardcoded localhost)
6. Concurrent requests wait for single refresh operation

### E2E Tests (Manual Testing Checklist)

**Authentication Flow:**
- [ ] User can login successfully
- [ ] User stays logged in after 15 minutes of inactivity
- [ ] User stays logged in after 30 minutes of activity
- [ ] User is logged out after 7 days of no activity
- [ ] Token refreshes automatically before expiration
- [ ] Page navigation doesn't cause logout
- [ ] Admin redirect works correctly after login
- [ ] Regular user redirect works correctly after login
- [ ] First connection flow requires password change

**Session Persistence:**
- [ ] Refresh page maintains authentication
- [ ] Navigate between pages maintains authentication
- [ ] Close and reopen browser maintains authentication (within 7 days)
- [ ] Multiple tabs share authentication state

**Logout Flow:**
- [ ] Logout button clears all tokens
- [ ] Logout redirects to login page
- [ ] Cannot access protected pages after logout

## Implementation Order

1. **Backend** - Update token expiration config (safest, no dependencies)
2. **Auth utilities** - Create `/src/lib/auth.ts` (needed by all other changes)
3. **Auth hook** - Create `/src/hooks/useAuth.ts` (needed by components)
4. **API fix** - Fix hardcoded URL in `/src/lib/api.ts` (critical bug)
5. **Nav component** - Remove token deletion logic
6. **Login page** - Replace manual auth with useAuth hook
7. **Admin page** - Replace manual auth with useAuth hook
8. **Other pages** - Update remaining protected pages
9. **Components** - Update KdosList and other components
10. **Testing** - Verify all flows work correctly

## Risk Mitigation

**Potential Issues:**

1. **Server-side rendering:** Token checks must handle SSR gracefully
   - Solution: All localStorage access wrapped in try-catch with window check

2. **Race conditions:** Multiple simultaneous token refreshes
   - Solution: Already handled by `isRefreshing` flag in api.ts

3. **Stale user info:** User data cached in components
   - Solution: useAuth hook updates on pathname changes

4. **Breaking existing sessions:** Users logged in during deployment
   - Solution: Changes are backward compatible, existing tokens still work

## Success Criteria

- [ ] Users stay logged in for 7 days without re-authentication
- [ ] No premature logouts during navigation
- [ ] Token refresh happens automatically and transparently
- [ ] No duplicated auth logic across files
- [ ] All manual token checks replaced with centralized utilities
- [ ] Console shows successful token refresh every ~28 minutes
- [ ] No errors in production related to localhost URLs
- [ ] All tests pass

## Rollback Plan

If issues arise:
1. Revert backend config changes (restart server with old values)
2. Keep new auth utilities (harmless)
3. Revert component changes one by one
4. Priority: Revert Nav.tsx first (most critical)

## Notes

- The `isRefreshing` flag in api.ts prevents concurrent refresh requests
- The 120-second threshold (2 minutes) in api.ts ensures tokens refresh before expiration
- DecodedToken interface must match backend JWT payload structure
- Username "Mathieu" is hardcoded as super admin (business requirement)
