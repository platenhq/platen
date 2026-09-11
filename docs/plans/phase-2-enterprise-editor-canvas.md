# Phase 2 — Enterprise Editor Canvas & Toolbar Experience

**Goal:** Elevate the Lexical editor from a functional rich-text input into a document-first
editing canvas. Introduce a Google Docs-inspired page layout (white page on a gray viewport,
ruler, visible margins), an advanced toolbar expansion with color pickers and formatting transforms,
a curated Insert menu covering standard document blocks, and proper spatial anchoring of Liveblocks
comment threads beside the page.

**Depends on:** [Phase 1.5 — Performance & UI Revamp](./phase-1.5-performance-and-ui-revamp.md)

**Estimated effort:** 2–3 weeks

---

## Sections Overview

| Section | Focus                                                   | Effort |
| ------- | ------------------------------------------------------- | ------ |
| 2.1     | Page canvas shell & viewport layout                     | Medium |
| 2.2     | Ruler & margin controls                                 | Medium |
| 2.3     | Advanced Toolbar & Formatting Expansion                 | Large  |
| 2.3.A   | Shadcn UI standardization & modular folder architecture | Medium |
| 2.3.B   | Toolbar strip layout alignment & overflow management    | Medium |
| 2.3.C   | Google Docs multi-page pagination & continuous canvas   | Large  |
| 2.4     | Curated Insert menu & table architecture                | Large  |
| 2.5     | Platen Engine hybrid multi-sheet canvas integration     | Large  |
| 2.6     | Comment thread spatial anchoring                        | Small  |
| 2.7     | Document outline sidebar                                | Medium |
| 2.8     | Home dashboard document previews                        | Medium |

---

## 2.1 Page Canvas Shell & Viewport Layout

The most impactful visual change: replace the current full-width editor fill with a
document-first "paper on a desk" metaphor. The editor canvas becomes a constrained-width
white page centered in a gray viewport — the same mental model users bring from Google
Docs and Microsoft Word.

This is **not a Lexical change**. It is a CSS layout architecture change to the editor
shell components. Lexical renders inside whatever container you give it; the container
just needs to look like a page.

### Target Layout

```txt
+----------- Viewport (gray, #f0f0f0 / dark: #1a1a1a) -------------------------+
|                                                                               |
|  +--------- Document Room Header -------------------------------------------+|
|  | <- Home  | Untitled Document (pencil icon)  Connected  [Share] [Avatars] ||
|  +---------------------------------------------------------------------------+|
|                                                                               |
|  +--------- Toolbar (sticky, full-width) ------------------------------------+|
|  | [Undo][Redo] | [Format] | [Font][Size] | [B][I][U]... | [Insert] [Align] ||
|  +---------------------------------------------------------------------------+|
|                                                                               |
|  +--- Ruler -----------------------------------------------------------------+|
|                                                                               |
|          +------- Page Canvas (816px, white, shadow) --------+               |
|          |                                                    |               |
|          |  [cursor / editor content renders here]            |               |
|          |                                                    |               |
|          +----------------------------------------------------+               |
|                      [Comment column appears to the right]                    |
+-------------------------------------------------------------------------------+
```

### Why 816px

816px = 8.5 inches x 96 DPI — the standard US Letter page width at screen resolution.
This makes the page feel like a real document. A4 equivalent would be 794px. The width
should be a CSS custom property so it can be changed per-document in a later phase.

### Checklist for page canvas

- [x] Wrap the editor viewport in a `PageViewport` shell component with a gray background
      and vertical scroll
- [x] Center a `PageCanvas` div (max-width: 816px, white background, padding: 96px 96px,
      `box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)`)
- [x] Define `--page-width`, `--page-padding-x`, and `--page-padding-y` as CSS custom
      properties in `globals.css` for future per-document overrides
- [x] Ensure the page canvas fills to at least the full viewport height even when content
      is short (min-height approach)
- [x] Verify dark mode: viewport becomes `#1e1e1e`, page canvas becomes `#2a2a2a` or
      near-white depending on the user's document theme preference
- [x] Confirm Liveblocks collaborator cursors render correctly inside the new canvas
      container (they are viewport-absolute and may need re-anchoring to the canvas)

### Files to modify for page canvas

```txt
components/editor/EditorShell.tsx              [NEW — wraps PageViewport + PageCanvas]
components/editor/Editor.tsx
app/(root)/documents/[id]/page.tsx
app/globals.css
styles/editor/index.css
```

---

## 2.2 Ruler & Margin Controls

A horizontal ruler sitting above the page canvas provides visual grounding and, in a later
iteration, draggable margin handles. The first iteration ships a read-only ruler that
reflects the current page width and padding. Drag-to-adjust margins is a future stretch
goal and is explicitly out of scope here.

### Ruler Anatomy

