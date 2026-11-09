"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $isHeadingNode } from "@lexical/rich-text";
import { $getRoot, type LexicalEditor } from "lexical";
import { saveDocumentSnapshot } from "@/lib/actions/room.actions";

// Save after typing pauses, but never more often than the minimum interval
const IDLE_DELAY_MS = 3_000;
const MIN_INTERVAL_MS = 30_000;
// Read a little more than the server keeps, so it can cut at a word boundary
const EXCERPT_READ_LENGTH = 300;
// Stay under the server action body limit (next.config.ts). Pasted images are stored inline in
// the document, so a few large ones can exceed it; the preview is still saved in that case.
const MAX_CONTENT_BYTES = 4 * 1024 * 1024;

interface Snapshot {
  heading: string;
  excerpt: string;
  json: string;
  text: string;
  html: string;
}

function readSnapshot(editor: LexicalEditor): Snapshot {
  return editor.read(() => {
    let heading = "";
    let excerpt = "";
    for (const node of $getRoot().getChildren()) {
      const text = node.getTextContent().replace(/\s+/g, " ").trim();
      if (!text) continue;
      if ($isHeadingNode(node)) {
        if (!heading) heading = text;
        continue;
      }
      if (excerpt.length < EXCERPT_READ_LENGTH) excerpt = excerpt ? `${excerpt} ${text}` : text;
    }
    return {
      heading,
      excerpt: excerpt.slice(0, EXCERPT_READ_LENGTH),
      json: JSON.stringify(editor.getEditorState().toJSON()),
      text: $getRoot().getTextContent(),
      html: $generateHtmlFromNodes(editor, null),
    };
  });
}

/**
 * Saves a snapshot of the document while an editor works in it: the dashboard preview and the
 * full content for the database. Saves after local edits, throttled, and once more when the
 * editor goes away. Mounted for editors only; remote edits are left to the collaborator who made
 * them.
 */
export default function DocumentSnapshotPlugin({ roomId }: { roomId: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Opening a document without editing it saves nothing
    let lastSavedJson = readSnapshot(editor).json;
    let lastSentAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;

    const save = () => {
      clearTimeout(timer);
      pending = false;
      const { heading, excerpt, json, text, html } = readSnapshot(editor);
      if (json === lastSavedJson) return;
      lastSavedJson = json;
      lastSentAt = Date.now();

      const size = new Blob([json, html]).size;
      void saveDocumentSnapshot({
        roomId,
        heading,
        excerpt,
        content: size <= MAX_CONTENT_BYTES ? { json, text, html } : null,
      });
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
