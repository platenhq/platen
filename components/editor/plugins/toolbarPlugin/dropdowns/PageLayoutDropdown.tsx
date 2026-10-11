"use client";

import React, { useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import {
  CustomPopover,
  CustomPopoverTrigger,
  CustomPopoverContent,
} from "@/components/ui/custom/CustomPopover";
import {
  MarginPreset,
  MARGIN_SPECS,
  PageSizePreset,
  PAGE_SIZE_SPECS,
  useDocumentLayout,
} from "@/context/DocumentLayoutContext";

export default function PageLayoutDropdown({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const { layout, setPageSize, setMargins } = useDocumentLayout();

  const handleSelectSize = (size: PageSizePreset) => {
    setPageSize(size);
    setIsOpen(false);
  };

  const handleSelectMargin = (margin: MarginPreset) => {
    setMargins(margin);
    setIsOpen(false);
  };

  return (
    <CustomPopover open={isOpen} onOpenChange={setIsOpen}>
      <CustomPopoverTrigger asChild>
        <CustomToolbarButton disabled={disabled} isActive={isOpen} tooltip="Page layout & setup">
          <SlidersHorizontal className="format icon size-4" />
        </CustomToolbarButton>
      </CustomPopoverTrigger>

      <CustomPopoverContent align="end" sideOffset={8} className="w-56 p-2">
        {/* Page Format Section */}
        <div className="text-muted-foreground mb-1 px-2 text-[10px] font-semibold tracking-wider uppercase">
          Page Size
        </div>
        <div className="flex flex-col gap-0.5">
          {(Object.keys(PAGE_SIZE_SPECS) as PageSizePreset[]).map((key) => {
            const isSelected = layout.pageSize === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectSize(key)}
                className="hover:bg-surface-hover text-foreground flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors"
              >
                <span>{PAGE_SIZE_SPECS[key].label}</span>
                {isSelected && <Check size={14} className="text-primary dark:text-accent" />}
              </button>
            );
          })}
        </div>

        <div className="border-border my-2 border-t" />

        {/* Margins Section */}
        <div className="text-muted-foreground mb-1 px-2 text-[10px] font-semibold tracking-wider uppercase">
          Margins
        </div>
        <div className="flex flex-col gap-0.5">
          {(Object.keys(MARGIN_SPECS) as MarginPreset[]).map((key) => {
            const isSelected = layout.margins === key && !layout.isPageless;
            return (
              <button
                key={key}
                type="button"
                disabled={layout.isPageless}
                onClick={() => handleSelectMargin(key)}
                className="hover:bg-surface-hover text-foreground flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors disabled:opacity-40"
              >
                <span>{MARGIN_SPECS[key].label}</span>
                {isSelected && <Check size={14} className="text-primary dark:text-accent" />}
              </button>
            );
          })}
        </div>
      </CustomPopoverContent>
    </CustomPopover>
  );
}
