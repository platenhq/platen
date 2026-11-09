"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode } from "@lexical/rich-text";
import { $getRoot, type LexicalEditor } from "lexical";
import { saveDocumentPreview } from "@/lib/actions/room.actions";

// Save after typing pauses, but never more often than the minimum interval
const IDLE_DELAY_MS = 3_000;
const MIN_INTERVAL_MS = 30_000;
// Read a little more than the server keeps, so it can cut at a word boundary
const EXCERPT_READ_LENGTH = 300;

interface PreviewSnapshot {
  heading: string;
  excerpt: string;
}

function readSnapshot(editor: LexicalEditor): PreviewSnapshot {
  return editor.getEditorState().read(() => {
    let heading = "";
    let excerpt = "";
    for (const node of $getRoot().getChildren()) {
      const text = node.getTextContent().replace(/\s+/g, " ").trim();
      if (!text) continue;
      if ($isHeadingNode(node)) {
        if (!heading) heading = text;
        continue;
      }
      excerpt = excerpt ? `${excerpt} ${text}` : text;
      if (excerpt.length >= EXCERPT_READ_LENGTH) break;
    }
    return { heading, excerpt: excerpt.slice(0, EXCERPT_READ_LENGTH) };
  });
}

/**
 * Keeps the dashboard card preview in step with the document. Saves the first heading and the
 * opening text after local edits, throttled, and once more when the editor goes away. Mounted for
 * editors only; remote edits are left to the collaborator who made them.
 */
export default function DocumentPreviewPlugin({ roomId }: { roomId: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Opening a document without editing it saves nothing
    let lastSaved = JSON.stringify(readSnapshot(editor));
    let lastSentAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;

    const save = () => {
      clearTimeout(timer);
      pending = false;
      const snapshot = readSnapshot(editor);
      const serialized = JSON.stringify(snapshot);
      if (serialized === lastSaved) return;
      lastSaved = serialized;
      lastSentAt = Date.now();
      void saveDocumentPreview({ roomId, ...snapshot });
    };

    const schedule = () => {
      pending = true;
      clearTimeout(timer);
      const wait = Math.max(IDLE_DELAY_MS, lastSentAt + MIN_INTERVAL_MS - Date.now());
      timer = setTimeout(save, wait);
    };

    const unregister = editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, tags }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
      if (tags.has("collaboration")) return;
      schedule();
    });

    // Leaving the page or switching tabs saves straight away
    const flush = () => {
      if (pending) save();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      unregister();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      flush();
    };
  }, [editor, roomId]);

  return null;
}
