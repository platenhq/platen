"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isElementNode,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  DROP_COMMAND,
  PASTE_COMMAND,
} from "lexical";
import {
  $createImageNode,
  INSERT_IMAGE_COMMAND,
  InsertImagePayload,
} from "@/components/editor/nodes/ImageNode";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export function ImagesPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          editor.update(() => {
            const selection = $getSelection();
            if (!selection) {
              const root = $getRoot();
              const lastChild = root.getLastChild();
              if (lastChild && $isElementNode(lastChild)) {
                lastChild.selectEnd();
              } else {
                const p = $createParagraphNode();
                root.append(p);
                p.select();
              }
            }

            const imageNode = $createImageNode(payload);
            $insertNodes([imageNode]);

            if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
              $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
            }
          });
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      // Direct Paste Handler for Image Files
      editor.registerCommand(
        PASTE_COMMAND,
        (event: ClipboardEvent) => {
          const files = event.clipboardData?.files;
          if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                event.preventDefault();
                const reader = new FileReader();
                reader.onload = (e) => {
                  const src = e.target?.result as string;
                  if (src) {
                    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                      src,
                      altText: file.name.replace(/\.[^/.]+$/, "") || "Pasted image",
                      maxWidth: 800,
                      alignment: "center",
                    });
                  }
                };
                reader.readAsDataURL(file);
                return true;
              }
            }
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),

      // Drag and Drop Handler for Image Files onto Canvas
      editor.registerCommand(
        DROP_COMMAND,
        (event: DragEvent) => {
          const files = event.dataTransfer?.files;
          if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                event.preventDefault();
                const reader = new FileReader();
                reader.onload = (e) => {
                  const src = e.target?.result as string;
                  if (src) {
                    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                      src,
                      altText: file.name.replace(/\.[^/.]+$/, "") || "Dropped image",
                      maxWidth: 800,
                      alignment: "center",
                    });
                  }
                };
                reader.readAsDataURL(file);
                return true;
              }
            }
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return null;
}

export default ImagesPlugin;
