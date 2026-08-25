# Airbone Admin — Reference Implementation Audit

> Analysis only. No code in Airbone, StreetPlayR, or NECTAR was modified to produce this document.
> Source: `C:\Users\pc\Desktop\Airbone\admin` (Next.js 15 / React 19, TS, Prisma 6 + Postgres, NextAuth v5 beta, TanStack Query v5 + Table v8, react-hook-form + zod, Radix UI + shadcn-style wrappers, Tailwind v4, framer-motion, Inngest, GCS/S3/Supabase storage, `@dnd-kit`, argon2). Domain: aviation training academy CRM + LMS + CMS. Package `airborne-admin`, port 4000.

---

## 1. Complete route map

Route groups: `(auth)`, `(dashboard)`, `(faculty)`, `(portal)`, plus `api/`, `dev/`, `health/`, `verify/`.

**Unauthenticated**
- `(auth)/login`, `forgot-password`, `reset-password`, `invite/[token]`
- `/verify/[code]` — public certificate/document verification
- `/health`, `/health/ready`

**Ops dashboard `(dashboard)`**
- `/` — main KPI dashboard
- `leads`, `leads/[id]` — CRM lead list/detail
- `crm/{dashboard,analytics,deals,integrations,integrations/facebook,integrations/facebook/callback,leads,meetings,outreach,pipeline}`
- `admissions`, `students`, `students/[id]`
- `courses` (marketing-facing course manager)
- `lms`, `lms/{assignments,attendance,batches,certificates,courses,courses/[id],timetable}`
- `cms`, `cms/pages`, `cms/pages/[id]`, `cms/pages/[id]/preview`
- `blog`, `resources`, `jobs`, `jobs/[id]`, `placements`, `testimonials`, `media`
- `users`, `settings`, `audit`, `notifications`, `profile`, `errors`, `vapi` (unconnected placeholder)

**`(faculty)`**: `faculty`, `faculty/students`

**`(portal)`** — student self-service: `portal`, `portal/{announcements,assessments,assignments,assistant,attendance,bookmarks,certificates,certificates/[certNo],certificates/[certNo]/print,courses,courses/[courseId],profile,progress}`

**`/dev/auto-login`** — dev-only, blocked in prod by middleware + page guard.

**API**: `api/auth/[...nextauth]`, `api/v1/auth/*`, `api/v1/*` (versioned REST, one dir per resource), `api/public/*` (unauthenticated marketing endpoints), `api/inngest`.

## 2. Feature/module map

CRM (leads, activities, routing, deals, pipeline, meetings, outreach, Facebook OAuth, analytics) · Admissions (stages, stage logs, documents, fee plans, payments) · Student records · LMS (courses→chapters→topics→contents→modules, batches, timetable, attendance, assignments, assessments/quizzes, certificates, announcements, chat, notifications, enrollments, progress, faculty + student-portal views) · Website CMS (pages→sections→blocks with versioning/rollback, nav menus, resources, testimonials w/ approval workflow, blog) · Careers (jobs, applications, hiring partners, placements) · Media library (folders/assets/usage) · Org/Users (orgs, campuses, users, invites, permissions) · System (audit logs, event logs, activity feed, notifications, workflows, feature flags) · Vapi voice-AI (stub).

## 3. Component inventory

