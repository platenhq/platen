# Phase 5 — Auth Strategy

**Goal:** Decide and implement the long-term authentication approach — customize Clerk deeply or migrate to custom auth — without breaking Liveblocks integration.

**Depends on:** [Phase 0 — Tooling](./phase-0-tooling.md). [Phase 3 — Core Product Features & Database Architecture](./phase-3-core-product-features.md) recommended (Postgres user table simplifies custom auth).

**Estimated effort:** 1 week (Clerk Elements) **or** 3–4 weeks (full custom auth)

---

## 5.1 Current auth architecture

| Component        | Clerk usage                                             |
| ---------------- | ------------------------------------------------------- |
| `middleware.ts`  | `clerkMiddleware()` protects routes                     |
| `app/layout.tsx` | `<ClerkProvider>` wraps app                             |
| Sign-in/up pages | `<SignIn>`, `<SignUp>` with `@clerk/themes`             |
| Server actions   | `currentUser()`, `clerkClient()`                        |
| Liveblocks auth  | `app/api/liveblocks-auth/route.ts` uses `currentUser()` |
| User resolution  | `getClerkUsers()` looks up users by email via Clerk API |
| Share flow       | Access keyed by **email** in Liveblocks `usersAccesses` |

Any auth change must preserve or migrate the Liveblocks `identifyUser` flow and email-based room access.

---

## 5.2 Decision matrix

### Option A — Stay on Clerk, customize heavily (recommended first)

| Pros                                    | Cons                              |
| --------------------------------------- | --------------------------------- |
| Auth, OAuth, MFA, sessions already done | Per-MAU pricing at scale          |
| Liveblocks integration works today      | Less control over auth data model |
| Fast path to polished UI                | Vendor lock-in                    |

**Best for:** Shipping quickly, portfolio/demo, small-to-medium user base.

### Option B — Custom auth with own backend

| Pros                          | Cons                                             |
| ----------------------------- | ------------------------------------------------ |
| Full control, no per-MAU cost | Rebuild sessions, OAuth, MFA, email verification |
| User model tied to Postgres   | 3–4 weeks minimum for production quality         |
| No vendor lock-in             | Must rewire Liveblocks auth + share flow         |

**Best for:** Long-term product, cost control, custom enterprise requirements.

### Recommendation

1. **Phase 5a:** Clerk Elements custom UI (1 week)
2. **Phase 5b:** Add Postgres `users` table synced with Clerk webhooks
3. **Phase 5c:** Revisit custom auth only if Clerk limits become a blocker

---

## 5.3 Option A — Clerk Elements custom UI

Replace default Clerk card components with fully branded auth matching the editor.

### Checklist

- [ ] Install `@clerk/elements` (if not already)
- [ ] Rebuild sign-in page with Clerk Elements + Tailwind v4 styles
- [ ] Rebuild sign-up page with matching design
- [ ] Match typography, colors, and layout to document list / editor
- [ ] Support dark/light theme via `next-themes`
- [ ] Add OAuth buttons (Google, GitHub) with consistent styling
- [ ] Add "Forgot password" and email verification flows
- [ ] Remove or minimize default Clerk card appearance overrides in `styles/clerk/`
- [ ] Mobile-responsive auth pages

### Files to modify

```txt
app/(auth)/sign-in/[[...sign-in]]/page.tsx
app/(auth)/sign-up/[[...sign-up]]/page.tsx
styles/clerk/index.css
```

### Reference

