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
import { Check, Eye, FileText, Layers, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewMenuProps {
  disabled?: boolean;
}

export const ViewMenu: React.FC<ViewMenuProps> = ({ disabled }) => {
  const [open, setOpen] = useState(false);
  const { layout, setPageSize, setZoom, setViewMode } = useDocumentLayout();

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
        {/* Mode switcher: Pages, Pageless, Platen Engine */}
        <div className="text-muted-foreground px-3 py-1 text-xs font-medium">Document View</div>
        <CustomDropdownItem
          className="px-3 py-2 text-sm"
          isActive={layout.viewMode === "paged-engine"}
          onClick={() => {
            setViewMode("paged-engine");
            setOpen(false);
          }}
        >
          <div className="flex flex-1 items-center gap-3">
            <Layers className="text-muted-foreground size-4" />
            <span>Pages</span>
          </div>
          {layout.viewMode === "paged-engine" && (
            <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          )}
        </CustomDropdownItem>

        <CustomDropdownItem
          className="px-3 py-2 text-sm"
          isActive={layout.viewMode === "pages"}
          onClick={() => {
            setViewMode("pages");
            setOpen(false);
          }}
        >
          <div className="flex flex-1 items-center gap-3">
            <FileText className="text-muted-foreground size-4" />
            <span>Continuous (legacy)</span>
          </div>
          {layout.viewMode === "pages" && (
            <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          )}
        </CustomDropdownItem>

        <CustomDropdownItem
          className="px-3 py-2 text-sm"
          isActive={layout.viewMode === "pageless"}
          onClick={() => {
            setViewMode("pageless");
            setOpen(false);
          }}
        >
          <div className="flex flex-1 items-center gap-3">
            <Eye className="text-muted-foreground size-4" />
            <span>Pageless</span>
          </div>
          {layout.viewMode === "pageless" && (
            <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          )}
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
