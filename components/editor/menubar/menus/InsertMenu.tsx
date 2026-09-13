"use client";

import React, { useState, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { $createCodeNode } from "@lexical/code";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { TableGridPicker } from "@/components/editor/plugins/toolbarPlugin/dropdowns/TableGridPicker";
import { INSERT_PAGE_BREAK_COMMAND } from "@/components/editor/nodes/PageBreakNode";
import { INSERT_CALLOUT_COMMAND, CalloutType } from "@/components/editor/nodes/CalloutNode";
import { INSERT_YOUTUBE_COMMAND } from "@/components/editor/nodes/YouTubeNode";
import { INSERT_TWEET_COMMAND } from "@/components/editor/nodes/TweetNode";
import { INSERT_IMAGE_COMMAND, InsertImagePayload } from "@/components/editor/nodes/ImageNode";
import MediaEmbedModal from "@/components/editor/modals/MediaEmbedModal";
import InsertImageModal from "@/components/editor/modals/InsertImageModal";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
  CustomDropdownSub,
  CustomDropdownSubTrigger,
  CustomDropdownSubContent,
  CustomDropdownSeparator,
} from "@/components/ui/custom/CustomDropdown";
import {
  Table as TableIcon,
  Minus,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  MessageSquareQuote,
  Info,
  Lightbulb,
  AlertTriangle,
  AlertOctagon,
  StickyNote,
  Video,
  Twitter,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InsertMenuProps {
  disabled?: boolean;
}

export const InsertMenu: React.FC<InsertMenuProps> = ({ disabled }) => {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [embedModal, setEmbedModal] = useState<{
    isOpen: boolean;
    type: "youtube" | "tweet";
  }>({
    isOpen: false,
    type: "youtube",
  });

  const insertHorizontalRule = () => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
    setOpen(false);
  };

  const insertPageBreak = () => {
    editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined);
    setOpen(false);
  };

  const insertCodeBlock = () => {
    editor.update(() => {
      const codeNode = $createCodeNode();
      $insertNodeToNearestRoot(codeNode);
    });
    setOpen(false);
  };

  const insertCallout = (type: CalloutType) => {
    editor.dispatchCommand(INSERT_CALLOUT_COMMAND, { type });
    setOpen(false);
  };

  const handleEmbedConfirm = (urlOrId: string) => {
    if (embedModal.type === "youtube") {
      editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, urlOrId);
    } else {
      editor.dispatchCommand(INSERT_TWEET_COMMAND, urlOrId);
    }
  };

  const handleImageConfirm = (payload: InsertImagePayload) => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
  };

  const handleDirectFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const img = new Image();
          img.onload = () => {
            let initialWidth: number | "inherit" = "inherit";
            let initialHeight: number | "inherit" = "inherit";

            // Large images (wider than 500px) use "inherit" so the wrapper's
            // maxWidth: 100% fills the page exactly \u2014 same as Google Docs.
            // Small images (icons, logos) render at their natural pixel size.
            // The first resize drag will commit exact px dimensions to the AST.
            if (img.naturalWidth <= 500) {
              initialWidth = img.naturalWidth;
              initialHeight = img.naturalHeight;
            }
            // else: both remain "inherit" \u2014 CSS handles the sizing

            const cleanName = file.name.replace(/\.[^/.]+$/, "");
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
              src: result,
              altText: cleanName || "Uploaded image",
              width: initialWidth,
              height: initialHeight,
              maxWidth: 800,
              alignment: "center",
            });
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
      // Reset input value so re-selecting same file works
      e.target.value = "";
    }
  };

  return (
    <>
      {/* Hidden file input for direct computer upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={handleDirectFileInputChange}
        className="hidden"
      />

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
            Insert
          </Button>
        </CustomDropdownTrigger>

        <CustomDropdownContent className="w-64 p-1.5" align="start">
          {/* Table Submenu with Interactive Grid Picker */}
          <CustomDropdownSub>
            <CustomDropdownSubTrigger className="px-3 py-2 text-sm">
              <div className="flex items-center gap-3">
                <TableIcon className="size-4 text-blue-500" />
                <span>Table</span>
              </div>
            </CustomDropdownSubTrigger>
            <CustomDropdownSubContent className="w-auto p-1.5">
              <TableGridPicker onClose={() => setOpen(false)} />
            </CustomDropdownSubContent>
          </CustomDropdownSub>

          {/* Callout Submenu */}
          <CustomDropdownSub>
            <CustomDropdownSubTrigger className="px-3 py-2 text-sm">
              <div className="flex items-center gap-3">
                <MessageSquareQuote className="size-4 text-amber-500" />
                <span>Callout block</span>
              </div>
            </CustomDropdownSubTrigger>
            <CustomDropdownSubContent className="w-48 p-1.5">
              <CustomDropdownItem
                className="px-3 py-2 text-sm"
                onClick={() => insertCallout("info")}
              >
                <div className="flex items-center gap-2.5">
                  <Info className="size-4 text-blue-500" />
                  <span>Info (Blue)</span>
                </div>
              </CustomDropdownItem>
              <CustomDropdownItem
                className="px-3 py-2 text-sm"
                onClick={() => insertCallout("tip")}
              >
                <div className="flex items-center gap-2.5">
                  <Lightbulb className="size-4 text-emerald-500" />
                  <span>Tip (Green)</span>
                </div>
              </CustomDropdownItem>
              <CustomDropdownItem
                className="px-3 py-2 text-sm"
                onClick={() => insertCallout("warning")}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <span>Warning (Yellow)</span>
                </div>
              </CustomDropdownItem>
              <CustomDropdownItem
                className="px-3 py-2 text-sm"
                onClick={() => insertCallout("danger")}
              >
                <div className="flex items-center gap-2.5">
                  <AlertOctagon className="size-4 text-rose-500" />
                  <span>Danger (Red)</span>
                </div>
              </CustomDropdownItem>
              <CustomDropdownItem
                className="px-3 py-2 text-sm"
                onClick={() => insertCallout("note")}
              >
                <div className="flex items-center gap-2.5">
                  <StickyNote className="size-4 text-purple-500" />
                  <span>Note (Purple)</span>
                </div>
              </CustomDropdownItem>
            </CustomDropdownSubContent>
          </CustomDropdownSub>

          <CustomDropdownSeparator />

          {/* Image Submenu */}
          <CustomDropdownSub>
            <CustomDropdownSubTrigger className="px-3 py-2 text-sm">
              <div className="flex items-center gap-3">
                <ImageIcon className="size-4 text-emerald-500" />
                <span>Image</span>
              </div>
            </CustomDropdownSubTrigger>
            <CustomDropdownSubContent className="w-56 p-1.5">
              <CustomDropdownItem
                className="px-3 py-2 text-sm"
                onClick={() => {
                  setOpen(false);
                  fileInputRef.current?.click();
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="size-4 text-emerald-500" />
                  <span>Upload from computer</span>
                </div>
              </CustomDropdownItem>
              <CustomDropdownItem
                className="px-3 py-2 text-sm"
                onClick={() => {
                  setOpen(false);
                  setIsImageModalOpen(true);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <LinkIcon className="size-4 text-blue-500" />
                  <span>By URL</span>
                </div>
              </CustomDropdownItem>
            </CustomDropdownSubContent>
          </CustomDropdownSub>

          {/* YouTube Video */}
          <CustomDropdownItem
            className="px-3 py-2 text-sm"
            onClick={() => {
              setOpen(false);
              setEmbedModal({ isOpen: true, type: "youtube" });
            }}
          >
            <div className="flex items-center gap-3">
              <Video className="size-4 text-red-500" />
              <span>YouTube video</span>
            </div>
          </CustomDropdownItem>

          {/* Twitter / X Embed */}
          <CustomDropdownItem
            className="px-3 py-2 text-sm"
            onClick={() => {
              setOpen(false);
              setEmbedModal({ isOpen: true, type: "tweet" });
            }}
          >
            <div className="flex items-center gap-3">
              <Twitter className="size-4 text-sky-500" />
              <span>Post from X (Twitter)</span>
            </div>
          </CustomDropdownItem>

          <CustomDropdownSeparator />

          {/* Horizontal Line / Divider */}
          <CustomDropdownItem className="px-3 py-2 text-sm" onClick={insertHorizontalRule}>
            <div className="flex items-center gap-3">
              <Minus className="text-muted-foreground size-4" />
              <span>Horizontal line</span>
            </div>
          </CustomDropdownItem>

          {/* Page Break */}
          <CustomDropdownItem className="px-3 py-2 text-sm" onClick={insertPageBreak}>
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="size-4 text-amber-500" />
              <span>Page break</span>
            </div>
          </CustomDropdownItem>

          <CustomDropdownSeparator />

          {/* Code Block */}
          <CustomDropdownItem className="px-3 py-2 text-sm" onClick={insertCodeBlock}>
            <div className="flex items-center gap-3">
              <FileCode className="size-4 text-indigo-500" />
              <span>Code block</span>
            </div>
          </CustomDropdownItem>
        </CustomDropdownContent>
      </CustomDropdown>

      {/* Media Embed Modal */}
      <MediaEmbedModal
        isOpen={embedModal.isOpen}
        type={embedModal.type}
        onClose={() => setEmbedModal((prev) => ({ ...prev, isOpen: false }))}
        onEmbed={handleEmbedConfirm}
      />

      {/* Insert Image Modal */}
      <InsertImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onConfirm={handleImageConfirm}
      />
    </>
  );
};
