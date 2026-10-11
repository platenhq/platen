"use client";

import React from "react";
import { LexicalEditor } from "lexical";
import { blockTypeToBlockName } from "@/context/ToolbarContext";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
} from "@/components/ui/custom/CustomDropdown";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import {
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
  getBlockTypeIcon,
} from "@/components/editor/plugins/toolbarPlugin/utils";
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListChecks,
  ListOrdered,
  MessageSquareQuote,
  Text,
  ChevronDown,
} from "lucide-react";

type rootTypeToRootName = {
  root: "Root";
  table: "Table";
};

export default function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  rootType?: keyof rootTypeToRootName;
  editor: LexicalEditor;
  disabled?: boolean;
}): React.JSX.Element {
  const Icon = getBlockTypeIcon(blockType);

  return (
    <CustomDropdown>
      <CustomDropdownTrigger asChild>
        <CustomToolbarButton
          disabled={disabled}
          tooltip="Text style"
          className="w-auto min-w-27.5 justify-between gap-1.5 px-2 font-normal"
        >
          <div className="flex items-center gap-1.5 truncate">
            {Icon && <Icon className="size-4 shrink-0" />}
            <span className="truncate text-xs font-medium">
              {blockTypeToBlockName[blockType] || "Normal"}
            </span>
          </div>
          <ChevronDown className="text-muted-foreground size-3 shrink-0" />
        </CustomToolbarButton>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-48 p-1">
        <CustomDropdownItem
          isActive={blockType === "paragraph"}
          onClick={() => formatParagraph(editor)}
        >
          <div className="flex items-center gap-2.5">
            <Text className="size-4" />
            <span>Normal</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownItem
          isActive={blockType === "h1"}
          onClick={() => formatHeading(editor, blockType, "h1")}
        >
          <div className="flex items-center gap-2.5">
            <Heading1 className="size-4" />
            <span className="text-base font-bold">Heading 1</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownItem
          isActive={blockType === "h2"}
          onClick={() => formatHeading(editor, blockType, "h2")}
        >
          <div className="flex items-center gap-2.5">
            <Heading2 className="size-4" />
            <span className="text-sm font-semibold">Heading 2</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownItem
          isActive={blockType === "h3"}
          onClick={() => formatHeading(editor, blockType, "h3")}
        >
          <div className="flex items-center gap-2.5">
            <Heading3 className="size-4" />
            <span className="text-xs font-medium">Heading 3</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownItem
          isActive={blockType === "bullet"}
          onClick={() => formatBulletList(editor, blockType)}
        >
          <div className="flex items-center gap-2.5">
            <List className="size-4" />
            <span>Bullet List</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownItem
          isActive={blockType === "number"}
          onClick={() => formatNumberedList(editor, blockType)}
        >
          <div className="flex items-center gap-2.5">
            <ListOrdered className="size-4" />
            <span>Numbered List</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownItem
          isActive={blockType === "check"}
          onClick={() => formatCheckList(editor, blockType)}
        >
          <div className="flex items-center gap-2.5">
            <ListChecks className="size-4" />
            <span>Check List</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownItem
          isActive={blockType === "quote"}
          onClick={() => formatQuote(editor, blockType)}
        >
          <div className="flex items-center gap-2.5">
            <MessageSquareQuote className="size-4" />
            <span>Quote</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownItem
          isActive={blockType === "code"}
          onClick={() => formatCode(editor, blockType)}
        >
          <div className="flex items-center gap-2.5">
            <Code className="size-4" />
            <span>Code Block</span>
          </div>
        </CustomDropdownItem>
      </CustomDropdownContent>
    </CustomDropdown>
  );
}
