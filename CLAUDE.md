# Claude Code Operating Guidelines: Platen (docs-editor)

## 1. Project Overview & Architecture

- **Repository**: `platen` (local folder `docs-editor`, GitHub `platenhq/platen`): a real-time
  collaborative rich-text document editor. Production: platenhq.vercel.app.
- **Framework**: Next.js 15.5 (App Router, React 19, TypeScript), Turbopack in dev
  (`npm run dev`, port **3002**). The React Compiler is on (`experimental.reactCompiler`), so
  new code needs no manual `useMemo` / `useCallback` / `React.memo`.
- **Styling**: Tailwind CSS v4, CSS-first. Theme tokens live in `app/globals.css` (`:root` and
  `.dark`); components use tokens (`bg-surface`, `text-muted`, `border-border`, ...) and never
  hardcoded hex. Editor CSS is in `styles/editor/`, Liveblocks in `styles/liveblocks/`, Clerk
  in `styles/clerk/`. Dark mode is next-themes with `attribute="class"`. Icons: `lucide-react`.
- **UI components**: shadcn/Radix primitives in `components/ui/`; standard wrappers in
  `components/ui/custom/` (`CustomToolbarButton`, `CustomDropdown`, `CustomPopover`,
  `CustomModal`, colour picker). Build toolbar and editor controls on these wrappers. Controls
  that act on the editor call `preventDefault` on mouse-down and block popover auto-focus so
  the Lexical caret is kept.
