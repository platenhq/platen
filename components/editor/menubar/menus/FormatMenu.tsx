"use client";

import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { $patchStyleText } from "@lexical/selection";
import { $getSelection, $isRangeSelection } from "lexical";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
  CustomDropdownSeparator,
} from "@/components/ui/custom/CustomDropdown";
import { Bold, Italic, Underline, Strikethrough, RemoveFormatting } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormatMenuProps {
  disabled?: boolean;
}

export const FormatMenu: React.FC<FormatMenuProps> = ({ disabled }) => {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);

  const formatText = (format: "bold" | "italic" | "underline" | "strikethrough") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    setOpen(false);
  };

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, {
          "font-weight": "",
          "font-style": "",
          "text-decoration": "",
          color: "",
          "background-color": "",
          "font-size": "",
          "font-family": "",
        });
      }
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
          Format
        </Button>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-60 p-1.5" align="start">
        <CustomDropdownItem className="px-3 py-2 text-sm" onClick={() => formatText("bold")}>
          <div className="flex items-center gap-3">
            <Bold className="text-muted-foreground size-4" />
            <span>Bold</span>
          </div>
          <span className="text-muted-foreground text-xs font-normal">Ctrl+B</span>
        </CustomDropdownItem>

        <CustomDropdownItem className="px-3 py-2 text-sm" onClick={() => formatText("italic")}>
          <div className="flex items-center gap-3">
            <Italic className="text-muted-foreground size-4" />
            <span>Italic</span>
          </div>
          <span className="text-muted-foreground text-xs font-normal">Ctrl+I</span>
        </CustomDropdownItem>

        <CustomDropdownItem className="px-3 py-2 text-sm" onClick={() => formatText("underline")}>
          <div className="flex items-center gap-3">
            <Underline className="text-muted-foreground size-4" />
            <span>Underline</span>
          </div>
          <span className="text-muted-foreground text-xs font-normal">Ctrl+U</span>
        </CustomDropdownItem>

        <CustomDropdownItem
          className="px-3 py-2 text-sm"
          onClick={() => formatText("strikethrough")}
        >
          <div className="flex items-center gap-3">
            <Strikethrough className="text-muted-foreground size-4" />
            <span>Strikethrough</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownSeparator />

        <CustomDropdownItem className="px-3 py-2 text-sm" onClick={clearFormatting}>
          <div className="flex items-center gap-3">
            <RemoveFormatting className="text-muted-foreground size-4" />
            <span>Clear formatting</span>
          </div>
          <span className="text-muted-foreground text-xs font-normal">Ctrl+\</span>
        </CustomDropdownItem>
      </CustomDropdownContent>
    </CustomDropdown>
  );
};
