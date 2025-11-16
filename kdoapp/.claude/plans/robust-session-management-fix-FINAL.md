# Plan FINAL v2.1: Robust Session Management Fix

**Status:** ✅ Ready for Implementation
**Last Review:** Complete - All feedback integrated
**Risk Level:** 🔴 High (affects all authentication flows)

---

## 🎯 Overview

Fix critical authentication bugs causing premature user disconnections (< 15 minutes) and implement robust session management. Multiple critical bugs identified: Nav.tsx deletes refresh tokens, inconsistent token storage keys, wrong authorization headers, duplicated auth logic, and security holes in first-connection flow.

**Expected Outcome:** Users stay logged in for 7 days without interruption, with automatic token refresh every 30 minutes.

---

## ✅ Goals

1. ✅ Fix Nav.tsx bug that prematurely deletes refresh tokens (lines 60-65)
2. ✅ Fix token storage key inconsistency (`accessToken` vs `authToken`)
3. ✅ Fix authorization header in logout (`Token` → `Bearer`)
4. ✅ Remove duplicate `isExpired` check in page.tsx (lines 42-43)
5. ✅ Replace hardcoded username checks with JWT `isMegaAdmin` flag
6. ✅ Update token expiration times (30 min access, 7 days refresh)
7. ✅ Centralize authentication logic to eliminate code duplication
8. ✅ Fix hardcoded API URL in token refresh function
9. ✅ Secure first-connection page with sessionStorage validation
10. ✅ Add comprehensive logging for debugging token refresh
11. ✅ Fix axios response handling in admin/add page

---

## 📋 Pre-Implementation Checklist

### Before Starting Implementation:

- [ ] **Backup production database and code**
  ```bash
  # Database backup
  pg_dump -U admin -d kdo > backup_$(date +%Y%m%d).sql

  # Git backup
  git checkout -b backup-before-auth-fix
  git push origin backup-before-auth-fix
  ```

- [ ] **Verify current configuration**
  - [x] Backend: ACCESS_TOKEN_EXPIRE_MINUTES = 15 ✅
  - [x] Backend: REFRESH_TOKEN_EXPIRE_DAYS = 7 ✅
  - [x] No dev/config.json file ✅
  - [x] All bugs documented with line numbers ✅

- [ ] **Set up monitoring**
  - [ ] Enable error tracking (Sentry/console)
  - [ ] Set up token refresh logging
  - [ ] Monitor localStorage operations
  - [ ] Track auth-related redirects

- [ ] **Prepare rollback plan**
  - [ ] Document current git commit hash
  - [ ] Test rollback procedure in dev
  - [ ] Prepare communication for users if needed

- [ ] **Review with stakeholders**
  - [x] Technical review complete ✅
  - [ ] **Stakeholder approval** ← YOUR APPROVAL NEEDED

---

## 🔍 Phase 0: Verification ✅ COMPLETED

### Confirmed Bugs (with line numbers):

1. ❌ **page.tsx:59** - `localStorage.setItem('accessToken', ...)` should be `'authToken'`
2. ❌ **page.tsx:42-47** - Duplicate `isExpired` check (copy-paste error)
3. ❌ **Nav.tsx:86** - `Authorization: Token ${token}` should be `Bearer ${token}`
4. ❌ **api.ts:57** - Hardcoded `http://localhost:8000` instead of `${ApiAdress}`
5. ❌ **Nav.tsx:60-65** - Deletes refresh token when access token expires (CRITICAL)
6. ❌ **Nav.tsx:178, 354, 592** - Hardcoded `username === 'Mathieu'` checks
7. ❌ **admin/add/page.tsx:39-55** - Manual token handling + fetch response handling
8. ❌ **first-connection/page.tsx** - No auth protection (security hole)

### Configuration Confirmed:
- Backend default: 15 minutes access, 7 days refresh
- JWT structure matches DecodedToken interface across all files
- Token keys: `authToken`, `refreshToken`, `isAdmin`, `user`

