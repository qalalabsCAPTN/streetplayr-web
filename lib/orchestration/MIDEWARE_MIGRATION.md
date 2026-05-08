# Middleware → Proxy Migration Strategy

## Current State (Before)

```
middleware.ts (root)
  │
  └── lib/supabase/middleware.ts
        │
        ├── createServerClient()
        ├── getUser()
        └── isProtectedRoute() [inline logic]
```

Problem: Auth logic is coupled to the middleware runtime.

## Migration Steps

### Step 1: Insert Gateway (NOW — this PR)

```
middleware.ts (root)
  │
  └── lib/auth/gateway.ts          ← NEW
        │
        ├── lib/supabase/middleware.ts  ← session refresh
        ├── lib/auth/permissions.ts     ← role checks
        └── lib/auth/service.ts     ← profile fetch
```

### Step 2: Create Proxy (Next.js 16 stable)

```
proxy.ts (root — replaces middleware.ts)
  │
  └── lib/auth/gateway.ts          ← UNCHANGED
        │
        ├── lib/supabase/middleware.ts
        ├── lib/auth/permissions.ts
        └── lib/auth/service.ts
```

### Step 3: Remove Middleware (after proxy verified)

```
proxy.ts (root)
  │
  └── lib/auth/gateway.ts          ← STILL UNCHANGED
```

## Key Principle

**The gateway interface never changes.**

Only the entry point file (middleware.ts → proxy.ts) changes.
All auth orchestration logic remains in the gateway.
