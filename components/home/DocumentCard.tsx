"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { dateConverter } from "@/lib/utils";
import DeleteModal from "@/components/modal/DeleteModal";
import { FileText } from "lucide-react";

interface DocumentCardProps {
  id: string;
  title?: string | string[];
  createdAt: string | Date;
  viewMode: "grid" | "list";
}

export const DocumentCard = ({ id, title, createdAt, viewMode }: DocumentCardProps) => {
  const displayTitle = (Array.isArray(title) ? title[0] : title) || "Untitled Document";
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
            <p className="text-muted text-xs">Created about {formattedDate}</p>
          </div>
        </Link>

        <div className="shrink-0">
          <DeleteModal roomId={id} />
        </div>
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
          <div className="border-border/80 bg-surface relative flex h-full w-24 flex-col gap-1.5 rounded-sm border p-2 shadow-xs transition-transform group-hover:scale-105">
            <div className="bg-primary/30 h-1.5 w-12 rounded-full" />
            <div className="bg-muted/20 h-1 w-full rounded-full" />
            <div className="bg-muted/20 h-1 w-full rounded-full" />
            <div className="bg-muted/20 h-1 w-4/5 rounded-full" />
            <div className="bg-muted/15 mt-1 h-1 w-full rounded-full" />
            <div className="bg-muted/15 h-1 w-2/3 rounded-full" />
          </div>
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

      {/* Delete button positioned absolute or bottom right */}
      <div className="absolute top-2 right-2 opacity-80 transition-opacity group-hover:opacity-100">
        <DeleteModal roomId={id} />
      </div>
    </div>
  );
};

export default DocumentCard;
