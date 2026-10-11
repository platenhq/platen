"use client";

import React, { useState } from "react";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
} from "@/components/ui/custom/CustomDropdown";
import { Keyboard, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HelpMenuProps {
  disabled?: boolean;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({ disabled }) => {
  const [open, setOpen] = useState(false);

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
          Help
        </Button>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-60 p-1.5" align="start">
        <CustomDropdownItem
          className="px-3 py-2 text-sm"
          onClick={() => {
            alert(
              "Keyboard Shortcuts:\n• Bold: Ctrl+B\n• Italic: Ctrl+I\n• Underline: Ctrl+U\n• Undo: Ctrl+Z\n• Redo: Ctrl+Y\n• Link: Ctrl+K\n• Clear Formatting: Ctrl+\\",
            );
            setOpen(false);
          }}
        >
          <div className="flex items-center gap-3">
            <Keyboard className="text-muted-foreground size-4" />
            <span>Keyboard shortcuts</span>
          </div>
          <span className="text-muted-foreground text-xs font-normal">Ctrl+/</span>
        </CustomDropdownItem>

        <CustomDropdownItem
          className="px-3 py-2 text-sm"
          onClick={() => {
            window.open("https://github.com/platenhq/platen", "_blank");
            setOpen(false);
          }}
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="text-muted-foreground size-4" />
            <span>Documentation</span>
          </div>
        </CustomDropdownItem>
      </CustomDropdownContent>
    </CustomDropdown>
  );
};
