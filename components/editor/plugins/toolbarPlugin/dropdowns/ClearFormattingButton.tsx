"use client";

import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $getSelection, $isRangeSelection, $isTextNode } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { RemoveFormatting } from "lucide-react";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";

export default function ClearFormattingButton({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();

  const handleClearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // 1. Reset all selected text node formats and inline CSS styles
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if ($isTextNode(node)) {
            node.setFormat(0);
            node.setStyle("");
          }
        });

        // 2. Convert block formats (e.g. Heading, Quote) back to normal Paragraph
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  return (
    <CustomToolbarButton
      disabled={disabled}
      tooltip="Clear formatting (Ctrl+\)"
      onClick={handleClearFormatting}
    >
      <RemoveFormatting className="format icon size-4" />
    </CustomToolbarButton>
  );
}
