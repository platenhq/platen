"use client";

import React from "react";
import { AnchoredThreads, FloatingThreads } from "@liveblocks/react-lexical";
import { useThreads } from "@liveblocks/react/suspense";

export const COMMENTS_COLUMN_WIDTH = 320;
export const COMMENTS_COLUMN_GAP = 24;

interface CommentThreadsProps {
  /** Show threads in a column beside the page; otherwise they pop up over the text. */
  anchored: boolean;
  /** Horizontal position of the column inside the scrolling content. */
  left: string;
}

/**
 * Comment threads for the document. Beside the page, each open thread sits level with the text
 * it refers to: positions are measured on screen, so they hold across page gaps and zoom. When
 * there is no room beside the page, threads fall back to popovers anchored to the text.
 * Must render inside LiveblocksPlugin.
 */
export default function CommentThreads({ anchored, left }: CommentThreadsProps) {
  const { threads } = useThreads();

  if (!anchored) {
    return (
      <FloatingThreads
        threads={threads}
        className="border-border bg-surface rounded-xl border shadow-2xl"
      />
    );
  }

  return (
    <AnchoredThreads
      threads={threads}
      // Outside the paged document, so print isolation leaves it out of printed pages
      className="comments-column"
      // Positioning goes in style: the component sets position: relative inline, which would
      // override a class and drop the column into the flow below the page
      style={{ position: "absolute", top: 0, left, width: COMMENTS_COLUMN_WIDTH }}
    />
  );
}