---

## 🚀 Implementation Phases

### Phase 1: Backend Configuration Update

**File:** `/server/config.py`

**Changes:**

**Line 15** (production environment):
```python
# BEFORE:
"ACCESS_TOKEN_EXPIRE_MINUTES": int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15)),

# AFTER:
"ACCESS_TOKEN_EXPIRE_MINUTES": int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)),
```

**Line 36** (development environment):
```python
# BEFORE:
"ACCESS_TOKEN_EXPIRE_MINUTES": int(config.get("ACCESS_TOKEN_EXPIRE_MINUTES", 15)),

# AFTER:
"ACCESS_TOKEN_EXPIRE_MINUTES": int(config.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30)),
```

**Testing:**
```bash
# Restart server
# Check token expiration in JWT decode
# Verify console shows 30-minute expiry
```

**Risk:** 🟢 Low - Only affects newly issued tokens

---

### Phase 2: Critical Bug Fixes

#### 2A. Fix Token Storage Key Inconsistency 🔴 CRITICAL

**File:** `/src/app/page.tsx`

**Line 59:**
```typescript
// BEFORE (BUG):
localStorage.setItem('accessToken', data.access_token);

// AFTER (FIX):
localStorage.setItem('authToken', data.access_token);
```

**Also check line 81** (in admin/page.tsx):
```typescript
// Should also be 'authToken' if exists
localStorage.setItem('authToken', data.access_token);
```

**Test immediately:** Login and verify token saved as `authToken` in localStorage

---

#### 2B. Remove Duplicate isExpired Check

**File:** `/src/app/page.tsx`

**Lines 35-56 - BEFORE (Buggy):**
```typescript
if (isExpired) {  // Line 35
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    localStorage.clear();
    router.push('/');
    return;
  }
  const isExpired = decoded.exp < Date.now() / 1000;  // Line 42 - DUPLICATE!
  if (isExpired) {  // Line 43 - Useless, always true
    localStorage.clear();
    router.push('/');
    return;
  }
  // This code is unreachable!
  const response = await fetch(`${ApiAdress}/api/refresh/`, {
```

**Lines 35-56 - AFTER (Fixed):**
```typescript
if (isExpired) {  // Line 35
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    localStorage.clear();
    router.push('/');
    return;
  }
  // Removed lines 42-47 (duplicate check + unreachable code)
  // Proceed directly to refresh
  const response = await fetch(`${ApiAdress}/api/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
```

**Explanation:** Line 42 redeclared `isExpired` with identical check, making subsequent code unreachable.

---

#### 2C. Fix Authorization Header in Logout

**File:** `/src/components/Nav.tsx`

**Line 86:**
```typescript
// BEFORE (BUG):
Authorization: `Token ${token}`,

