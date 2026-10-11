"use client";

import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $patchStyleText } from "@lexical/selection";
import { $getSelection, $isRangeSelection } from "lexical";
import { useToolbarState } from "@/context/ToolbarContext";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import {
  CustomPopover,
  CustomPopoverTrigger,
  CustomPopoverContent,
} from "@/components/ui/custom/CustomPopover";
import CustomColorPicker from "@/components/ui/custom/CustomColorPicker";
import CustomColorModal from "@/components/ui/custom/CustomColorModal";

export default function FontColorButton({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { toolbarState } = useToolbarState();
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const activeColor = toolbarState.fontColor || "#000000";

  const handleSelectColor = (color: string | null) => {
    if (!color) return;
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { color });
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
            tooltip="Text color"
            className="flex-col gap-0"
          >
            <span className="font-serif text-base leading-none font-bold">A</span>
            <span
              className="mt-0.5 h-1 w-4.5 rounded-full border border-black/10"
              style={{ backgroundColor: activeColor }}
            />
          </CustomToolbarButton>
        </CustomPopoverTrigger>

        <CustomPopoverContent className="border-none bg-transparent p-0 shadow-none" sideOffset={8}>
          <CustomColorPicker
            currentColor={activeColor}
            onSelectColor={handleSelectColor}
            onClose={() => setIsOpen(false)}
            onOpenCustomModal={handleOpenCustomModal}
          />
        </CustomPopoverContent>
      </CustomPopover>

      <CustomColorModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSelectColor={handleSelectColor}
        initialColor={activeColor}
      />
    </>
  );
}
