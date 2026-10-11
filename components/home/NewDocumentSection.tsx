"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { createDoc } from "@/lib/actions/room.actions";

interface NewDocumentSectionProps {
  userId: string;
  email: string;
}

export const NewDocumentSection = ({ userId, email }: NewDocumentSectionProps) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBlankDoc = async () => {
    if (isCreating) return;
    try {
      setIsCreating(true);
      const room = await createDoc({ userId, email });
      if (room?.id) {
        router.push(`/documents/${room.id}`);
      }
    } catch (error) {
      console.error("Error creating new document:", error);
      setIsCreating(false);
    }
  };

  return (
    <section className="border-border bg-surface-canvas w-full border-b py-6 transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-medium">Start a new document</h2>
        </div>

        <div className="mt-3 flex items-start gap-6">
          {/* Blank Document Creation Card */}
          <button
            type="button"
            onClick={handleCreateBlankDoc}
            disabled={isCreating}
            className="group flex flex-col items-start text-left focus:outline-none"
          >
            <div className="group-hover:border-primary border-border bg-surface relative flex h-40 w-32 items-center justify-center rounded-lg border shadow-xs transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
              {isCreating ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="text-primary size-6 animate-spin" />
                  <span className="text-muted text-[11px] font-medium">Creating...</span>
                </div>
              ) : (
                <div className="bg-primary/10 group-hover:bg-primary/20 flex size-10 items-center justify-center rounded-full transition-colors">
                  <Plus className="text-primary size-6 transition-transform group-hover:scale-110" />
                </div>
              )}
            </div>
            <span className="text-foreground group-hover:text-primary mt-2 text-xs font-medium transition-colors">
              Blank document
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default NewDocumentSection;
