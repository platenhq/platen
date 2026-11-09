# Phase 1.5 — Performance Acceleration & UI Revamp

**Goal:** Eliminate cold dev server bottlenecks, enable Turbopack, lock in production-grade
performance foundations (React Compiler, streaming SSR, auth latency), optimize bundle
deserialization, and completely modernize the Docs Editor user interface.

**Depends on:** [Phase 1 — Foundation & Collaboration](./phase-1-foundation-collaboration.md)

**Estimated effort:** 1–2 weeks

---

## Sections Overview

| Section | Focus                             | Impact Layer   |
| ------- | --------------------------------- | -------------- |
| 1.5.1   | Turbopack dev bundler             | Dev-time       |
| 1.5.2   | Sentry dev decoupling             | Dev-time       |
| 1.5.3   | Lexical plugin lazy-loading       | Dev + Prod     |
| 1.5.4   | Liveblocks auth cold start fix    | **Production** |
| 1.5.5   | React Compiler (auto-memoization) | **Production** |
| 1.5.6   | Suspense boundaries & streaming   | **Production** |
| 1.5.7   | Premium design system & fonts     | UI             |
| 1.5.8   | Home dashboard revamp             | UI             |
| 1.5.9   | Header & room navigation overhaul | UI             |
| 1.5.10  | Toolbar & editor canvas           | UI             |
| 1.5.11  | Share dialog polish               | UI             |

---

## 1.5.1 Local Dev Performance & Turbopack Acceleration

Next.js 15 Webpack dev compilation on large modules (Lexical + Liveblocks) causes cold start delays of 75s–3min and memory serialization warnings.

### Bottleneck Breakdown

| Component                      | Dev Impact                                       | Solution                                                      |
| ------------------------------ | ------------------------------------------------ | ------------------------------------------------------------- |
| **Webpack Bundler**            | 5,400+ modules compiled synchronously            | Migrate dev script to `next dev --turbopack`                  |
| **Sentry Telemetry**           | Intercepts all dev routes & generates sourcemaps | Disable Sentry replay/tracing in `NODE_ENV === 'development'` |
| **Liveblocks Auth Cold Start** | ~29s response on initial auth handshakes         | See dedicated section 1.5.4                                   |
| **Lexical Auxiliary Plugins**  | Heavy synchronous AST nodes in initial bundle    | Dynamic code-splitting for secondary plugins                  |

### Checklist

- [x] Update `package.json` dev script to enable Turbopack (`next dev --turbopack`)
- [x] Verify Tailwind v4 `@tailwindcss/postcss` compatibility under Turbopack
- [x] Verify Sentry client instrumentation (`instrumentation-client.ts`) runs smoothly with Turbopack
- [x] Profile cold page loads on `/` and `/documents/[id]` to ensure under 3s render times

### Files to modify

```txt
package.json
next.config.ts
```

---

## 1.5.2 Development Telemetry & Sentry Decoupling

Sentry is critical in production but adds substantial overhead during local development compilation and navigation.

### Checklist for development telemetry

- [x] Gate Sentry client initialization so tracing/replay are disabled or minimized in development
- [x] Ensure Sentry server/edge instrumentation avoids redundant source map generation in dev
- [x] Opt out of Clerk telemetry pings during development if desired (`NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED=1`)

### Files to modify for development telemetry

```txt
instrumentation-client.ts
sentry.server.config.ts
sentry.edge.config.ts
.env.example
```

---

## 1.5.3 Lexical & Liveblocks Bundle Optimization

Secondary editor features (Draggable block menu, code highlight action menus, floating link
editors) can be split into asynchronous chunks to reduce the initial JS parse cost on
`/documents/[id]`.

### Checklist for lexical bundle optimization

- [x] Lazy-load `CodeActionMenuPlugin` with `next/dynamic` (`{ ssr: false }`)
- [x] Lazy-load `DraggableBlockPlugin` to keep primary editor canvas light
- [x] Lazy-load `FloatingLinkEditorPlugin` with `next/dynamic` (`{ ssr: false }`)
- [x] Audit vendor chunk sizes on `/documents/[id]` using `npm run analyze`

