"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type DocumentViewMode = "pages" | "pageless" | "paged-engine";
export type PageSizePreset = "letter" | "a4" | "legal" | "pageless";
export type MarginPreset = "normal" | "narrow" | "moderate" | "wide";
export type ZoomPreset = "fit" | 50 | 75 | 90 | 100 | 125 | 150 | 200;

export interface PageLayoutConfig {
  pageSize: PageSizePreset;
  margins: MarginPreset;
  zoom: ZoomPreset;
  zoomFactor: number; // 0.5, 1.0, 1.5, etc.
  width: number; // in pixels
  minHeight: number; // in pixels
  paddingX: number; // in pixels
  paddingY: number; // in pixels
  isPageless: boolean;
  viewMode: DocumentViewMode;
  isPagedEngine: boolean;
}

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

export const ZOOM_PRESETS: { label: string; value: ZoomPreset }[] = [
  { label: "Fit", value: "fit" },
  { label: "50%", value: 50 },
  { label: "75%", value: 75 },
  { label: "90%", value: 90 },
  { label: "100%", value: 100 },
  { label: "125%", value: 125 },
  { label: "150%", value: 150 },
  { label: "200%", value: 200 },
];

interface DocumentLayoutContextValue {
  layout: PageLayoutConfig;
  setPageSize: (size: PageSizePreset) => void;
  setMargins: (margin: MarginPreset) => void;
  setZoom: (zoom: ZoomPreset) => void;
  setViewMode: (mode: DocumentViewMode) => void;
  enginePageCount: number;
  setEnginePageCount: (count: number) => void;
}

const DocumentLayoutContext = createContext<DocumentLayoutContextValue | undefined>(undefined);

export function DocumentLayoutProvider({
  children,
  initialPageSize = "letter",
  initialMargins = "normal",
  initialZoom = 100,
}: {
  children: React.ReactNode;
  initialPageSize?: PageSizePreset;
  initialMargins?: MarginPreset;
  initialZoom?: ZoomPreset;
}): React.JSX.Element {
  const STORAGE_KEY = "platen_document_layout_prefs";

  const [pageSize, setPageSizeState] = useState<PageSizePreset>(initialPageSize);
  const [viewMode, setViewModeState] = useState<DocumentViewMode>(() =>
    initialPageSize === "pageless" ? "pageless" : "paged-engine",
  );
  const [enginePageCount, setEnginePageCount] = useState<number>(1);
  const [margins, setMarginsState] = useState<MarginPreset>(initialMargins);
  const [zoom, setZoomState] = useState<ZoomPreset>(initialZoom);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  // Hydrate preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.viewMode) {
          // Version 2 migration: if saved has no version or version < 2, upgrade legacy "pages" to "paged-engine"
          if ((!parsed.version || parsed.version < 2) && parsed.viewMode === "pages") {
            setViewModeState("paged-engine");
          } else {
            setViewModeState(parsed.viewMode);
          }
        }
        if (parsed.pageSize) setPageSizeState(parsed.pageSize);
        if (parsed.margins) setMarginsState(parsed.margins);
        if (parsed.zoom !== undefined) setZoomState(parsed.zoom);
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }, []);

  // Save preferences to localStorage whenever they change (version 2)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 2,
          viewMode,
          pageSize,
          margins,
          zoom,
        }),
      );
    } catch {
      // Ignore quota errors
    }
  }, [viewMode, pageSize, margins, zoom]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const setPageSize = (size: PageSizePreset) => {
    setPageSizeState(size);
    if (size === "pageless") {
      setViewModeState("pageless");
    } else if (viewMode === "pageless") {
      setViewModeState("paged-engine");
    }
  };

  const setViewMode = (mode: DocumentViewMode) => {
    setViewModeState(mode);
    if (mode === "pageless") {
      setPageSizeState("pageless");
    } else if (pageSize === "pageless") {
      setPageSizeState("letter");
    }
  };

  const setMargins = (m: MarginPreset) => {
    setMarginsState(m);
  };

  const setZoom = (z: ZoomPreset) => {
    setZoomState(z);
  };

  const zoomFactor = useMemo<number>(() => {
    if (typeof zoom === "number") {
      return zoom / 100;
    }
    // Dynamic "Fit" calculation matching Google Docs (fills viewport width with balanced gutters)
    const sizeSpec = PAGE_SIZE_SPECS[pageSize];
    if (sizeSpec.isPageless) return 1.0;

    const availableWidth = Math.max(320, viewportWidth - 96);
    const factor = availableWidth / sizeSpec.width;
    return Math.min(2.0, Math.max(0.5, Math.round(factor * 100) / 100));
  }, [zoom, pageSize, viewportWidth]);

  const layout = useMemo<PageLayoutConfig>(() => {
    const sizeSpec = PAGE_SIZE_SPECS[pageSize];
    const marginSpec = MARGIN_SPECS[margins];
    const isPageless = viewMode === "pageless";
    const isPagedEngine = viewMode === "paged-engine";

    return {
      pageSize,
      margins,
      zoom,
      zoomFactor,
      width: sizeSpec.width,
      minHeight: sizeSpec.height,
      paddingX: isPageless ? 48 : marginSpec.padX,
      paddingY: isPageless ? 32 : marginSpec.padY,
      isPageless,
      viewMode,
      isPagedEngine,
    };
  }, [pageSize, margins, zoom, zoomFactor, viewMode]);

  // Keep CSS Variables on :root synchronized
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--page-width",
        layout.isPageless ? "100%" : `${layout.width}px`,
      );
      document.documentElement.style.setProperty(
        "--page-height",
        layout.isPageless ? "auto" : `${layout.minHeight}px`,
      );
      document.documentElement.style.setProperty("--page-padding-x", `${layout.paddingX}px`);
      document.documentElement.style.setProperty("--page-padding-y", `${layout.paddingY}px`);
      document.documentElement.style.setProperty("--page-zoom", `${layout.zoomFactor}`);
    }
  }, [layout]);

  return (
    <DocumentLayoutContext.Provider
      value={{
        layout,
        setPageSize,
        setMargins,
        setZoom,
        setViewMode,
        enginePageCount,
        setEnginePageCount,
      }}
    >
      {children}
    </DocumentLayoutContext.Provider>
  );
}

export function useDocumentLayout(): DocumentLayoutContextValue {
  const context = useContext(DocumentLayoutContext);
  if (!context) {
    throw new Error("useDocumentLayout must be used within a DocumentLayoutProvider");
  }
  return context;
}
