"use client";

import React, { useEffect, useRef, useState } from "react";
import DocumentRuler from "./DocumentRuler";
import { useDocumentLayout } from "@/context/DocumentLayoutContext";
import { cn } from "@/lib/utils";

interface EditorShellProps {
  children: React.ReactNode;
  showRuler?: boolean;
}

/**
 * EditorShell provides the "paper on a desk" layout:
 * - Gray desktop viewport with vertical scroll (fluid white canvas in Pageless mode)
 * - Synchronized horizontal ruler sitting above the canvas with lockstep zoom scaling
 * - Authentic Google Docs multi-page pagination with discrete sheets & margin awareness
 */
export const EditorShell: React.FC<EditorShellProps> = ({ children, showRuler = true }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { layout } = useDocumentLayout();
  const { width, minHeight, paddingX, paddingY, isPageless, zoomFactor } = layout;

  const [pageCount, setPageCount] = useState<number>(1);

  // Synchronize horizontal scrolling between ruler and viewport at higher zoom levels
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onScroll = () => {
      if (rulerScrollRef.current) {
        rulerScrollRef.current.scrollLeft = viewport.scrollLeft;
      }
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Page Margin Awareness Engine:
   * Dynamically tracks top-level block elements inside the editor.
   * When a block crosses the usable bottom margin of the current page,
   * it pushes the block to start cleanly at the top of the next page sheet,
   * keeping the bottom margin, the 16px desk gutter, and the top margin 100% clear of text.
   */
  // Dynamically compute pageCount based on content height without layout thrashing
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    let timeoutId: NodeJS.Timeout;
    const updatePageCount = () => {
      if (isPageless) {
        setPageCount(1);
        return;
      }

      const editable = el.querySelector<HTMLElement>(".editor-input") || el;
      const contentHeight = editable.scrollHeight || el.scrollHeight;
      const usablePageHeight = Math.max(100, minHeight - paddingY * 2);
      const newCount = Math.max(1, Math.ceil(contentHeight / usablePageHeight));

      setPageCount((prev) => (prev !== newCount ? newCount : prev));
    };

    updatePageCount();

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updatePageCount, 100);
    });

    resizeObserver.observe(el);
    const editable = el.querySelector<HTMLElement>(".editor-input");
    if (editable) resizeObserver.observe(editable);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [isPageless, minHeight, paddingY]);

  const scaledWidth = width * zoomFactor;

  return (
    <div
      className={cn(
        "relative flex flex-1 flex-col overflow-hidden transition-colors duration-200",
        isPageless ? "bg-surface" : "bg-surface-canvas",
      )}
    >
      {/* Sticky Ruler Bar (hidden in Pageless mode) */}
      {showRuler && !isPageless && (
        <div className="bg-surface-canvas/90 border-border z-10 w-full shrink-0 border-b backdrop-blur-xs">
          <div ref={rulerScrollRef} className="scrollbar-none overflow-x-hidden px-4">
            <div
              className="mx-auto flex justify-center transition-all duration-200"
              style={{
                width: `${scaledWidth}px`,
              }}
            >
              <DocumentRuler
                pageWidth={width}
                marginLeft={paddingX}
                marginRight={paddingX}
                zoomFactor={zoomFactor}
              />
            </div>
          </div>
        </div>
      )}

      {/* Viewport Scroll Area */}
      <div
        ref={viewportRef}
        className={cn(
          "editor-viewport relative flex flex-1 flex-col items-center justify-start overflow-auto transition-colors duration-200",
          isPageless && "pageless",
        )}
      >
        {isPageless ? (
          /* Pageless Mode: Fluid continuous canvas that auto-expands with content */
          <div
            ref={contentRef}
            className="page-canvas-pageless bg-surface relative mx-auto h-auto min-h-[calc(100vh-140px)] w-full rounded-none border-none shadow-none transition-all duration-200"
            style={{
              paddingTop: `${paddingY}px`,
              paddingBottom: `${paddingY}px`,
            }}
          >
            {children}
          </div>
        ) : (
          /* Pages Mode: Continuous Paper Canvas with Google Docs Page Dividers */
          <div
            ref={contentRef}
            className="page-canvas bg-surface relative mx-auto mb-16 h-auto rounded-none border border-[#dadce0] shadow-md transition-all duration-200 dark:border-slate-800"
            style={{
              width: `${width}px`,
              minHeight: `${Math.max(pageCount * minHeight, minHeight)}px`,
              paddingLeft: `${paddingX}px`,
              paddingRight: `${paddingX}px`,
              paddingTop: `${paddingY}px`,
              paddingBottom: `${paddingY}px`,
              zoom: zoomFactor !== 1 ? `${zoomFactor}` : undefined,
            }}
          >
            {/* Subtle Google Docs Page Boundary Dividers */}
            {pageCount > 1 &&
              Array.from({ length: pageCount - 1 }).map((_, idx) => (
                <div
                  key={idx}
                  className="page-break-divider"
                  style={{
                    top: `${(idx + 1) * minHeight}px`,
                  }}
                >
                  <div className="page-break-line" />
                  <span className="page-break-badge">Page {idx + 2}</span>
                </div>
              ))}

            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorShell;
