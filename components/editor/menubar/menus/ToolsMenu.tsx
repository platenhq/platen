"use client";

import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
} from "@/components/ui/custom/CustomDropdown";
import { Calculator, SpellCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolsMenuProps {
  disabled?: boolean;
}

export const ToolsMenu: React.FC<ToolsMenuProps> = ({ disabled }) => {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);

  const showWordCount = () => {
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      alert(`Word Count:\n• Words: ${words}\n• Characters: ${chars}`);
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
          Tools
        </Button>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-60 p-1.5" align="start">
        <CustomDropdownItem className="px-3 py-2 text-sm" onClick={showWordCount}>
          <div className="flex items-center gap-3">
            <Calculator className="text-muted-foreground size-4" />
            <span>Word count</span>
          </div>
          <span className="text-muted-foreground text-xs font-normal">Ctrl+Shift+C</span>
        </CustomDropdownItem>

        <CustomDropdownItem className="px-3 py-2 text-sm" onClick={() => setOpen(false)}>
          <div className="flex items-center gap-3">
            <SpellCheck className="text-muted-foreground size-4" />
            <span>Spelling and grammar</span>
          </div>
        </CustomDropdownItem>
      </CustomDropdownContent>
    </CustomDropdown>
  );
};
