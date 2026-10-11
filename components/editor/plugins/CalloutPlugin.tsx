"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
} from "lexical";
import { $insertNodeToNearestRoot, mergeRegister } from "@lexical/utils";
import {
  $createCalloutNode,
  $isCalloutNode,
  CalloutNode,
  INSERT_CALLOUT_COMMAND,
} from "../nodes/CalloutNode";

export default function CalloutPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([CalloutNode])) {
      throw new Error("CalloutPlugin: CalloutNode not registered on editor");
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_CALLOUT_COMMAND,
        (payload) => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const callout = $createCalloutNode(payload?.type || "info");
              const paragraph = $createParagraphNode();
              callout.append(paragraph);
              $insertNodeToNearestRoot(callout);
              paragraph.select();
            }
          });
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Natural Escape on Enter: Pressing Enter on empty last paragraph escapes callout
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const node = selection.anchor.getNode();
          const paragraph = $isParagraphNode(node) ? node : node.getParent();

          if (!$isParagraphNode(paragraph)) {
            return false;
          }

          const parent = paragraph.getParent();
          if (!$isCalloutNode(parent)) {
            return false;
          }

          // If current paragraph in callout is empty and is the last child
          if (paragraph.getTextContentSize() === 0 && paragraph.getNextSibling() === null) {
            // Only escape if there's at least one other block before it in the callout
            if (parent.getChildrenSize() > 1) {
              if (event) event.preventDefault();
              paragraph.remove();
              const newParagraph = $createParagraphNode();
              parent.insertAfter(newParagraph);
              newParagraph.select();
              return true;
            }
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
}