- [Clerk Elements docs](https://clerk.com/docs/customization/elements/overview)
- Existing theme tokens from Tailwind v4 `@theme`

---

## 5.4 Option A — Clerk organizations (optional)

If workspace/team sharing is needed:

- [ ] Enable Clerk Organizations
- [ ] Map org → shared document folders (requires Phase 3 DB)
- [ ] Org-level billing (future)

---

## 5.5 Option B — Custom auth (if pursued)

### Recommended stack

- **Auth.js v5** (NextAuth) or **Better Auth**
- **Postgres** for users, sessions, accounts, verification tokens
- **bcrypt** or **argon2** for passwords
- **Resend** or **Postmark** for transactional email

### Checklist for stack

- [ ] Define auth schema (users, sessions, oauth_accounts, verification_tokens)
- [ ] Implement sign-up with email verification
- [ ] Implement sign-in / sign-out
- [ ] Password reset flow
- [ ] OAuth providers (Google, GitHub)
- [ ] Session middleware replacing `clerkMiddleware()`
- [ ] Update `app/api/liveblocks-auth/route.ts` to use session user
- [ ] Replace `getClerkUsers()` with DB user lookup
- [ ] Replace `<ClerkProvider>`, `<SignIn>`, `<UserButton>` across app
- [ ] Migration path for existing Clerk users (export + import or dual-run period)
- [ ] MFA (optional, phase 5c)

### Files to replace/modify

```txt
middleware.ts
app/layout.tsx
app/(auth)/
app/api/liveblocks-auth/route.ts
app/api/auth/[...nextauth]/route.ts   ← new
lib/actions/user.actions.ts
components/ui/common/ClerkSignedInUserButton.tsx
components/collaborators/CollaborativeRoom.tsx
```

---

## 5.6 Hybrid — Clerk + Postgres user sync (recommended bridge)

Even if staying on Clerk, sync users to Postgres for Phase 3 features.

- [ ] Clerk webhook: `user.created`, `user.updated`, `user.deleted`
- [ ] `app/api/webhooks/clerk/route.ts` with signature verification
- [ ] Upsert into `users` table with `clerk_id`, email, name, avatar
- [ ] Document access references `users.id` instead of raw email over time
- [ ] Gradual migration of Liveblocks `usersAccesses` keys (email → user id)

### Benefits

- Search, folders, and AI history tied to stable user IDs
- Easier future migration off Clerk
- Clerk remains auth provider; DB is source of truth for app data

---

## 5.7 Liveblocks auth contract (must preserve)

Regardless of option, the auth endpoint must:

1. Verify the user session
2. Call `liveblocks.identifyUser({ userId, groupIds }, { userInfo })`
3. Return `{ status, body }` response

Current shape in `app/api/liveblocks-auth/route.ts`:

```typescript
const user = {
  id: clerkUser.id,
  info: {
    id,
    name: `${firstName} ${lastName}`,
    email: emailAddresses[0].emailAddress,
    avatar: imageUrl,
    color: getUserColor(id),
  },
};

await liveblocks.identifyUser({ userId: user.info.email, groupIds: [] }, { userInfo: user.info });
```

> **Note:** `userId` for Liveblocks is currently the user's **email**. Any auth migration must plan for ID strategy (keep email vs migrate to UUID) to avoid breaking existing room access.

---

## 5.8 Share flow migration considerations

- Room access today: `usersAccesses` keyed by email string
- If moving to user IDs: migration script to remap access keys
- Invite flow: lookup user by email in DB or Clerk before granting access
- Pending invites table for users not yet registered

---

## Acceptance criteria

### Option A (Clerk Elements)

- [ ] Sign-in/up pages match editor branding in light and dark mode
- [ ] OAuth works
- [ ] Liveblocks collaboration unaffected
- [ ] No regression in middleware route protection

### Option B (Custom auth)

- [ ] Full auth flows work without Clerk
- [ ] Liveblocks auth uses new session
- [ ] Existing documents accessible after user migration
- [ ] Security review passed (session cookies, CSRF, rate limits)

### Hybrid

- [ ] Clerk webhook syncs users to Postgres
- [ ] Document list can join on `users` table

---

## 5.9 Architectural Topology: Monorepo vs Integrated Next.js Fullstack

When building a full custom auth system and database-backed document service, we must evaluate the application topology:

### Topology Options

| Dimension           | Option 1: Integrated Next.js Fullstack (Single App)             | Option 2: Turborepo Monorepo (Split Frontend & Backend)                              |
| :------------------ | :-------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **Structure**       | Single Next.js 15 repository (`app/`, `lib/`, `server/`)        | Turborepo with `apps/web` (Next.js) + `apps/api` (Hono/Express/Nest) + `packages/db` |
| **Auth Engine**     | **Better Auth** or **Auth.js v5** via Next.js Route Handlers    | Dedicated auth server / microservice issuing JWT/HttpOnly session cookies            |
| **Database Access** | Drizzle / Prisma called directly in Server Actions & API routes | Backend API handles all DB operations via REST / tRPC / GraphQL                      |
| **Deployment**      | Single container / Vercel deployment                            | Independent deployments for Frontend and API services                                |
| **Complexity**      | **Low to Moderate** — fast iteration, zero IPC overhead         | **High** — requires monorepo tooling, CI pipelines, CORS, shared packages            |

### Architectural Decision Questions

1. **Do we need a separate backend (Monorepo), or is Next.js fullstack sufficient?**
   - _Verdict:_ Next.js 15 (Node.js runtime with Route Handlers, Server Actions, and connection-pooled Drizzle/Prisma) is already a complete fullstack framework. Unless we plan a separate native mobile client or separate Python/Go microservices, **Integrated Next.js Fullstack** provides maximum development velocity without monorepo maintenance overhead.
2. **Which custom auth library fits best?**
   - **Better Auth (Recommended):** Modern TypeScript-first auth designed for Next.js and fullstack TS. Native two-factor, email verification, OAuth, passkeys, and direct Drizzle/Prisma adapters. Runs entirely on local Postgres with zero external auth API dependencies.
   - **Auth.js v5 (NextAuth):** Mature ecosystem, wide provider support, but historically slower schema evolution and breaking API changes.
3. **How does Liveblocks auth transition with custom auth?**
   - With local Postgres + Better Auth, `POST /api/liveblocks-auth` simply verifies the local session cookie (`auth.api.getSession`) and issues the Liveblocks token in < 2ms, completely eliminating external Clerk network latency and 503 cascades.

---

## Suggested commit sequence

### Option A path

```txt
feat(auth): rebuild sign-in with clerk elements
feat(auth): rebuild sign-up with clerk elements
feat(auth): add clerk webhook for user sync to postgres
refactor(auth): use database user ids in document access
```

### Option B path

```txt
feat(auth): add auth.js with postgres adapter
feat(auth): implement sign-up and email verification
feat(auth): replace clerk middleware with session middleware
feat(auth): migrate liveblocks auth to session user
feat(auth): migrate existing clerk users
```

---

## Related plans

← [Phase 3 — Core Product Features & Database Architecture](./phase-3-core-product-features.md) (Postgres prerequisite for hybrid/custom)  
← [Phase 1 — Foundation & Collaboration](./phase-1-foundation-collaboration.md)
