"use client";

import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import {
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { $getNearestNodeOfType } from "@lexical/utils";
import { List, ListOrdered, ListCheck, Indent, Outdent, ChevronDown } from "lucide-react";
import { useToolbarState } from "@/context/ToolbarContext";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import {
  CustomPopover,
  CustomPopoverTrigger,
  CustomPopoverContent,
} from "@/components/ui/custom/CustomPopover";
import { cn } from "@/lib/utils";

// 6 Visual Bullet List Style Presets matching Google Docs
const BULLET_CARD_PRESETS = [
  {
    id: "disc",
    styleType: "disc",
    levels: [
      { sym: "●", indent: 0, width: "w-10" },
      { sym: "○", indent: 1, width: "w-8" },
      { sym: "■", indent: 2, width: "w-6" },
    ],
  },
  {
    id: "diamond",
    styleType: "diamond",
    levels: [
      { sym: "◆", indent: 0, width: "w-10" },
      { sym: "◇", indent: 1, width: "w-8" },
      { sym: "◆", indent: 2, width: "w-6" },
    ],
  },
  {
    id: "square",
    styleType: "square",
    levels: [
      { sym: "■", indent: 0, width: "w-10" },
      { sym: "□", indent: 1, width: "w-8" },
      { sym: "■", indent: 2, width: "w-6" },
    ],
  },
  {
    id: "arrow-diamond",
    styleType: "arrow",
    levels: [
      { sym: "➔", indent: 0, width: "w-10" },
      { sym: "◆", indent: 1, width: "w-8" },
      { sym: "●", indent: 2, width: "w-6" },
    ],
  },
  {
    id: "star",
    styleType: "star",
    levels: [
      { sym: "★", indent: 0, width: "w-10" },
      { sym: "○", indent: 1, width: "w-8" },
      { sym: "■", indent: 2, width: "w-6" },
    ],
  },
  {
    id: "arrow-circle",
    styleType: "arrow-circle",
    levels: [
      { sym: "➢", indent: 0, width: "w-10" },
      { sym: "○", indent: 1, width: "w-8" },
      { sym: "■", indent: 2, width: "w-6" },
    ],
  },
];

// 6 Visual Numbered List Style Presets matching Google Docs
const NUMBERED_CARD_PRESETS = [
  {
    id: "decimal",
    styleType: "decimal",
    lines: [
      { prefix: "1.", indent: 0, width: "w-9" },
      { prefix: "a.", indent: 1, width: "w-7" },
      { prefix: "i.", indent: 2, width: "w-5" },
      { prefix: "2.", indent: 0, width: "w-9" },
    ],
  },
  {
    id: "paren-decimal",
    styleType: "paren-decimal",
    lines: [
      { prefix: "1)", indent: 0, width: "w-9" },
      { prefix: "a)", indent: 1, width: "w-7" },
      { prefix: "i)", indent: 2, width: "w-5" },
      { prefix: "2)", indent: 0, width: "w-9" },
    ],
  },
  {
    id: "nested-decimal",
    styleType: "nested-decimal",
    lines: [
      { prefix: "1.", indent: 0, width: "w-9" },
      { prefix: "1.1.", indent: 1, width: "w-7" },
      { prefix: "1.2.1.", indent: 2, width: "w-5" },
      { prefix: "2.", indent: 0, width: "w-9" },
    ],
  },
  {
    id: "upper-alpha",
    styleType: "upper-alpha",
    lines: [
      { prefix: "A.", indent: 0, width: "w-9" },
      { prefix: "a.", indent: 1, width: "w-7" },
      { prefix: "i.", indent: 2, width: "w-5" },
      { prefix: "B.", indent: 0, width: "w-9" },
    ],
  },
  {
    id: "upper-roman",
    styleType: "upper-roman",
    lines: [
      { prefix: "I.", indent: 0, width: "w-9" },
      { prefix: "A.", indent: 1, width: "w-7" },
      { prefix: "1.", indent: 2, width: "w-5" },
      { prefix: "II.", indent: 0, width: "w-9" },
    ],
  },
  {
    id: "leading-zero",
    styleType: "leading-zero",
    lines: [
      { prefix: "01.", indent: 0, width: "w-9" },
      { prefix: "a.", indent: 1, width: "w-7" },
      { prefix: "i.", indent: 2, width: "w-5" },
      { prefix: "02.", indent: 0, width: "w-9" },
    ],
  },
];

function getListStyleCSS(styleType: string): string {
  if (styleType === "diamond") return `list-style-type: "◆ ";`;
  if (styleType === "square") return `list-style-type: square;`;
  if (styleType === "arrow") return `list-style-type: "➔ ";`;
  if (styleType === "arrow-circle") return `list-style-type: "➢ ";`;
  if (styleType === "star") return `list-style-type: "★ ";`;
  if (styleType === "paren-decimal") return `list-style-type: decimal;`;
  if (styleType === "upper-roman") return `list-style-type: upper-roman;`;
  if (styleType === "upper-alpha") return `list-style-type: upper-alpha;`;
  if (styleType === "nested-decimal") return `list-style-type: decimal;`;
  if (styleType === "leading-zero") return `list-style-type: decimal-leading-zero;`;
  return `list-style-type: ${styleType};`;
}

export function BulletedListDropdown({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { toolbarState } = useToolbarState();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBulletId, setSelectedBulletId] = useState<string>("disc");

  const isBulletActive = toolbarState.blockType === "bullet";

  const handleToggleOrSetStyle = (presetId: string, styleType: string) => {
    setSelectedBulletId(presetId);
    if (!isBulletActive) {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
    if (styleType !== "disc") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const listNode = $getNearestNodeOfType(anchorNode, ListNode);
          if (listNode) {
            listNode.setStyle(getListStyleCSS(styleType));
          }
        }
      });
    }
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    if (isBulletActive) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      setSelectedBulletId("disc");
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  };

  return (
    <div className="inline-flex items-center">
      {/* Primary Button */}
      <CustomToolbarButton
        size="split-left"
        disabled={disabled}
        isActive={isBulletActive}
        tooltip="Bulleted list"
        onClick={handleButtonClick}
      >
        <List className="format icon size-4" />
      </CustomToolbarButton>

      {/* Dropdown Chevron */}
      <CustomPopover open={isOpen} onOpenChange={setIsOpen}>
        <CustomPopoverTrigger asChild>
          <CustomToolbarButton
            size="split-right"
            disabled={disabled}
            isActive={isOpen}
            tooltip="Bullet list options"
          >
            <ChevronDown className="text-foreground size-3 shrink-0" />
          </CustomToolbarButton>
        </CustomPopoverTrigger>

        <CustomPopoverContent className="w-68 p-2" sideOffset={8}>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {BULLET_CARD_PRESETS.map((preset) => {
              const isSelected = isBulletActive && selectedBulletId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToggleOrSetStyle(preset.id, preset.styleType)}
                  className={cn(
                    "flex flex-col rounded-md border p-2 text-left transition-all",
                    isSelected
                      ? "border-blue-600 bg-blue-50/80 ring-1 ring-blue-500 dark:bg-blue-950/40"
                      : "hover:bg-surface-hover/70 border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700",
                  )}
                >
                  <div className="space-y-1.5 py-0.5">
                    {preset.levels.map((lvl, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-1.5 leading-none",
                          lvl.indent === 1 && "pl-2",
                          lvl.indent === 2 && "pl-4",
                        )}
                      >
                        <span className="text-foreground w-2.5 shrink-0 text-center text-[10px]">
                          {lvl.sym}
                        </span>
                        <span
                          className={cn(
                            "h-1 rounded-full bg-slate-300 dark:bg-slate-600",
                            lvl.width,
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </CustomPopoverContent>
      </CustomPopover>
    </div>
  );
}

export function NumberedListDropdown({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { toolbarState } = useToolbarState();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNumberId, setSelectedNumberId] = useState<string>("decimal");

  const isNumberActive = toolbarState.blockType === "number";

  const handleToggleOrSetStyle = (presetId: string, styleType: string) => {
    setSelectedNumberId(presetId);
    if (!isNumberActive) {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
    if (styleType !== "decimal") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const listNode = $getNearestNodeOfType(anchorNode, ListNode);
          if (listNode) {
            listNode.setStyle(getListStyleCSS(styleType));
          }
        }
      });
    }
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    if (isNumberActive) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      setSelectedNumberId("decimal");
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  return (
    <div className="inline-flex items-center">
      {/* Primary Button */}
      <CustomToolbarButton
        size="split-left"
        disabled={disabled}
        isActive={isNumberActive}
        tooltip="Numbered list"
        onClick={handleButtonClick}
      >
        <ListOrdered className="format icon size-4" />
      </CustomToolbarButton>

      {/* Dropdown Chevron */}
      <CustomPopover open={isOpen} onOpenChange={setIsOpen}>
        <CustomPopoverTrigger asChild>
          <CustomToolbarButton
            size="split-right"
            disabled={disabled}
            isActive={isOpen}
            tooltip="Numbered list options"
          >
            <ChevronDown className="text-foreground size-3 shrink-0" />
          </CustomToolbarButton>
        </CustomPopoverTrigger>

        <CustomPopoverContent className="w-68 p-2" sideOffset={8}>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {NUMBERED_CARD_PRESETS.map((preset) => {
              const isSelected = isNumberActive && selectedNumberId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleToggleOrSetStyle(preset.id, preset.styleType)}
                  className={cn(
                    "flex flex-col rounded-md border p-2 text-left transition-all",
                    isSelected
                      ? "border-blue-600 bg-blue-50/80 ring-1 ring-blue-500 dark:bg-blue-950/40"
                      : "hover:bg-surface-hover/70 border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700",
                  )}
                >
                  <div className="space-y-1 py-0.5">
                    {preset.lines.map((line, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-1.5 leading-none",
                          line.indent === 1 && "pl-2",
                          line.indent === 2 && "pl-4",
                        )}
                      >
                        <span className="text-foreground min-w-3 shrink-0 text-right font-mono text-[9px]">
                          {line.prefix}
                        </span>
                        <span
                          className={cn(
                            "h-1 rounded-full bg-slate-300 dark:bg-slate-600",
                            line.width,
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </CustomPopoverContent>
      </CustomPopover>
    </div>
  );
}

export function ChecklistButton({ disabled = false }: { disabled?: boolean }): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { toolbarState, updateToolbarState } = useToolbarState();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCheckType = toolbarState.checklistStyle;
  const isCheckActive = toolbarState.blockType === "check";

  const handleSelectChecklist = (strikethrough: boolean) => {
    const style = strikethrough ? "strikethrough" : "standard";
    updateToolbarState("checklistStyle", style);
    if (!isCheckActive) {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    }
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const listNode = $getNearestNodeOfType(anchorNode, ListNode);
        if (listNode) {
          listNode.setStyle(strikethrough ? "checklist-strikethrough" : "");
        }
      }
    });
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (isCheckActive) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    }
  };

  return (
    <div className="inline-flex items-center">
      <CustomToolbarButton
        size="split-left"
        disabled={disabled}
        isActive={isCheckActive}
        tooltip="Checklist"
        onClick={handleToggle}
      >
        <ListCheck className="format icon size-4" />
      </CustomToolbarButton>

      <CustomPopover open={isOpen} onOpenChange={setIsOpen}>
        <CustomPopoverTrigger asChild>
          <CustomToolbarButton
            size="split-right"
            disabled={disabled}
            isActive={isOpen}
            tooltip="Checklist options"
          >
            <ChevronDown className="text-foreground size-3 shrink-0" />
          </CustomToolbarButton>
        </CustomPopoverTrigger>

        <CustomPopoverContent className="w-56 p-2" sideOffset={8}>
          <div className="grid grid-cols-2 gap-1.5">
            {/* Card 1: Standard Checklist (no strikethrough) */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectChecklist(false)}
              className={cn(
                "flex flex-col rounded-md border p-2.5 text-left transition-all",
                isCheckActive && selectedCheckType === "standard"
                  ? "border-blue-600 bg-blue-50/80 ring-1 ring-blue-500 dark:bg-blue-950/40"
                  : "hover:bg-surface-hover/70 border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700",
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-2xs size-3.5 shrink-0 border border-slate-500" />
                  <span className="h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-2xs flex size-3.5 shrink-0 items-center justify-center border border-blue-600 bg-blue-600 text-[9px] text-white">
                    ✓
                  </span>
                  <span className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
              </div>
            </button>

            {/* Card 2: Strikethrough Checklist */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectChecklist(true)}
              className={cn(
                "flex flex-col rounded-md border p-2.5 text-left transition-all",
                isCheckActive && selectedCheckType === "strikethrough"
                  ? "border-blue-600 bg-blue-50/80 ring-1 ring-blue-500 dark:bg-blue-950/40"
                  : "hover:bg-surface-hover/70 border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700",
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-2xs size-3.5 shrink-0 border border-slate-500" />
                  <span className="h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-2xs flex size-3.5 shrink-0 items-center justify-center border border-blue-600 bg-blue-600 text-[9px] text-white">
                    ✓
                  </span>
                  <div className="relative flex items-center">
                    <span className="h-1 w-10 rounded-full bg-slate-300 opacity-60 dark:bg-slate-600" />
                    <span className="absolute inset-x-0 h-px bg-slate-500 dark:bg-slate-400" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        </CustomPopoverContent>
      </CustomPopover>
    </div>
  );
}

export function IndentControls({ disabled = false }: { disabled?: boolean }): React.JSX.Element {
  const [editor] = useLexicalComposerContext();

  return (
    <div className="inline-flex items-center gap-0.5">
      <CustomToolbarButton
        disabled={disabled}
        tooltip="Decrease indent (Outdent)"
        onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
      >
        <Outdent className="format icon size-4" />
      </CustomToolbarButton>

      <CustomToolbarButton
        disabled={disabled}
        tooltip="Increase indent (Indent)"
        onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
      >
        <Indent className="format icon size-4" />
      </CustomToolbarButton>
    </div>
  );
}
