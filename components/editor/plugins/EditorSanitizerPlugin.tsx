"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getNodeByKey,
  $createParagraphNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  $getSelection,
  $isRangeSelection,
  ElementNode,
} from "lexical";
import { ListNode, $isListNode } from "@lexical/list";
import { $getNearestNodeOfType } from "@lexical/utils";

/**
 * Suppress benign upstream Yjs warnPrematureAccess warning emitted during Fast Refresh
 * and collaborative tree reconciliation when @lexical/yjs creates unattached CollabNodes.
 */
if (
  typeof window !== "undefined" &&
  !(window as unknown as { __yjs_warn_filter_installed?: boolean }).__yjs_warn_filter_installed
) {
  (window as unknown as { __yjs_warn_filter_installed?: boolean }).__yjs_warn_filter_installed =
    true;
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Invalid access: Add Yjs type to a document before reading data")
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

/**
 * EditorSanitizerPlugin guarantees Lexical structural integrity & DOM syncing:
 * 1. Shift+Enter line break guard: Ensures line breaks always occur inside a valid block ancestor.
 * 2. ListNode DOM Sync: Synchronously mirrors listNode style to its individual <ul> DOM element
 *    so strikethrough checklist formatting scopes strictly to that specific list without mutating AST.
 * 3. Never mutates AST on mount or via root transforms, ensuring Liveblocks Yjs CRDT never duplicates.
 * 4. Silences benign upstream Yjs CollabNode construction warnings during HMR/Fast Refresh.
 */
export default function EditorSanitizerPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // 1. Guard Shift+Enter so selection always has a valid block ancestor
    const unregisterEnterCommand = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        if (event && event.shiftKey) {
          let handled = false;
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const anchor = selection.anchor.getNode();
              const block = $getNearestNodeOfType(anchor, ElementNode);
              if (!block || block.getKey() === "root") {
                const paragraph = $createParagraphNode();
                const root = $getRoot();
                root.append(paragraph);
                paragraph.select();
                handled = true;
              }
            }
          });
          if (handled) return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );

    // 2. Synchronous mutation listener on ListNode to scope strikethrough strictly to that specific list
    const unregisterListMutation = editor.registerMutationListener(ListNode, (mutations) => {
      editor.getEditorState().read(() => {
        for (const [key, mutation] of mutations) {
          if (mutation === "created" || mutation === "updated") {
            const node = $getNodeByKey(key);
            if ($isListNode(node)) {
              const dom = editor.getElementByKey(key);
              if (dom) {
                const isStrike = node.getStyle().includes("checklist-strikethrough");
                dom.classList.toggle("editor-checklist-strikethrough", isStrike);
              }
            }
          }
        }
      });
    });

    return () => {
      unregisterEnterCommand();
      unregisterListMutation();
    };
  }, [editor]);

  return null;
}
