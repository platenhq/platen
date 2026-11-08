# Docs Editor — Development Roadmap

Living documentation for the docs-editor development effort. Each phase has its own file with checklists, file targets, and acceptance criteria.

## Branch strategy

```txt
master          ← production-ready releases
  └── dev       ← integration branch for development work
        └── feature/*  ← individual tasks per phase
```

- Open PRs into `dev`; merge `dev` → `master` when a phase (or milestone) is stable.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for every commit.
- See [CONTRIBUTING.md](../CONTRIBUTING.md) and [AGENTS.md](../../AGENTS.md) for full commit and PR rules.

### Commit format

```txt
<type>[optional scope]: <description>

Types: feat | fix | docs | style | refactor | test | chore | ci | build
```

Examples:

```txt
chore: add husky and lint-staged
ci: add github actions workflow for lint and build
docs: add phase 1 foundation plan
feat(collaboration): add live cursors and presence
```

---

## Phases

| Phase   | File                                                                               | Focus                                                    | Depends on                | Status                                     |
| ------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------- | ------------------------------------------ |
| **0**   | [phase-0-tooling.md](./phase-0-tooling.md)                                         | Prettier, Husky, commitlint, CI/CD, security             | —                         | Done                                       |
| **1**   | [phase-1-foundation-collaboration.md](./phase-1-foundation-collaboration.md)       | Dependency upgrades, Tailwind v4, seamless collaboration | Phase 0                   | Done                                       |
| **1.5** | [phase-1.5-performance-and-ui-revamp.md](./phase-1.5-performance-and-ui-revamp.md) | Dev speed (Turbopack), Google Docs sharing, UI revamp    | Phase 1                   | Done (bundle size audit open)              |
| **2**   | [phase-2-enterprise-editor-canvas.md](./phase-2-enterprise-editor-canvas.md)       | Page canvas, ruler, toolbar expansion, outline, comments | Phase 1.5                 | In progress (paged printing, 2.6–2.8 open) |
| **3**   | [phase-3-core-product-features.md](./phase-3-core-product-features.md)             | Version history, search, export, Postgres metadata       | Phase 1.5, Phase 2        | Not started                                |
| **4**   | [phase-4-ai-features.md](./phase-4-ai-features.md)                                 | Inline AI editing, formatting, summarization             | Phase 1, Phase 2          | Not started                                |
| **5**   | [phase-5-auth-strategy.md](./phase-5-auth-strategy.md)                             | Clerk customization vs custom auth                       | Phase 0, Phase 3 (for DB) | Not started                                |

---

## Current codebase snapshot

| Area              | Current state                                                                          |
| ----------------- | -------------------------------------------------------------------------------------- |
| **Framework**     | Next.js 15.5 (App Router, Turbopack dev), React 19 with the React Compiler, TypeScript |
| **Editor**        | Lexical 0.35 + `@liveblocks/react-lexical`, custom nodes and plugins                   |
| **Pagination**    | `@platen/engine` float-rail paged layout (default view), plus continuous and pageless  |
| **Collaboration** | Liveblocks 3 (rooms, live cursors, comments, notifications, share modal)               |
| **Auth**          | Clerk 7                                                                                |
| **Styling**       | Tailwind CSS v4 (CSS-first tokens in `app/globals.css`), shadcn/Radix primitives       |
| **Monitoring**    | Sentry                                                                                 |
| **Tooling**       | ESLint, Prettier, Husky, lint-staged, commitlint, GitHub Actions CI, Gitleaks          |
| **Releases**      | Release Please on `master`, Vercel preview and production deployments                  |
| **Data**          | Liveblocks rooms only — no application database yet (Phase 3)                          |

---

## How to use these plans

1. Pick the next phase (start with **Phase 0**).
2. Work through the checklist in order unless a task is marked parallel-safe.
3. Check off items as they ship on `dev`.
4. Update the plan file when scope changes — these docs are the source of truth.

---

## Out of scope (for now)

- Mobile native apps
- Real-time video/voice
- Full Google Docs feature parity (slides, sheets, etc.)
