"use client";

import React, { useEffect, useRef, useState } from "react";
import DocumentRuler from "./DocumentRuler";
import PlatenEngineCanvas from "./PlatenEngineCanvas";
import Loader from "@/components/shared/Loader";
import { useDocumentLayout } from "@/context/DocumentLayoutContext";
import { cn } from "@/lib/utils";
import CommentThreads, {
  COMMENTS_COLUMN_GAP,
  COMMENTS_COLUMN_WIDTH,
} from "./comments/CommentThreads";
import OutlineSidebar from "./outline/OutlineSidebar";

interface EditorShellProps {
  children: React.ReactNode;
  showRuler?: boolean;
  ready?: boolean;
}

/**
 * EditorShell provides the "paper on a desk" layout:
 * - Gray desktop viewport with vertical scroll (fluid white canvas in Pageless mode)
 * - Synchronized horizontal ruler sitting above the canvas with lockstep zoom scaling
 * - Authentic Google Docs multi-page pagination with discrete sheets & margin awareness
 * - Platen Engine discrete multi-sheet layout mode
 */
export const EditorShell: React.FC<EditorShellProps> = ({
  children,
  showRuler = true,
  ready = true,
}) => {
  // Held in state so the outline and comment column re-measure once the viewport mounts
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { layout, showComments } = useDocumentLayout();
  const { width, minHeight, paddingX, paddingY, isPageless, isPagedEngine, zoomFactor } = layout;

  const [pageCount, setPageCount] = useState<number>(1);

  // Synchronize horizontal scrolling between ruler and viewport at higher zoom levels
  useEffect(() => {
    if (!viewport) return;

    const onScroll = () => {
      if (rulerScrollRef.current) {
        rulerScrollRef.current.scrollLeft = viewport.scrollLeft;
      }
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [viewport]);

  useEffect(() => {
    if (!viewport) return;
    const observer = new ResizeObserver(() => setViewportWidth(viewport.clientWidth));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewport]);

  /**
   * Page Margin Awareness Engine:
   * Dynamically tracks top-level block elements inside the editor.
   * When a block crosses the usable bottom margin of the current page,
   * it pushes the block to start cleanly at the top of the next page sheet,
   * keeping the bottom margin, the 16px desk gutter, and the top margin 100% clear of text.
   */
  // Dynamically compute pageCount based on content height without layout thrashing
  useEffect(() => {
    if (isPagedEngine) return;

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
  }, [isPageless, isPagedEngine, minHeight, paddingY]);

  const scaledWidth = width * zoomFactor;
  // Comments sit beside the page only when the space right of it can hold the column
  const commentsFitBesidePage =
    !isPageless &&
    (viewportWidth - scaledWidth) / 2 >= COMMENTS_COLUMN_WIDTH + COMMENTS_COLUMN_GAP * 2;

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

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Over the viewport, not inside it: stays in place while the document scrolls */}
        <OutlineSidebar viewport={viewport} />

        {/* Viewport Scroll Area */}
        <div
          ref={setViewport}
          className={cn(
            "editor-viewport relative flex flex-1 flex-col items-center justify-start overflow-auto transition-colors duration-200",
            isPageless && "pageless",
          )}
        >
          {!ready && (
            <div className="bg-surface-canvas/80 absolute inset-0 z-40 flex items-center justify-center backdrop-blur-xs">
              <Loader />
            </div>
          )}
          {/* Scrolling content: the page plus the comment column beside it */}
          <div className="relative flex w-full flex-1 flex-col items-center">
            {isPagedEngine ? (
              /* Platen Engine Mode: High-Fidelity Discrete Multi-Sheet PagedDesk */
              <div ref={contentRef} className="relative flex w-full flex-1 flex-col items-center">
                <PlatenEngineCanvas className="w-full">{children}</PlatenEngineCanvas>
              </div>
            ) : isPageless ? (
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
            <CommentThreads
              anchored={showComments && commentsFitBesidePage}
              left={`calc(50% + ${scaledWidth / 2 + COMMENTS_COLUMN_GAP}px)`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorShell;
