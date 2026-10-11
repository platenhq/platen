"use client";

import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $patchStyleText } from "@lexical/selection";
import { $getSelection, $isRangeSelection } from "lexical";
import { Highlighter } from "lucide-react";
import { useToolbarState } from "@/context/ToolbarContext";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import {
  CustomPopover,
  CustomPopoverTrigger,
  CustomPopoverContent,
} from "@/components/ui/custom/CustomPopover";
import CustomColorPicker from "@/components/ui/custom/CustomColorPicker";
import CustomColorModal from "@/components/ui/custom/CustomColorModal";

export default function HighlightColorButton({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { toolbarState } = useToolbarState();
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const activeColor =
    toolbarState.bgColor &&
    toolbarState.bgColor !== "transparent" &&
    toolbarState.bgColor !== "none" &&
    toolbarState.bgColor !== "rgba(0, 0, 0, 0)"
      ? toolbarState.bgColor
      : "";

  const handleSelectColor = (color: string | null) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (!color || color === "transparent" || color === "none") {
          $patchStyleText(selection, { "background-color": null });
        } else {
          $patchStyleText(selection, { "background-color": color });
        }
      }
    });
    setIsOpen(false);
    setIsCustomModalOpen(false);
  };

  const handleOpenCustomModal = () => {
    setIsOpen(false);
    setIsCustomModalOpen(true);
  };

  return (
    <>
      <CustomPopover open={isOpen} onOpenChange={setIsOpen}>
        <CustomPopoverTrigger asChild>
          <CustomToolbarButton
            disabled={disabled}
            isActive={isOpen}
            tooltip="Highlight color"
            className="flex-col gap-0.5"
          >
            <Highlighter className="format icon" />
            <span
              className="h-1 w-4.5 rounded-full border border-black/10"
              style={{
                backgroundColor: activeColor || "transparent",
                backgroundImage: activeColor
                  ? "none"
                  : "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                backgroundSize: "4px 4px",
              }}
            />
          </CustomToolbarButton>
        </CustomPopoverTrigger>

        <CustomPopoverContent className="border-none bg-transparent p-0 shadow-none" sideOffset={8}>
          <CustomColorPicker
            currentColor={activeColor}
            onSelectColor={handleSelectColor}
            onClose={() => setIsOpen(false)}
            onOpenCustomModal={handleOpenCustomModal}
            showNoneOption
          />
        </CustomPopoverContent>
      </CustomPopover>

      <CustomColorModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSelectColor={handleSelectColor}
        initialColor={activeColor || "#ffff00"}
      />
    </>
  );
}
