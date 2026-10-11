"use client";

import React, { useState } from "react";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
  CustomDropdownSeparator,
} from "@/components/ui/custom/CustomDropdown";
import { Printer, Download, Plus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface FileMenuProps {
  disabled?: boolean;
}

export const FileMenu: React.FC<FileMenuProps> = ({ disabled }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
    setOpen(false);
  };

  const handleNew = () => {
    router.push("/");
    setOpen(false);
  };

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
          File
        </Button>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-60 p-1.5" align="start">
        <CustomDropdownItem className="px-3 py-2 text-sm" onClick={handleNew}>
          <div className="flex items-center gap-3">
            <Plus className="text-primary size-4" />
            <span>New document</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownSeparator />

        <CustomDropdownItem className="px-3 py-2 text-sm" onClick={handlePrint}>
          <div className="flex items-center gap-3">
            <Printer className="text-muted-foreground size-4" />
            <span>Print</span>
          </div>
          <span className="text-muted-foreground text-xs font-normal">Ctrl+P</span>
        </CustomDropdownItem>

        <CustomDropdownItem
          className="px-3 py-2 text-sm"
          onClick={() => {
            // Future export pipeline
            setOpen(false);
          }}
        >
          <div className="flex items-center gap-3">
            <Download className="text-muted-foreground size-4" />
            <span>Download</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownSeparator />

        <CustomDropdownItem
          className="px-3 py-2 text-sm"
          onClick={() => {
            setOpen(false);
          }}
        >
          <div className="flex items-center gap-3">
            <Settings className="text-muted-foreground size-4" />
            <span>Page setup</span>
          </div>
        </CustomDropdownItem>
      </CustomDropdownContent>
    </CustomDropdown>
  );
};
