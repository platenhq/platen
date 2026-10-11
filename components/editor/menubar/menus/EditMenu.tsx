"use client";

import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { UNDO_COMMAND, REDO_COMMAND, $getRoot, $selectAll } from "lexical";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
  CustomDropdownSeparator,
} from "@/components/ui/custom/CustomDropdown";
import { Undo2, Redo2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditMenuProps {
  disabled?: boolean;
}

export const EditMenu: React.FC<EditMenuProps> = ({ disabled }) => {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);

  const handleUndo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
    setOpen(false);
  };

  const handleRedo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
    setOpen(false);
  };

  const handleSelectAll = () => {
    editor.update(() => {
      $selectAll();
    });
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
          Edit
        </Button>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-60 p-1.5" align="start">
        <CustomDropdownItem className="px-3 py-2 text-sm" onClick={handleUndo}>
          <div className="flex items-center gap-3">
            <Undo2 className="text-muted-foreground size-4" />
            <span>Undo</span>
          </div>
          <span className="text-muted-foreground text-xs font-normal">Ctrl+Z</span>
        </CustomDropdownItem>

        <CustomDropdownItem className="px-3 py-2 text-sm" onClick={handleRedo}>
          <div className="flex items-center gap-3">
            <Redo2 className="text-muted-foreground size-4" />
            <span>Redo</span>
          </div>
          <span className="text-muted-foreground text-xs font-normal">Ctrl+Y</span>
        </CustomDropdownItem>

        <CustomDropdownSeparator />

        <CustomDropdownItem className="px-3 py-2 text-sm" onClick={handleSelectAll}>
          <div className="flex items-center gap-3">
            <CheckSquare className="text-muted-foreground size-4" />
            <span>Select all</span>
          </div>
          <span className="text-muted-foreground text-xs font-normal">Ctrl+A</span>
        </CustomDropdownItem>
      </CustomDropdownContent>
    </CustomDropdown>
  );
};
