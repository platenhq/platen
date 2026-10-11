"use client";

import React from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
} from "@/components/ui/custom/CustomDropdown";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import { useDocumentLayout, ZOOM_PRESETS, ZoomPreset } from "@/context/DocumentLayoutContext";

interface ZoomDropdownProps {
  disabled?: boolean;
}

export default function ZoomDropdown({ disabled = false }: ZoomDropdownProps): React.JSX.Element {
  const { layout, setZoom } = useDocumentLayout();
  const currentZoom = layout.zoom;

  const currentLabel = currentZoom === "fit" ? "Fit" : `${currentZoom}%`;

  return (
    <CustomDropdown>
      <CustomDropdownTrigger asChild>
        <CustomToolbarButton
          disabled={disabled}
          tooltip="Zoom"
          className="w-auto min-w-16 justify-between gap-1 px-2 font-normal"
        >
          <span className="text-xs font-medium">{currentLabel}</span>
          <ChevronDown className="text-muted-foreground size-3 shrink-0" />
        </CustomToolbarButton>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-28 p-1">
        {ZOOM_PRESETS.map((preset, index) => {
          const isActive = currentZoom === preset.value;

          return (
            <React.Fragment key={preset.label}>
              {/* Separator between Fit and percentage list */}
              {index === 1 && <div className="bg-border my-1 h-px w-full shrink-0" />}
              <CustomDropdownItem
                isActive={isActive}
                onClick={() => setZoom(preset.value)}
                className="flex items-center justify-between text-xs"
              >
                <span>{preset.label}</span>
                {isActive && <Check className="text-primary size-3.5" />}
              </CustomDropdownItem>
            </React.Fragment>
          );
        })}
      </CustomDropdownContent>
    </CustomDropdown>
  );
}
