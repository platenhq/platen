"use client";

import React, { useCallback } from "react";
import { $getSelection, LexicalEditor } from "lexical";
import { $patchStyleText } from "@lexical/selection";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
} from "@/components/ui/custom/CustomDropdown";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import { Type, ChevronDown } from "lucide-react";

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ["Arial", "Arial"],
  ["Courier New", "Courier New"],
  ["Georgia", "Georgia"],
  ["Times New Roman", "Times New Roman"],
  ["Trebuchet MS", "Trebuchet MS"],
  ["Verdana", "Verdana"],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ["10px", "10px"],
  ["11px", "11px"],
  ["12px", "12px"],
  ["13px", "13px"],
  ["14px", "14px"],
  ["15px", "15px"],
  ["16px", "16px"],
  ["17px", "17px"],
  ["18px", "18px"],
  ["19px", "19px"],
  ["20px", "20px"],
];

export function FontDropDown({
  editor,
  value,
  style,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: string;
  style: string;
  disabled?: boolean;
}): React.JSX.Element {
  const handleClick = useCallback(
    (option: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [editor, style],
  );

  const options = style === "font-family" ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS;

  return (
    <CustomDropdown>
      <CustomDropdownTrigger asChild>
        <CustomToolbarButton
          disabled={disabled}
          tooltip={style === "font-family" ? "Font family" : "Font size"}
          className="w-auto min-w-25 justify-between gap-1.5 px-2 font-normal"
        >
          <div className="flex items-center gap-1.5 truncate">
            {style === "font-family" && <Type className="size-3.5 shrink-0" />}
            <span className="truncate text-xs font-medium">{value}</span>
          </div>
          <ChevronDown className="text-muted-foreground size-3 shrink-0" />
        </CustomToolbarButton>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-40 p-1">
        {options.map(([option, text]) => (
          <CustomDropdownItem
            key={option}
            isActive={value === option}
            onClick={() => handleClick(option)}
            style={style === "font-family" ? { fontFamily: option } : undefined}
          >
            <span>{text}</span>
          </CustomDropdownItem>
        ))}
      </CustomDropdownContent>
    </CustomDropdown>
  );
}