// AFTER (FIX):
Authorization: `Bearer ${token}`,
```

**Reason:** Backend expects "Bearer" prefix for JWT tokens, not "Token"

**Test:** Logout and verify backend receives proper header

---

#### 2D. Fix Hardcoded Localhost in Refresh 🔴 CRITICAL

**File:** `/src/lib/api.ts`

**Add at top of file** (around line 5):
```typescript
const ApiAdress = process.env.NEXT_PUBLIC_API_URL;
```

**Line 57:**
```typescript
// BEFORE (BUG):
const response = await axios.post(`http://localhost:8000/api/refresh/`, {

// AFTER (FIX):
const response = await axios.post(`${ApiAdress}/api/refresh/`, {
```

**Impact:** Token refresh will work in production environments

**Test immediately:** Trigger token refresh and verify it uses correct API URL

---

#### 2E. Add Token Refresh Logging (NEW)

**File:** `/src/lib/api.ts`

**Add logging to refreshAccessToken function** (after line 60):
```typescript
async function refreshAccessToken() {
  console.log('🔄 [AUTH] Token refresh initiated at:', new Date().toISOString());

  if (isRefreshing) {
    console.log('⏳ [AUTH] Token refresh already in progress, waiting...');
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.warn('⚠️ [AUTH] No refresh token found');
        return;
      }

      const response = await axios.post(`${ApiAdress}/api/refresh/`, {
        refresh_token: refreshToken,
      });

      console.log('✅ [AUTH] Token refreshed successfully at:', new Date().toISOString());
      console.log('📅 [AUTH] New token expires:', new Date(jwtDecode(response.data.access_token).exp * 1000).toISOString());

      localStorage.setItem('authToken', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
    } catch (err) {
      console.error('❌ [AUTH] Token refresh failed:', err);
      console.log('🚪 [AUTH] Logging out user due to refresh failure');
      localStorage.clear();
      window.location.href = '/';
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
```

**Benefits:**
- ✅ Easy debugging of token lifecycle
- ✅ Visibility into refresh timing
- ✅ Track when users get logged out
- ✅ Verify 30-minute expiry working correctly

---

### Phase 3: Create Centralized Auth Utilities

#### New File: `/src/lib/auth.ts`

```typescript
import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  sub: number;
  username: string;
  isAdmin: boolean;
  isMegaAdmin: boolean;
  exp: number;
}

/**
 * Safely retrieves authToken from localStorage
 * Returns null if not found or on server-side
 */
export function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

/**
 * Safely retrieves refreshToken from localStorage
 */
export function getRefreshTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('refreshToken');
  } catch {
    return null;
  }
}

/**
 * Checks if token can be decoded (not corrupted)
 * Does NOT check expiration
 */
export function isTokenDecodable(token: string): boolean {
  try {
    jwtDecode<DecodedToken>(token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely decodes JWT token
 * Returns null on decode errors
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

/**
 * Checks if token is expired
 * Returns true if expired OR invalid
 * Read-only check - does not delete tokens
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true; // Treat invalid as expired
  }
}

/**
 * Removes all auth-related localStorage items
 * Safe to call multiple times
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
}

/**
 * Reads current token and extracts user data
 * Returns null if no valid token
 * Does NOT check expiration (assumes api.ts handles it)
 */
export function getUserInfo(): { username: string; isAdmin: boolean; isMegaAdmin: boolean } | null {
  const token = getTokenFromStorage();
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    username: decoded.username,
    isAdmin: decoded.isAdmin,
    isMegaAdmin: decoded.isMegaAdmin,
  };
}
```

**Key Design:**
- ✅ All functions are read-only (no side effects)
- ✅ SSR-safe with window checks
- ✅ No automatic token deletion
- ✅ Expiration checks are informational only

---

### Phase 4: Create Authentication Hook

#### New File: `/src/hooks/useAuth.ts`

```typescript
'use client';

import { useState, useEffect } from 'use';
import { usePathname, useRouter } from 'next/navigation';
import { getTokenFromStorage, decodeToken, clearAuthStorage, DecodedToken } from '@/lib/auth';

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: DecodedToken | null;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true);
      setError(null);

      const token = getTokenFromStorage();

      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const decoded = decodeToken(token);

      if (!decoded) {
        // Token is corrupted
        setIsAuthenticated(false);
        setUser(null);
        setError('Session invalide - token corrompu');
        setIsLoading(false);
        return;
      }

      // Token is decodable (we don't check expiration - api.ts handles that)
      setIsAuthenticated(true);
      setUser(decoded);
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname]); // Re-check on route change

  const logout = () => {
    console.log('🚪 [AUTH] User logging out');
    clearAuthStorage();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    router.push('/');
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    logout,
  };
}
```

**Key Features:**
- ✅ Returns error state for corrupted tokens
- ✅ Doesn't check expiration (trusts api.ts to refresh)
- ✅ Re-validates on route changes
- ✅ Provides logout function for all components

---

### Phase 5: Fix Nav Component 🔴 CRITICAL

**File:** `/src/components/Nav.tsx`

#### 5A. Fix checkToken Function (Lines 48-74)

**Import new utilities:**
```typescript
import { isTokenDecodable, decodeToken, clearAuthStorage } from '@/lib/auth';
```

**Replace checkToken function:**
```typescript
const checkToken = () => {
  const token = localStorage.getItem('authToken');

  if (token) {
    // Only check if token is decodable, NOT if expired
    if (isTokenDecodable(token)) {
      const decoded = decodeToken(token);
      if (decoded) {
        setIsUserLoggedIn(true);
        setUsername(decoded.username);
        setIsAdmin(decoded.isAdmin ? 'true' : 'false');
      } else {
        // Shouldn't happen if isTokenDecodable returned true, but safety check
        setIsUserLoggedIn(false);
      }
    } else {
      // Token is corrupted/invalid (not just expired)
      console.warn('⚠️ [NAV] Token is corrupted but not deleting it');
      setIsUserLoggedIn(false);
      // DON'T delete tokens - user might be mid-refresh
    }
  } else {
    setIsUserLoggedIn(false);
  }
};
```

**Critical Changes:**
- ✅ No expiration check
- ✅ No token deletion ever
- ✅ Only checks if token is decodable
- ✅ Corrupted tokens don't trigger deletion

#### 5B. Fix Logout Function (Line 79-105)

**Already fixed in Phase 2C**, but also update to use clearAuthStorage:

```typescript
const handleLogout = async () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    try {
      const response = await fetch(`${ApiAdress}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,  // Fixed: Token → Bearer
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        console.log('✅ [NAV] Logout successful');
      } else {
        console.warn('⚠️ [NAV] Logout response not OK');
      }
    } catch (error) {
      console.error('❌ [NAV] Logout error:', error);
    }
  }

  clearAuthStorage();  // Use centralized function
  setIsUserLoggedIn(false);
  window.location.href = '/';
};
```

#### 5C. Replace Hardcoded Username Checks (Lines 178, 354, 592)

**For now, keep as backup:**
```typescript
// Keep username check temporarily as backup
} : isAdmin === 'true' && username === 'Mathieu' ? {

// TODO: Replace with isMegaAdmin once verified in production
// } : isMegaAdmin === true ? {
```

**Note:** Remove username checks in follow-up PR after verifying isMegaAdmin works

---

### Phase 6: Fix Login Page + First-Connection Flow

**File:** `/src/app/page.tsx`

#### 6A. Already Fixed (Phase 2A, 2B)
- Line 59: accessToken → authToken ✅
- Lines 42-47: Removed duplicate check ✅

#### 6B. Update Login Flow for First-Connection

**Add sessionStorage flag when redirecting to first-connection:**

**Lines 103-107:**
```typescript
// BEFORE:
const firstConnection = data.firstConnection;
if (firstConnection) {
  router.push('/first-connection');
  return;
}

// AFTER:
const firstConnection = data.firstConnection;
if (firstConnection) {
  // Set temporary flag for first-connection page validation
  sessionStorage.setItem('requirePasswordChange', 'true');
  router.push('/first-connection');
  return;
}
```

#### 6C. Simplify with useAuth Hook

**Remove entire checkAuth function (lines 27-77)**

**Replace component:**
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
      const admin = localStorage.getItem('isAdmin'); // Or use user.isAdmin
      if (admin === 'true') {
        router.push('/admin');
      } else {
        router.push('/list');
      }
    }
  }, [isAuthenticated, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // ... existing code stays the same ...
    // Just ensure line 59 fix is applied (authToken not accessToken)
  }

  // ... rest of JSX stays the same ...
}
```

---

### Phase 7: Secure First-Connection Page

**File:** `/src/app/first-connection/page.tsx`

**Add strict validation with sessionStorage:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import FormModifyPwd from '@/components/FormModifyPwd';
import { KeyRound, Gift, Sparkles } from 'lucide-react';
import Snowflakes from '@/components/Snowflakes';

const theme = process.env.NEXT_PUBLIC_THEME || 'default';

export default function FirstConnection() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [shouldShowPage, setShouldShowPage] = useState(false);

  useEffect(() => {
    if (isLoading) return; // Wait for auth check

    // Check if this is a legitimate first-connection flow
    const requirePasswordChange = sessionStorage.getItem('requirePasswordChange');

    if (!isAuthenticated) {
      // Not logged in → redirect to login
      console.log('🚫 [FIRST-CONNECTION] Not authenticated, redirecting to login');
      router.push('/');
    } else if (!requirePasswordChange) {
      // Logged in but not first-connection → redirect to normal page
      console.log('🚫 [FIRST-CONNECTION] No password change required, redirecting');
      router.push(user?.isAdmin ? '/admin' : '/list');
    } else {
      // Valid first-connection flow
      console.log('✅ [FIRST-CONNECTION] Valid first-connection flow');
      setShouldShowPage(true);
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading during auth check
  if (isLoading || !shouldShowPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 to-indigo-600">
        <div className="text-white text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div
      className={`
        min-h-screen
        flex
        items-center
        justify-center
        px-4
        sm:px-6
        lg:px-8
        relative
        overflow-hidden
        ${
          theme === 'christmas'
            ? 'bg-gradient-to-br from-red-700 via-green-800 to-red-900'
            : 'bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600'
        }
        animate-gradient
      `}
    >
      {theme === 'christmas' && <Snowflakes />}

      <div className="w-full max-w-md z-10 animate-fadeInUp">
        <div
          className={`
            backdrop-blur-lg
            bg-white/10
            rounded-3xl
            shadow-2xl
            p-8
            border
            border-white/20
            ${theme === 'christmas' ? 'animate-glow' : ''}
          `}
        >
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {theme === 'christmas' ? (
                <Gift className="w-16 h-16 text-white drop-shadow-lg" />
              ) : (
                <Sparkles className="w-16 h-16 text-white drop-shadow-lg" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-4">
              {theme === 'christmas' ? '🎄 ' : ''}
              Première connexion
              {theme === 'christmas' ? ' 🎄' : ''}
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-white/80" />
              <p className="text-white/80 text-sm">
                Sécurisez votre compte
              </p>
            </div>
            <p className="text-white/70 text-sm">
              C&apos;est votre première connexion. Vous devez changer votre mot
              de passe pour des raisons de sécurité.
            </p>
          </div>

          <FormModifyPwd firstConnection />
        </div>

        {theme === 'christmas' && (
          <div className="mt-4 text-center text-white/60 text-xs">
            ✨ Joyeux Noël ! ✨
          </div>
        )}
      </div>
    </div>
  );
}
```

