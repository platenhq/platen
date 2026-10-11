"use client";

import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, $getSelection, $isNodeSelection } from "lexical";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Maximize2,
  Minimize2,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
} from "@/components/ui/custom/CustomDropdown";
import { useToolbarState } from "@/context/ToolbarContext";
import {
  $isImageNode,
  ImageAlignment,
  ImageNode,
  ImageObjectFit,
} from "@/components/editor/nodes/ImageNode";

interface ImageContextualToolbarProps {
  disabled?: boolean;
}

export default function ImageContextualToolbar({
  disabled = false,
}: ImageContextualToolbarProps): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { toolbarState, updateToolbarState } = useToolbarState();

  const getTargetImageNode = (): ImageNode | null => {
    if (toolbarState.selectedImageNodeKey) {
      const node = $getNodeByKey(toolbarState.selectedImageNodeKey);
      if ($isImageNode(node)) return node;
    }
    const selection = $getSelection();
    if ($isNodeSelection(selection)) {
      const nodes = selection.getNodes();
      for (const n of nodes) {
        if ($isImageNode(n)) return n;
      }
    }
    return null;
  };

  const handleSetAlignment = (alignment: ImageAlignment) => {
    editor.update(() => {
      const node = getTargetImageNode();
      if (node) {
        node.setAlignment(alignment);
        updateToolbarState("imageAlignment", alignment);
      }
    });
  };

  const handleSetObjectFit = (fit: ImageObjectFit) => {
    editor.update(() => {
      const node = getTargetImageNode();
      if (node) {
        node.setObjectFit(fit);
        updateToolbarState("imageObjectFit", fit);
      }
    });
  };

  const handleResetSize = () => {
    editor.update(() => {
      const node = getTargetImageNode();
      if (node) {
        node.setWidthAndHeight("inherit", "inherit");
      }
    });
  };

  const handleDelete = () => {
    editor.update(() => {
      const node = getTargetImageNode();
      if (node) {
        const parent = node.getParent();
        node.remove();
        if (parent && parent.getChildrenSize() === 0) {
          parent.select();
        }
        updateToolbarState("isImage", false);
        updateToolbarState("selectedImageNodeKey", null);
      }
    });
  };

  const currentAlign = toolbarState.imageAlignment || "center";
  const currentFit = toolbarState.imageObjectFit || "fill";

  const AlignIcon =
    currentAlign === "left" ? AlignLeft : currentAlign === "right" ? AlignRight : AlignCenter;

  const FitIcon =
    currentFit === "contain" ? Minimize2 : currentFit === "cover" ? Maximize2 : Square;

  const fitLabels: Record<ImageObjectFit, string> = {
    fill: "Default (Scale to frame)",
    contain: "Contain (Preserve ratio)",
    cover: "Cover (Crop edges)",
  };

  return (
    <div className="flex items-center gap-0.5 select-none">
      {/* Alignment Dropdown */}
      <CustomDropdown>
        <CustomDropdownTrigger asChild>
          <CustomToolbarButton
            disabled={disabled}
            tooltip="Image alignment"
            className="w-fit! gap-0.5 px-2!"
          >
            <AlignIcon className="size-4" />
            <ChevronDown className="text-muted-foreground size-3" />
          </CustomToolbarButton>
        </CustomDropdownTrigger>
        <CustomDropdownContent className="w-36 p-1">
          <CustomDropdownItem
            isActive={currentAlign === "left"}
            onClick={() => handleSetAlignment("left")}
          >
            <div className="flex items-center gap-2">
              <AlignLeft className="size-4" />
              <span>Left</span>
            </div>
          </CustomDropdownItem>
          <CustomDropdownItem
            isActive={currentAlign === "center"}
            onClick={() => handleSetAlignment("center")}
          >
            <div className="flex items-center gap-2">
              <AlignCenter className="size-4" />
              <span>Center</span>
            </div>
          </CustomDropdownItem>
          <CustomDropdownItem
            isActive={currentAlign === "right"}
            onClick={() => handleSetAlignment("right")}
          >
            <div className="flex items-center gap-2">
              <AlignRight className="size-4" />
              <span>Right</span>
            </div>
          </CustomDropdownItem>
        </CustomDropdownContent>
      </CustomDropdown>

      {/* Image Fit Dropdown */}
      <CustomDropdown>
        <CustomDropdownTrigger asChild>
          <CustomToolbarButton
            disabled={disabled}
            tooltip={`Image fit: ${fitLabels[currentFit]}`}
            className="w-fit! gap-1 px-2!"
          >
            <FitIcon className="size-4" />
            <span className="hidden text-xs font-medium capitalize sm:inline">{currentFit}</span>
            <ChevronDown className="text-muted-foreground size-3" />
          </CustomToolbarButton>
        </CustomDropdownTrigger>
        <CustomDropdownContent className="w-56 p-1">
          <CustomDropdownItem
            isActive={currentFit === "fill"}
            onClick={() => handleSetObjectFit("fill")}
          >
            <div className="flex items-center gap-2.5">
              <Square className="size-4" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium">Default (Google Docs)</span>
                <span className="text-muted-foreground text-[10px]">Scale without cropping</span>
              </div>
            </div>
          </CustomDropdownItem>
          <CustomDropdownItem
            isActive={currentFit === "contain"}
            onClick={() => handleSetObjectFit("contain")}
          >
            <div className="flex items-center gap-2.5">
              <Minimize2 className="size-4" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium">Contain</span>
                <span className="text-muted-foreground text-[10px]">
                  Fit inside frame with letterbox
                </span>
              </div>
            </div>
          </CustomDropdownItem>
          <CustomDropdownItem
            isActive={currentFit === "cover"}
            onClick={() => handleSetObjectFit("cover")}
          >
            <div className="flex items-center gap-2.5">
              <Maximize2 className="size-4" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium">Cover</span>
                <span className="text-muted-foreground text-[10px]">
                  Fill frame and crop overflow
                </span>
              </div>
            </div>
          </CustomDropdownItem>
        </CustomDropdownContent>
      </CustomDropdown>

      {/* Reset Size */}
      <CustomToolbarButton
        disabled={disabled}
        tooltip="Reset image size"
        onClick={handleResetSize}
        className="px-2"
      >
        <RotateCcw className="size-3.5" />
      </CustomToolbarButton>

      {/* Delete Image */}
      <CustomToolbarButton
        disabled={disabled}
        tooltip="Delete image"
        onClick={handleDelete}
        className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground px-2"
      >
        <Trash2 className="size-3.5" />
      </CustomToolbarButton>
    </div>
  );
}
