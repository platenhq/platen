# Contributing to Platen

Thank you for contributing. This guide covers setup, workflow, commit conventions, and pull requests.

## Setup

```bash
git clone https://github.com/platenhq/platen.git
cd platen
npm install
cp .env.example .env.local   # fill in values (when .env.example exists)
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

## Branch strategy

```txt
master  ← production-ready releases
  └── dev  ← integration branch for development work
        └── feature/*  ← individual tasks
```

1. Branch from `dev` for new work.
2. Open pull requests into `dev`.
3. Merge `dev` → `master` when a phase or milestone is stable.

## Scripts

| Command                      | Description                                |
| ---------------------------- | ------------------------------------------ |
| `npm run dev`                | Start development server                   |
| `npm run build`              | Production build                           |
| `npm run lint`               | Run ESLint                                 |
| `npm run format`             | Format codebase with Prettier              |
| `npm run format:check`       | Check formatting (CI-safe)                 |
| `npm run typecheck`          | Run TypeScript type checking               |
| `npm run security:audit`     | Run dependency security audit (high level) |
| `npm run security:audit:fix` | Automatically fix audit vulnerabilities    |
| `npm run security:outdated`  | Check for outdated package versions        |
| `npm run reset`              | Clean reinstall of modules and lockfile    |

> **Note on Security Audits:** `security:audit` is blocking: high-severity advisories fail the pre-push hook and the CI security job.

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```txt
<type>[optional scope]: <subject>

[optional body]
```

### Types

| Type       | When to use                         |
| ---------- | ----------------------------------- |
| `feat`     | New feature                         |
| `fix`      | Bug fix                             |
| `docs`     | Documentation only                  |
| `style`    | Formatting, no logic change         |
| `refactor` | Code change that is not feat or fix |
| `perf`     | Performance improvement             |
| `test`     | Adding or updating tests            |
| `chore`    | Tooling, deps, config               |
| `ci`       | CI/CD changes                       |
| `build`    | Build system changes                |
| `revert`   | Reverting previous commits          |

### Rules

1. **Every line must be under 100 characters** (subject, body, and bullets).
2. **Describe what changed functionally**, not how it was implemented.
3. Use **imperative mood** in the subject: "add feature" not "added feature".
4. **No trailing period** on the subject line.
5. Use **flat bullet points** in the body for multi-part changes — no nested bullets.

### Do not include in commit messages

- JSX/HTML tags (`<div>`, `<form>`)
- CSS or Tailwind class names (`bg-blue-500`, `flex-col`)
- Variable names, hook names, or function names (`useState`, `handleSubmit`)
- File paths with line numbers as the primary description

### Examples

**Good subject lines:**

```txt
feat(share): add email validation before document invite
fix(collaboration): correct event listener cleanup on title edit
docs: add development roadmap for phases 0-4
chore: add husky and lint-staged
ci: add github actions workflow for lint and build
```

**Bad subject lines:**

```txt
feat(share): add regex in ShareModal onClick handler
fix: update CollaborativeRoom.tsx useEffect cleanup function
style: change bg-[#00afdb] to bg-[#0081a4] on share button
```

**Good body:**

```txt
feat(editor): enable table plugin

- Allow inserting tables from the toolbar
- Sync table edits across collaborators via Liveblocks
- Style table borders in light and dark themes
```

**Bad body:**

```txt
feat(editor): enable table plugin

- Added TablePlugin to Editor.tsx
- Imported TableNode from @lexical/table
- Added btn with className="table-insert" to ToolbarPlugin
```

### Multiline commit command

```bash
git commit -m "$(cat <<'EOF'
feat(scope): short subject under 100 chars

- First functional change described plainly
- Second functional change described plainly
EOF
)"
```

### Enforcement

Enforced automatically via Git hooks:

- **Husky pre-commit** runs `lint-staged` (Prettier + ESLint on staged files).
- **Husky commit-msg** runs `commitlint` (validating conventional types, length limits, and formatting).
- **Husky pre-push** runs `security:audit` (preventing vulnerable packages from being pushed).

## Pull request conventions

### Title

Use conventional commit format, lowercase after the scope, starting with a verb and naming the
main capability in specific terms:

```txt
feat(editor): implement table grid dimension picker and page break node
fix(editor): prevent unbreakable blocks from collapsing at page breaks
```

Join capabilities with commas only when the PR delivers two or three distinct modules. Long comma
lists are for release PRs into `master`.

### Description structure

```markdown
## Breaking Changes

- Only when existing users, documents or deployments must account for something.

## Summary

Introduces document-level page setup so every collaborator sees the same paper size and
margins. This ensures page breaks, page counts and printed output match across sessions.

## Key Changes

- Save paper size and margins with the document instead of the browser.
- Apply page setup changes to every open session without a reload.
- Restrict page setup changes to collaborators with write access.
```

### PR rules

1. **Tone** — formal and technical, like a release note; no casual phrasing or first person.
2. **Summary** — one paragraph opening with a present-tense verb ("Introduces…", "Fixes…"),
   followed by a "This includes…" or "This ensures…" sentence.
3. **Key Changes** — flat list, no nested bullets; each bullet is one behaviour, starts with an
   imperative verb (Add, Implement, Prevent, Restrict, Resolve) and ends with a full stop.
4. Base the description on **actual commit messages** in the branch.

### Creating a PR

```bash
git push -u origin HEAD

gh pr create --base dev --title "feat(scope): implement specific capability" --body "$(cat <<'EOF'
## Summary

Introduces ...

## Key Changes

- Add ...
- Prevent ...
EOF
)"
```

GitHub will also pre-fill the description from [`.github/pull_request_template.md`](../.github/pull_request_template.md).

## Git hooks

Enforced on development workflow:

| Hook         | Action                                               |
| ------------ | ---------------------------------------------------- |
| `pre-commit` | lint-staged (Prettier + ESLint on staged files)      |
| `commit-msg` | commitlint (conventional format + length limits)     |
| `pre-push`   | security audit (blocks push on high vulnerabilities) |

Do not skip hooks with `--no-verify` unless there is a documented reason.

## Planning docs

Development roadmap plans live in [`docs/plans/`](./plans/README.md). Check the relevant phase before starting work.

## AI agents

Agents working in this repo must follow:

- [`AGENTS.md`](../AGENTS.md)
- [`CLAUDE.md`](../CLAUDE.md)
- [`.cursor/rules/git-and-pr-conventions.mdc`](../.cursor/rules/git-and-pr-conventions.mdc)

Agents may commit when the user asks. Present the commit message for approval first, then run `git commit`. Do not push unless the user explicitly requests it. Never add `Co-authored-by` or other commit trailers.

## Questions

Open an issue or discuss in your pull request.
