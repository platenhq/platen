"use client";

import React, { useState } from "react";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
  CustomDropdownSeparator,
  CustomDropdownSub,
  CustomDropdownSubTrigger,
  CustomDropdownSubContent,
} from "@/components/ui/custom/CustomDropdown";
import { useDocumentLayout, ZOOM_PRESETS } from "@/context/DocumentLayoutContext";
import { Check, Eye, FileText, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewMenuProps {
  disabled?: boolean;
}

export const ViewMenu: React.FC<ViewMenuProps> = ({ disabled }) => {
  const [open, setOpen] = useState(false);
  const { layout, setPageSize, setZoom } = useDocumentLayout();

  return (
    <CustomDropdown open={open} onOpenChange={setOpen}>
      <CustomDropdownTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          className="text-foreground/80 hover:text-foreground hover:bg-surface-secondary/80 data-[state=open]:bg-surface-secondary/80 h-7 rounded px-2.5 text-sm font-normal transition-colors outline-none select-none disabled:opacity-50"
        >
          View
        </Button>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-60 p-1.5" align="start">
        {/* Mode switcher: Pages vs Pageless */}
        <CustomDropdownItem
          className="px-3 py-2 text-sm"
          onClick={() => {
            setPageSize(layout.isPageless ? "letter" : "pageless");
            setOpen(false);
          }}
        >
          <div className="flex items-center gap-3">
            <FileText className="text-muted-foreground size-4" />
            <span>{layout.isPageless ? "Switch to Pages mode" : "Switch to Pageless"}</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownSeparator />

        {/* Zoom Submenu */}
        <CustomDropdownSub>
          <CustomDropdownSubTrigger className="px-3 py-2 text-sm">
            <div className="flex items-center gap-3">
              <ZoomIn className="text-muted-foreground size-4" />
              <span>Zoom</span>
            </div>
          </CustomDropdownSubTrigger>
          <CustomDropdownSubContent className="w-40 p-1.5">
            {ZOOM_PRESETS.map((preset) => (
              <CustomDropdownItem
                key={String(preset.value)}
                isActive={layout.zoom === preset.value}
                className="px-3 py-2 text-sm"
                onClick={() => {
                  setZoom(preset.value);
                  setOpen(false);
                }}
              >
                <span>{preset.label}</span>
                {layout.zoom === preset.value && <Check className="size-4" />}
              </CustomDropdownItem>
            ))}
          </CustomDropdownSubContent>
        </CustomDropdownSub>
      </CustomDropdownContent>
    </CustomDropdown>
  );
};