### Bundle audit findings (2026-11-09)

`/documents/[id]` first load: 743 kB (242 kB page chunk, 203 kB shared). Largest client packages,
summed across chunks:

| Package                                                       | Parsed |   Gzip | Notes                                                                         |
| :------------------------------------------------------------ | -----: | -----: | :---------------------------------------------------------------------------- |
| `next`                                                        | 597 kB | 249 kB | Framework; fixed cost                                                         |
| Sentry (`replay`, `core`, `browser`, `nextjs`, `conventions`) | 510 kB | 177 kB | Replay alone is 182 kB parsed, bundled even though it only runs in production |
| Liveblocks (`core`, `react-ui`, `react-lexical`)              | 405 kB | 142 kB | Collaboration and comments; needed                                            |
| `slate` + `slate-react`                                       | 152 kB |  42 kB | Pulled in by the Liveblocks comment composer                                  |
| `react-dom`                                                   | 174 kB |  55 kB | Framework; fixed cost                                                         |
| `lexical`                                                     | 116 kB |  37 kB | Editor core; needed                                                           |
| `@clerk/*`                                                    | 143 kB |  42 kB | Auth UI; needed                                                               |
| `yjs`                                                         |  66 kB |  19 kB | Collaboration; needed                                                         |
| `prismjs`                                                     |  55 kB |  23 kB | Code block highlighting                                                       |

Recommendations, in order of payoff:

- [x] **Load Sentry Replay lazily.** Replay is fetched from Sentry's CDN once the page is idle
      (production only) instead of shipping in the bundle. Sentry in the client went from
      510 kB to 309 kB parsed (177 kB to 115 kB gzip); first load shared by all pages went
      from 203 kB to 164 kB, and `/documents/[id]` from 743 kB to 704 kB. Errors in the first
      moments after load, before Replay arrives, are reported without a recording.
- [ ] **Load code highlighting only when needed (blocked).** `@lexical/code` 0.35 imports
      `prismjs` and its language grammars at module load, and code nodes must be registered
      when the editor starts. Newer Lexical splits Prism into `@lexical/code-prism`, but
      `@liveblocks/react-lexical` pins Lexical to exactly 0.35.0. Revisit when Liveblocks
      supports a newer Lexical.
- [ ] **Load the comment UI lazily (deferred).** The notifications inbox already loads
      `@liveblocks/react-ui` on the document page, so the saving may be limited to `slate`
      (about 42 kB gzip), at the cost of a delay on the first comment interaction. Measure
      before deciding.

### Files to modify for lexical bundle optimization

```txt
components/editor/Editor.tsx
package.json
next.config.ts
```

---

## 1.5.4 Liveblocks Auth Cold Start Fix

> **Production Critical.** Every user who opens a document waits for `/api/liveblocks-auth`
> before the Liveblocks WebSocket handshake can complete.

The ~29s cold start is caused by calling `currentUser()` from `@clerk/nextjs/server`, which
makes a **live network round-trip to Clerk's API** on every invocation.

### Root Cause

```ts
// Slow — makes a Clerk network request on every call
import { currentUser } from "@clerk/nextjs/server";
const user = await currentUser();

// Fast — reads from the signed session JWT locally, zero network call
import { auth } from "@clerk/nextjs/server";
const { userId } = await auth();
```

`auth()` verifies the JWT cryptographically in-process. `currentUser()` hits Clerk's API to
hydrate the full user object. For the auth endpoint, only `userId` and user metadata are
needed — `auth()` is always the right choice here.

### Checklist for auth cold start fix

- [x] Replace `currentUser()` with `auth()` in `app/api/liveblocks-auth/route.ts`
- [x] Source user name and avatar from `auth().sessionClaims` or a lightweight Clerk backend
      client call (not `currentUser()`)
- [x] Add `Cache-Control: no-store` header to the auth route to prevent CDN caching of tokens
- [x] Measure auth response time before and after (target: under 200ms)

### Files to modify for auth cold start fix

```txt
app/api/liveblocks-auth/route.ts
```

---

