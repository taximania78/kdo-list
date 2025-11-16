# Plan v2: Robust Session Management Fix

**Status:** Ready for Implementation
**Last Updated:** Based on comprehensive code review
**Risk Level:** 🔴 High (affects all authentication flows)

## Overview

Fix critical authentication bugs causing premature user disconnections (< 15 minutes) and implement robust session management across the application. The current system has multiple bugs: Nav.tsx deletes refresh tokens prematurely, inconsistent token storage keys, wrong authorization headers, and duplicated auth logic across pages.

## Goals

1. ✅ Fix Nav.tsx bug that prematurely deletes refresh tokens (lines 60-65)
2. ✅ Fix token storage key inconsistency (`accessToken` vs `authToken`)
3. ✅ Fix authorization header in logout (`Token` → `Bearer`)
4. ✅ Remove duplicate `isExpired` check in page.tsx (lines 42-43)
5. ✅ Replace hardcoded username checks with JWT `isMegaAdmin` flag
6. ✅ Update token expiration times (30 min access, 7 days refresh)
7. ✅ Centralize authentication logic to eliminate code duplication
8. ✅ Fix hardcoded API URL in token refresh function
9. ✅ Ensure automatic token refresh works seamlessly

## Pre-Implementation Verification (Phase 0)

### Verification Checklist

