"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  DEFAULT_PAGE_SETUP,
  MARGIN_SPECS,
  PAGE_SIZE_SPECS,
  isMarginPreset,
  isPaperSize,
} from "@/lib/page-setup";

interface DocumentThumbnailProps {
  /** Sanitized HTML of the document's opening blocks, saved by the server. */
  html: string | null;
  pageSize: string | null;
  margins: string | null;
  /** Shown on the page when there is no saved HTML yet. */
  children?: React.ReactNode;
}

/**
 * The document's first page in miniature: its opening blocks laid out at the real paper size and
 * margins with the editor's own styles, scaled down to the card and cropped to one page.
 */
export const DocumentThumbnail = ({
  html,
  pageSize,
  margins,
  children,
}: DocumentThumbnailProps) => {
  const page = PAGE_SIZE_SPECS[isPaperSize(pageSize) ? pageSize : DEFAULT_PAGE_SETUP.pageSize];
  const margin = MARGIN_SPECS[isMarginPreset(margins) ? margins : DEFAULT_PAGE_SETUP.margins];
  const frameRef = useRef<HTMLDivElement>(null);
  // Zero until the card is measured, so the full-size page never shows
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / page.width),
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [page.width]);

  return (
    <div
      ref={frameRef}
      aria-hidden
      className="document-thumbnail bg-surface pointer-events-none relative w-full overflow-hidden select-none"
      style={{ aspectRatio: `${page.width} / ${page.height}` }}
    >
      <div
        className="text-foreground absolute top-0 left-0 origin-top-left text-left text-base leading-5"
        style={{
          width: page.width,
          height: page.height,
          padding: `${margin.padY}px ${margin.padX}px`,
          transform: `scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {/* Content past the bottom margin belongs to the next page */}
        {html ? (
          <div
            className="h-full overflow-hidden"
            // Sanitized on the server before it was stored (lib/html/sanitize.ts)
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="h-full overflow-hidden">{children}</div>
        )}
      </div>
    </div>
  );
};

export default DocumentThumbnail;
