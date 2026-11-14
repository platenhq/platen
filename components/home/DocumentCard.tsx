"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn, dateConverter } from "@/lib/utils";
import { splitExcerpt } from "@/lib/search-excerpt";
import DeleteModal from "@/components/modal/DeleteModal";
import DocumentThumbnail from "@/components/home/DocumentThumbnail";
import { FileText, Users } from "lucide-react";

/** Columns of a list-view row and its header: name, owner, last modified, actions. */
export const LIST_COLUMNS =
  "grid-cols-[minmax(0,1fr)_2rem] sm:grid-cols-[minmax(0,1fr)_8rem_8rem_2rem]";

interface DocumentCardProps {
  document: DashboardDocument;
  /** A passage around a search match in the document's text, with the match marked. */
  searchExcerpt?: string;
  viewMode: "grid" | "list";
}

/** A search excerpt with the matched words highlighted, rendered as text. */
const SearchExcerpt = ({ excerpt, className }: { excerpt: string; className?: string }) => (
  <p className={className}>
    {splitExcerpt(excerpt).map((part, index) =>
      part.match ? (
        <mark key={index} className="bg-primary/15 text-foreground rounded-sm">
          {part.text}
        </mark>
      ) : (
        <React.Fragment key={index}>{part.text}</React.Fragment>
      ),
    )}
  </p>
);

export const DocumentCard = ({ document, searchExcerpt, viewMode }: DocumentCardProps) => {
  const { id, title, previewHeading, preview, isOwner, isShared, modifiedAt } = document;
  const displayTitle = title || "Untitled Document";
  const formattedDate = dateConverter(new Date(modifiedAt).toISOString());

  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "group border-border/60 hover:bg-surface-hover grid items-center gap-x-4 border-b px-3 py-2 transition-colors",
          LIST_COLUMNS,
        )}
      >
        <Link
          href={`/documents/${id}`}
          className="flex min-w-0 items-center gap-3 sm:col-span-3 sm:grid sm:grid-cols-subgrid"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary/10 text-primary group-hover:bg-primary/15 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors">
              <FileText className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-foreground group-hover:text-primary truncate text-sm font-medium transition-colors">
                  {displayTitle}
                </p>
                {isShared && <Users className="text-muted size-3.5 shrink-0" aria-label="Shared" />}
              </div>
              {searchExcerpt && (
                <SearchExcerpt excerpt={searchExcerpt} className="text-muted truncate text-xs" />
              )}
              <p className="text-muted text-xs sm:hidden">{formattedDate}</p>
            </div>
          </div>

          <p className="text-muted hidden truncate text-xs sm:block">
            {isOwner ? "me" : "Shared with me"}
          </p>
          <p className="text-muted hidden truncate text-xs sm:block">{formattedDate}</p>
        </Link>

        <div className="flex justify-end">{isOwner && <DeleteModal roomId={id} />}</div>
      </div>
    );
  }

  // Grid Mode (Visual thumbnail card)
  return (
    <div className="group border-border bg-surface hover:border-border-hover relative flex flex-col overflow-hidden rounded-xl border shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/documents/${id}`} className="flex flex-1 flex-col">
        {/* First page of the document, its lower part cropped by the card */}
        <div className="border-border/60 bg-surface-canvas group-hover:bg-surface-canvas-hover border-b px-4 pt-4 transition-colors">
          <div className="border-border/80 aspect-[1/1.1] overflow-hidden rounded-t-sm border border-b-0 shadow-xs">
            <DocumentThumbnail
              html={document.thumbnailHtml}
              pageSize={document.pageSize}
              margins={document.pageMargins}
            >
              {/* Until an editor saves the document again, show its first heading and text */}
              {previewHeading && <h1 className="editor-heading-h1">{previewHeading}</h1>}
              {preview && <p className="editor-paragraph">{preview}</p>}
            </DocumentThumbnail>
          </div>
        </div>

        {/* Card Footer Info */}
        <div className="flex flex-col p-3.5">
          <p className="text-foreground group-hover:text-primary truncate text-sm font-medium transition-colors">
            {displayTitle}
          </p>
          {searchExcerpt && (
            <SearchExcerpt
              excerpt={searchExcerpt}
              className="text-muted mt-1 line-clamp-2 text-xs leading-snug"
            />
          )}
          <div className="text-muted mt-1.5 flex items-center gap-1.5 text-xs">
            <Image
              src="/assets/icons/doc.svg"
              alt="Doc"
              width={14}
              height={14}
              className="shrink-0 opacity-80"
            />
            <span className="truncate">Modified {formattedDate}</span>
          </div>
        </div>
      </Link>

      {isOwner && (
        <div className="absolute top-2 right-2 opacity-80 transition-opacity group-hover:opacity-100">
          <DeleteModal roomId={id} />
        </div>
      )}
    </div>
  );
};

export default DocumentCard;