**Backend Configuration:**
- ✅ Current `ACCESS_TOKEN_EXPIRE_MINUTES`: **15** (confirmed in server/config.py:15,36)
- ✅ Current `REFRESH_TOKEN_EXPIRE_DAYS`: **7** (confirmed in server/config.py:16,37)
- ✅ No dev/config.json file exists (dev directory doesn't exist)
- ⚠️ Only server/config.py needs updating

**JWT Payload Structure:**
```typescript
interface DecodedToken {
  sub: number;           // User ID
  username: string;      // Username
  isAdmin: boolean;      // Admin flag
  isMegaAdmin: boolean;  // Super admin flag
  exp: number;           // Expiration timestamp
}
```
- ✅ Matches across all files (api.ts, page.tsx, admin/page.tsx, Nav.tsx)

**Token Storage Keys:**
- ❌ **INCONSISTENCY FOUND:**
  - Login sets: `authToken` (page.tsx:98)
  - Refresh sets: `accessToken` (page.tsx:59) ← **BUG**
  - api.ts reads: `authToken` (api.ts:84)
  - Nav reads: `authToken` (Nav.tsx:49,80)

**API Endpoints:**
- Login: `POST /api/login/` (returns access_token, refresh_token)
- Refresh: `POST /api/refresh/` (returns access_token, refresh_token)
- Logout: `POST /api/auth/logout/`

**Critical Bugs Confirmed:**
1. ❌ Line 59 in page.tsx: `localStorage.setItem('accessToken', ...)` should be `authToken`
2. ❌ Lines 42-43 in page.tsx: Duplicate `isExpired` check (copy-paste error)
3. ❌ Line 86 in Nav.tsx: `Authorization: Token ${token}` should be `Bearer ${token}`
4. ❌ Line 57 in api.ts: Hardcoded `http://localhost:8000` in refresh
5. ❌ Lines 60-65 in Nav.tsx: Deletes refresh token when access token expires
6. ❌ Lines 178, 354, 592 in Nav.tsx: `username === 'Mathieu'` should use `isMegaAdmin`

## Files to Modify

### Backend (1 file)
1. `/server/config.py` - Update ACCESS_TOKEN_EXPIRE_MINUTES default

### Frontend - New Files (2 files)
1. `/src/lib/auth.ts` - Centralized auth utilities
2. `/src/hooks/useAuth.ts` - React hook for authentication

### Frontend - Bug Fixes (3 files - CRITICAL)
1. `/src/app/page.tsx` - Lines 42, 59 (duplicate check, wrong key)
2. `/src/lib/api.ts` - Line 57 (hardcoded localhost)
3. `/src/components/Nav.tsx` - Lines 60-65, 86, 178, 354, 592

### Frontend - Refactoring (8 files)
1. `/src/app/admin/page.tsx` - Remove redundant auth
2. `/src/app/list/page.tsx` - Add auth protection
3. `/src/app/admin/add/page.tsx` - Use api instance
4. `/src/app/admin/change-password/page.tsx` - Add auth check
5. `/src/components/KdosList.tsx` - Use getUserInfo
6. `/src/app/admin/superadmin/page.tsx` - Add auth check
7. `/src/app/admin/superadmin/add-user/page.tsx` - Add auth check
8. `/src/app/admin/superadmin/password/[id]/page.tsx` - Add auth check

## Implementation Plan

### Phase 0: Pre-Flight Verification ✅ COMPLETED

**Status:** All bugs identified and documented above

**No action needed** - Verification complete, proceed to Phase 1

---

### Phase 1: Backend Configuration Update

**File:** `/server/config.py`

**Changes:**
1. Line 15 (production): Change `15` to `30`
   ```python
   "ACCESS_TOKEN_EXPIRE_MINUTES": int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)),
   ```

2. Line 36 (development): Change `15` to `30`
   ```python
   "ACCESS_TOKEN_EXPIRE_MINUTES": int(config.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30)),
   ```

**Testing:**
- Restart backend server
- Verify tokens now expire after 30 minutes
- Check console logs for token expiration time

**Risk:** 🟡 Medium - Existing sessions will keep their original expiration

---

### Phase 2: Critical Bug Fixes (High Priority)

#### 2A. Fix Token Storage Key Inconsistency

**File:** `/src/app/page.tsx`

**Line 59 - Change:**
```typescript
// BEFORE (BUG):
localStorage.setItem('accessToken', data.access_token);

// AFTER (FIX):
localStorage.setItem('authToken', data.access_token);
```

**Line 81 - Also check if there's another instance:**
```typescript
// Should also be 'authToken' everywhere
localStorage.setItem('authToken', data.access_token);
```

**Impact:** Users will stay logged in after refresh token operations

---

#### 2B. Remove Duplicate isExpired Check

**File:** `/src/app/page.tsx`

**Lines 35-47 - Current buggy code:**
```typescript
if (isExpired) {  // Line 35 - First check
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    localStorage.clear();
    router.push('/');
    return;
  }
  const isExpired = decoded.exp < Date.now() / 1000;  // Line 42 - DUPLICATE
  if (isExpired) {  // Line 43 - Useless check
    localStorage.clear();
    router.push('/');
    return;
  }
```

**Fix - Remove lines 42-47:**
```typescript
if (isExpired) {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    localStorage.clear();
    router.push('/');
    return;
  }
  // Removed duplicate check - proceed directly to refresh
  const response = await fetch(`${ApiAdress}/api/refresh/`, {
```

**Explanation:** Line 42 redeclares `isExpired` with the same check as line 35, making lines 43-47 unreachable dead code. This is clearly a copy-paste error.

---

#### 2C. Fix Authorization Header in Logout

**File:** `/src/components/Nav.tsx`

**Line 86 - Change:**
```typescript
// BEFORE (BUG):
Authorization: `Token ${token}`,

// AFTER (FIX):
Authorization: `Bearer ${token}`,
```

**Note:** The backend expects "Bearer" for JWT tokens, not "Token"

---

#### 2D. Fix Hardcoded Localhost in Refresh

**File:** `/src/lib/api.ts`

**Line 57 - Change:**
```typescript
// BEFORE (BUG):
const response = await axios.post(`http://localhost:8000/api/refresh/`, {

// AFTER (FIX):
const response = await axios.post(`${ApiAdress}/api/refresh/`, {
```

**Add at top of file if missing:**
```typescript
const ApiAdress = process.env.NEXT_PUBLIC_API_URL;
```

**Impact:** Token refresh will work in production environments

---

### Phase 3: Create Centralized Auth Utilities

#### New File: `/src/lib/auth.ts`

**Purpose:** Single source of truth for all token operations

**Exports:**

```typescript
export interface DecodedToken {
  sub: number;
  username: string;
  isAdmin: boolean;
  isMegaAdmin: boolean;
  exp: number;
}
```

**Functions:**

1. **`getTokenFromStorage(): string | null`**
   - Safely retrieves authToken from localStorage
   - Returns null if not found or on server-side
   - Handles SSR gracefully with try-catch

2. **`getRefreshTokenFromStorage(): string | null`**
   - Safely retrieves refreshToken from localStorage
   - Returns null if not found or on server-side

3. **`isTokenDecodable(token: string): boolean`**
   - Checks if token can be decoded (not corrupted)
   - Does NOT check expiration
   - Returns false for malformed tokens

4. **`decodeToken(token: string): DecodedToken | null`**
   - Safely decodes JWT token
   - Returns null on decode errors
   - Uses jwt-decode library

5. **`isTokenExpired(token: string): boolean`**
   - Decodes and checks if exp < now
   - Returns true if expired OR invalid
   - Used for read-only checks only

6. **`clearAuthStorage(): void`**
   - Removes: authToken, refreshToken, isAdmin, user
   - Single source for cleanup
   - Safe to call multiple times

7. **`getUserInfo(): { username: string; isAdmin: boolean; isMegaAdmin: boolean } | null`**
   - Reads current token and extracts user data
   - Returns null if no valid token
   - Does NOT check expiration (assumes api.ts handles it)

**Key Design Principle:**
- ✅ Read-only checks (no side effects)
- ✅ No automatic token deletion
- ✅ SSR-safe with window checks
- ✅ Expiration checks are informational only

---

### Phase 4: Create Authentication Hook

#### New File: `/src/hooks/useAuth.ts`

**Hook:** `useAuth()`

**Returns:**
```typescript
{
  isAuthenticated: boolean;      // Has valid, decodable token
  user: DecodedToken | null;     // Current user info
  isLoading: boolean;            // Initial check in progress
  error: string | null;          // Decode errors, corruption
  logout: () => void;            // Clear storage + redirect
}
```

**Behavior:**

1. **On Mount:**
   - Check if token exists in localStorage
   - Try to decode token
   - Set `isAuthenticated = true` if decodable
   - Set `error` if token is corrupted
   - Does NOT check expiration (api.ts handles that)

2. **On pathname Change:**
   - Re-check token validity
   - Update user state

3. **Error Handling:**
   - If token is corrupted: `error = "Session invalide"`
   - If no token: `isAuthenticated = false`, `error = null`
   - If decodable but expired: `isAuthenticated = true` (let api.ts refresh)

4. **Logout Function:**
   - Calls `clearAuthStorage()`
   - Redirects to `/`
   - Can be called from any component

**Key Feature:** The hook trusts api.ts to handle expiration and refresh. It only checks if the token is present and decodable.

---

### Phase 5: Fix Nav Component (CRITICAL - Highest Risk)

**File:** `/src/components/Nav.tsx`

#### 5A. Fix checkToken Function (Lines 48-74)

**BEFORE (Buggy):**
```typescript
const checkToken = async () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const isExpired = decoded.exp < Date.now() / 1000;

      if (!isExpired) {
        setIsUserLoggedIn(true);
        setUsername(localStorage.getItem('user'));
        setIsAdmin(localStorage.getItem('isAdmin'));
      } else {
        // ❌ BUG: DELETES REFRESH TOKEN!
        setIsUserLoggedIn(false);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');  // ← THIS IS THE PROBLEM
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('user');
      }
    } catch (error) {
      setIsUserLoggedIn(false);
    }
  }
};
```

**AFTER (Fixed):**
```typescript
import { isTokenDecodable, decodeToken } from '@/lib/auth';