- **Editor**: Lexical 0.35 (all `lexical` / `@lexical/*` pinned together through `overrides`;
  the version must match `@liveblocks/react-lexical`'s peer range). Composer:
  `components/editor/Editor.tsx`. Nodes: `components/editor/nodes/` (registry
  `playgroundNodes.ts`). Plugins: `components/editor/plugins/`; toolbar in
  `plugins/toolbarPlugin/`; menu bar in `components/editor/menubar/`. Secondary plugins load
  with `next/dynamic` (`ssr: false`).
  - Preserve AST serialization: every custom node must round-trip through Lexical JSON, since
    that is what Liveblocks persists.
  - Prefer native `@lexical` utilities inside `editor.update()` over DOM workarounds.
  - Keep paragraph buffers around standalone blocks (tables, embeds) for caret navigation.
- **Collaboration**: Liveblocks 3. The auth route `app/api/liveblocks-auth/route.ts` uses
  Clerk's `auth()`, never `currentUser()` (a network round trip on every connect). The
  Liveblocks `userId` is the user's **email**, and room access (`usersAccesses`) is keyed by
  email. Room operations live in `lib/actions/room.actions.ts`; updates must preserve the
  metadata (`title`, `creatorId`, `email`) and `usersAccesses`.
- **Auth**: Clerk 7 (`middleware.ts`, `<ClerkProvider>` in `app/layout.tsx`).
- **Monitoring**: Sentry (`instrumentation*.ts`, `sentry.*.config.ts`), reduced in development.
- **Page layout**: `context/DocumentLayoutContext.tsx` owns the view mode, page size, margins
  and zoom. View modes: `paged-engine` (default, labelled "Pages"), `pages` (labelled
  "Continuous (legacy)") and `pageless`. Settings are saved per browser in `localStorage`;
  they are not synced to collaborators.
- **Pagination**: `@platen/engine` from npm, developed in the sibling repo `../paged-engine`.
  Read its `README.md` and `ARCHITECTURE.md` before changing paged layout or print.
  `components/editor/PlatenEngineCanvas.tsx` wraps the editor in `PagedDocument`.
  - The engine never writes to the editor DOM. Do not add plugins that mutate the DOM or the
    document to paginate.
  - Every element between `PagedDocument` and `.editor-input` must be a plain block: no
    `overflow`, `contain`, `float` or absolute positioning, and not a flex or grid item.
  - A block that must move to the next page whole (code, callout, image paragraph) needs
    `display: flow-root; width: 100%; box-sizing: border-box`, scoped under
    `.platen-engine-canvas` in `styles/editor/index.css`. Cap media with
    `var(--platen-usable-height)`.
  - Pagination bugs are fixed in the engine repo and released, not worked around here.
  - From engine 0.3, the engine handles print paper size, margins, gutters, zoom and hiding the
    rest of the page. Do not add print CSS for those, and never pass `printIsolated={false}`.
- **Data**: Liveblocks rooms only; no application database yet (Postgres is Phase 3).
- **Checks**: there is no test suite. Verify with `npm run typecheck`, `npm run lint` and
  `npm run format:check`, then in the browser at `localhost:3002`. CI also runs the build and
  `npm run security:audit`.
- **Roadmap**: `docs/plans/README.md`; one file per phase in `docs/plans/`.

---

## 2. STRICT APPROVAL WORKFLOW (MANDATORY)

### Phase 1: Absolute Read-Only Investigation (Default State)

- The initial phase of any request is strictly read-only.
- Use read-only tools (file reads, search, `git status`, `git diff`, `git log`) to inspect the
  codebase, and `../paged-engine` when the change touches pagination or print.
- **CRITICAL**: You are ABSOLUTELY FORBIDDEN from creating new files, deleting files, editing
  existing code, running installation commands, or executing modifying scripts of any kind
  until approval is granted.

### Phase 2: Scope-Based Proposal Formats

- **Small/Minor Changes** (minor styling tweaks, simple fixes, few lines of code):
  - Skip creating formal artifact files.
  - Write a concise inline proposal in the chat listing target files and exact lines changing.
- **Medium to Large Changes** (structural refactoring, multiple file additions/deletions,
  complex logic):
  - You MUST create or update `implementation_plan.md` in the repo root (git-ignored).
  - Detail the architecture, proposed edits, and verification steps.
  - Present the path to the user for review.

### Phase 3: Strict Halt for User Approval

- Immediately after presenting your proposal, **halt all tool calls and end your turn**.
- You are ABSOLUTELY FORBIDDEN from performing any file write/replace operations or modifying
  terminal commands until the user explicitly approves (e.g., "proceed", "approve", "go ahead").

---

## 3. Environment

- Windows. Run shell commands directly (`npm install`, `git status`); no wrapper is needed.
- Node 24 (`.nvmrc`). Environment variables are documented in `.env.example`.

---

## 4. Git & Version Control Rules

### 4.1 Branches

- Branch from `dev`; open PRs into `dev`. `master` only accepts PRs from `dev` or Release Please
  (enforced by the branch-guard workflow).
- Release Please writes `CHANGELOG.md` and bumps the version on `master`; never edit them by
  hand.
- Husky runs lint-staged on commit, commitlint on the message and `security:audit` on push.
  Never skip hooks with `--no-verify`.

### 4.2 Git Commits

- **Format**: Conventional Commits (`feat(scope):`, `fix(scope):`, `refactor(scope):`,
  `chore(scope):`, `docs(scope):`, ...). Types allowed by commitlint: feat, fix, docs, style,
  refactor, perf, test, build, ci, chore, revert.
- **Strict Line Limit**: every line (title, body, bullets) must be **under 100 characters**.
- **No Implementation Details**: describe _what_ changed for the user or the system, not _how_.
  - Do NOT include JSX/HTML tags (e.g., `<div>`, `<form>`).
  - Do NOT include CSS classes or Tailwind utility names.
  - Do NOT include code-level variables, hook names, or state handlers (e.g., `useState`).
- **Workflow**: run `git status` and `git diff` and write from the actual diff, never from
  intent. For moved files, trace the source and list every functional change made in the move.
- **Granular Flat Bullets**: one bullet per discrete behavioural change, proportional to the
  batch. No nested bullets. Split work into logical batches rather than thinning bullets.
- **On-Demand Generation Only**: do NOT generate commit messages or git commands unless the
  user explicitly asks.
- **No Co-Author or AI Attribution**: never add `Co-Authored-By` trailers, "Generated with"
  lines, or any other AI attribution to commits or pull requests.
- **Shell-Safe Output**: quoted and escaped for safe copy-pasting in Bash and Windows
  terminals, with no `cmd /c` prefix.

### 4.3 Pull Requests

- Title in Conventional Commit format.
- Body follows `.github/pull_request_template.md`: a one-paragraph **Summary**, a flat list of
  **Key Changes** (no nested bullets), and a **Test plan** when runtime behaviour changes.
- Key changes are discrete functional capabilities, not file names.
- Generate from the real commits (`git log`), never from assumptions.

---

## 5. Frontend Code Practices & Standards

- Server Components by default. Add `"use client"` only for state, effects, browser APIs or
  event handlers, and push it as far down the tree as possible.
- Route groups: `(auth)` sign-in/up, `(root)` the dashboard and `documents/[id]` editor room.
  API routes in `app/api/`.
- Domain folders under `components/`: `home`, `editor`, `collaborators`, `liveblocks`, `modal`,
  `shared`, `providers`; design-system primitives only in `components/ui`. Move files
  incrementally as an area is touched, never in one big relocation.
- Component files are PascalCase `.tsx`; follow the surrounding file's export style. Import
  through the `@/` alias.
- Server actions live in `lib/actions/`; shared types in `types/`.
- Heavy or secondary editor plugins load with `next/dynamic` (`ssr: false`).
