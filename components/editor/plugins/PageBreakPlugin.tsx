"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { COMMAND_PRIORITY_EDITOR } from "lexical";
import { useEffect } from "react";
import { $createPageBreakNode, INSERT_PAGE_BREAK_COMMAND } from "../nodes/PageBreakNode";

export function PageBreakPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_PAGE_BREAK_COMMAND,
      () => {
        editor.update(() => {
          const pageBreakNode = $createPageBreakNode();
          $insertNodeToNearestRoot(pageBreakNode);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