const checkToken = () => {
  const token = localStorage.getItem('authToken');

  if (token) {
    // Only check if token is decodable, NOT if expired
    if (isTokenDecodable(token)) {
      const decoded = decodeToken(token);
      setIsUserLoggedIn(true);
      setUsername(decoded?.username || null);
      setIsAdmin(decoded?.isAdmin ? 'true' : 'false');
    } else {
      // Token is corrupted/invalid (not just expired)
      setIsUserLoggedIn(false);
      // Still don't delete tokens - user might fix by refreshing
    }
  } else {
    setIsUserLoggedIn(false);
  }
};
```

**Key Changes:**
- ✅ No expiration check (api.ts handles that)
- ✅ No token deletion (ever)
- ✅ Only checks if token is decodable
- ✅ Corrupted tokens don't delete refresh token

---

#### 5B. Fix Logout Authorization Header (Line 86)

**Already covered in Phase 2C** - Change `Token` to `Bearer`

---

#### 5C. Replace Hardcoded Username Checks

**Lines to change: 178, 354, 592**

**BEFORE:**
```typescript
} : username === 'Mathieu' ? {
```

**AFTER:**
```typescript
} : isAdmin === 'true' && username === 'Mathieu' ? {  // Keep for now as backup
// TODO: Once isMegaAdmin is confirmed in JWT, replace with:
// } : isMegaAdmin === true ? {
```

**Note:** Keep username check as backup until we 100% confirm isMegaAdmin works in production. Remove in follow-up PR.

---

### Phase 6: Fix Login Page

**File:** `/src/app/page.tsx`

#### 6A. Already fixed in Phase 2A (line 59)
#### 6B. Already fixed in Phase 2B (lines 42-47)

#### 6C. Simplify checkAuth with useAuth Hook

**Remove entire checkAuth function (lines 27-77)**

**Replace with:**
```typescript
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // User already logged in, redirect based on role
      if (user.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/list');
      }
    }
  }, [isAuthenticated, user, router]);

  // Keep handleSubmit as-is (already correct)
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // ... existing code ...
  }
}
```

**Benefits:**
- ✅ No manual token checks
- ✅ No duplicate code
- ✅ useAuth hook handles all edge cases

---

### Phase 7: Fix Admin Page

**File:** `/src/app/admin/page.tsx`

**Remove checkAuth function (lines 49-101)**

**Replace with:**
```typescript
import { useAuth } from '@/hooks/useAuth';