## 1.5.5 React Compiler (Auto-Memoization)

> **Production Critical.** Especially important as the app grows and more collaborators
> join a single document room.

The **React Compiler** (formerly "React Forget"), stable in React 19, automatically memoizes
all components and hooks — eliminating the need for manual `useMemo`, `useCallback`, and
`React.memo` throughout the codebase.

For a Lexical editor this is transformative: every keypress, cursor move, selection change,
and Liveblocks presence update triggers a cascade of re-renders across the toolbar, floating
plugins, and presence layer. The compiler eliminates this overhead automatically.

### Why This Matters at Scale

- `ToolbarPlugin` re-renders on every editor state change (format state, selection, block type)
- `ActiveCollaborators` re-renders on every cursor position update from every connected peer
- `CollaborativeRoom` holds title editing, connection status, and Liveblocks presence — all
  updating at high frequency

Without the compiler, re-render overhead compounds as collaborators join and document content
grows. With the compiler, it is eliminated automatically with zero changes to existing
components.

### Enablement

```ts
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
};
```

```bash
npm install --save-dev babel-plugin-react-compiler
```

### Checklist for React Compiler

- [x] Install `babel-plugin-react-compiler` as a dev dependency
- [x] Enable `experimental.reactCompiler: true` in `next.config.ts`
- [x] Verify no components use patterns that opt them out (mutable refs in render, direct DOM
      mutations outside `useEffect`)
- [x] Run `npm run typecheck` and `npm run build` to confirm clean compilation
- [x] Smoke test editor interactions: typing, selection, formatting, table operations,
      collaborator cursors

### Files to modify for React Compiler

```txt
next.config.ts
package.json
```

---

## 1.5.6 Suspense Boundaries & Streaming SSR Architecture

Next.js 15 App Router streams page responses to the browser via React Suspense. Without
explicit `<Suspense>` wrappers, any slow data dependency on the critical path — Liveblocks
auth, Clerk session fetch, Postgres query — blocks the **entire page** from rendering.

This is important now (auth cold start) and becomes critical in Phase 2 when Postgres queries
will sit on the rendering critical path of the dashboard.

### Current Gap

The document room page renders the full `<CollaborativeRoom>` and `<Editor>` tree
synchronously. If the auth endpoint is slow, the user sees a blank page. The Phase 2 dashboard
will load multiple data-dependent tab views — without streaming, all tabs block on the slowest
query.

### Target Architecture

```txt
Document room:
  Page Shell (renders instantly — no blocking data)
    └── <Suspense fallback={<EditorSkeleton />}>
          └── CollaborativeRoom -> Liveblocks WebSocket (streams in)
                └── <Suspense fallback={<CanvasLoader />}>
                      └── Editor -> Lexical canvas

Phase 2 Dashboard:
  Page Shell
    └── <Suspense fallback={<DashboardSkeleton />}>
          └── Tab data (Postgres — each tab streams independently)
```

### Checklist for Suspense & streaming

- [x] Wrap `CollaborativeRoom` in an explicit `<Suspense>` boundary in
      `app/(root)/documents/[id]/page.tsx` with a canvas skeleton fallback
- [x] Ensure the document room page shell renders before the Liveblocks connection is
      established
- [x] Plan Phase 2 dashboard with per-section `<Suspense>` wrappers so each tab streams
      independently
- [x] Verify `loading.tsx` files exist for all route segments to provide automatic Suspense
      fallbacks at the route level

### Files to modify for Suspense & streaming

```txt
app/(root)/documents/[id]/page.tsx
app/(root)/loading.tsx
components/collaborators/CollaborativeRoom.tsx
```

---

## 1.5.7 Premium Design System & Modern Theme Tokens

Elevate the visual aesthetic from a prototype layout to a state-of-the-art SaaS workspace.

### Design Tokens & Aesthetics

- **Color Palettes:**
  - Dark Mode: Rich slate/obsidian backgrounds (`#090d16`, `#0f172a`, `#1e293b`), elevated
    borders (`#334155`), and electric cyan/azure accents (`#00afdb` / `#38bdf8`).
  - Light Mode: Crisp off-white surfaces (`#f8fafc`, `#ffffff`), subtle gray borders
    (`#e2e8f0`), and deep charcoal typography (`#0f172a`).
