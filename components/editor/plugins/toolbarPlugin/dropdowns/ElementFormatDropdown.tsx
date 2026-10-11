"use client";

import React from "react";
import { ElementFormatType, FORMAT_ELEMENT_COMMAND, LexicalEditor } from "lexical";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, ChevronDown } from "lucide-react";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
} from "@/components/ui/custom/CustomDropdown";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";

const ELEMENT_FORMAT_OPTIONS = {
  left: { icon: AlignLeft, name: "Left Align" },
  center: { icon: AlignCenter, name: "Center Align" },
  right: { icon: AlignRight, name: "Right Align" },
  justify: { icon: AlignJustify, name: "Justify Align" },
  start: { icon: AlignLeft, name: "Left Align" },
  end: { icon: AlignRight, name: "Right Align" },
  "": { icon: AlignLeft, name: "Left Align" },
};

export function ElementFormatDropdown({
  editor,
  value,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: ElementFormatType;
  disabled?: boolean;
}): React.JSX.Element {
  const current = ELEMENT_FORMAT_OPTIONS[value || "left"] || ELEMENT_FORMAT_OPTIONS.left;
  const CurrentIcon = current.icon;

  return (
    <CustomDropdown>
      <CustomDropdownTrigger asChild>
        <CustomToolbarButton disabled={disabled} tooltip="Text alignment" className="gap-0 px-1.5">
          <CurrentIcon className="format icon size-4" />
          <ChevronDown className="text-foreground size-3 shrink-0" />
        </CustomToolbarButton>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-36 p-1">
        <CustomDropdownItem
          isActive={value === "left" || value === "start" || !value}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
        >
          <div className="flex items-center gap-2.5">
            <AlignLeft className="size-4" />
            <span>Left Align</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownItem
          isActive={value === "center"}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
        >
          <div className="flex items-center gap-2.5">
            <AlignCenter className="size-4" />
            <span>Center Align</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownItem
          isActive={value === "right" || value === "end"}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
        >
          <div className="flex items-center gap-2.5">
            <AlignRight className="size-4" />
            <span>Right Align</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownItem
          isActive={value === "justify"}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")}
        >
          <div className="flex items-center gap-2.5">
            <AlignJustify className="size-4" />
            <span>Justify Align</span>
          </div>
        </CustomDropdownItem>
      </CustomDropdownContent>
    </CustomDropdown>
  );
}