- **UI primitives** `src/components/ui/` — shadcn-style Radix wrappers: `alert-dialog`, `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `scroll-area`, `select`, `separator`, `skeleton`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `tooltip`, `use-toast`.
- **Layout** `src/components/layout/` — `sidebar.tsx`, `topbar.tsx`, `command-palette.tsx`.
- **Shared** `src/components/shared/` — `data-table.tsx` (TanStack Table wrapper), `crm-data-table.tsx` (self-contained client table), `confirm-dialog.tsx`, `empty-state.tsx`, `media-picker.tsx`, `page-header.tsx`, `stat-card.tsx`, `status-badge.tsx`.
- **CMS** `src/components/cms/` — `block-editor.tsx`, `block-form.tsx`, `block-renderer.tsx`, `nav-menu-editor.tsx`, `page-editor.tsx`, `public-page-renderer.tsx`, `resource-manager.tsx`, `section-editor.tsx`, `version-history.tsx`.
- **LMS** `src/components/lms/print-button.tsx` — most LMS UI is embedded inline in page files, not componentized.
- **Portal** `src/components/portal/` — self-contained kit: `course-sidebar.tsx`, `portal-skeleton.tsx`, `portal-ui.tsx`, `portal.css`, `progress-ring.tsx`, `quiz-modal.tsx`, `types.ts`.

## 4. Dashboard architecture

`(dashboard)/page.tsx` (client component). Two `useQuery` calls (`/leads?page=1&limit=8`, `/dashboard/stats`). A hard-coded `STAT_CARDS` array (10 cards) renders as `motion.div` glass cards, responsive grid `1→3→5` cols, icon + colored badge + `Skeleton` loading. "Recent leads" panel (2/3 width) + static "Quick actions" 2×2 link grid (1/3 width). **No generic Widget/DashboardCard abstraction** — the reusable `StatCard` in `shared/` exists but this page doesn't use it; cards are inlined array + JSX instead. Worth noting as an anti-pattern to avoid copying.

## 5. Sidebar/navigation architecture

`layout/sidebar.tsx`: hard-coded `NAV_GROUPS` array of `{label, items:[{href,icon,label,badge?}]}`, grouped (Core Analytics / Integrations / CRM & Admissions / Student LMS / Website & CMS / System & Config). **No role-based filtering — all items render regardless of role.** Collapse state lifted to `(dashboard)/layout.tsx`, passed as props; collapsed = icon-only + Radix `Tooltip`, width toggles `w-16`/`w-64`. Active state: exact match for root, else `pathname.startsWith(href)`. One badge item (Testimonials pending-count) polls every 60s. `Topbar` adds search→`CommandPalette` trigger, notification dropdown (one-shot fetch, no polling), user menu with `signOut()`. `CommandPalette`: hard-coded `MODULES` array, local fuzzy filter, arrow-key nav, global ⌘K listener.

## 6. Table/list architecture

**Two parallel, non-unified implementations** — worth flagging as a real inconsistency in the reference itself, not a pattern to copy wholesale:
- `shared/data-table.tsx` — TanStack Table v8, `manualPagination`/`manualSorting` (server-driven). Props: `columns: ColumnDef<TData,TValue>[]`, `data`, `loading?`, `pageCount?`, `pagination?`, `onPaginationChange?`, `sorting?`, `onSortingChange?`, `emptyTitle?`, `emptyDescription?`, `className?`. Skeleton rows while loading, `EmptyState` when empty, 4-button pager.
- `shared/crm-data-table.tsx` — separate `CRMColumn<T>` shape (`key,header,sortable?,render?,className?,align?`), all-client-side search/sort/paginate via `useState`/`useMemo`, own baked-in search input.

## 7. Form architecture

Standard: **react-hook-form v7 + `@hookform/resolvers/zod` + zod**, schema defined next to the page, `useForm<X>({resolver: zodResolver(schema)})`, manual `Label`/`Input {...register()}`/inline error `<p>` — **no generic `<Form>`/`<FormField>` wrapper** (unlike typical shadcn `Form` primitives); every page hand-rolls JSX. Server validation mirrors client via `src/lib/validations/*.schema.ts` (one file per domain), consumed in route handlers, errors surfaced through central `handleError()`. CMS block forms instead render fields dynamically from a `blockType.schema` JSON definition — a schema-driven forms escape hatch, not RHF-based.

## 8. Modal/drawer architecture

Built on Radix, wrapped in `ui/dialog.tsx` + `alert-dialog.tsx`. **No drawer/sheet component exists.** Pattern: local `useState` boolean per page, controlled `<Dialog open={x} onOpenChange={setX}>`, form inside `DialogContent`, close on mutation `onSuccess`. Reusable generics: `shared/confirm-dialog.tsx` (`ConfirmDialog{open,onOpenChange,title,description?,confirmLabel?,cancelLabel?,onConfirm,variant?:"destructive"|"default",loading?}` wrapping `AlertDialog`), and `shared/media-picker.tsx` (self-contained `Dialog` w/ debounced search + asset grid). No global modal-manager/portal stack.

## 9. Search/filter architecture

No global search — topbar "Search" just opens `CommandPalette` (client array filter, not a real search API). No shared `<FilterBar>` component; each page hand-builds its filter row (debounced text search via manual `setTimeout(400ms)`/`clearTimeout` in `useEffect`, duplicated in at least `leads/page.tsx` and `media-picker.tsx` — **no shared `useDebounce` hook**, a gap to actually improve on rather than copy) + `Select` dropdowns folded into the TanStack Query `queryKey` so filter changes auto-refetch.

## 10. Authentication and authorization

**NextAuth v5 (beta), Credentials provider, `PrismaAdapter`.** Split config: `auth.config.ts` (edge-safe, used by middleware) vs `config.ts` (full Node — `jwt`/`session` callbacks inject `id,orgId,campusId,role,avatarUrl`; `authorize()` validates `{email,password,orgSlug}` via zod, resolves org by slug+active, user by email+orgId+active+not-deleted, `argon2.verify` password, updates `lastLoginAt`, writes an audit event on sign-in). Token refresh re-checks user still active on every request. `src/middleware.ts`: wraps `auth()`, defines `PUBLIC_PATHS`/`DEV_ONLY_PATHS` (404'd in prod), 401 JSON for unauth `/api/*`, redirect w/ `callbackUrl` for pages, injects `x-request-id/x-org-id/x-user-id/x-user-role` headers downstream (multi-tenant scoping signal). `(dashboard)/layout.tsx` also client-redirects `STUDENT` role → `/portal` (role-based landing enforced in two places).

## 11. Role/permission system

**Roles** (Prisma enum `UserRole`): `SUPER_ADMIN, ADMIN, MARKETING_MANAGER, CONTENT_MANAGER, ADMISSIONS_COUNSELOR, PLACEMENT_MANAGER, SUPPORT_STAFF, TEACHER, STUDENT`. **Code-based RBAC/ABAC**, not a DB join table (a `Permission` Prisma model exists for future dynamic overrides per a code comment). `lib/utils/permissions.ts` — static `PERMISSION_MATRIX: Record<UserRole, Record<resource, action[]>>`; `hasPermission(user,action,resource)` checks wildcard then resource; `meetsCondition()` adds **ABAC row-level checks** (`assigned_to:"self"`, `campus_id:"own"`) — this row-level condition layer is a genuinely good pattern. `lib/middleware/permissions.ts` — `guard()`/`guardRecord()` throw `ForbiddenError`; `getCounselorCondition()` self-scopes counselors. **Gap worth noting, not copying:** UI gating is server-side only — sidebar/`NAV_GROUPS`/`CommandPalette MODULES` render unconditionally regardless of role, so a `TEACHER`/`STUDENT` could see nav links to pages they have no data access to.

## 12. Rich text/editor implementation

**None** — no TipTap/Slate/Quill/Lexical/Draft.js. Content editing instead goes through a **block-based page builder**: `page-editor.tsx` → `section-editor.tsx` → `block-editor.tsx` → `block-form.tsx` (schema-driven per block type) → `block-renderer.tsx`/`public-page-renderer.tsx`. `nav-menu-editor.tsx` + `version-history.tsx` (version diff/rollback). Models: `ContentBlock, Page, PageSection, PageBlock, PageVersion`, with `/publish` and `/versions/[vid]/rollback` routes. Free-text fields elsewhere are plain `Textarea` — no markdown.

## 13. Media upload implementation

Two storage adapters: `lib/storage/gcs.ts` (GCS, signed v4 PUT URLs, 900s expiry, `uploadObject`/`createSignedUploadUrl`/`deleteObject`) and `lib/storage/supabase.ts` (alt/dev backend); S3 SDK deps also present, suggesting env-selectable backend. Flow: `/api/v1/media/presign` issues signed URL → client uploads direct to bucket → finalize via `/api/v1/media`. `MediaAsset`/`MediaFolder`/`MediaUsage` models track usage counts + folder hierarchy. `shared/media-picker.tsx` — reusable: 350ms debounced search, thumbnail/mime-icon grid, `Dialog`-based picker, selected-asset preview strip. No inline drag-drop uploader/cropper; `@dnd-kit` is used for block/section and LMS chapter/topic/content reordering instead.

## 14. API architecture

Route Handlers under `app/api/v1/**/route.ts`, one dir per resource, nested dynamic segments for sub-resources/actions (`leads/[id]/activities/[activityId]`, `leads/[id]/assign`, `leads/[id]/convert`, `courses/[id]/publish`, `courses/[id]/versions/[vid]/rollback`, `lms/chapters/reorder`). **Layering**: route → `guard()`/`guardRecord()` → zod validate → `*.service.ts` → `*.repository.ts` (Prisma) → `ok()`/`created()`/`noContent()` response helpers. **Envelope**: `{success:true,data,meta?}` / `{success:false,error:{code,message,details?}}`. Client wrapper `lib/api.ts`'s `apiFetch<T>()` — note it **drops `.meta`**, forcing pages needing pagination totals to bypass it and call `fetch()` raw (a documented workaround, not something to replicate). Centralized `handleError()` maps `ZodError`→400, typed `AppError` subclasses (`NotFoundError`404, `UnauthorizedError`401, `ForbiddenError`403, `ValidationError`400, `ConflictError`409, `RateLimitError`429, `StorageUnavailableError`503) → status codes, unknown → logged 500. Pagination via shared `getPaginationParams()`/`buildPaginationMeta()` (limit capped 100). Multi-tenancy via `x-org-id` header + Prisma `orgId` filter. Background jobs via **Inngest** (`lib/events/functions/*.functions.ts`) — event-driven side effects triggered from services, not inlined in handlers.

## 15. Loading/error/empty states

`ui/skeleton.tsx` base primitive, used ad hoc (dashboard stat cards, `data-table.tsx`'s 5 skeleton rows). `portal/portal-skeleton.tsx` — dedicated portal layout skeleton. `shared/empty-state.tsx` — generic `EmptyState({icon?,title,description?,action?})`, used in `DataTable`'s empty branch (though some pages still hand-roll their own dashed-border empty block instead of reusing it — inconsistency to avoid). **No error-boundary component** (`error.tsx`/`ErrorBoundary`) found; pages manually check `isError` from `useQuery` and render an inline error card + "Retry" `refetch()` button, duplicated per page rather than a shared `<ErrorState>`.

## 16. Notification/toast system

Custom shadcn-style toast: `ui/use-toast.ts` (reducer store, `TOAST_LIMIT=5`, `TOAST_REMOVE_DELAY=5000ms`, `variant:"default"|"destructive"|"success"`) + `toast.tsx` (Radix `react-toast`) + `toaster.tsx` (viewport, mounted in root layout). Called via `toast({title,description,variant})`. **Separate** in-app notification system: `Topbar` bell dropdown fetches `/notifications` (models `NotificationLog`/`NotificationTemplate`), `notification.service.ts`, `NotificationChannel`/`NotificationEvent` enums imply multi-channel (email/SMS/push) dispatch via Inngest. A distinct `LmsNotification` model serves the student portal.

## 17. Activity/timeline components

No single generic `<Timeline>`/`<ActivityFeed>` component — each domain implements its own list: **Audit** (`(dashboard)/audit/page.tsx` — full searchable/filterable log page reading `AuditLog`, `integrityHash` field implies tamper-evident hash-chaining, hand-built CSV export). **Lead activity** (`LeadActivity`/`LeadScoreHistory` models + `/leads/[id]/activities` routes). **Admission stage log** (`AdmissionStageLog`). **System-wide** (`ActivityFeedItem` + `EventLog` models, surfaced via Topbar's "System Activity Alert" panel: `actor.name performed {verb} on {objectType} {objectId}`).

## 18. Settings architecture

Single tabbed page (`(dashboard)/settings/page.tsx`, 196 lines, `activeTab` state). Settings are a **loosely-typed JSON bag** (`org.settings: Record<string,unknown>`) rather than discrete columns: `applicationIntake` (bool, enforced on public intake), `maintenanceMode` (bool, enforced — 503s public routes), `forceDebugLogs` (bool, stored but explicitly **not yet consumed**, flagged by a code comment), plus webhook URL strings (Razorpay/Vapi/WhatsApp) also stored-only pending integration. KPI cards show intake/maintenance state as color-coded badges. Org/campus data layer exists (`Organization`/`Campus` models + repo/service + `/organizations/[id]/campuses`) but no dedicated campus-management UI surfaced. User-level: `profile` page (RHF) + `/users/me/password`.

## 19. Reusable UI patterns worth noting

- **Design tokens**: `globals.css` Tailwind v4 `@theme` block, full dark HSL palette (`--color-background/foreground/card/popover/primary/secondary/muted/accent/destructive/border/input/ring/success/warning`), `--radius:0.75rem`, `--font-sans:"Inter"`, `color-scheme:dark` — **dark-only, no light theme toggle**.
- **Glassmorphism utilities**: `.glass-panel` (blurred translucent, dropdowns/dialogs/palette) + `.glass-card` (stat cards/panels, hover lift + border-glow) — consistent card visual language layered on top of shadcn `Card`.
- **`cn()`** (`lib/utils.ts`, clsx + tailwind-merge) used everywhere.
- **`class-variance-authority`** for `button`/`badge` variant props.
- **`framer-motion`** as a consistent micro-interaction layer (stat-card stagger-in, palette fade/scale, bulk-action toolbar slide-in) — not just decoration.
- **Zod-schema-per-domain convention**: `lib/validations/*.schema.ts` mirrors `lib/services/*` and `lib/repositories/*` 1:1 — clean layered service/repository/validation separation, genuinely worth carrying forward as an architectural convention (not literal code).
- **`StatusBadge` domain-map pattern** (`shared/status-badge.tsx`): one component, `domain` prop selects a per-domain color map (`lead,admission,job,job_application,resource,testimonial,student,course`) — extensible-ish, though the domain list is still hard-coded/closed.

## 20. Features that should NOT be copied

Everything below is aviation-academy/India-market-specific and must be genericized or dropped, not ported as-is:

- **Branding**: "Airborne OS" name, `Plane` icon logo, "Enterprise Aviation CRM" / "Aviation Academy Operations Platform" copy in sidebar + login page; default `orgSlug:"airborne-aviation"`, placeholder `admin@airborne.academy`.
- **Placeholder copy**: lead form placeholders ("Captain Arjun Kapoor", "DGCA CPL Ground School", medical-eligibility callback text).
- **`UserRole` enum & `PERMISSION_MATRIX`**: `ADMISSIONS_COUNSELOR`, `PLACEMENT_MANAGER`, `TEACHER` etc. are education/admissions-specific role names baked directly into `permissions.ts`, route protections, and Prisma enums — a generic template needs a role-abstraction layer, not these literal names.
- **Domain models as "core" schema**: `Admission`, `AdmissionStage` (INQUIRY/DOCUMENT_COLLECTION/INTERVIEW/ENROLLED/REJECTED), `Placement`, `HiringPartner`, `FeePlan`, all `Lms*` models — training-institute business logic, not generic CRM/CMS primitives.
- **Vapi voice-AI module** — named after a specific third-party product for "candidate calls," admissions-specific use case, currently an unconnected placeholder anyway.
- **Currency/locale**: hard-coded `₹` + lakhs formatting (`/100000).toFixed(1)}L`) on the dashboard revenue stat, `toLocaleString("en-IN")` timestamps in `topbar.tsx` — India-specific assumptions baked into otherwise-generic code.
- **Storage bucket default**: `GCS_BUCKET` defaults to `"airborne-aviation-media-prod"` — must be env-driven with no domain-specific fallback.
- **Settings integrations set**: Razorpay/Vapi/WhatsApp webhook fields are India/aviation-academy-specific; StreetPlayR already uses Easebuzz — this integration list doesn't transfer.

---

*Companion document: [`ADMIN_FEATURE_REUSE_MATRIX.md`](./ADMIN_FEATURE_REUSE_MATRIX.md) maps each Airbone capability against StreetPlayR's existing `app/admin` ("OpsOS") and NECTAR's `apps/ecosystem-ops`, with reuse/adapt/rebuild guidance and priority.*
