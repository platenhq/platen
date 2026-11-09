"use client";

import React from "react";
import { ListTree, X } from "lucide-react";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import { useDocumentLayout } from "@/context/DocumentLayoutContext";
import { cn } from "@/lib/utils";
import { useDocumentOutline } from "./useDocumentOutline";

const LEVEL_INDENT = { 1: "pl-2", 2: "pl-5", 3: "pl-8" } as const;

/**
 * Document outline over the left edge of the editor viewport. It does not take layout space, so
 * opening or closing it never moves the page or changes page breaks.
 */
export default function OutlineSidebar({ viewport }: { viewport: HTMLElement | null }) {
  const { showOutline, setShowOutline } = useDocumentLayout();
  const { entries, activeKey, scrollToHeading } = useDocumentOutline(viewport);

  if (!showOutline) {
    return (
      <div className="absolute top-3 left-3 z-20 hidden md:block">
        <CustomToolbarButton
          tooltip="Show outline"
          aria-label="Show outline"
          onClick={() => setShowOutline(true)}
          className="bg-surface border-border border shadow-xs"
        >
          <ListTree className="size-4" />
        </CustomToolbarButton>
      </div>
    );
  }

  return (
    <nav
      aria-label="Document outline"
      className="bg-surface-canvas/95 border-border absolute top-0 bottom-0 left-0 z-20 flex w-60 flex-col border-r backdrop-blur-xs"
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Outline
        </span>
        <CustomToolbarButton
          tooltip="Close outline"
          aria-label="Close outline"
          onClick={() => setShowOutline(false)}
        >
          <X className="size-4" />
        </CustomToolbarButton>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted px-3 py-2 text-xs leading-relaxed">
          Headings you add to the document will appear here.
        </p>
      ) : (
        <ul className="flex-1 overflow-y-auto px-2 pb-4">
          {entries.map((entry) => (
            <li key={entry.key}>
              <button
                type="button"
                // Keep the editor's selection where it is
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => scrollToHeading(entry.key)}
                aria-current={entry.key === activeKey ? "location" : undefined}
                className={cn(
                  "hover:bg-surface-hover w-full truncate rounded-md py-1.5 pr-2 text-left text-xs transition-colors",
                  LEVEL_INDENT[entry.level],
                  entry.level === 1 ? "font-medium" : "font-normal",
                  entry.key === activeKey
                    ? "bg-primary/10 text-primary dark:text-accent"
                    : "text-foreground/80",
                )}
                title={entry.text}
              >
                {entry.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