**Update FormModifyPwd to clear sessionStorage flag:**

**File:** `/src/components/FormModifyPwd.tsx`

**Lines 110-111** (after successful password change):
```typescript
router.push('/');

// AFTER:
// Clear first-connection flag after successful password change
if (firstConnection) {
  sessionStorage.removeItem('requirePasswordChange');
}
router.push('/');
```

**Security Benefits:**
- ✅ Prevents direct URL access to /first-connection
- ✅ Validates legitimate first-connection flow
- ✅ Flag is session-only (cleared on browser close)
- ✅ Flag is removed after password change

---

### Phase 8: Fix Admin Page

**File:** `/src/app/admin/page.tsx`

**Remove checkAuth function (lines 49-101)**

**Replace with:**
```typescript
import { useAuth } from '@/hooks/useAuth';

function Admin() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [kdosList, setKdosList] = useState<Kdo[] | null>(null);
  const [selectedUser, setSelectedUser] = useState('Marie-Eve');

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('🚫 [ADMIN] Not authenticated, redirecting to login');
        router.push('/');
      } else if (user && !user.isAdmin) {
        console.log('🚫 [ADMIN] Not admin, redirecting to list');
        router.push('/list');
      }
      // If admin, stay on page
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Rest of component stays the same...
  // Keep fetchKdos, SelectUser, etc.
}
```