```txt
  <- margin ->|<-- -- -- -- text area (624px) -- -- -- -- -->|<- margin ->
  0           1           2           3           4           5           6
  |           |           |           |           |           |           |
  |||   |   |||   |   |||   |   |||   |   |||   |   |||   |   |||   |   |||
```

### Checklist for ruler

- [x] Build a `DocumentRuler` React component that renders above the page canvas
- [x] Ruler ticks at 0.25in intervals, labeled at every 1in; tick height varies by interval
- [x] Ruler width matches the page canvas width including horizontal scroll offset
- [x] Shade the margin zones (left and right of the text area) in a distinct background
      tint to visually separate them from the live editing zone
- [x] The ruler hides automatically on mobile (below `md` breakpoint) where page
      margins collapse for readability
- [x] Expose `--ruler-unit` CSS variable (`96px = 1in`) for consistency with page width

### Files to modify for ruler

```txt
components/editor/DocumentRuler.tsx            [NEW]
components/editor/EditorShell.tsx
styles/editor/index.css
```

---

## 2.3 Advanced Toolbar & Formatting Expansion

Bring the editor toolbar to Google Docs parity by introducing text and highlight color pickers, a Line & Paragraph Spacing dropdown, list styling grids, a Format menu (text transforms), and a Page Layout dropdown.

### Toolbar Strip Layout (Left to Right)

```txt
[Undo][Redo] | [Print] | [Format▾ (Aa)] | [Styles▾] | [Font Family▾] | [Size -/+] |
[B][I][U] | [A▾ TextColor][Highlighter▾ BgColor] |
[InsertLink][AddComment][InsertImage] |
[Align▾] | [LineSpacing▾] | [Checklist][BulletList▾][NumberList▾] | [Outdent][Indent] |
[ClearFormatting] | [Insert▾] | [PageLayout▾]
```

### Color Picker UI & Custom Modal

```txt
Dropdown:
+----------------------------------------------+
| [None] (Only for Highlight color)            |
+----------------------------------------------+
| ● ● ● ● ● ● ● ●  (Preset palette grid)       |
| ● ● ● ● ● ● ● ●                              |
+----------------------------------------------+
| CUSTOM                                       |
| ⊕ (Opens Custom Modal)                       |
+----------------------------------------------+

Custom Modal:
+----------------------------------------------+
| [Gradient Canvas (Saturation/Lightness)]     |
| [Hue Slider]                                 |
| Hex [ #FF0000 ]  R [255] G [0] B [0]         |
|                      [ Cancel ] [ OK ]       |
+----------------------------------------------+
```

### Lexical Mechanism & Preset Palette

```ts
// Text color
$patchStyleText(selection, { color: hexValue });

// Highlight (Background) color
$patchStyleText(selection, { "background-color": hexValue });
```

Preset palette matching Google Docs / Lexical:

```txt
Row 1: #000  #434343  #666  #999  #b7b7b7  #ccc  #efefef  #f3f3f3  #fff
Row 2: #f00  #f90  #ff0  #0f0  #0ff  #00f  #90f  #f0f  + custom (from modal)
```

### Format & Spacing Menu Scope

```txt
Format (Aa)
+-- Strikethrough        (Ctrl+Shift+X)
+-- Superscript          (Ctrl+.)
+-- Subscript            (Ctrl+,)
+-- (separator)
+-- Capitalization
    +-- lowercase
    +-- UPPERCASE
    +-- Title Case

Line & paragraph spacing
+-- Single (1.0)
+-- 1.15 (Default)
+-- 1.5
+-- Double (2.0)
+-- (separator)
+-- Add space before paragraph
+-- Add space after paragraph
+-- Custom spacing...
```

### Page Layout Settings & CSS Mapping

