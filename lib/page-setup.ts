/**
 * Paper sizes and margins, shared by the editor's page layout and the dashboard thumbnails. Kept
 * free of React and Liveblocks so the dashboard and the server can import it.
 */

export type PaperSize = "letter" | "a4" | "legal";
// "pageless" is a view, not a paper size; it is listed here for the page layout menu
export type PageSizePreset = PaperSize | "pageless";
export type MarginPreset = "normal" | "narrow" | "moderate" | "wide";

/**
 * Page setup stored with the document and shared with every collaborator. A type alias, not an
 * interface, so it satisfies Liveblocks' storage constraint.
 */
export type PageSetup = {
  pageSize: PaperSize;
  margins: MarginPreset;
};

export const DEFAULT_PAGE_SETUP: PageSetup = { pageSize: "letter", margins: "normal" };

export const PAGE_SIZE_SPECS: Record<
  PageSizePreset,
  { label: string; width: number; height: number; isPageless: boolean }
> = {
  letter: { label: "Letter (8.5 x 11″)", width: 816, height: 1056, isPageless: false },
  a4: { label: "A4 (8.27 x 11.69″)", width: 794, height: 1123, isPageless: false },
  legal: { label: "Legal (8.5 x 14″)", width: 816, height: 1344, isPageless: false },
  pageless: { label: "Pageless (Fluid)", width: 960, height: 1056, isPageless: true },
};

export const MARGIN_SPECS: Record<
  MarginPreset,
  { label: string; padX: number; padY: number; preview: string }
> = {
  normal: { label: "Normal (1″)", padX: 96, padY: 96, preview: "1.00″" },
  narrow: { label: "Narrow (0.5″)", padX: 48, padY: 48, preview: "0.50″" },
  moderate: { label: "Moderate (0.75″)", padX: 72, padY: 72, preview: "0.75″" },
  wide: { label: "Wide (1.5″)", padX: 144, padY: 96, preview: "1.50″" },
};

export const isPaperSize = (value: unknown): value is PaperSize =>
  value === "letter" || value === "a4" || value === "legal";

export const isMarginPreset = (value: unknown): value is MarginPreset =>
  typeof value === "string" && Object.hasOwn(MARGIN_SPECS, value);