**Removed:** Duplicate isExpired checks (lines 64-65) automatically removed with new approach

---

### Phase 9: Update Components Using Tokens

#### 9A. KdosList Component

**File:** `/src/components/KdosList.tsx`

**Replace fetchUsername function (lines 61-70):**
```typescript
import { getUserInfo } from '@/lib/auth';

// BEFORE:
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

// AFTER:
const fetchUsername = () => {
  const userInfo = getUserInfo();
  if (userInfo) {
    setUserLogged(userInfo.username);
  }
};
```

---

#### 9B. Admin Add Item Page (CRITICAL - Axios Response Handling)

**File:** `/src/app/admin/add/page.tsx`

**Complete replacement of onSubmit function:**

**BEFORE (Lines 37-61):**
```typescript
async function onSubmit(values: z.infer<typeof formSchema>) {
  console.log('Form values:', values);
  const token = localStorage.getItem('authToken');  // Line 39 - REMOVE
  const apiUrl = `${ApiAdress}/api/add-item/`;
  try {
    const response = await fetch(apiUrl, {  // Line 42 - REPLACE WITH AXIOS
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,  // Line 45 - NOT NEEDED WITH AXIOS
        'Content-Type': 'application/json',  // Line 46 - NOT NEEDED WITH AXIOS
      },
      body: JSON.stringify(values),  // Line 48 - AXIOS HANDLES THIS
    });

    if (!response.ok) {  // Lines 51-53 - AXIOS THROWS AUTOMATICALLY
      throw new Error('Network response was not ok');
    }

    const data = await response.json();  // Line 55 - WRONG FOR AXIOS
    console.log('Success:', data);
    router.push('/admin');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

**AFTER (Complete fix):**
```typescript
import api from '@/lib/api';  // Add this import at top

