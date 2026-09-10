# Phase 3 — Core Product Features & Database Architecture

**Goal:** Transform Docs Editor into a multi-tenant document platform with an application database (Postgres), personalized home dashboards, Google Docs-grade sharing (anonymous guest carets & public link sharing), Google Drive/Docs integration, version history, full-text search, and multi-format exports.

**Depends on:** [Phase 1 — Foundation & Collaboration](./phase-1-foundation-collaboration.md), [Phase 1.5 — Performance & UI Revamp](./phase-1.5-performance-and-ui-revamp.md), [Phase 2 — Enterprise Editor Canvas & Toolbar Experience](./phase-2-enterprise-editor-canvas.md)

**Estimated effort:** 3–4 weeks

---

## 3.1 Application Database & Multi-Tenant Schema (Postgres)

**Core Architectural Shift:** Postgres is the permanent, authoritative single source of truth for all document content and metadata. Liveblocks is strictly a transient multiplayer transport bus (WebSockets, carets, live keystroke merging, comments).

Documents can never be wiped out by third-party cloud outages, client connection race conditions, or unhandled 503 errors.

### Architecture Overview

```txt
┌─────────────────────────────────────────────────────────────┐
│                       OUR POSTGRES DB                       │
│              (Permanent Source of Truth)                    │
│   • documents (content_json, content_text, title, owner)    │
│   • document_versions (full point-in-time rollback history) │
└──────────────┬───────────────────────────────▲──────────────┘
               │                               │
       1. Hydrate on load              3. Debounced Autosave
               │                        (with Anti-Wipe Guard)
               ▼                               │
┌──────────────────────────────┐               │
│     NEXT.JS SERVER / RSC     │───────────────┘
│   (Loads doc even if offline)│
└──────────────┬───────────────┘
               │
       2. Real-time edits only
               ▼
┌──────────────────────────────┐
│     LIVEBLOCKS WEBSOCKET     │  <-- Only handles live typing,
│   (Multiplayer Sync & Carets)│      cursors, & comments while open!
└──────────────────────────────┘
```

### Database Schema (Drizzle ORM / Prisma)

```sql
-- Users (Linked with Clerk or Inbuilt Auth)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents with Authoritative Content Persistence
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  liveblocks_room_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  general_access TEXT NOT NULL DEFAULT 'restricted', -- 'restricted' | 'public_view' | 'public_edit'

  -- Content Persistence Layer (Immune to external cloud wipeouts)
  content_json JSONB,                -- Canonical Lexical AST (serialized JSON snapshot)
  content_text TEXT,                 -- Plain text extraction for indexed full-text search
  content_html TEXT,                 -- Static HTML cache for fast preview and exports
  last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Independent Version History & Disaster Recovery Snapshots
CREATE TABLE document_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  version_name TEXT,                 -- e.g. "Draft", "Approved Copy", or NULL for periodic autosaves
  content_json JSONB NOT NULL,       -- Complete snapshot of document AST at this revision
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Permissions
CREATE TABLE document_permissions (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'viewer' | 'commenter' | 'editor'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, user_email)
);

-- Folders
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Starred Documents
CREATE TABLE starred_documents (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, document_id)
);
```

### 3.1.B Document Persistence Pipeline & Anti-Wipeout Engine

1. **Hydration on Document Open (`/documents/[id]`):**
   - Next.js Server Component queries `documents` directly from Postgres.
   - If the Liveblocks room is newly initialized or empty, the server seeds the room with `content_json` from Postgres.
   - Even if Liveblocks is unreachable (503), the document renders on screen from Postgres in read/offline mode.

2. **Debounced Client Autosave with Anti-Wipeout Guard:**
   - On every keystroke/mutation, Lexical debounces an autosave (3 seconds idle) calling a Server Action (`saveDocumentContent`).
   - **Anti-Wipeout Validation:**

     ```ts
     // Reject suspected wipeouts
     if (isAstEmpty(newContentJson) && existingDoc.hasContent) {
       throw new Error("Suspected empty-state wipeout rejected by persistence guard.");
     }
     ```

3. **Liveblocks Webhook Sync:**
   - An API route `/api/webhooks/liveblocks` captures `storage:updated` and user disconnect events, automatically synchronizing final room states to Postgres.

### Checklist for database schema

- [ ] Set up Drizzle ORM (or Prisma) with Postgres connection pooling
- [ ] Define database schema tables: `users`, `documents`, `document_versions`, `document_permissions`, `folders`, `starred_documents`
- [ ] Implement `saveDocumentContent` server action with Anti-Wipeout validation
- [ ] Implement document hydration pipeline: seed Liveblocks rooms from Postgres `content_json`
- [ ] Create database migration scripts and seed utilities
- [ ] Connect Liveblocks session-end webhooks to Postgres auto-flushing

### Files to create/modify for database schema

```txt
drizzle.config.ts (or prisma/schema.prisma)
lib/db/index.ts
lib/db/schema.ts
lib/actions/document.actions.ts
app/api/webhooks/liveblocks/route.ts
.env.example
```

---

