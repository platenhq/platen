"use client";

import { useEffect, useState } from "react";
import { useStatus, useSyncStatus } from "@liveblocks/react";
import { CircleCheckBig, CloudOff, LoaderCircle } from "lucide-react";

/**
 * Save state beside the document title. Edits are saved by Liveblocks, so its sync status is the
 * source: "Saving…" until every local change is confirmed, then "Saved". Nothing shows until the
 * first change of the session, so opening a document stays uncluttered.
 */
export default function SaveStatus({ savingTitle }: { savingTitle: boolean }) {
  // Smoothed, so fast typing does not flicker between states
  const syncStatus = useSyncStatus({ smooth: true });
  const connection = useStatus();
  const [hasChanges, setHasChanges] = useState(false);
  // The initial load can also report "synchronizing"; only count changes after the first sync
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (syncStatus === "synchronized") {
      setSettled(true);
    } else if (settled) {
      setHasChanges(true);
    }
  }, [syncStatus, settled]);

  useEffect(() => {
    if (savingTitle) setHasChanges(true);
  }, [savingTitle]);

  const saving = savingTitle || (settled && syncStatus === "synchronizing");
  if (!hasChanges && !saving) return null;

  if (saving && connection !== "connected") {
    return (
      <span
        role="status"
        title="Your changes will save when the connection is back"
        className="flex shrink-0 items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
      >
        <CloudOff className="size-3.5" />
        <span className="hidden sm:inline">Waiting to save</span>
      </span>
    );
  }

  if (saving) {
    return (
      <span role="status" className="text-muted flex shrink-0 items-center gap-1 text-xs">
        <LoaderCircle className="size-3.5 animate-spin" />
        <span className="hidden sm:inline">Saving…</span>
      </span>
    );
  }

  return (
    <span
      role="status"
      title="All changes saved"
      className="text-muted flex shrink-0 items-center gap-1 text-xs"
    >
      <span className="hidden sm:inline">Saved</span>
      <CircleCheckBig className="size-3.5 text-emerald-600 dark:text-emerald-400" />
    </span>
  );
}