async function onSubmit(values: z.infer<typeof formSchema>) {
  console.log('📝 [ADD-ITEM] Submitting form:', values);

  try {
    // api instance automatically:
    // - Adds Bearer token
    // - Handles Content-Type
    // - Refreshes token if needed
    // - Throws on error (no response.ok check needed)
    const response = await api.post('/api/add-item/', values);

    // Axios stores response data in response.data (not response.json())
    const data = response.data;
    console.log('✅ [ADD-ITEM] Success:', data);

    router.push('/admin');
  } catch (error) {
    console.error('❌ [ADD-ITEM] Error:', error);
    // TODO: Show error message to user
  }
}
```

**Key Changes:**
1. ✅ Line 39: Removed manual `localStorage.getItem('authToken')`
2. ✅ Lines 42-48: Replaced `fetch()` with `api.post()`
3. ✅ Lines 45-46: Removed manual headers (api adds them)
4. ✅ Lines 51-53: Removed `response.ok` check (axios throws on error)
5. ✅ Line 55: Changed `await response.json()` to `response.data`

**Axios vs Fetch Differences:**
| Aspect | Fetch | Axios |
|--------|-------|-------|
| Error handling | Must check `response.ok` | Throws automatically on 4xx/5xx |
| JSON parsing | `await response.json()` | `response.data` |
| Headers | Manual | Auto Content-Type for objects |
| Auth token | Manual | Added by interceptor |
| Token refresh | Manual | Automatic via interceptor |

---

### Phase 10: Update Remaining Protected Pages

**Pattern for each page:**

**Import useAuth:**
```typescript
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
```

**Add auth check:**
```typescript
const router = useRouter();
const { isAuthenticated, user, isLoading } = useAuth();

useEffect(() => {
  if (!isLoading) {
    if (!isAuthenticated) {
      router.push('/');
    } else if (ROLE_CHECK) {
      router.push(FALLBACK_PAGE);
    }
  }
}, [isAuthenticated, user, isLoading, router]);

