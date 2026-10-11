"use client";

import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import {
  CustomPopover,
  CustomPopoverTrigger,
  CustomPopoverContent,
} from "@/components/ui/custom/CustomPopover";

interface MoreOptionsDropdownProps {
  children: React.ReactNode;
  disabled?: boolean;
}

export default function MoreOptionsDropdown({
  children,
  disabled = false,
}: MoreOptionsDropdownProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CustomPopover open={isOpen} onOpenChange={setIsOpen}>
      <CustomPopoverTrigger asChild>
        <CustomToolbarButton disabled={disabled} isActive={isOpen} tooltip="More options">
          <MoreVertical className="format icon size-4" />
        </CustomToolbarButton>
      </CustomPopoverTrigger>

      <CustomPopoverContent
        align="end"
        sideOffset={8}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        className="flex w-auto max-w-[95vw] items-center gap-0.5 overflow-x-auto p-1 px-3 shadow-lg lg:px-2"
      >
        {children}
      </CustomPopoverContent>
    </CustomPopover>
  );
}
