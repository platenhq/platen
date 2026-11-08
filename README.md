# Platen

[![CI](https://github.com/platenhq/platen/actions/workflows/ci.yml/badge.svg)](https://github.com/platenhq/platen/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A modern, real-time collaborative rich-text document editor built with Next.js, Lexical, Liveblocks, and Clerk.

**Live Demo:** [platenhq.vercel.app](https://platenhq.vercel.app/)

---

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React Compiler)
- **UI & Components:** React 19, Radix UI, Tailwind CSS v4
- **Rich-Text Engine:** [Lexical](https://lexical.dev/) 0.35
- **Pagination:** [`@platen/engine`](https://www.npmjs.com/package/@platen/engine) (multi-page layout with page breaks between lines)
- **Real-Time Collaboration:** [Liveblocks](https://liveblocks.io/) 3 (presence, live cursors, comments)
- **Authentication:** [Clerk](https://clerk.com/) 7
- **Monitoring:** [Sentry](https://sentry.io/)
- **Code Quality & CI/CD:** ESLint, Prettier, Husky, commitlint, Gitleaks, GitHub Actions, Release Please

---

## Getting Started

### Prerequisites

- Node.js >= 24.0.0 (see [`.nvmrc`](./.nvmrc))
- npm >= 10.0.0

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/platenhq/platen.git
   cd platen
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your credentials from Clerk and Liveblocks.

4. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3002](http://localhost:3002) in your browser.

---

## Available Scripts

| Command                      | Description                                     |
| :--------------------------- | :---------------------------------------------- |
| `npm run dev`                | Start development server at `localhost:3002`    |
| `npm run build`              | Compile optimized production build              |
| `npm run start`              | Start production server                         |
| `npm run lint`               | Run Next.js ESLint checks                       |
| `npm run format`             | Format all code with Prettier                   |
| `npm run format:check`       | Check code formatting compliance                |
| `npm run typecheck`          | Run TypeScript type checking (`tsc --noEmit`)   |
| `npm run security:audit`     | Run dependency vulnerability scan               |
| `npm run security:audit:fix` | Automatically apply non-breaking security fixes |
| `npm run security:outdated`  | Check for outdated package versions             |
| `npm run reset`              | Clean reinstall of `node_modules` and lockfile  |

---

## Development Roadmap & Contributing

- **Roadmap:** Review our multi-phase roadmap in [`docs/plans/README.md`](./docs/plans/README.md).
- **Contributing Guidelines:** Read commit conventions and workflow rules in [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md).
- **Agent Instructions:** Guidelines for AI agents working in this repository are in [`AGENTS.md`](./AGENTS.md) and [`CLAUDE.md`](./CLAUDE.md).

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
