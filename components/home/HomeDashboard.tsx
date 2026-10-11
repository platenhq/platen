"use client";

import React, { useState } from "react";
import Header from "@/components/shared/Header";
import Notifications from "@/components/liveblocks/Notifications";
import NotificationsErrorBoundary from "@/components/liveblocks/NotificationsErrorBoundary";
import ClerkSignedInUserButton from "@/components/shared/ClerkSignedInUserButton";
import { ToggleTheme } from "@/components/shared/ToggleTheme";
import NewDocumentSection from "@/components/home/NewDocumentSection";
import HomeDocumentGrid from "@/components/home/HomeDocumentGrid";
import { RoomData } from "@liveblocks/node";
import { Search, X } from "lucide-react";

interface HomeDashboardProps {
  userId: string;
  email: string;
  roomDocuments: RoomData[];
}

export const HomeDashboard = ({ userId, email, roomDocuments }: HomeDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <main className="bg-background text-foreground relative flex min-h-screen w-full flex-col transition-colors">
      {/* Top Application Header */}
      <Header>
        {/* Centered Search Bar */}
        <div className="mx-2 flex max-w-xl flex-1 items-center">
          <div className="relative w-full">
            <Search className="text-muted absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="border-border bg-surface-secondary/60 text-foreground placeholder:text-muted focus:border-primary focus:bg-surface focus:ring-primary/20 h-10 w-full rounded-full border pr-9 pl-10 text-sm transition-all focus:ring-2 focus:outline-none dark:bg-slate-900/80"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Navigation & Profile */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <NotificationsErrorBoundary>
            <Notifications />
          </NotificationsErrorBoundary>
          <ToggleTheme />
          <ClerkSignedInUserButton />
        </div>
      </Header>

      {/* "Start a new document" Section */}
      {!searchQuery && <NewDocumentSection userId={userId} email={email} />}

      {/* Recent Documents Grid / List */}
      <HomeDocumentGrid
        documents={roomDocuments}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery("")}
      />
    </main>
  );
};

export default HomeDashboard;
