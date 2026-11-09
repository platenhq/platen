"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { dateConverter } from "@/lib/utils";
import DeleteModal from "@/components/modal/DeleteModal";
import { FileText } from "lucide-react";

type MetadataValue = string | string[] | undefined;

interface DocumentCardProps {
  id: string;
  title?: MetadataValue;
  /** First heading and opening text, saved while editors work in the document. */
  previewHeading?: MetadataValue;
  preview?: MetadataValue;
  /** Only the owner may delete a document. */
  isOwner: boolean;
  createdAt: string | Date;
  viewMode: "grid" | "list";
}

const firstValue = (value: MetadataValue) => (Array.isArray(value) ? value[0] : value) ?? "";

export const DocumentCard = ({
  id,
  title,
  previewHeading,
  preview,
  isOwner,
  createdAt,
  viewMode,
}: DocumentCardProps) => {
  const displayTitle = firstValue(title) || "Untitled Document";
  const heading = firstValue(previewHeading);
  const excerpt = firstValue(preview);
  // Undefined until an editor works in the document after previews shipped
  const hasPreview = previewHeading !== undefined || preview !== undefined;
  const dateObj = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const formattedDate = dateConverter(dateObj.toISOString());

  if (viewMode === "list") {
    return (
      <div className="group border-border bg-surface hover:border-border-hover hover:bg-surface-hover relative flex items-center justify-between gap-4 rounded-xl border px-4 py-3 shadow-xs transition-all hover:shadow-sm">
        <Link href={`/documents/${id}`} className="flex min-w-0 flex-1 items-center gap-3.5">
          <div className="bg-primary/10 text-primary group-hover:bg-primary/15 flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors">
            <FileText className="size-5" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="text-foreground group-hover:text-primary truncate text-sm font-medium transition-colors">
              {displayTitle}
            </p>
            {excerpt && <p className="text-muted truncate text-xs">{excerpt}</p>}
            <p className="text-muted text-xs">Created about {formattedDate}</p>
          </div>
        </Link>

        {isOwner && (
          <div className="shrink-0">
            <DeleteModal roomId={id} />
          </div>
        )}
      </div>
    );
  }

  // Grid Mode (Visual thumbnail card)
  return (
    <div className="group border-border bg-surface hover:border-border-hover relative flex flex-col overflow-hidden rounded-xl border shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/documents/${id}`} className="flex flex-1 flex-col">
        {/* Top Document Preview Thumbnail */}
        <div className="border-border/60 bg-surface-canvas group-hover:bg-surface-canvas-hover relative flex h-36 w-full items-center justify-center border-b p-4 transition-colors">
          {/* Simulated mini page canvas */}
          {hasPreview ? (
            /* Mini page with the document's first heading and opening text */
            <div className="border-border/80 bg-surface relative flex h-full w-24 flex-col gap-1 overflow-hidden rounded-sm border p-2 shadow-xs transition-transform group-hover:scale-105">
              {heading || excerpt ? (
                <>
                  {heading && (
                    <p className="text-foreground line-clamp-2 text-[6px] leading-tight font-semibold">
                      {heading}
                    </p>
                  )}
                  {excerpt && (
                    <p className="text-muted line-clamp-9 text-[5px] leading-snug">{excerpt}</p>
                  )}
                </>
              ) : (
                <p className="text-muted m-auto text-[6px]">Empty document</p>
              )}
            </div>
          ) : (
            /* Placeholder until an editor works in the document */
            <div className="border-border/80 bg-surface relative flex h-full w-24 flex-col gap-1.5 rounded-sm border p-2 shadow-xs transition-transform group-hover:scale-105">
              <div className="bg-primary/30 h-1.5 w-12 rounded-full" />
              <div className="bg-muted/20 h-1 w-full rounded-full" />
              <div className="bg-muted/20 h-1 w-full rounded-full" />
              <div className="bg-muted/20 h-1 w-4/5 rounded-full" />
              <div className="bg-muted/15 mt-1 h-1 w-full rounded-full" />
              <div className="bg-muted/15 h-1 w-2/3 rounded-full" />
            </div>
          )}
        </div>

        {/* Card Footer Info */}
        <div className="flex flex-col p-3.5">
          <p className="text-foreground group-hover:text-primary truncate text-sm font-medium transition-colors">
            {displayTitle}
          </p>
          <div className="text-muted mt-1.5 flex items-center gap-1.5 text-xs">
            <Image
              src="/assets/icons/doc.svg"
              alt="Doc"
              width={14}
              height={14}
              className="shrink-0 opacity-80"
            />
            <span className="truncate">{formattedDate}</span>
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
