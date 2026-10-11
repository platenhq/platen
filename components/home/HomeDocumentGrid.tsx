"use client";

import React, { useState, useEffect, useMemo } from "react";
import { RoomData } from "@liveblocks/node";
import DocumentCard from "@/components/home/DocumentCard";
import SortDropdown, { SortOption } from "@/components/home/SortDropdown";
import { LayoutGrid, List, FileText, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HomeDocumentGridProps {
  documents: RoomData[];
  searchQuery: string;
  onClearSearch?: () => void;
}

export const HomeDocumentGrid = ({
  documents,
  searchQuery,
  onClearSearch,
}: HomeDocumentGridProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");

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

  // Filter and sort documents
  const filteredAndSortedDocs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const getDocTitle = (doc: RoomData) => {
      const rawTitle = doc.metadata?.title;
      if (Array.isArray(rawTitle)) return rawTitle[0] || "";
      return typeof rawTitle === "string" ? rawTitle : "";
    };

    const filtered = query
      ? documents.filter((doc) => {
          const title = getDocTitle(doc).toLowerCase();
          return title.includes(query);
        })
      : documents;

    return [...filtered].sort((a, b) => {
      if (sortBy === "created_desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "created_asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "title_asc") {
        return getDocTitle(a).localeCompare(getDocTitle(b));
      }
      if (sortBy === "title_desc") {
        return getDocTitle(b).localeCompare(getDocTitle(a));
      }
      return 0;
    });
  }, [documents, searchQuery, sortBy]);

  return (
    <section className="bg-surface w-full flex-1 py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header Controls */}
        <div className="border-border/70 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <h2 className="text-foreground font-semibold">
            {searchQuery ? `Search results (${filteredAndSortedDocs.length})` : "Recent documents"}
          </h2>

          <div className="flex items-center gap-2">
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
        {searchQuery && filteredAndSortedDocs.length === 0 && (
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

        {/* Documents Render */}
        {filteredAndSortedDocs.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "mt-4 flex flex-col gap-2.5"
            }
          >
            {filteredAndSortedDocs.map(({ id, metadata, createdAt }) => (
              <DocumentCard
                key={id}
                id={id}
                title={metadata?.title}
                createdAt={createdAt}
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
