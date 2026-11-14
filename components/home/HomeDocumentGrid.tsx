"use client";

import React, { useState, useEffect, useMemo } from "react";
import DocumentCard, { LIST_COLUMNS } from "@/components/home/DocumentCard";
import SortDropdown, { SortOption } from "@/components/home/SortDropdown";
import { LayoutGrid, List, FileText, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DocumentTab = "all" | "owned" | "shared";

const TABS: { value: DocumentTab; label: string; empty: string }[] = [
  { value: "all", label: "All", empty: "" },
  { value: "owned", label: "Owned by me", empty: "You have not created any documents yet." },
  {
    value: "shared",
    label: "Shared with me",
    empty: "No documents have been shared with you yet.",
  },
];

const inTab = (doc: DashboardDocument, tab: DocumentTab) =>
  tab === "all" || (tab === "owned") === doc.isOwner;

interface HomeDocumentGridProps {
  documents: DashboardDocument[];
  searchQuery: string;
  /**
   * Passages around matches in document text, by document id, for the current query. Null while
   * the server search is pending or unavailable; titles are filtered here in the meantime.
   */
  searchExcerpts: Record<string, string> | null;
  onClearSearch?: () => void;
}

export const HomeDocumentGrid = ({
  documents,
  searchQuery,
  searchExcerpts,
  onClearSearch,
}: HomeDocumentGridProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("modified_desc");
  const [tab, setTab] = useState<DocumentTab>("all");

  // Load view mode preference from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("docs-editor-view-mode");
      if (savedMode === "grid" || savedMode === "list") {
        setViewMode(savedMode);
      }
    } catch {
      // Ignore localStorage errors in private mode
    }
  }, []);

  const handleToggleView = (mode: "grid" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("docs-editor-view-mode", mode);
    } catch {
      // Ignore
    }
  };

  // Documents matching the search, before the tab is applied, so each tab can show its count
  const searchedDocs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter(
      (doc) => doc.title.toLowerCase().includes(query) || searchExcerpts?.[doc.id] !== undefined,
    );
  }, [documents, searchQuery, searchExcerpts]);

  const visibleDocs = useMemo(() => {
    const time = (date: string) => new Date(date).getTime();
    return searchedDocs
      .filter((doc) => inTab(doc, tab))
      .sort((a, b) => {
        switch (sortBy) {
          case "modified_desc":
            return time(b.modifiedAt) - time(a.modifiedAt);
          case "created_desc":
            return time(b.createdAt) - time(a.createdAt);
          case "created_asc":
            return time(a.createdAt) - time(b.createdAt);
          case "title_asc":
            return a.title.localeCompare(b.title);
          case "title_desc":
            return b.title.localeCompare(a.title);
        }
      });
  }, [searchedDocs, tab, sortBy]);

  const activeTab = TABS.find(({ value }) => value === tab)!;

  return (
    <section className="bg-surface w-full flex-1 py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header Controls */}
        <div className="border-border/70 flex flex-wrap items-center justify-between gap-3 border-b">
          <div role="tablist" aria-label="Documents" className="-mb-px flex items-center gap-1">
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-2.5 pt-1 pb-3 text-sm font-medium transition-colors",
                  tab === value
                    ? "border-primary text-foreground"
                    : "text-muted hover:text-foreground border-transparent",
                )}
              >
                {label}
                <span className="text-muted text-xs font-normal">
                  {searchedDocs.filter((doc) => inTab(doc, value)).length}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pb-3">
            <SortDropdown value={sortBy} onChange={setSortBy} />

            {/* View Mode Toggle Pill */}
            <div className="border-border bg-surface flex items-center rounded-lg border p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleView("grid")}
                className={`h-7 w-8 rounded-md p-0 ${
                  viewMode === "grid"
                    ? "bg-surface-secondary text-primary dark:bg-slate-800"
                    : "text-muted hover:text-foreground"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleView("list")}
                className={`h-7 w-8 rounded-md p-0 ${
                  viewMode === "list"
                    ? "bg-surface-secondary text-primary dark:bg-slate-800"
                    : "text-muted hover:text-foreground"
                }`}
                title="List view"
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Empty Search Results */}
        {searchQuery && visibleDocs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-surface-secondary text-muted flex size-12 items-center justify-center rounded-full">
              <SearchX className="size-6" />
            </div>
            <h3 className="text-foreground mt-4 text-sm font-medium">No documents found</h3>
            <p className="text-muted mt-1 text-xs">
              No documents matched &quot;{searchQuery}&quot;
            </p>
            {onClearSearch && (
              <Button variant="outline" size="sm" onClick={onClearSearch} className="mt-4 text-xs">
                Clear search
              </Button>
            )}
          </div>
        )}

        {/* Empty Documents State */}
        {!searchQuery && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
              <FileText className="size-7" />
            </div>
            <h3 className="text-foreground mt-4 text-base font-medium">No documents yet</h3>
            <p className="text-muted mt-1 max-w-sm text-xs">
              Select &quot;Blank document&quot; in the section above to create your first
              collaborative document.
            </p>
          </div>
        )}

        {/* Empty Tab */}
        {!searchQuery && documents.length > 0 && visibleDocs.length === 0 && (
          <p className="text-muted py-16 text-center text-sm">{activeTab.empty}</p>
        )}

        {/* Documents Render */}
        {visibleDocs.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]"
                : "mt-2 flex flex-col"
            }
          >
            {viewMode === "list" && (
              <div
                className={cn(
                  "border-border/60 text-muted hidden gap-x-4 border-b px-3 py-2 text-xs font-medium sm:grid",
                  LIST_COLUMNS,
                )}
              >
                <span>Name</span>
                <span>Owner</span>
                <span>Last modified</span>
              </div>
            )}
            {visibleDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                searchExcerpt={searchQuery ? searchExcerpts?.[doc.id] : undefined}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeDocumentGrid;