function Admin() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [kdosList, setKdosList] = useState<Kdo[] | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not logged in
        router.push('/');
      } else if (user && !user.isAdmin) {
        // Logged in but not admin
        router.push('/list');
      }
      // If admin, stay on page
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Keep fetchKdos and rest of component as-is
}
```

**Also has duplicate isExpired check (lines 64-65)** - removed by new approach

---

### Phase 8: Update Remaining Protected Pages

For each page below, add authentication check at the top:

#### Pattern for Regular User Pages:

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  // Rest of component...
}
```

#### Pattern for Admin-Only Pages:

```typescript
useEffect(() => {
  if (!isLoading) {
    if (!isAuthenticated) {
      router.push('/');
    } else if (user && !user.isAdmin) {
      router.push('/list');
    }
  }
}, [isAuthenticated, user, isLoading, router]);
```

#### Pattern for Super Admin Pages:

```typescript
useEffect(() => {
  if (!isLoading) {
    if (!isAuthenticated) {
      router.push('/');
    } else if (user && !user.isMegaAdmin) {
      // Fallback: also check username === 'Mathieu' for safety
      if (user.username !== 'Mathieu') {
        router.push('/admin');
      }
    }
  }
}, [isAuthenticated, user, isLoading, router]);
```

**Files to Update:**

1. `/src/app/list/page.tsx` - Regular user pattern
2. `/src/app/first-connection/page.tsx` - Regular user pattern (already redirected from login)
3. `/src/app/admin/add/page.tsx` - Admin pattern + fix line 39 (see Phase 9)
4. `/src/app/admin/change-password/page.tsx` - Admin pattern
5. `/src/app/admin/superadmin/page.tsx` - Super admin pattern
6. `/src/app/admin/superadmin/add-user/page.tsx` - Super admin pattern
7. `/src/app/admin/superadmin/password/[id]/page.tsx` - Super admin pattern

---

### Phase 9: Update Components Using Tokens

#### 9A. KdosList Component

**File:** `/src/components/KdosList.tsx`

**Function: fetchUsername (lines 61-70)**

**BEFORE:**
```typescript
const fetchUsername = async () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    const decoded = jwtDecode<DecodedToken>(token);
    const isExpired = decoded.exp < Date.now() / 1000;
    if (!isExpired) {
      setUserLogged(decoded.username);
    }
  }
};
```

**AFTER:**
```typescript
import { getUserInfo } from '@/lib/auth';

const fetchUsername = () => {
  const userInfo = getUserInfo();
  if (userInfo) {
    setUserLogged(userInfo.username);
  }
};
```