- **Typography:** Modern variable font via `next/font` (Inter / Outfit) with balanced leading
  and hierarchy. Use `next/font` — not a CDN link — to self-host fonts, eliminate external
  network requests, and prevent layout shift (CLS).
- **Glassmorphism & Elevation:** Subtle backdrop blur (`backdrop-blur-md`), layered dark mode
  drop shadows (`shadow-sm-dark` to `shadow-xl-dark`).

### Checklist for design system

- [x] Replace `font-family: Arial` in `globals.css` body rule with self-hosted variable font
      (`@fontsource-variable/inter`) configured in `app/globals.css` and `app/layout.tsx`
- [x] Refine `@theme` token definitions in `app/globals.css` with semantic CSS variables
      for centralized theme control
- [x] Standardize text color contrast across all dark mode inputs, dropdowns, and canvas
      containers
- [x] Polish scrollbars, tooltips, and micro-interaction animations

### Theme Contract (enforced from 1.5.7 onwards)

This project enforces a **zero-hardcoded-hex rule** across all components:

- All colors MUST use Tailwind tokens backed by CSS custom properties from `app/globals.css`
  (e.g. `bg-surface`, `text-muted`, `border-border`, `bg-surface-canvas`).
- **Never** use `bg-[#xxxxxx]` or `dark:bg-[#xxxxxx]` directly in component JSX.
- To update any color across the entire app (light and dark mode), change only the
  corresponding CSS variable in `:root` or `.dark` inside `app/globals.css`.
- New tokens should follow the existing naming conventions:
  `--surface-*`, `--border-*`, `--primary-*`, `--muted`, `--destructive`.

### Files to modify for design system

```txt
app/globals.css
app/layout.tsx
styles/editor/dark-theme.css
styles/editor/light-theme.css
```

---

## 1.5.8 Home Dashboard Revamp

Transform the home page from a basic prototype list into a polished, Google Docs-inspired
document dashboard. The goal is familiarity — not a direct replica — so users coming from
Google Docs immediately understand the layout and feel at home.

### Layout Architecture