| Page Size        | `--page-width` | `--page-height` (print) | Margin Preset    | `--page-padding-x` | `--page-padding-y` |
| :--------------- | :------------- | :---------------------- | :--------------- | :----------------- | :----------------- |
| Pageless         | `100%`         | auto                    | Normal (1")      | `96px`             | `96px`             |
| Letter (8.5×11") | `816px`        | `1056px`                | Narrow (0.5")    | `48px`             | `48px`             |
| A4 (8.27×11.69") | `794px`        | `1123px`                | Moderate (0.75") | `72px`             | `72px`             |
| Legal (8.5×14")  | `816px`        | `1344px`                | Wide (1.5")      | `144px`            | `96px`             |

Page settings are stored in **Liveblocks Room Metadata** (`liveblocks.updateRoom({ metadata })`) and sync live to collaborators.

### Checklist for toolbar expansion

- [x] Build `ColorDropdown` component (preset swatches + CUSTOM `+` button)
- [x] Build `CustomColorModal` component (gradient canvas + hue slider + Hex/RGB inputs)
- [x] Build `FontColorButton` and `HighlightColorButton` toolbar components
- [x] Build `LineSpacingDropdown` toolbar component with line height and paragraph spacing controls
- [x] Add `ChecklistButton`, `BulletedListDropdown` (with style grid), `NumberedListDropdown` (with style grid), and Indent/Outdent controls
- [x] Build `FormatDropdown` with Strikethrough, Superscript, Subscript, and Title Case text transforms
- [x] Add `ClearFormattingButton` directly to the main toolbar strip (calling `$clearFormatting`)
- [x] Build `PageLayoutDropdown` to adjust page size (Letter, A4, Pageless) and margin presets via CSS custom properties and Liveblocks metadata

### Files to modify for toolbar expansion

```txt
components/editor/plugins/toolbarPlugin/ColorDropdown.tsx         [NEW]
components/editor/plugins/toolbarPlugin/CustomColorModal.tsx      [NEW]
components/editor/plugins/toolbarPlugin/FontColorButton.tsx       [NEW]
components/editor/plugins/toolbarPlugin/HighlightColorButton.tsx  [NEW]
components/editor/plugins/toolbarPlugin/LineSpacingDropdown.tsx   [NEW]
components/editor/plugins/toolbarPlugin/ListDropdowns.tsx         [NEW]
components/editor/plugins/toolbarPlugin/FormatDropdown.tsx        [NEW]
components/editor/plugins/toolbarPlugin/PageLayoutDropdown.tsx    [NEW]
components/editor/plugins/toolbarPlugin/ToolbarPlugin.tsx         [MODIFY]
styles/editor/index.css                                           [MODIFY]
```

---

## 2.3.A Codebase Component Layer & Shadcn UI Standardization

To prevent visual drift, inconsistent hover/active states, and ad-hoc CSS overrides, all toolbar and editor interactive elements must be built upon standardized wrappers extending Shadcn UI primitives.

### Wrapper Hierarchy & Component Contracts

```txt
components/ui/
├── custom/
│   ├── CustomToolbarButton.tsx     # Extends Shadcn Button with toolbar-item tokens & active state
│   ├── CustomDropdown.tsx          # Extends Shadcn DropdownMenu with standardized item padding
│   ├── CustomPopover.tsx           # Extends Shadcn Popover with zero-clipping portal behavior
│   ├── CustomModal.tsx             # Extends Shadcn Dialog with consistent backdrop & transitions
│   ├── CustomColorPicker.tsx       # Standardized 10x8 palette matrix & custom trigger dropdown
│   └── CustomColorModal.tsx        # Standalone 2D HSV gradient & RGB/HEX picker dialog
├── button.tsx                      # Base Shadcn Button
├── dropdown-menu.tsx               # Base Shadcn Dropdown Menu
├── popover.tsx                     # Base Shadcn Popover
├── dialog.tsx                      # Base Shadcn Dialog
└── select.tsx                      # Base Shadcn Select
```

### Core Design System Rules

1. **`CustomToolbarButton` Contract:**
   - Standard size: `size-9` ($36 \times 36\text{px}$) with dedicated split-button sizing presets.
   - Hover state: `hover:enabled:bg-surface-hover` (resolves to `--surface-hover`).
   - Active state: `bg-primary/15 text-primary dark:bg-primary/20 dark:text-accent font-semibold`.
   - Interaction guard: `onMouseDown={(e) => e.preventDefault()}` on all buttons to maintain Lexical caret selection.
2. **`CustomDropdown` & `CustomPopover` Contract:**
   - Fixed elevation (`z-50` / `z-60`), animated transitions, and viewport collision detection.
   - Focus retention guard: `onOpenAutoFocus={(e) => e.preventDefault()}` and `onCloseAutoFocus` to preserve editor caret position.
   - Standardized text scale: `text-xs` font size, `px-2.5 py-1.5` item padding.
3. **`CustomModal` & `CustomColorModal` Contract:**
   - Uniform backdrop blur, centered responsive container (`max-w-md` / `max-w-sm`), and standardized action headers/footers.
   - Reusable across both toolbar controls and upcoming table cell / document canvas styling.

### Enterprise Folder Structure & Gradual Refactoring Blueprint

To ensure long-term scalability without causing merge friction or breaking Git history, we establish clear domain boundaries and a gradual, non-destructive migration pattern:

```txt
components/
├── ui/                              # Pure design system primitives & enterprise wrappers ONLY
│   ├── custom/                      # CustomToolbarButton, CustomDropdown, CustomModal, etc.
│   └── ...                          # Base Radix / Shadcn primitives (button, dialog, popover)
├── home/                            # Home dashboard & document library (DocumentCard, HomeDashboard)
├── shared/                          # Global shell & reusable widgets (Header, ToggleTheme, Loader)
├── modal/                           # Centralized application dialogs (DeleteModal, ShareModal)
├── liveblocks/                      # Real-time collaboration UI (Comments, Notifications)
├── collaborators/                   # Live room presence & active collaborator avatars
└── editor/                          # Lexical rich-text editing engine
    ├── DocumentRuler.tsx            # Horizontal document ruler
    ├── EditorShell.tsx              # Paper-on-a-desk page canvas shell
    ├── nodes/                       # Custom Lexical Decorator & AST nodes
    └── plugins/                     # Lexical feature plugins
        └── toolbarPlugin/           # Main formatting ribbon
            ├── dropdowns/           # Grouped formatting dropdowns & pickers
            ├── ToolbarPlugin.tsx
            ├── options.ts
            └── utils.ts
```

#### What Stays As-Is (Zero Disruption)

- **`app/` Router Groups (`app/(auth)/`, `app/(root)/`, `app/api/`):** Maintain idiomatic Next.js 15 App Router conventions.
- **`context/` Providers:** Keep `DocumentLayoutContext.tsx`, `ToolbarContext.tsx`, and `SettingsContext.tsx` focused and single-purpose.
- **`lib/actions/`:** Keep server-side database/room operations cleanly separated from client UI.

#### Gradual Refactoring Rules

1. **No Big-Bang Relocations:** Never move entire directory trees in one massive commit.
2. **Feature-Bound Moves:** Migrate components to their proper domain folders (e.g. moving `components/ui/home/` to `components/home/`) incrementally as those feature areas are touched in upcoming phases.
3. **Strict Import Aliases:** Always use root `@/...` aliases to ensure clean, resilient import paths.

---

## 2.3.B Toolbar Strip Layout Alignment & Overflow Management

Align the primary editor ribbon with the Google Docs layout hierarchy, eliminating clutter and organizing overflow actions cleanly.

### Primary Ribbon Layout

```txt
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [↩ ↪ 🖨] │ [Zoom 100% ▾] │ [Normal text ▾] │ [Arial ▾] │ [- 11 +] │ [B I U A 🖍] │ [🔗 💬 🖼] │ [⋮ More Options]                      │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Interaction Paradigms

1. **No Standalone Block Clutter:** Blocks like Table, Page Break, and Divider are housed inside the **Insert** dropdown menu, not floating as standalone buttons in the inline text formatting strip.
2. **Strict On-Click Activation:** All dropdowns, submenus, and overflow panels open exclusively on **click** (never on hover) with `onMouseDown={(e) => e.preventDefault()}` to preserve editor selection.
3. **Secondary Overflow Bar (`⋮` More Options):**
   - Housed within an on-click floating strip when the viewport width constrains the toolbar.
   - Houses paragraph alignment, line spacing, list presets, indentation, and table cell contextual controls (Fill Color, Border Color, Border Width).
4. **Visual Preset Card Grids:**
   - Checklist Dropdown (2 visual cards: Strike vs No-Strike).
   - Bulleted List Dropdown (6 visual card grids: Disc, Circle, Square, Diamond, Star, Arrow).
   - Numbered List Dropdown (6 visual card grids: Decimal, Alpha, Roman, Nested).

---

## 2.3.C Google Docs Multi-Page Pagination & Continuous Canvas Architecture

Elevate the editor canvas from a single static height container into an authentic Google Docs book-like pagination system with continuous paper canvas, dynamic page calculation, and dashed page boundary indicators.

### Core Anatomy

1. **Pages Mode (Continuous Paper Canvas with Google Docs Page Dividers):**
   - Renders a continuous paper sheet (816px x 1056px for Letter, 794px x 1123px for A4) on a desk background with subtle drop shadows and borders.
   - Dynamically calculates total page count based on active editor content height using a pure read-only, debounced `ResizeObserver`:
     $$\text{pageCount} = \max\left(1, \left\lceil \frac{\text{contentHeight}}{\text{pageHeight} - (\text{pagePaddingY} \times 2)} \right\rceil\right)$$
   - At exact standard page intervals (1056px for Letter), renders visual Google Docs-style dashed page dividers (`.page-break-divider`) with right-aligned page number badges (`Page 2`, `Page 3`), giving authors clear spatial orientation without layout thrashing.
   - Guarantees 60fps typing, zero layout pendulums, zero flickering, and zero AST mutation conflicts in collaborative Liveblocks sessions.
2. **Pageless Mode (Fluid Continuous Canvas):**
   - 100% fluid edge-to-edge canvas with zero fixed width clamps (`.page-canvas-pageless`) and comfortable responsive horizontal padding.
   - Viewport background dynamically matches paper background (`bg-surface`) with zero card borders or gray desk boxing, matching Google Docs Pageless.
3. **Chromium `zoom` Resolution:**
   - Sized the zoom factor conditionally (`zoom: zoomFactor !== 1 ? zoomFactor : undefined`) to prevent Chromium's layout engine from freezing container dimensions during typing.
4. **Standalone Dedicated Engine Blueprint (`@trayshmhirk/paged-engine`):**
   - Comprehensive forensic research of Microsoft Word Online completed and documented in the agent knowledge base.
   - Standalone open-source repository initialized to build the full 6-layer Hybrid Micro-Canvas Track Engine with discrete page margin slicing for future plug-and-play integration.

### Checklist for 2.3.C

- [x] Measure content height dynamically with a debounced read-only `ResizeObserver` on the editor input.
- [x] Build continuous multi-page paper canvas with Google Docs-style dashed page break dividers and page badges in `EditorShell.tsx`.
- [x] Ensure Pageless mode dynamically expands without clipping or text escaping the white paper.
- [x] Resolve Chromium `zoom` dimension freezing with conditional zoom application.
- [x] Verify live typing, Enter key, and Backspace work seamlessly with 100% stability and zero layout flickering.
- [x] Document the 6-layer Hybrid Micro-Canvas Track architecture for the dedicated standalone pagination package.

---

## 2.4 Application Menu Bar & Curated Insert Architecture

Google Docs and Microsoft Word organize high-level document actions into a primary **Menu Bar** and an intuitive **Insert** experience. We anchor the application Menu Bar (`File`, `Edit`, `View`, `Insert`, `Format`, `Tools`, `Help`) directly above the formatting toolbar ribbon, adopting the Google Docs dropdown paradigm so text formatting controls remain permanently visible while providing organized document-level action menus.

### 2.4.0 Application Menu Bar Strip (Google Docs Paradigm)

Housed directly above the formatting toolbar ribbon, the Menu Bar provides clean, accessible dropdown triggers for document-level operations:

```txt
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ File  Edit  View  Insert  Format  Tools  Help                                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **`File`**: New document, Share, Download (PDF, Plain Text), Print (`window.print()`), Page Setup.
2. **`Edit`**: Undo (`UNDO_COMMAND`), Redo (`REDO_COMMAND`), Select All.
3. **`View`**: Mode Switcher (Pages vs. Pageless), Show/Hide Ruler, Zoom presets.
4. **`Insert`**: Curated block insertion dropdown (Table grid picker, Image, Horizontal line, Page break, Code block).
5. **`Format`**: Text styling shortcuts (Bold, Italic, Underline, Strikethrough, Superscript, Subscript, Clear formatting).
6. **`Tools`**: Word count dialog / statistics, Keyboard shortcuts.
7. **`Help`**: Keyboard shortcuts guide, Documentation.

### 2.4.1 Interactive Table Grid Dimension Picker

Instead of inserting a static hardcoded $3\times 3$ table on click:

- Provide an interactive $8\times 8$ (expandable up to $10\times 10$) hover grid inside the Table dropdown menu.
- As the user moves the mouse across grid cells, live-highlight the selection in blue and display a dynamic label: `5 × 4 Table`.
- Clicking a cell dispatches `INSERT_TABLE_COMMAND` with `{ columns: String(col), rows: String(row), includeHeaders: false }`.
- Automatically ensures editable paragraph buffers exist before and after the table.

```txt
┌─────────────────────────┐
│ Insert Table            │
│ ┌─┬─┬─┬─┬─┬─┬─┬─┐       │
│ ├─┼─┼─┼─┼─┼─┼─┼─┤       │
│ ├─┼─┼─┼─┼─┼─┼─┼─┤  4 × 5 │
│ ├─┼─┼─┼─┼─┼─┼─┼─┤       │
│ └─┴─┴─┴─┴─┴─┴─┴─┘       │
└─────────────────────────┘
```

### 2.4.2 Table Cell Action Menu & Context Controls

When the caret is positioned inside any table cell, a subtle dropdown chevron appears on the active cell (or via right-click context menu):

1. **Row Controls:**
   - Insert row above (`$insertTableRowAtSelection(false)`)
   - Insert row below (`$insertTableRowAtSelection(true)`)
   - Delete row (`$deleteTableRowAtSelection()`)
2. **Column Controls:**
   - Insert column left (`$insertTableColumnAtSelection(false)`)
   - Insert column right (`$insertTableColumnAtSelection(true)`)
   - Delete column (`$deleteTableColumnAtSelection()`)
3. **Table Level Actions:**
   - Delete table (`$deleteTableAtSelection()`)
   - Cell background color palette (`SET_TABLE_CELL_BACKGROUND_COLOR_COMMAND`)

### 2.4.3 Table Column & Row Drag-to-Resize (`TableCellResizerPlugin`)

- Attaches invisible hover zones along cell column borders and row dividers.
- On hover, displays a `col-resize` or `row-resize` cursor with a blue guideline overlay.
- Dragging adjusts `TableCellNode` width and height in real time, recalculating table layout smoothly.

### 2.4.4 Table Keyboard Navigation & Buffer Lines (`TableEscapePlugin`)

- **Paragraph Buffering:** Guarantees that any standalone `TableNode` in the document root has accessible paragraph lines before and after it.
- **Arrow Key Escaping:** `ArrowUp` on the top row steps out to the preceding paragraph; `ArrowDown` on the bottom row steps out to the trailing paragraph.
- **Tab Key Navigation:** `Tab` moves cell-to-cell; pressing `Tab` on the bottom-right cell automatically creates a new row below and focuses its first cell.

### 2.4.5 Curated Insert Menu Scope & Custom Decorator Nodes

```txt
Insert
+-- Media
|   +-- Image (upload file or paste URL)
|   +-- Horizontal line / Divider
+-- Structure
|   +-- Table (opens 8x8 grid dimension picker)
|   +-- Callout Block (info, warning, tip)
|   +-- Break
|       +-- Page Break
+-- Embed
|   +-- YouTube Video
|   +-- Tweet
+-- Code
    +-- Code Block (with language selector)
```

### Lexical Node Requirements

| Insert Item     | Lexical Mechanism                     | Status   |
| --------------- | ------------------------------------- | -------- |
| Image           | Custom `ImageNode` (Decorator)        | To build |
| Horizontal Rule | `HorizontalRuleNode` (@lexical/react) | Done     |
| Table           | `@lexical/table`                      | Enhanced |
| Callout Block   | Custom `CalloutNode` (Decorator)      | To build |
| Page Break      | Custom `PageBreakNode` (Decorator)    | Done     |
| YouTube Embed   | Custom `YouTubeNode` (Decorator)      | To build |
| Tweet Embed     | Custom `TweetNode` (Decorator)        | To build |
| Code Block      | `@lexical/code`                       | Exists   |

### Checklist for Section 2.4

- [x] Standardize the component layer by implementing `CustomToolbarButton`, `CustomDropdown`, `CustomPopover`, and `CustomModal` in `components/ui/custom/`
- [x] Consolidate toolbar controls into `components/editor/plugins/toolbarPlugin/dropdowns/`
- [x] Build `MenuBar` component with `File`, `Edit`, `View`, `Insert`, `Format`, `Tools`, `Help` dropdown triggers in `components/editor/menubar/MenuBar.tsx`
- [x] Build `InsertMenu` and `InsertDropdown` toolbar components with grouped sections and keyboard-accessible menu items
- [x] Build interactive `TableGridPicker` component with an $8\times 8$ dimension matrix and live label
- [x] Implement `TableCellActionMenuPlugin` for inserting/deleting rows, columns, and tables
- [x] Implement `TableCellResizerPlugin` for drag-to-resize column widths and row heights
- [x] Implement Table Contextual Toolbar (Fill Color, Border Color, Border Width, Vertical Alignment, Quick Actions) in the toolbar and responsive overflow strip
- [x] Maintain `TableEscapePlugin` for automatic paragraph buffers and Tab/Arrow navigation
- [ ] Implement `ImageNode` (Decorator): upload dialog to file or URL; resize handle overlay on selection
- [x] Wire `HorizontalRuleNode` from `@lexical/react` as an insert action
- [x] Implement `CalloutNode` (Decorator): styled block with icon (info / warning / tip) and editable text
- [x] Implement `PageBreakNode` (Decorator): renders as a visual dashed rule across the canvas
- [x] Implement `YouTubeNode` and `TweetNode` decorator embeds
- [x] All custom nodes must serialize to/from Lexical JSON correctly for Liveblocks persistence

### Files to modify for Section 2.4

```txt
components/editor/menubar/MenuBar.tsx                                          [NEW]
components/editor/menubar/menus/InsertMenu.tsx                                 [NEW]
components/editor/plugins/toolbarPlugin/dropdowns/TableGridPicker.tsx          [NEW]
components/editor/plugins/toolbarPlugin/dropdowns/TableContextualToolbar.tsx   [NEW]
components/editor/plugins/TableCellActionMenuPlugin.tsx                        [NEW]
components/editor/plugins/TableCellResizerPlugin.tsx                           [NEW]
components/editor/plugins/TableEscapePlugin.tsx
components/editor/nodes/ImageNode.tsx                                          [NEW]
components/editor/nodes/CalloutNode.tsx                                        [NEW]
components/editor/nodes/PageBreakNode.tsx                                      [NEW]
components/editor/nodes/YouTubeNode.tsx                                        [NEW]
components/editor/nodes/TweetNode.tsx                                          [NEW]
components/editor/Editor.tsx
components/editor/plugins/toolbarPlugin/ToolbarPlugin.tsx
styles/editor/index.css
```

---

## 2.5 Platen Engine Hybrid Multi-Sheet Canvas Integration

Connect the dedicated `@platen/engine` library into Platen as a high-fidelity, discrete multi-sheet layout mode. While **Pages Mode** (Section 2.3.C) provides continuous, low-latency DOM typing with visual dashed dividers, **Platen Engine Mode** brings true desktop publishing fidelity by slicing text runs into discrete physical paper sheets with absolute line tracking and strict CSS containment (`contain: strict`).

### Core Architectural Synergy

```txt
┌────────────────────────────────────────────────────────────────────────┐
│                        Liveblocks Lexical Composer                     │
│               (Single Source of Truth / Collaborative AST)             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Updates / AST
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        LexicalAdapter (@platen/engine)                 │
│               (Extracts ParagraphBlocks, TextRuns, Bitmasks)           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Batching via rAF
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PagedEngineBridge (@platen/engine)                │
│                 (Offscreen MetricEngine -> LayoutSlicer)               │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ PageSlice[]
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     PlatenEngineCanvas / PagedDesk                     │
│         [ PagedSheet 1 ]      [ PagedSheet 2 ]      [ PagedSheet N ]   │
│         (contain: strict)     (contain: strict)     (contain: strict)  │
└────────────────────────────────────────────────────────────────────────┘
```

### View Mode Integration

In `ViewMenu.tsx`, authors can seamlessly toggle between three document presentations:

1. **Pages (Continuous DOM Canvas):** Continuous DOM canvas with standard Google Docs-style dashed page dividers and badges. Ideal for rapid composition and rich interactive tables.
2. **Pageless Mode:** Fluid edge-to-edge canvas matching Google Docs Pageless.
3. **Platen Engine (Multi-Sheet):** Print-faithful multi-sheet rendering using `@platen/engine`. Each sheet is an isolated container where paragraphs wrap across page boundaries with sub-pixel typography.

### Checklist for Section 2.5

- [ ] Add `@platen/engine` to `package.json` dependencies
- [ ] Implement `PagedEditorPlugin.tsx` connecting the Lexical editor state to `PagedEngineBridge` via `LexicalAdapter`
- [ ] Build `PlatenEngineCanvas.tsx` hosting `PagedDesk` and rendering reactive `PagedSheet` components
- [ ] Extend `DocumentLayoutContext` to support `'pages' | 'pageless' | 'paged-engine'` view modes
- [ ] Update `ViewMenu.tsx` to include an active checkmark toggle for **Platen Engine (Multi-Sheet)**
- [ ] Synchronize zoom and document dimensions between `PagedDesk` and the document ruler
- [ ] Verify zero collaborative mutation loops between Liveblocks Yjs sync and `PagedEngineBridge`

### Files to modify for Section 2.5

```txt
package.json
context/DocumentLayoutContext.tsx
components/editor/menubar/menus/ViewMenu.tsx
components/editor/plugins/PagedEditorPlugin.tsx      [NEW]
components/editor/PlatenEngineCanvas.tsx             [NEW]
components/editor/EditorShell.tsx
styles/editor/index.css
```

---

## 2.6 Comment Thread Spatial Anchoring

Liveblocks `FloatingThreads` currently renders comment threads as overlays attached to selected text. The enterprise pattern — as seen in Google Docs — is to anchor threads to the right margin of the page, vertically aligned with the text they annotate.

### Target Layout for comment anchoring

```txt
+------- Page Canvas -----------------+   +---- Comment Column (320px) --------+
|                                     |   |                                     |
|  Lorem ipsum dolor sit amet,        |<--|  Thread: @user - 2h ago             |
|  consectetur adipiscing elit.       |   |  "Can we rework this paragraph?"    |
|                                     |   |  [Reply...]                         |
|                                     |   +-------------------------------------+
+-------------------------------------+
```

### Checklist for comment anchoring

- [ ] Wrap the page canvas and comment column in a flex row container inside `EditorShell`
- [ ] Position `FloatingThreads` (Liveblocks) inside the comment column (right side), fixed width 320px, anchored to the annotated text's vertical offset
- [ ] Ensure the comment column collapses to a floating popover on narrow viewports (below `lg` breakpoint)
- [ ] Add a toggle button in the room header to show/hide the comment column
- [ ] Verify that clicking a comment thread highlights the corresponding text range in Lexical

### Files to modify for comment anchoring

```txt
components/editor/EditorShell.tsx
components/collaborators/CollaborativeRoom.tsx
components/ui/shared/Header.tsx
styles/editor/index.css
```

---

## 2.7 Document Outline Sidebar

A collapsible left sidebar that reads heading nodes (H1, H2, H3) from the Lexical editor state and renders a navigable outline. Clicking an entry smoothly scrolls the page canvas to the corresponding heading.

### Checklist for document outline

- [ ] Build an `OutlinePlugin` Lexical plugin that reads the editor state for heading nodes and emits an ordered outline array
- [ ] Build an `OutlineSidebar` component that renders the outline with indentation levels matching heading depth (H1 / H2 / H3)
- [ ] Clicking an outline item scrolls the associated heading into view using `scrollIntoView`
- [ ] The sidebar is collapsible; default state is open on desktop, closed on tablet and mobile
- [ ] Highlight the active heading in the outline as the user scrolls through the document
- [ ] The sidebar toggle button lives in the document room header

### Files to modify for document outline

```txt
components/editor/plugins/OutlinePlugin.tsx    [NEW]
components/editor/OutlineSidebar.tsx           [NEW]
components/editor/EditorShell.tsx
components/editor/Editor.tsx
components/ui/shared/Header.tsx
```

---

## 2.8 Home Dashboard Document Preview Thumbnails

> **Context:** Phase 1.5 ships a simulated page thumbnail (decorative placeholder lines). This section upgrades those cards to show real document content.

To render a live preview of document content in the home dashboard card, we need to serialize and store a snapshot of each document's text content outside of Liveblocks storage (which is only accessible inside a `RoomProvider`). The approach:

### Technical Strategy

1. **Document Snapshot Storage:** When a document is saved or edited (debounced), serialize the first ~300 characters of plain text and the first heading from Lexical's `EditorState` using `editor.getEditorState().read()`. Store this snapshot in Liveblocks room metadata (via `updateRoom` from the server action, extending `RoomMetadata` with a `preview` field).

2. **Home Dashboard Reading:** `getDocuments()` already returns full `RoomData` including `metadata`. Once `metadata.preview` exists, `DocumentCard` renders actual text lines instead of placeholder bars.

3. **Graceful Degradation:** If `metadata.preview` is absent (older documents), the existing decorative placeholder lines are shown — no breaking change.

### Preview Card Anatomy

```txt
┌──────────────────────┐
│ ── Title Heading ──── │  ← first heading or doc title (font-semibold)
│ Lorem ipsum dolor    │  ← first ~80 chars of body text (text-xs text-muted)
│ sit amet consect...  │
└──────────────────────┘
  Document Title
  Opened 2d ago
```

### Checklist for document previews

- [ ] Extend `RoomMetadata` type with `preview?: string` and `previewHeading?: string`
- [ ] Add a `saveDocumentPreview(roomId, preview, heading)` server action that calls `liveblocks.updateRoom()` to patch metadata
- [ ] In the Lexical `Editor` component, add a debounced `OnChangePlugin` that reads plain-text content and fires `saveDocumentPreview` on change (max once per 30s)
- [ ] Update `DocumentCard` to render `metadata.previewHeading` and `metadata.preview` when available, falling back to the current decorative placeholder
- [ ] Ensure the preview text is truncated safely and does not expose private content to users who only have `room:read` access (server-side check)

### Files to modify for document previews

```txt
types/index.d.ts                                  (extend RoomMetadata)
lib/actions/room.actions.ts                       (saveDocumentPreview action)
components/editor/Editor.tsx                      (debounced OnChangePlugin)
components/ui/home/DocumentCard.tsx               (preview rendering)
```

---

## Acceptance Criteria

### Canvas, Ruler & Layout

- [ ] The editor renders as a white page (816px wide) centered on a gray viewport background
- [ ] A horizontal ruler sits above the page with correct inch markings and shaded margin zones
- [ ] Page canvas has drop shadow and padding in both dark and light mode
- [ ] Page size, orientation, and margin changes apply immediately to the canvas and persist in Liveblocks metadata

### Toolbar & Formatting

- [ ] Text color and highlight color pickers open dropdowns with preset palette and custom color modal
- [ ] Line & Paragraph spacing applies line height and paragraph margins correctly
- [ ] List style dropdowns provide bullet and numbering style grids
- [ ] Format dropdown includes Title Case text transform, strikethrough, superscript, and subscript
- [ ] Clear Formatting button strips inline styling

### Insert Experience & Sidebar

- [ ] Curated Insert dropdown inserts Image, Table, HR, Page Break, and Embeds correctly
- [ ] Custom nodes serialize to and from Lexical JSON for Liveblocks persistence
- [ ] Comment threads are spatially anchored to the right margin column beside the page
- [ ] Document outline sidebar renders H1/H2/H3 headings and scrolls on click

---

## Suggested Commit Sequence

```txt
style(canvas): introduce page canvas shell with gray viewport and white page layout
style(ruler): add horizontal document ruler with inch markings and margin zones
feat(toolbar): add text and highlight color pickers with custom color modal
feat(toolbar): implement line spacing, list style dropdowns, and format transforms
feat(toolbar): add page layout dropdown for page size and margin presets
feat(editor): add curated Insert dropdown with image, table, hr, and page break
feat(nodes): implement ImageNode, CalloutNode, and PageBreakNode decorator nodes
feat(comments): anchor liveblocks threads to right margin column beside page
feat(outline): add collapsible document outline sidebar driven by heading nodes
feat(home): render real document content previews inside home dashboard cards
```

---

## Next Phase

→ [Phase 3 — Core Product Features & Database Architecture](./phase-3-core-product-features.md)