---

#### 9B. Admin Add Item Page

**File:** `/src/app/admin/add/page.tsx`

**Line 39-48 - BEFORE:**
```typescript
const token = localStorage.getItem('authToken');
const apiUrl = `${ApiAdress}/api/add-item/`;
try {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  });
```

**AFTER:**
```typescript
import api from '@/lib/api';

// Remove line 39 entirely
const apiUrl = '/api/add-item/';
try {
  const response = await api.post(apiUrl, values);
  // api instance automatically adds Bearer token
```

**Benefits:**
- ✅ No manual token handling
- ✅ Automatic token refresh
- ✅ Consistent with rest of app

---

### Phase 10: Testing & Validation

#### Unit Tests

**File:** `/src/lib/auth.test.ts`

1. ✅ `getTokenFromStorage` returns token when exists
2. ✅ `getTokenFromStorage` returns null when missing
3. ✅ `getTokenFromStorage` handles SSR gracefully
4. ✅ `isTokenDecodable` returns true for valid token
5. ✅ `isTokenDecodable` returns false for corrupted token
6. ✅ `isTokenExpired` returns true for expired token
7. ✅ `isTokenExpired` returns false for valid token
8. ✅ `decodeToken` extracts correct user data
9. ✅ `getUserInfo` returns null when no token
10. ✅ `clearAuthStorage` removes all 4 localStorage items

**File:** `/src/hooks/useAuth.test.ts`

1. ✅ Hook returns isAuthenticated=true for valid token
2. ✅ Hook returns error for corrupted token
3. ✅ Hook returns isAuthenticated=false for no token
4. ✅ Logout function clears storage
5. ✅ Hook updates on pathname change

**File:** `/src/lib/api.test.ts`

1. ✅ Refresh uses ApiAdress not localhost
2. ✅ Request interceptor adds Bearer token
3. ✅ Request interceptor refreshes when expiring soon
4. ✅ Response interceptor catches 401
5. ✅ Response interceptor retries after refresh
6. ✅ Concurrent requests share single refresh

---

#### E2E Manual Testing Checklist

**Authentication Flow:**
- [ ] User can login with valid credentials
- [ ] Invalid credentials show error
- [ ] First-time user redirected to password change
- [ ] Admin redirected to /admin after login
- [ ] Regular user redirected to /list after login

**Session Persistence:**
- [ ] User stays logged in after 15 minutes of inactivity ⭐ KEY TEST
- [ ] User stays logged in after 30 minutes of activity
- [ ] Token refreshes automatically (check console logs)
- [ ] Page refresh maintains authentication
- [ ] Navigate between pages maintains authentication
- [ ] Close and reopen browser maintains auth (< 7 days)

**Token Refresh:**
- [ ] Access token expires after 30 minutes (check JWT exp)
- [ ] Refresh token expires after 7 days (check JWT exp)
- [ ] Automatic refresh happens ~2 min before expiration
- [ ] Console shows "Refreshing token..." message
- [ ] No 401 errors during normal usage
- [ ] API calls succeed during token refresh

**Nav Component:**
- [ ] Nav shows correct links for regular users
- [ ] Nav shows correct links for admins
- [ ] Nav shows super admin link only for Mathieu
- [ ] Logout button works correctly
- [ ] User info displayed correctly in Nav
- [ ] Nav doesn't cause logout on page change ⭐ KEY TEST

**Authorization:**
- [ ] Regular users cannot access /admin routes
- [ ] Non-super-admins cannot access /admin/superadmin
- [ ] Unauthorized access redirects appropriately
- [ ] Protected pages redirect to login when not authenticated

**Edge Cases:**
- [ ] Corrupted token handled gracefully
- [ ] Missing refresh token logs out user
- [ ] Expired refresh token requires re-login
- [ ] Concurrent API calls don't cause multiple refreshes
- [ ] SSR doesn't crash on localStorage access

---

## Implementation Order & Risk Management

### High-Risk Changes (Do First, Test Thoroughly)

