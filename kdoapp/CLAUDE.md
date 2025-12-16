# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application for managing gift lists (wishlists), built with TypeScript, React 19, and Tailwind CSS. The app allows users to view gift ideas for family members, and admins to manage those lists. It features a Christmas theme option and integrates with a FastAPI backend.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code with Prettier
npx prettier --write .
```

## Docker Build

The project includes a multi-stage Dockerfile:

```bash
# Build with environment variables
docker build \
  --build-arg NEXT_PUBLIC_API_URL=<api_url> \
  --build-arg NEXT_PUBLIC_THEME=<theme> \
  -t kdoapp .

# Run container
docker run -p 3000:3000 kdoapp
```

**Build arguments:**
- `NEXT_PUBLIC_API_URL`: Backend API URL (e.g., `http://localhost:8000`)
- `NEXT_PUBLIC_THEME`: Theme setting (`default` or `christmas`)

## Architecture

### Authentication Flow

The app uses JWT-based authentication with access and refresh tokens:

1. Login occurs at `/` (root page), which stores tokens in localStorage
2. `src/lib/api.ts` contains an Axios instance with interceptors that:
   - Automatically refresh tokens when they expire within 120 seconds
   - Retry failed requests with 401 errors after refreshing
   - Handle concurrent requests during token refresh

**Important:** The api.ts interceptors handle token refresh automatically. Always use the `api` instance from `@/lib/api` for authenticated requests.

### User Roles

- **Regular users**: Can view gift lists and mark items as reserved
- **Admins** (`isAdmin: true`): Can edit their own gift list
- **Super admin** (hardcoded as username "Mathieu"): Has additional admin panel access

### Route Structure

```
/                           - Login page
/first-connection           - Password change on first login
/list                       - View gift lists (query param: ?user=NAME)
/admin                      - Admin panel to manage gift items
/admin/add                  - Add new gift item
/admin/change-password      - Change password
/admin/superadmin           - Super admin panel
/admin/superadmin/add-user  - Add new user
/admin/superadmin/password/[id] - Reset user password
```

### Key Components

- **Nav.tsx**: Navigation bar with conditional rendering based on user role
- **KdosList.tsx**: Displays gift items in a grid, fetches data from API
- **DialogKdo.tsx**: Dialog for reserving/unreserving gift items
- **FormModifyItem.tsx**: Form for editing/deleting gift items (admin only)
- **FormModifyPwd.tsx**: Password change form

### Data Flow

1. Components use the `api` instance from `src/lib/api.ts` for API calls
2. API endpoints are proxied through Next.js rewrites (see `next.config.ts`)
3. Images are served from `/api/kdos/` which rewrites to the FastAPI backend
4. User authentication state is managed via localStorage and decoded JWT tokens

### Theming

The app supports two themes controlled by `NEXT_PUBLIC_THEME`:
- `default`: Standard birthday theme with sky blue colors
- `christmas`: Holiday theme with red/green colors and Christmas fonts

Theme-specific styling is applied conditionally throughout components using the `theme` constant.

### Environment Variables

Required environment variables (set at build time):
- `NEXT_PUBLIC_API_URL`: Backend API base URL
- `NEXT_PUBLIC_THEME`: Application theme (`default` or `christmas`)

### TypeScript Configuration

- Path alias: `@/*` maps to `./src/*`
- Strict mode enabled
- Target: ES2017

### API Integration

The backend is a FastAPI application. Key endpoints:
- `POST /api/login/`: Authentication (returns access + refresh tokens)
- `POST /api/refresh/`: Refresh access token
- `POST /api/auth/logout/`: Logout
- `GET /api/kdos/`: Fetch gift items (supports `?user=NAME` filter)
- `GET /api/kdos-admin/`: Admin endpoint to fetch items with full details
- Images: `/api/kdos/{filename}` (proxied through Next.js)

### Code Style

- Prettier configuration in `.prettierrc`:
  - Single quotes
  - 2-space indentation
  - Semicolons required
  - 80 character line width
  - ES5 trailing commas

## Important Notes

1. **Token Management**: Never implement manual token refresh logic. The `src/lib/api.ts` interceptors handle this automatically.

2. **Hardcoded Users**: The app currently hardcodes two users (Marie-Eve and Mathieu) in several places. When modifying user-related features, search for these names to find all references.

3. **Image Rewrites**: Images are served through Next.js rewrites. In production, the backend hostname is `fastapi` (Docker networking); in development, it's `localhost:8000`.

4. **Client Components**: Most pages and components use `'use client'` directive since they rely on browser APIs (localStorage, router, etc.).

5. **Authentication Check Pattern**: Pages that require authentication follow this pattern:
   - Check for `authToken` in localStorage
   - Decode JWT and verify expiration
   - Redirect to `/` if token is invalid or expired
   - Redirect based on user role (admin vs regular user)

6. **Form Validation**: Forms use Zod schemas with `@hookform/resolvers` for validation.
