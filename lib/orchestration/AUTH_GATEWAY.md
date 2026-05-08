# SSR/Auth Gateway Architecture

## Design

```
                 ┌─────────────────────────────────┐
                 │        lib/auth/gateway.ts       │
                 │                                   │
                 │  verifySession()                   │
                 │  resolveRole()                     │
                 │  requireAuth()                     │
                 │  requireRole()                     │
                 │  getCurrentUser()                  │
                 │  isProtectedRoute()                │
                 └──────────┬──────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     middleware.ts      proxy.ts        Server Actions
     (current)         (future)         + Route Handlers
```

## Gateway Interface

```typescript
// lib/auth/gateway.ts

export const AuthGateway = {
  /**
   * Verify session from request cookies.
   * Returns user if valid, null otherwise.
   * SSR-safe. No side effects.
   */
  async verifySession(request?: NextRequest): Promise<User | null>,

  /**
   * Resolve role for a user ID.
   * Uses admin client to bypass RLS.
   */
  async resolveRole(userId: string): Promise<UserRole>,

  /**
   * Check if a path requires authentication.
   */
  isProtectedRoute(pathname: string): boolean,

  /**
   * Check if a path requires specific role(s).
   */
  requiredRolesForPath(pathname: string): UserRole[] | null,

  /**
   * Get current user for SSR (used in layouts/pages).
   */
  async getCurrentUser(): Promise<User | null>,

  /**
   * Build middleware response for auth decisions.
   * Handles redirects, 401s, etc.
   */
  async handleAuthDecision(
    request: NextRequest,
    user: User | null
  ): Promise<NextResponse | null>,
}
```

## Migration Path

1. ✅ Current: `middleware.ts` → `lib/supabase/middleware.ts` (direct coupling)
2. 🔄 NOW: `middleware.ts` → `lib/auth/gateway.ts` (abstraction layer)
3. 🔜 FUTURE: `proxy.ts` → `lib/auth/gateway.ts` (runtime swap)

## Benefits

- Auth orchestration lives in ONE file.
- Runtime (middleware vs proxy) is a thin import.
- SSR helpers share same logic.
- Role resolution is centralized.
- Testing: mock gateway, not middleware.