## 3.2 Personalized Multi-Tenant Dashboard (`/`)

The home screen must be strictly tailored to the authenticated user, matching Google Docs' organization.

### Dashboard Views

1. **Owned by Me:** Documents where `owner_id === user.id` and `deleted_at IS NULL`.
2. **Shared with Me:** Documents where `document_permissions.user_email === user.email` (excluding owned docs).
3. **Recent:** All accessible documents sorted chronologically by `updated_at DESC`.
4. **Starred:** Quick-access bookmarked documents from `starred_documents`.
5. **Trash:** Soft-deleted documents (`deleted_at IS NOT NULL`) with restore and permanent purge actions.

### Dashboard Streaming & Suspense Architecture

```txt
Page Shell (Sticky Header + Search + Tab Navigation + Create Button) — Renders Instantly
  └── <Suspense fallback={<DashboardDocumentSkeleton />}>
        └── Active Tab Stream (Postgres query: Owned / Shared / Recent / Starred / Trash)
```

### Checklist for multi-tenant dashboard

- [ ] Rebuild home page (`app/(root)/page.tsx`) with dynamic tab filtering (_All_, _Owned by me_, _Shared with me_, _Recent_, _Trash_)
- [ ] Wrap dashboard tab views in per-section `<Suspense>` boundaries with skeleton placeholders for streaming SSR
- [ ] Implement document search bar and sorting options (Last modified, Title, Date created)
- [ ] Add Grid and List view switcher for document cards
- [ ] Build document action menu: Rename, Star, Duplicate, Move to Folder, Move to Trash

### Files to create/modify for multi-tenant dashboard

```txt
app/(root)/page.tsx
components/dashboard/DocumentGrid.tsx
components/dashboard/DocumentList.tsx
components/dashboard/DocumentCard.tsx
components/dashboard/DashboardTabs.tsx
components/dashboard/DashboardSkeleton.tsx
components/dashboard/DocumentActionsMenu.tsx
```

---

## 3.3 Google Docs-Grade Sharing & Anonymous Guest Carets

Allow seamless public link sharing without forcing mandatory sign-ups, while retaining strict permission controls.

### Two-Tier Permission Model

```txt
┌─────────────────────────────────────────────────────────────┐
│                    Document Share Model                     │
├─────────────────────────────────────────────────────────────┤
│ 1. General Access:                                          │
│    • Restricted: Only users with explicit invites           │
│    • Anyone with the link (Viewer / Editor)                 │
│                                                             │
│ 2. People with Access:                                      │
│    • Owner (Full rights)                                    │
│    • Invited Collaborators (Viewer / Commenter / Editor)    │
└─────────────────────────────────────────────────────────────┘
```

### Anonymous Guest Collaboration

When a document has `general_access = 'public_view'` or `'public_edit'`:

- Unauthenticated visitors can open `/documents/[id]` directly without being forced to `/sign-in`.
- `/api/liveblocks-auth` generates an ephemeral guest identity (_Anonymous Penguin_, _Anonymous Otter_) with a randomized color and guest avatar.
- Anonymous users have full real-time reading and cursor visibility.

### Post-Auth Deep Linking

- If an unauthenticated user opens a restricted document, preserve `returnBackUrl=/documents/[id]` so that after signing in/up they return directly to the document instead of the home screen.

### Checklist for sharing

- [ ] Add `general_access` selector (_Restricted_ vs _Anyone with link_) to `ShareModal.tsx`
- [ ] Update `app/api/liveblocks-auth/route.ts` to support authenticated users and anonymous guest tokens
- [ ] Update `middleware.ts` to permit public document access when `general_access !== 'restricted'`
- [ ] Preserve return URLs across Clerk sign-in and sign-up flows

### Files to create/modify for sharing

```txt
app/api/liveblocks-auth/route.ts
middleware.ts
components/modal/ShareModal.tsx
lib/actions/room.actions.ts
```

---

## 3.4 Google Drive & Google Docs Integrations (Export & Import)

Allow seamless document synchronization and export with the Google Workspace ecosystem.

### Google Integration Workflows

1. **Export to Google Docs / Google Drive:**
   - Authenticate with Google OAuth (`drive.file` / `documents` scope).
   - Convert Lexical document AST into Google Docs formatting via Google Docs API (`documents.create` + `documents.batchUpdate`).
   - Save directly as a Google Doc or uploaded `.docx` / `.pdf` in the user's Google Drive.
2. **Import from Google Drive:**
   - Integrate Google Drive File Picker.
   - Fetch `.gdoc`, `.docx`, or `.md` files, parse into Lexical nodes, and instantiate a new collaborative room.

### Checklist for export/import

- [ ] Configure Google OAuth client and API credentials
- [ ] Implement Lexical AST to Google Docs API structural transformer
- [ ] Add "Save to Google Drive" and "Export to Google Docs" options to export dialog
- [ ] Add "Import from Google Drive" action on home dashboard

### Files to create/modify for export/import

```txt
app/api/integrations/google/export/route.ts
app/api/integrations/google/import/route.ts
lib/integrations/google-docs.ts
lib/integrations/google-drive.ts
components/modal/ExportModal.tsx
```

