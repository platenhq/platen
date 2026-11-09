"use client";

import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode, HeadingNode } from "@lexical/rich-text";
import { $getRoot, type LexicalEditor } from "lexical";

export interface OutlineEntry {
  key: string;
  level: 1 | 2 | 3;
  text: string;
}

const OUTLINE_TAGS = { h1: 1, h2: 2, h3: 3 } as const;
// A heading counts as the current section once it is this close to the top of the viewport
const ACTIVE_OFFSET = 96;
// Space left above a heading after jumping to it
const SCROLL_MARGIN = 24;

function readOutline(editor: LexicalEditor): OutlineEntry[] {
  return editor.getEditorState().read(() =>
    $getRoot()
      .getChildren()
      .flatMap((node) => {
        if (!$isHeadingNode(node)) return [];
        const tag = node.getTag();
        const text = node.getTextContent().trim();
        if (!(tag in OUTLINE_TAGS) || !text) return [];
        return [
          { key: node.getKey(), level: OUTLINE_TAGS[tag as keyof typeof OUTLINE_TAGS], text },
        ];
      }),
  );
}

function sameOutline(a: OutlineEntry[], b: OutlineEntry[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (entry, i) =>
        entry.key === b[i].key && entry.level === b[i].level && entry.text === b[i].text,
    )
  );
}

/**
 * Top-level H1–H3 headings of the document, the heading whose section is in view, and a way to
 * scroll to a heading. Reads the editor state only; never moves the caret or edits the document.
 */
export function useDocumentOutline(viewport: HTMLElement | null) {
  const [editor] = useLexicalComposerContext();
  const [entries, setEntries] = useState<OutlineEntry[]>(() => readOutline(editor));
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Recompute only when a heading is created, edited or removed, including by collaborators
  useEffect(() => {
    const refresh = () => {
      const next = readOutline(editor);
      setEntries((prev) => (sameOutline(prev, next) ? prev : next));
    };
    refresh();
    return editor.registerMutationListener(HeadingNode, refresh);
  }, [editor]);

  // Track the section in view, at most once per frame while scrolling
  useEffect(() => {
    if (!viewport) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const limit = viewport.getBoundingClientRect().top + ACTIVE_OFFSET;
      let current: string | null = entries[0]?.key ?? null;
      for (const entry of entries) {
        const element = editor.getElementByKey(entry.key);
        if (!element) continue;
        if (element.getBoundingClientRect().top > limit) break;
        current = entry.key;
      }
      setActiveKey(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    viewport.addEventListener("scroll", schedule, { passive: true });
    return () => {
      viewport.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
    };
  }, [editor, viewport, entries]);

  const scrollToHeading = (key: string) => {
    const element = editor.getElementByKey(key);
    if (!element || !viewport) return;
    // Screen positions already include zoom, so this works in every view and zoom level
    const offset =
      element.getBoundingClientRect().top - viewport.getBoundingClientRect().top - SCROLL_MARGIN;
    viewport.scrollTo({ top: viewport.scrollTop + offset, behavior: "smooth" });
  };

  return { entries, activeKey, scrollToHeading };
}
