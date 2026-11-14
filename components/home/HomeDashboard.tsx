"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/shared/Header";
import Notifications from "@/components/liveblocks/Notifications";
import NotificationsErrorBoundary from "@/components/liveblocks/NotificationsErrorBoundary";
import ClerkSignedInUserButton from "@/components/shared/ClerkSignedInUserButton";
import { ToggleTheme } from "@/components/shared/ToggleTheme";
import NewDocumentSection from "@/components/home/NewDocumentSection";
import HomeDocumentGrid from "@/components/home/HomeDocumentGrid";
import { searchDocuments } from "@/lib/actions/room.actions";
import { excerptHasMatch } from "@/lib/search-excerpt";
import { Search, X } from "lucide-react";

// Search the document text once typing pauses; titles are filtered on every keystroke
const SEARCH_DELAY_MS = 250;

interface HomeDashboardProps {
  userId: string;
  email: string;
  documents: DashboardDocument[];
}

export const HomeDashboard = ({ userId, email, documents }: HomeDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  // Server results for one query: an excerpt per matching document, empty for title-only matches
  const [searchResults, setSearchResults] = useState<{
    query: string;
    excerpts: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await searchDocuments(query);
      if (cancelled || !results) return;
      setSearchResults({
        query,
        excerpts: Object.fromEntries(
          results.map(({ id, excerpt }) => [id, excerptHasMatch(excerpt) ? excerpt : ""]),
        ),
      });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Results for an earlier query are not shown while the current one is pending
  const searchExcerpts =
    searchResults?.query === searchQuery.trim() ? searchResults.excerpts : null;

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
        documents={documents}
        searchQuery={searchQuery}
        searchExcerpts={searchExcerpts}
        onClearSearch={() => setSearchQuery("")}
      />
    </main>
  );
};

export default HomeDashboard;