---

## 3.5 Version History & Snapshots

Provide revision tracking, comparison, and one-click rollback.

### Checklist for version history

- [ ] Wire Liveblocks Yjs history / versioning API endpoints
- [ ] Build Version History sidebar UI displaying timestamped revisions and authors
- [ ] Implement "Restore this version" workflow with confirmation dialog
- [ ] Add named version tagging (e.g. "Final Draft", "Approved Copy")

### Files to create/modify for version history

```txt
components/editor/VersionHistorySidebar.tsx
lib/actions/version.actions.ts
app/(root)/documents/[id]/page.tsx
```

---

## 3.6 Unified Document Search (Titles + Full Text)

Enable instant search across all documents.

### Checklist for document search

- [ ] Implement fast title search via Postgres indexed queries
- [ ] Add plain-text content indexing in Postgres using `tsvector` on document save
- [ ] Build global `Cmd+K` / `Ctrl+K` search modal with instant results and highlight snippets

### Files to create/modify for document search

```txt
components/dashboard/SearchCommandModal.tsx
app/api/search/route.ts
lib/actions/document.actions.ts
```

---

## 3.7 Document Organization (Folders, Starred, Trash)

Structured file management for power users.

### Checklist for docs organization

- [ ] Implement folder creation, renaming, nesting, and document movement
- [ ] Add folder tree sidebar navigation on home screen
- [ ] Implement Star/Unstar toggle with instant UI update
- [ ] Implement Trash view with soft delete (`deleted_at`), Restore, and Empty Trash actions

### Files to create/modify for docs organization

```txt
components/dashboard/FolderSidebar.tsx
components/dashboard/FolderTree.tsx
components/dashboard/TrashView.tsx
lib/actions/folder.actions.ts
```

---

## 3.8 Multi-Format Export (Markdown, PDF, HTML, Docx)

Enable exporting document content to standard industry formats.

### Checklist multi-format export

- [ ] Export to Markdown (`.md`) using Lexical markdown serializer
- [ ] Export to PDF (`.pdf`) using `@react-pdf/renderer` or server-side headless print
- [ ] Export to HTML / Copy Rich Text for pasting into external tools
- [ ] Export to Word Document (`.docx`)

### Files to create/modify for multi-format export

```txt
app/api/export/[id]/route.ts
lib/export/markdown.ts
lib/export/pdf.ts
lib/export/docx.ts
components/modal/ExportModal.tsx
```

---

## 3.9 Keyboard Shortcuts, Command Palette & Inline Mentions

Provide power-user shortcuts and interactive collaborator tagging.

### Checklist for keyboard shortcuts

- [ ] Add `Cmd+K` / `Ctrl+K` command palette for quick formatting, exporting, and actions
- [ ] Add keyboard shortcuts help dialog (`?` key)
- [ ] Implement inline `@` mention plugin in Lexical editor with user autocomplete
- [ ] Send Liveblocks notifications when a user is mentioned in the document body

### Files to create/modify for keyboard shortcuts

```txt
components/editor/plugins/mentionPlugin/index.tsx
components/editor/CommandPalette.tsx
components/modal/ShortcutsModal.tsx
```

---

## 3.10 Mobile & Responsive Editor Experience

Ensure high-quality document editing across mobile devices and tablets.

### Checklist for mobile experience

- [ ] Build responsive bottom formatting toolbar for mobile viewports
- [ ] Optimize touch targets for selection, comments, and modals
- [ ] Verify touch drag and drop interactions

### Files to modify for mobile experience

```txt
components/editor/Editor.tsx
components/editor/plugins/toolbarPlugin/ToolbarPlugin.tsx
```

---

## Acceptance Criteria

- [ ] Postgres schema manages users, documents, permissions, and folders
- [ ] Home dashboard (`/`) dynamically separates _Owned by me_, _Shared with me_, _Recent_, and _Trash_
- [ ] Public link sharing allows unauthenticated users to view/edit with anonymous guest carets
- [ ] Documents can be exported to and imported from Google Drive / Google Docs
- [ ] Version history allows reviewing and restoring past document revisions
- [ ] Instant `Cmd+K` search finds documents by title and content
- [ ] Multi-format export (Markdown, PDF, HTML, Docx) works reliably

---

## Suggested Commit Sequence

```txt
feat(db): establish postgres schema with drizzle orm and migration scripts
feat(dashboard): build multi-tenant document views with dynamic filtering
feat(sharing): implement general access tiers and anonymous guest presence
feat(integrations): add google drive and google docs export/import handlers
feat(history): implement version history sidebar and snapshot restore
feat(search): add full-text postgres search with command palette modal
feat(organization): add folders, starred items, and soft-delete trash
feat(export): add multi-format export for markdown, pdf, and docx
feat(mentions): add inline collaborator mentions with inbox notifications
```

---

## Next Phase

→ [Phase 4 — AI Features & Inline Editing](./phase-4-ai-features.md)  
→ [Phase 5 — Auth Strategy & Inbuilt Auth Migration](./phase-5-auth-strategy.md)
