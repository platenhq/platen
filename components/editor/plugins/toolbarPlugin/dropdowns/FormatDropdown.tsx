"use client";

import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, $isTextNode, FORMAT_TEXT_COMMAND } from "lexical";
import {
  Strikethrough,
  Superscript,
  Subscript,
  Code,
  CaseSensitive,
  ChevronRight,
  Check,
} from "lucide-react";
import { useToolbarState } from "@/context/ToolbarContext";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import {
  CustomPopover,
  CustomPopoverTrigger,
  CustomPopoverContent,
} from "@/components/ui/custom/CustomPopover";

export default function FormatDropdown({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { toolbarState } = useToolbarState();
  const [isOpen, setIsOpen] = useState(false);
  const [showCaseSubmenu, setShowCaseSubmenu] = useState(false);

  const applyTextFormat = (format: "strikethrough" | "subscript" | "superscript" | "code") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    setIsOpen(false);
  };

  const applyCaseTransform = (mode: "lower" | "upper" | "title") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if ($isTextNode(node)) {
            const text = node.getTextContent();
            let transformed = text;
            if (mode === "lower") {
              transformed = text.toLowerCase();
            } else if (mode === "upper") {
              transformed = text.toUpperCase();
            } else if (mode === "title") {
              transformed = text.replace(/\b\w/g, (char) => char.toUpperCase());
            }
            node.setTextContent(transformed);
          }
        });
      }
    });
    setIsOpen(false);
    setShowCaseSubmenu(false);
  };

  return (
    <CustomPopover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setShowCaseSubmenu(false);
      }}
    >
      <CustomPopoverTrigger asChild>
        <CustomToolbarButton disabled={disabled} isActive={isOpen} tooltip="Format options (Aa)">
          <span className="text-xs font-semibold tracking-tight">Aa</span>
        </CustomToolbarButton>
      </CustomPopoverTrigger>

      <CustomPopoverContent className="w-52 p-1.5" sideOffset={8}>
        <div className="flex flex-col gap-0.5">
          {/* Strikethrough */}
          <button
            type="button"
            onClick={() => applyTextFormat("strikethrough")}
            className="hover:bg-surface-hover text-foreground flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs transition-colors outline-none select-none focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <Strikethrough className="format icon size-3.5" />
              <span>Strikethrough</span>
            </span>
            {toolbarState.isStrikethrough && (
              <Check size={14} className="text-primary dark:text-accent" />
            )}
          </button>

          {/* Superscript */}
          <button
            type="button"
            onClick={() => applyTextFormat("superscript")}
            className="hover:bg-surface-hover text-foreground flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs transition-colors outline-none select-none focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <Superscript className="format icon size-3.5" />
              <span>Superscript</span>
            </span>
            {toolbarState.isSuperscript && (
              <Check size={14} className="text-primary dark:text-accent" />
            )}
          </button>

          {/* Subscript */}
          <button
            type="button"
            onClick={() => applyTextFormat("subscript")}
            className="hover:bg-surface-hover text-foreground flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs transition-colors outline-none select-none focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <Subscript className="format icon size-3.5" />
              <span>Subscript</span>
            </span>
            {toolbarState.isSubscript && (
              <Check size={14} className="text-primary dark:text-accent" />
            )}
          </button>

          {/* Inline Code */}
          <button
            type="button"
            onClick={() => applyTextFormat("code")}
            className="hover:bg-surface-hover text-foreground flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs transition-colors outline-none select-none focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <Code className="format icon size-3.5" />
              <span>Inline code</span>
            </span>
            {toolbarState.isCode && <Check size={14} className="text-primary dark:text-accent" />}
          </button>

          <div className="border-border my-1 border-t" />

          {/* Capitalization Submenu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCaseSubmenu((prev) => !prev)}
              className="hover:bg-surface-hover text-foreground flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-xs transition-colors outline-none select-none focus:outline-none"
            >
              <span className="flex items-center gap-2">
                <CaseSensitive className="format icon size-3.5" />
                <span>Capitalization</span>
              </span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>

            {showCaseSubmenu && (
              <div className="border-border bg-surface text-foreground absolute top-0 left-full z-70 ml-1 w-36 rounded-lg border p-1 shadow-xl outline-none select-none">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => applyCaseTransform("lower")}
                    className="hover:bg-surface-hover text-foreground flex cursor-pointer items-center rounded-md px-2.5 py-1 text-left text-xs transition-colors outline-none select-none focus:outline-none"
                  >
                    lowercase
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCaseTransform("upper")}
                    className="hover:bg-surface-hover text-foreground flex cursor-pointer items-center rounded-md px-2.5 py-1 text-left text-xs transition-colors outline-none select-none focus:outline-none"
                  >
                    UPPERCASE
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCaseTransform("title")}
                    className="hover:bg-surface-hover text-foreground flex cursor-pointer items-center rounded-md px-2.5 py-1 text-left text-xs transition-colors outline-none select-none focus:outline-none"
                  >
                    Title Case
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CustomPopoverContent>
    </CustomPopover>
  );
}
