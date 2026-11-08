"use client";

import React from "react";
import { PagedDocument, type PageInfo } from "@platen/engine";
import { useDocumentLayout } from "@/context/DocumentLayoutContext";
import { cn } from "@/lib/utils";

interface PlatenEngineCanvasProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * PlatenEngineCanvas — Paged Engine Layout Coordinator
 *
 * Employs the Float-Rail architecture via @platen/engine's PagedDocument:
 * - Renders paper sheets behind the editable content
 * - Deploys invisible zero-height float rails at each page boundary
 * - Line breaking and page splitting occur naturally via browser line layout
 * - Zero mutations to the Lexical editor DOM, eliminating layout flicker
 */
export default function PlatenEngineCanvas({
  className,
  children,
}: PlatenEngineCanvasProps): React.JSX.Element {
  const { layout, setEnginePageCount } = useDocumentLayout();
  const deskPadding = 32;

  return (
    <div
      className={cn(
        "platen-engine-canvas relative flex flex-1 flex-col items-center justify-start pb-16 transition-colors duration-200",
        className,
      )}
    >
      {/* Desk: centres the page stack and provides viewport breathing room */}
      <div
        className="flex w-full justify-center"
        style={{ padding: `${deskPadding}px 16px`, boxSizing: "border-box" }}
      >
        <PagedDocument
          pageSize={{ width: layout.width, height: layout.minHeight }}
          margins={{
            top: layout.paddingY,
            bottom: layout.paddingY,
            left: layout.paddingX,
            right: layout.paddingX,
          }}
          deskGutter={20}
          zoom={layout.zoomFactor}
          sheetClassName="border-border bg-surface shadow-md dark:border-slate-800"
          sheetStyle={{ backgroundColor: "var(--surface)" }}
          onPageCountChange={setEnginePageCount}
          renderFooter={(info: PageInfo) => (
            <div className="text-muted-foreground/60 flex h-full w-full items-center justify-center text-[11px] select-none">
              <span>
                Page {info.pageNumber} of {info.totalPages}
              </span>
            </div>
          )}
        >
          {children}
        </PagedDocument>
      </div>
    </div>
  );
}
