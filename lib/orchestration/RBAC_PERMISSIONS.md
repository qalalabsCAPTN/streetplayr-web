# RBAC Permission Map

## Roles

```sql
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'ops_admin',
  'fulfillment',
  'editorial',
  'support',
  'viewer',
  'member'
);
```

## Permission Matrix

| Area | super_admin | ops_admin | fulfillment | editorial | support | viewer | member |
|---|---|---|---|---|---|---|---|
| **OpsOS Access** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Products: View** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Products: Create/Edit** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Products: Archive** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Drops: View** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Drops: Create/Schedule** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Drops: Publish** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Orders: View** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Orders: Fulfill** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Orders: Cancel/Refund** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Orders: Edit** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Customers: View** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Customers: Edit** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Wallet: View** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Wallet: Adjust** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Content: Edit** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Content: Publish** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Users: Manage Roles** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **System: Configure** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reports: View** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

## Permission Helper (Implementation)

Defined in `lib/auth/permissions.ts` — used by gateway, middleware, and components.
