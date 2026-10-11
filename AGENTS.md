# Agent Instructions — Docs Editor

## Mandatory Operating Protocol

You must execute all tasks in strict, sequential phases. You are required to maintain a passive, read-only state until an explicit progression signal is granted by the user.

---

## PHASE 1: READ-ONLY INVESTIGATION (DEFAULT STATE)

- **Execution:** You must restrict your initial operations entirely to reading and inspecting the workspace.
- **Allowed Tools:** You are permitted to use read-only file system tools (e.g., `view_file`, `list_dir`, `grep_search`) and read-only shell inspection (e.g., `git status`, `git diff`).
- **State Constraint:** You must refrain from creating, modifying, or deleting files, running installation commands, or executing modifying scripts of any kind until Phase 2 is complete and explicit Phase 3 approval is granted.

---

## PHASE 2: SCOPE-BASED PROPOSAL GENERATION

Before modifying code, you must analyze the scope of changes and present a clear proposal matching one of these two formats:

### A. Small/Minor Changes (e.g., minor styling tweaks, simple fixes, few lines of code)

- Skip the creation of external documentation artifacts.
- Write a concise, inline text proposal directly in your chat response.
- List the specific target files and the exact lines of code changing, then proceed immediately to Phase 3.

### B. Medium to Large Changes (e.g., structural refactoring, complex logic, multi-file edits)

- You must create or update a formal `implementation_plan.md` artifact document in the project workspace.
- Detail the architecture, specific file modifications, and verification steps within this file.
- Present the link or path to this plan to the user, then proceed immediately to Phase 3.

---

## PHASE 3: MANDATORY USER APPROVAL GATE

- **Action:** Immediately after presenting your proposal (inline summary or `implementation_plan.md`), you must halt all tool execution and terminate your turn.
- **Resumption Rule:** You must remain in a halted state until the user provides explicit verbal confirmation to proceed (e.g., "proceed", "approve", "go ahead"). No write or terminal execution tool may be called until this condition is satisfied.

---

## GIT & VERSION CONTROL PROTOCOLS

### 1. Conventional Git Commits

- **Structure:** Format the commit message strictly according to the Conventional Commits specification (e.g., `feat(scope):`, `refactor(scope):`, `chore(scope):`, `fix(scope):`).
- **Line Length Guardrail:** Maintain a strict limit of under 100 characters for every single line within the commit message text (including the title line, body paragraphs, and individual bullet points).
- **Functional Extraction Rules:** Detail _what_ changed functionally from a user or system architectural perspective. You must exclude explicit technical implementation details, such as:
  - Raw JSX/HTML tags (e.g., `<div>`, `<form>`).
  - CSS layout or Tailwind CSS utility classes (e.g., `bg-linear-to-r`, `py-16`).
  - Specific code-level variable names, hook handles, or state functions (e.g., `useState`, `userType`, `isSubmitting`).
  - _Example Correct Focus:_ "replace interactive feedback form with static lists of attendee benefits".
- **Generation Workflow:** You must systematically run `git status` followed by `git diff` to extract exact functional changes. If files were relocated or restructured, trace the source file and explicitly document all functional modifications made during the relocation in granular, flat bullet points. Never guess or write messages based on what was intended to be done.
- **Granular Bullet Points:** Include detailed, flat bullet points proportional to the number of distinct functional changes in that commit batch. Each bullet must represent exactly one discrete user-facing or system-level behavioral change. A batch with many changes warrants many bullets — do not collapse them into a vague summary.
- **Batched Commit Intent:** Commits are split into logical batches so each carries a focused body proportional to its own scope. Do not thin out or summarize bullets to keep a batch brief — the purpose of batching is to allow thorough per-scope detail in each commit body.
- **On-Demand Generation Only:** You are ABSOLUTELY FORBIDDEN from generating git commit messages or git command snippets automatically after making file changes. You MUST ONLY generate commit messages when the user explicitly requests one.
- **Shell-Safe Delivery:** Format the final git command string using clean escaping and quoting so the user can copy-paste and execute it safely across both Bash and Windows command prompts without syntax errors. Do NOT include `cmd /c` prefixes in snippets generated for the user.

### 2. Pull Request (PR) Standard

- **Format:** Ensure the final PR description is concise, flat, and conventional.
- **Content:** Restrict the description to a high-level **Summary** section and a flat list of **Key Changes**.
- **Structural Constraint:** You must use flat, sequential items for the changes list. Do not generate nested or indented bullet points.
- **Key Changes Depth:** Each key change in the PR must reflect a distinct functional capability or user-facing behavior, not a restatement of file names. The level of detail must reflect the total functional scope of the PR.
- **Context Retrieval:** When tasked with generating a PR description for specific Commit IDs, you must first execute `git log` or relevant git retrieval commands to inspect the exact commit messages. Generate the PR Title and content strictly from the actual recorded commit logs, never from assumptions.

---

## CODEBASE ARCHITECTURE & LEXICAL/LIVEBLOCKS RULES

- **Stack:** Next.js 15 (App Router, Turbopack), React 18, TypeScript, Tailwind CSS, Lexical, Liveblocks, Clerk, Sentry.
- **Lexical Contracts:**
  - Preserve AST serialization for Liveblocks synchronization.
  - Prefer native `@lexical` utilities (e.g., `$insertTableRowAtSelection`) inside `editor.update()` over custom DOM workarounds.
- **Liveblocks Room Contracts:**
  - Metadata updates must preserve `title`, `creatorId`, and `usersAccesses`.
  - Maintain paragraph buffers around standalone blocks (tables, embeds) so caret navigation and click-to-focus remain seamless.

---

## DEVELOPMENT PHASES

| Phase | File                                                | Focus                               |
| ----- | --------------------------------------------------- | ----------------------------------- |
| 0     | `docs/plans/phase-0-tooling.md`                     | Tooling, CI/CD, conventions         |
| 1     | `docs/plans/phase-1-foundation-collaboration.md`    | Deps, Tailwind v4, collaboration    |
| 1.5   | `docs/plans/phase-1.5-performance-and-ui-revamp.md` | Dev speed, Google Docs sharing, UI  |
| 2     | `docs/plans/phase-2-enterprise-editor-canvas.md`    | Page canvas, ruler, toolbar, tables |
| 3     | `docs/plans/phase-3-core-product-features.md`       | History, search, export, Postgres   |
| 4     | `docs/plans/phase-4-ai-features.md`                 | Inline AI editing                   |
| 5     | `docs/plans/phase-5-auth-strategy.md`               | Auth strategy                       |