```txt
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo │ Search (centered) │ Notifications + Avatar   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌── "Start a new document" ─────────────────────────────┐  │
│  │  [ + Blank ]                                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Recent documents                       [Sort ▾] [⊞] [☰]   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │ doc  │ │ doc  │ │ doc  │ │ doc  │   (card grid)          │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Design Decisions

- **No template cards** in the initial release — the "Start a new document" section contains
  only the blank document creation button. Templates are a Phase 2+ concern.
- **Card grid layout** for recent documents: visual page-thumbnail placeholders (document
  icon + color accent) with title, owner, and last-opened date beneath each card. Users scan
  by visual memory, not just text.
- **List/grid toggle** in the recent documents section header so power users can switch to
  a compact row view.
- **Sort control** (Last opened, Last modified, Title A–Z) as a minimal dropdown.
- **Search bar centered in the header** — this is a primary job-to-be-done; finding an
  existing document should never require scrolling.
- **Fully responsive:** three-column grid on large screens, two-column on tablet, single
  column on mobile.

### Checklist for home dashboard

- [x] Redesign `app/(root)/page.tsx` with the three-zone layout (header, new-doc section,
      recent grid)
- [x] Extract the document list/grid into a `HomeDocumentGrid` client component to
      keep the page server component clean
- [x] Build `NewDocumentSection` with a styled blank-document creation card (no templates)
- [x] Build `DocumentCard` component with page-thumbnail placeholder, title, date, and
      three-dot action menu (Open, Delete)
- [x] Add grid/list view toggle state (localStorage-persisted) with smooth layout transition
- [x] Add sort dropdown (Last opened / Last modified / Title)
- [x] Extend `Header.tsx` with a centered search input (client-side filter by title for now;
      full-text search lands in Phase 2)
- [x] Ensure dark mode and light mode both look polished across all new components
- [x] Verify empty state design (when a user has no documents yet)
- [x] Migrate all new home components to use CSS variable tokens (zero hardcoded hex);
      apply same rule to `DeleteModal`, `ToggleTheme`, `Notifications`, and
      `ClerkSignedInUserButton` for uniform cross-page color consistency
- [x] Add `--surface-canvas` / `--surface-canvas-hover` tokens to `globals.css` for
      thumbnail preview areas and section band backgrounds
- [x] Fix `ToggleTheme` dark mode: switched to `variant="ghost"` so default Button
      dark styles (`dark:bg-slate-50`) no longer override custom surface tokens
- [x] Migrate `styles/clerk/index.css` dark mode overrides from hardcoded hex to
      CSS custom properties so Clerk dropdown color scheme is controlled by `globals.css`

> **Deferred — Real Document Preview Thumbnails:** Rendering actual document content
> inside card thumbnails (like Google Docs) requires access to the Liveblocks/Lexical
> document state at list time, which is not available during home page load. This feature
> will be implemented in Phase 2 (see `docs/plans/phase-2-enterprise-editor-canvas.md`)
> as part of the document metadata / storage architecture work.

### Files to modify for home dashboard

```txt
app/(root)/page.tsx
components/ui/common/AddDocumentBtn.tsx
components/ui/shared/Header.tsx
components/ui/home/HomeDocumentGrid.tsx       [NEW]
components/ui/home/DocumentCard.tsx           [NEW]
components/ui/home/NewDocumentSection.tsx     [NEW]
components/ui/home/SortDropdown.tsx           [NEW]
components/modal/DeleteModal.tsx
components/ui/common/ToggleTheme.tsx
components/ui/liveblocks/Notifications.tsx
components/ui/common/ClerkSignedInUserButton.tsx
styles/clerk/index.css
```

---

## 1.5.9 Header & Room Navigation Overhaul

Redesign the document room header (aligned with the home header updated in 1.5.8).

### Checklist navigation overhaul

- [x] Build a sleek, floating room navigation header with logo, document title, and actions
- [x] Add editable document title with seamless hover/focus transition and saving indicator
- [x] Redesign connection status pill (`• Connected`, `• Reconnecting`, `• Offline`) with
      pulsing state
- [x] Redesign collaborator avatar stack with smooth hover magnification and name badges
- [x] Add breadcrumb / quick navigation back to home

### Files to modify navigation overhaul

```txt
components/ui/shared/Header.tsx
components/collaborators/CollaborativeRoom.tsx
components/collaborators/ActiveCollaborators.tsx
```

---

## 1.5.10 Toolbar & Editor Canvas Modernization

Transform the Lexical toolbar into a fluid, grouped pill interface.

### Checklist toolbar modernization

- [x] Reorganize toolbar items into logical visual groups with subtle dividers:
  - _History:_ Undo, Redo
  - _Hierarchy:_ Block Format dropdown (Paragraph, H1, H2, H3, Bullet, Numbered, Check, Code, Quote)
  - _Typography:_ Font family, font size incrementer
  - _Inline Styles:_ Bold, Italic, Underline, Strikethrough, Sub/Superscript, Case
  - _Insert Tools:_ Link, Collaborative Table
  - _Alignment:_ Left, Center, Right, Justify
- [x] Style active buttons with prominent contrasting backdrops
- [x] Elevate editor canvas with crisp page margins, drop shadow, and dark mode contrast
- [x] Add smooth hover tooltips across all toolbar controls

### Files to modify toolbar modernization

```txt
components/editor/Editor.tsx
components/editor/plugins/toolbarPlugin/ToolbarPlugin.tsx
components/editor/plugins/toolbarPlugin/toolbarDropdown/BlockFormatDropdown.tsx
components/editor/plugins/toolbarPlugin/toolbarDropdown/FontDropdown.tsx
components/editor/plugins/toolbarPlugin/toolbarDropdown/TextFormatDropdown.tsx
components/editor/plugins/toolbarPlugin/toolbarDropdown/ElementFormatDropdown.tsx
components/editor/plugins/toolbarPlugin/fontSize/index.css
components/ui/lexical/dropdown.tsx
app/globals.css
```

---

## 1.5.11 Share Dialog UI & User Experience Polish

Provide a refined sharing modal experience matching modern collaborative editors.

### Checklist for share dialog UI

- [x] Implement clear visual hierarchy: Document Access Summary, Email Invite Field,
      Collaborator List
- [x] Add animated "Copy Link" button with instant success feedback
- [x] Polish collaborator list items with role dropdowns (Viewer / Editor) and owner badges
- [x] Add animated transitions for dialog open/close using Radix dialog primitives

### Files to modify for share dialog UI

```txt
components/modal/ShareModal.tsx
components/collaborators/Collaborator.tsx
components/ui/common/UserTypeSelector.tsx
components/ui/select.tsx
components/ui/dialog.tsx
```

### Checklist for dark mode fixes & scroll containment (1.5.12)

- [x] Tokenize `button.tsx` default/destructive/outline/secondary/ghost/link variants with
      design tokens — no hardcoded `slate-*` colors
- [x] Harmonize `styles/liveblocks/dark-theme.css` with `var(--surface)`, `var(--border)`,
      `var(--foreground)`, `var(--muted)`, `var(--primary)` tokens
- [x] Update `styles/liveblocks/index.css` base root background and button foreground to tokens
- [x] Add `h-screen overflow-hidden` to `DocumentClient.tsx` `<main>` to contain scroll
- [x] Add `overflow-hidden` to `CollaborativeRoom.tsx` root wrapper
- [x] Restructure `Editor.tsx` outer div to `flex flex-col overflow-hidden` and `editor-wrapper`
      to `flex-1 overflow-y-auto` (single scroll zone)
- [x] Remove fixed `h-[calc(100vh-114px)]` from `.editor-wrapper` in `globals.css`

### Files modified for 1.5.12

```txt
components/ui/button.tsx
styles/liveblocks/dark-theme.css
styles/liveblocks/index.css
components/ui/common/DocumentClient.tsx
components/collaborators/CollaborativeRoom.tsx
components/editor/Editor.tsx
app/globals.css
```

---

## Acceptance Criteria

### Performance (Production-Grade)

- [x] Local dev server starts and compiles routes in under 5 seconds with Turbopack
- [x] Sentry dev overhead is eliminated with no source map lag in development
- [x] `/api/liveblocks-auth` responds in under 200ms consistently (no Clerk network round-trip)
- [x] React Compiler is enabled; no manual `useMemo`/`useCallback` is required in new code
- [x] Document room page shell renders before the Liveblocks WebSocket is established

### UI

- [x] Home dashboard renders in three zones: header with search, new-document section,
      recent documents grid
- [x] Recent documents support both card grid and compact list views with a persisted toggle
- [x] Application header and document room canvas feature polished dark and light themes
- [x] Toolbar controls are grouped into fluid pill sections with responsive active states
- [x] Share modal provides instant link copying and clear collaborator management
- [x] All button variants use design tokens — Share button renders correctly in dark mode
- [x] Liveblocks comments sidebar blends with the dark slate surface and border tokens
- [x] Document room page has a single scrollbar — no duplicate outer scroll

---

## Suggested Commit Sequence

```txt
perf(dev): enable turbopack and optimize development compilation
perf(sentry): decouple telemetry and source map tracing in development
perf(editor): lazy-load auxiliary lexical plugins with next/dynamic
perf(auth): replace currentUser with auth to eliminate liveblocks cold start
perf(compiler): enable react compiler for automatic component memoization
perf(streaming): add suspense boundaries for streaming ssr on document room
style(theme): establish modern dark slate tokens and typography with next/font
style(home): revamp home dashboard with search header and document grid
style(header): redesign document room header and live presence stack
style(toolbar): modernize editor toolbar with grouped pill formatting
style(share): polish share dialog layout, copy-link, and dark mode fixes
```

---

## Next Phase

→ [Phase 2 — Enterprise Editor Canvas & Toolbar Experience](./phase-2-enterprise-editor-canvas.md)
