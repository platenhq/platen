"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertTableRowAtSelection, $isTableNode, TableNode } from "@lexical/table";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_TAB_COMMAND,
} from "lexical";
import { useEffect } from "react";

/**
 * TableEscapePlugin enables seamless navigation into and out of tables:
 * 1. Automatically ensures surrounding paragraphs exist around tables so users can click/tab outside.
 * 2. Pressing Arrow Down on the last row/cell escapes out to the paragraph after the table.
 * 3. Pressing Arrow Up on the first row/cell escapes out to a paragraph before the table.
 * 4. Pressing Tab on the bottom-right cell automatically creates a new row below (Google Docs behavior).
 */
export function TableEscapePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // 1. Arrow Down escaping: If in last row/cell, move to paragraph after table
    const unregisterArrowDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      () => {
        let handled = false;
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return;
          }

          const anchorNode = selection.anchor.getNode();
          const topLevelBlock = anchorNode.getTopLevelElement();
          if ($isTableNode(topLevelBlock)) {
            let nextSibling = topLevelBlock.getNextSibling();
            if (!nextSibling) {
              const paragraph = $createParagraphNode();
              topLevelBlock.insertAfter(paragraph);
              nextSibling = paragraph;
            }

            const lastRow = topLevelBlock.getLastChild();
            const lastCell = $isElementNode(lastRow) ? lastRow.getLastChild() : null;
            if (
              lastCell &&
              $isElementNode(lastCell) &&
              (anchorNode === lastCell || lastCell.isParentOf(anchorNode))
            ) {
              if ($isElementNode(nextSibling)) {
                nextSibling.selectStart();
                handled = true;
              }
            }
          }
        });
        return handled;
      },
      COMMAND_PRIORITY_LOW,
    );

    // 2. Arrow Up escaping: If in first row/cell, move to paragraph before table
    const unregisterArrowUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      () => {
        let handled = false;
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return;
          }

          const anchorNode = selection.anchor.getNode();
          const topLevelBlock = anchorNode.getTopLevelElement();
          if ($isTableNode(topLevelBlock)) {
            let prevSibling = topLevelBlock.getPreviousSibling();
            if (!prevSibling) {
              const paragraph = $createParagraphNode();
              topLevelBlock.insertBefore(paragraph);
              prevSibling = paragraph;
            }

            const firstRow = topLevelBlock.getFirstChild();
            const firstCell = $isElementNode(firstRow) ? firstRow.getFirstChild() : null;
            if (
              firstCell &&
              $isElementNode(firstCell) &&
              (anchorNode === firstCell || firstCell.isParentOf(anchorNode))
            ) {
              if ($isElementNode(prevSibling)) {
                prevSibling.selectEnd();
                handled = true;
              }
            }
          }
        });
        return handled;
      },
      COMMAND_PRIORITY_LOW,
    );

    // 3. Tab on last cell: Automatically insert a new row below
    const unregisterTab = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        if (event.shiftKey) return false;

        let handled = false;
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          const anchorNode = selection.anchor.getNode();
          const topLevelBlock = anchorNode.getTopLevelElement();
          if ($isTableNode(topLevelBlock)) {
            const lastRow = topLevelBlock.getLastChild();
            const lastCell = $isElementNode(lastRow) ? lastRow.getLastChild() : null;
            if (
              lastCell &&
              $isElementNode(lastCell) &&
              (anchorNode === lastCell || lastCell.isParentOf(anchorNode))
            ) {
              event.preventDefault();
              $insertTableRowAtSelection(true);
              handled = true;
            }
          }
        });
        return handled;
      },
      COMMAND_PRIORITY_LOW,
    );

    // 4. Node Transform: Ensure any TableNode has accessible surrounding paragraphs
    const unregisterTransform = editor.registerNodeTransform(TableNode, (tableNode) => {
      const root = $getRoot();
      if (tableNode.getPreviousSibling() === null && root.getFirstChild() === tableNode) {
        const leadingParagraph = $createParagraphNode();
        tableNode.insertBefore(leadingParagraph);
      }
      if (tableNode.getNextSibling() === null) {
        const trailingParagraph = $createParagraphNode();
        tableNode.insertAfter(trailingParagraph);
      }
    });

    return () => {
      unregisterArrowDown();
      unregisterArrowUp();
      unregisterTab();
      unregisterTransform();
    };
  }, [editor]);

  return null;
}

export default TableEscapePlugin;
