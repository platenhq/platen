"use client";

import { RoomProvider, useStatus } from "@liveblocks/react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { Editor } from "@/components/editor/Editor";
import Header from "@/components/shared/Header";
import { Show, SignInButton } from "@clerk/nextjs";
import ActiveCollaborators from "@/components/collaborators/ActiveCollaborators";
import Loader from "@/components/shared/Loader";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { SquarePen, ChevronRight, Eye } from "lucide-react";
import { updateDocument } from "@/lib/actions/room.actions";
import ShareModal from "@/components/modal/ShareModal";
import ClerkSignedInUserButton from "@/components/shared/ClerkSignedInUserButton";
import Notifications from "@/components/liveblocks/Notifications";
import NotificationsErrorBoundary from "@/components/liveblocks/NotificationsErrorBoundary";
import { ToggleTheme } from "@/components/shared/ToggleTheme";

function ConnectionStatusBadge() {
  const status = useStatus();

  if (status === "connected") {
    return (
      <span
        title="Connected to collaboration server"
        className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
      >
        <span className="size-1.5 rounded-full bg-emerald-500" />
        <span className="hidden md:inline">Connected</span>
      </span>
    );
  }

  if (status === "reconnecting" || status === "connecting") {
    return (
      <span
        title="Connecting to collaboration server..."
        className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
      >
        <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
        <span className="hidden md:inline">Connecting</span>
      </span>
    );
  }

  if (status === "disconnected") {
    return (
      <span
        title="Disconnected from collaboration server"
        className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400"
      >
        <span className="size-1.5 rounded-full bg-rose-500" />
        <span className="hidden md:inline">Offline</span>
      </span>
    );
  }

  return null;
}

const CollaborativeRoom = ({
  roomId,
  roomMetadata,
  users,
  currentUserType,
}: CollaborativeRoomProps) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentTitle, setDocumentTitle] = useState(roomMetadata.title);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateTitleHandler = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setLoading(true);

      try {
        if (documentTitle !== roomMetadata.title) {
          const updatedDocument = await updateDocument(roomId, documentTitle);

          if (updatedDocument) {
            setEditing(false);
          }
        } else {
          setEditing(false);
        }
      } catch (error) {
        console.error(`Error updating document title: ${error}`);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = async (e: MouseEvent) => {
      if (editing && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setLoading(true);
        try {
          if (documentTitle !== roomMetadata.title) {
            await updateDocument(roomId, documentTitle);
          }
        } catch (error) {
          console.error(`Error updating document title: ${error}`);
        } finally {
          setLoading(false);
          setEditing(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [roomId, documentTitle, editing, roomMetadata.title]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    document.title = `Docs Editor | ${documentTitle}`;
  }, [documentTitle]);

  return (
    <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
      <ClientSideSuspense fallback={<Loader />}>
        <div className="flex size-full flex-1 flex-col items-center overflow-hidden">
          <Header>
            {/* Left Zone: Breadcrumb & Editable Document Title */}
            <div ref={containerRef} className="flex flex-1 items-center gap-2 overflow-hidden">
              <ChevronRight className="text-muted hidden size-4 shrink-0 sm:block" />

              <div className="flex max-w-sm min-w-0 items-center gap-1.5 sm:max-w-md">
                {editing && !loading ? (
                  <Input
                    type="text"
                    value={documentTitle}
                    ref={inputRef}
                    placeholder="Enter document title"
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    onKeyDown={updateTitleHandler}
                    disabled={!editing}
                    className="border-border bg-surface-secondary/80 text-foreground focus-visible:ring-primary/40 h-8 w-full max-w-xs rounded-md px-2.5 text-sm font-semibold shadow-xs focus-visible:ring-1"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => currentUserType === "editor" && setEditing(true)}
                    disabled={currentUserType !== "editor"}
                    className="group hover:bg-surface-secondary flex items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors focus:outline-none"
                    title={currentUserType === "editor" ? "Click to rename" : undefined}
                  >
                    <span className="text-foreground truncate text-sm font-semibold">
                      {documentTitle}
                    </span>
                    {currentUserType === "editor" && (
                      <SquarePen className="text-muted group-hover:text-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </button>
                )}

                {currentUserType !== "editor" && (
                  <span className="border-border bg-surface-secondary text-muted flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                    <Eye className="size-3" />
                    View only
                  </span>
                )}

                {loading && (
                  <span className="text-muted shrink-0 animate-pulse text-xs">Saving...</span>
                )}
              </div>
            </div>

            {/* Right Zone: Status, Collaborators, Share, Notifications, Theme, Profile */}
            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              <ConnectionStatusBadge />
              <ActiveCollaborators />
              <ShareModal
                roomId={roomId}
                collaborators={users}
                creatorId={roomMetadata.creatorId}
                currentUserType={currentUserType}
              />
              <NotificationsErrorBoundary>
                <Notifications />
              </NotificationsErrorBoundary>
              <ToggleTheme isEditor />
              <Show when="signed-out">
                <SignInButton />
              </Show>
              <ClerkSignedInUserButton />
            </div>
          </Header>
          <Editor roomId={roomId} currentUserType={currentUserType} />
        </div>
      </ClientSideSuspense>
    </RoomProvider>
  );
};

export default CollaborativeRoom;