| Phase | Files | Risk | Test Before Next Phase |
|-------|-------|------|------------------------|
| 2A | page.tsx line 59 | 🔴 High | Login flow still works |
| 2D | api.ts line 57 | 🔴 High | Token refresh works |
| 5A | Nav.tsx lines 60-65 | 🔴 CRITICAL | Nav doesn't logout users |

**Strategy:** Deploy these 3 fixes first, test in production, then proceed.

### Medium-Risk Changes (Phased Rollout)

| Phase | Files | Risk | Notes |
|-------|-------|------|-------|
| 3-4 | New files | 🟢 Low | No existing code affected |
| 6 | page.tsx refactor | 🟡 Medium | Can rollback easily |
| 7 | admin/page.tsx | 🟡 Medium | Can rollback easily |

### Low-Risk Changes (Can batch)

| Phase | Files | Risk | Notes |
|-------|-------|------|-------|
| 2B-C | Minor fixes | 🟢 Low | Duplicate check, header |
| 8-9 | Other pages | 🟢 Low | Progressive enhancement |
| 1 | Backend config | 🟢 Low | Only affects new tokens |

---

## Rollback Plan

If critical issues occur after deployment:

### Immediate Rollback (< 5 min)

1. **Revert Nav.tsx** (Phase 5A) - Most critical
   ```bash
   git revert <commit-hash-phase-5>
   ```

2. **Revert api.ts** (Phase 2D) - If refresh fails
   ```bash
   git revert <commit-hash-phase-2d>
   ```

3. **Restart backend** with old config
   ```bash
   export ACCESS_TOKEN_EXPIRE_MINUTES=15
   restart server
   ```

### Progressive Rollback (If needed)

- Keep: New auth utilities (harmless)
- Revert: Page refactors one by one
- Monitor: User sessions and error logs

### Safety Net

- All token changes are backward compatible
- Existing valid sessions continue to work
- Users only need to re-login if their session truly expired

---

## Success Metrics

### Quantitative

- [ ] User session duration avg > 30 minutes (currently < 15)
- [ ] Zero premature logouts in first 24 hours
- [ ] Token refresh success rate > 99%
- [ ] No increase in login error rate
- [ ] Console errors related to auth: 0

### Qualitative

- [ ] No user complaints about frequent logouts
- [ ] Admin users can work uninterrupted for hours
- [ ] Code review: Less than 50% of previous auth code
- [ ] New developer onboarding: Single useAuth hook to learn

---

## Post-Implementation Tasks

### Immediate (Week 1)

1. Monitor production logs for token refresh errors
2. Check user session duration analytics
3. Verify no increase in support tickets about login
4. Review Sentry/error tracking for auth-related errors

### Short-term (Month 1)

1. Remove username === 'Mathieu' checks (use isMegaAdmin only)
2. Add comprehensive E2E tests for auth flows
3. Document auth architecture in /docs
4. Create runbook for auth-related incidents

### Long-term (Quarter 1)

1. Implement "Remember me" feature (90-day tokens)
2. Add session management UI (view active sessions)
3. Implement device tracking
4. Add auth event logging (login, logout, refresh)

---

## Critical Bug Summary

### Must Fix Before Deployment

1. ✅ **Line 59 page.tsx:** `accessToken` → `authToken`
2. ✅ **Lines 42-47 page.tsx:** Remove duplicate `isExpired` check
3. ✅ **Line 86 Nav.tsx:** `Token` → `Bearer`
4. ✅ **Line 57 api.ts:** Remove hardcoded localhost
5. ✅ **Lines 60-65 Nav.tsx:** Stop deleting refresh token

### Should Fix (Less Critical)

6. ✅ Lines 178, 354, 592 Nav.tsx: Hardcoded username checks
7. ✅ Line 39 admin/add/page.tsx: Manual token handling

---

## Approval Checklist

Before starting implementation:

- [x] All bugs identified and documented
- [x] Implementation order finalized
- [x] Rollback plan prepared
- [x] Success criteria defined
- [x] Risk mitigation strategies in place
- [ ] Stakeholder approval (YOU)
- [ ] Backup of current production code
- [ ] Monitoring/alerting configured

---

**Ready to implement?** This plan addresses all critical bugs, provides clear implementation steps, and includes comprehensive testing and rollback strategies.
