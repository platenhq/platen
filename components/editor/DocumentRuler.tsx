"use client";

import React, { useMemo } from "react";

interface DocumentRulerProps {
  pageWidth?: number; // base: 816 (8.5in * 96dpi)
  marginLeft?: number; // base: 96 (1in * 96dpi)
  marginRight?: number; // base: 96 (1in * 96dpi)
  zoomFactor?: number; // 0.5, 0.75, 1.0, 1.5, etc.
}

/**
 * Pixel-accurate horizontal document ruler matching Google Docs.
 * Dynamically expands/contracts physical width and tick spacing with zoom,
 * while keeping ruler height, number typography, and blue indent markers crisp and fixed.
 */
export const DocumentRuler: React.FC<DocumentRulerProps> = ({
  pageWidth = 816,
  marginLeft = 96,
  marginRight = 96,
  zoomFactor = 1.0,
}) => {
  const renderedWidth = pageWidth * zoomFactor;
  const renderedMarginLeft = marginLeft * zoomFactor;
  const renderedMarginRight = marginRight * zoomFactor;
  const pixelsPerInch = 96 * zoomFactor;
  const eighthInch = pixelsPerInch / 8;
  const totalInches = pageWidth / 96;

  // Generate 1/8 inch tick intervals across the scaled physical width
  const ticks = useMemo(() => {
    const tickCount = Math.floor(renderedWidth / eighthInch);
    return Array.from({ length: tickCount + 1 }, (_, i) => {
      const position = i * eighthInch;
      const isInch = i % 8 === 0;
      const isHalfInch = i % 4 === 0 && !isInch;
      const isQuarterInch = i % 2 === 0 && !isInch && !isHalfInch;
      const inchNumber = isInch ? i / 8 : null;

      let height = "h-0.75"; // 1/8" tick
      if (isQuarterInch) height = "h-1.25";
      if (isHalfInch) height = "h-1.5";
      if (isInch) height = "h-2";

      return {
        index: i,
        position,
        isInch,
        inchNumber,
        height,
      };
    });
  }, [renderedWidth, eighthInch]);

  const activeWidth = Math.max(0, renderedWidth - renderedMarginLeft - renderedMarginRight);

  return (
    <div
      aria-hidden="true"
      className="border-border bg-surface text-muted-foreground relative mx-auto hidden h-7 border-y font-sans text-[10px] select-none md:block"
      style={{ width: `${renderedWidth}px` }}
    >
      {/* Left Shaded Margin Zone */}
      <div
        className="bg-surface-secondary/70 absolute top-0 bottom-0 left-0"
        style={{ width: `${renderedMarginLeft}px` }}
      />

      {/* Active Content Zone */}
      <div
        className="bg-surface absolute top-0 bottom-0"
        style={{ left: `${renderedMarginLeft}px`, width: `${activeWidth}px` }}
      />

      {/* Right Shaded Margin Zone */}
      <div
        className="bg-surface-secondary/70 absolute top-0 right-0 bottom-0"
        style={{ width: `${renderedMarginRight}px` }}
      />

      {/* Ticks and Number Labels */}
      <div className="pointer-events-none relative size-full">
        {ticks.map((tick) => (
          <div
            key={tick.index}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: `${tick.position}px` }}
          >
            {tick.isInch &&
              tick.inchNumber !== null &&
              tick.inchNumber > 0 &&
              tick.inchNumber < totalInches && (
                <span className="text-foreground absolute -top-2.5 -translate-x-1/2 text-[11px] leading-none font-normal">
                  {tick.inchNumber}
                </span>
              )}
            <span className={`w-px bg-slate-400 dark:bg-slate-500 ${tick.height}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentRuler;