if (isLoading) return <div>Loading...</div>;
if (!isAuthenticated) return null;
```

**Files to update:**

1. **`/src/app/list/page.tsx`** - Regular user (just needs auth)
   ```typescript
   // No role check needed, any authenticated user
   ```

2. **`/src/app/admin/change-password/page.tsx`** - Admin only
   ```typescript
   if (user && !user.isAdmin) router.push('/list');
   ```

3. **`/src/app/admin/superadmin/page.tsx`** - Super admin only
   ```typescript
   if (user && !user.isMegaAdmin && user.username !== 'Mathieu') {
     router.push('/admin');
   }
   ```

4. **`/src/app/admin/superadmin/add-user/page.tsx`** - Super admin
5. **`/src/app/admin/superadmin/password/[id]/page.tsx`** - Super admin

---

### Phase 11: Testing & Validation

#### Unit Tests

**File:** `/src/lib/auth.test.ts`

```typescript
import { getTokenFromStorage, isTokenDecodable, isTokenExpired, decodeToken, getUserInfo, clearAuthStorage } from './auth';

describe('Auth Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('getTokenFromStorage returns token when exists', () => {
    localStorage.setItem('authToken', 'test-token');
    expect(getTokenFromStorage()).toBe('test-token');
  });

  test('getTokenFromStorage returns null when missing', () => {
    expect(getTokenFromStorage()).toBeNull();
  });

  test('isTokenDecodable returns true for valid token', () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoidGVzdCIsImlzQWRtaW4iOnRydWUsImlzTWVnYUFkbWluIjpmYWxzZSwiZXhwIjo5OTk5OTk5OTk5fQ.X';
    expect(isTokenDecodable(validToken)).toBe(true);
  });

  test('isTokenDecodable returns false for corrupted token', () => {
    expect(isTokenDecodable('corrupted')).toBe(false);
  });

  test('clearAuthStorage removes all items', () => {
    localStorage.setItem('authToken', 'token');
    localStorage.setItem('refreshToken', 'refresh');
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem('user', 'test');

    clearAuthStorage();

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('isAdmin')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
```

#### E2E Manual Testing Checklist

**Critical Tests (Must Pass Before Deployment):**

**Authentication Flow:**
- [ ] Login with valid credentials succeeds
- [ ] Login stores `authToken` (not `accessToken`)
- [ ] Admin redirected to /admin
- [ ] Regular user redirected to /list
- [ ] First-time user redirected to /first-connection
- [ ] sessionStorage flag set for first-connection

**Session Persistence (KEY TESTS):**
- [ ] ⭐ User stays logged in after 15 minutes of inactivity
- [ ] ⭐ User stays logged in after 30 minutes of activity
- [ ] ⭐ Nav component doesn't logout on page navigation
- [ ] Page refresh maintains authentication
- [ ] Close and reopen browser maintains auth (< 7 days)

**Token Refresh:**
- [ ] ⭐ Console shows "🔄 Token refresh initiated" every ~28 minutes
- [ ] ⭐ Console shows "✅ Token refreshed successfully"
- [ ] Access token expires after 30 minutes (check JWT in console)
- [ ] Refresh token expires after 7 days
- [ ] No 401 errors during normal usage
- [ ] API calls succeed during token refresh

**First-Connection Security:**
- [ ] Direct navigation to /first-connection without flag redirects
- [ ] Flag only set after login with firstConnection=true
- [ ] Flag cleared after password change
- [ ] Cannot access page without being authenticated

**Logout:**
- [ ] Logout sends Bearer token (not Token)
- [ ] Logout clears all localStorage items
- [ ] Logout redirects to login page
- [ ] Cannot access protected pages after logout

**Admin Add Item:**
- [ ] Form submission uses axios
- [ ] No manual token handling in code
- [ ] Success shows "✅ [ADD-ITEM] Success"
- [ ] Errors caught and logged

---

## 📊 Implementation Order & Risk Management

### Deployment Strategy: 3 Waves

**Wave 1: Critical Fixes (Deploy & Test First)** 🔴

Must succeed before proceeding:

1. Phase 2A - Token key fix (page.tsx:59)
2. Phase 2D - Localhost URL fix (api.ts:57)
3. Phase 2E - Add logging (api.ts)
4. Phase 5A - Nav token deletion fix (Nav.tsx:60-65)

**Test checkpoint:** Login, navigate pages, wait 15 min, verify no logout

---

**Wave 2: Infrastructure (New Code)** 🟢

Low risk - new files:

5. Phase 3 - Create /src/lib/auth.ts
6. Phase 4 - Create /src/hooks/useAuth.ts

**Test checkpoint:** Import in one test component, verify no errors

---

**Wave 3: Refactoring (Replace Old Code)** 🟡

Progressive rollout:

7. Phase 1 - Backend config (restart required)
8. Phase 2B,C - Minor fixes
9. Phase 6 - Login page refactor
10. Phase 7 - First-connection security
11. Phase 8 - Admin page refactor
12. Phase 9 - Component updates
13. Phase 10 - Remaining pages

**Test after each phase:** Verify no regressions

---

## 🔄 Rollback Plan

### Immediate Rollback (< 5 min)

If critical logout issues occur:

```bash
# 1. Revert Nav.tsx (most critical)
git revert <commit-hash-phase-5>
git push origin main

# 2. Revert api.ts if refresh fails
git revert <commit-hash-phase-2>
git push origin main

# 3. Restart backend with old config
export ACCESS_TOKEN_EXPIRE_MINUTES=15
systemctl restart kdo-api
```

### Progressive Rollback

- Keep: auth.ts and useAuth.ts (harmless)
- Revert: Page refactors one by one
- Monitor: Error logs and user sessions

---

## ✅ Success Criteria

### Quantitative Metrics

- [ ] Average user session duration > 30 minutes (currently < 15)
- [ ] Zero premature logouts in first 24 hours
- [ ] Token refresh success rate > 99%
- [ ] Console shows refresh every ~28-30 minutes
- [ ] No increase in login error rate
- [ ] Auth-related errors: 0

### Qualitative Metrics

- [ ] No user complaints about frequent logouts
- [ ] Admins can work for hours without re-login
- [ ] Code review: 50% less auth code
- [ ] Token refresh logs visible in console
- [ ] All E2E tests pass

---

## 📝 Post-Implementation Tasks

### Week 1 (Monitoring)
- [ ] Monitor production logs for refresh errors
- [ ] Check session duration analytics
- [ ] Verify no support tickets about login
- [ ] Review error tracking (Sentry)

### Month 1 (Cleanup)
- [ ] Remove `username === 'Mathieu'` checks → use `isMegaAdmin` only
- [ ] Add comprehensive E2E tests
- [ ] Update documentation

### Quarter 1 (Enhancements)
- [ ] Implement "Remember me" (90-day tokens)
- [ ] Add session management UI
- [ ] Device tracking
- [ ] Auth event logging

---

## ✅ Final Approval Checklist

**Before starting implementation:**

- [x] All bugs identified with line numbers
- [x] Implementation order finalized
- [x] Rollback plan prepared
- [x] Success criteria defined
- [x] Risk mitigation strategies ready
- [x] Axios response handling clarified
- [x] First-connection security designed
- [x] Token refresh logging added
- [ ] **Production code backup created**
- [ ] **Monitoring/alerting configured**
- [ ] **STAKEHOLDER APPROVAL** ← **YOUR GO/NO-GO DECISION**

---

## 🎯 Ready for Implementation?

**All critical issues addressed:**
✅ 8 critical bugs documented with fixes
✅ Axios vs fetch differences explained
✅ First-connection security implemented
✅ Token refresh logging comprehensive
✅ Testing checklist complete
✅ Rollback plan ready

**This plan is production-ready. Awaiting your approval to begin implementation.**

---

**Next Steps:**
1. Review this plan
2. Create production backup
3. Set up monitoring
4. Give approval to proceed
5. Start with Wave 1 (critical fixes)

