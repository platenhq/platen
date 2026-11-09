"use client";

import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when the dashboard or a document cannot load, usually because Clerk or Liveblocks
 * could not be reached. Documents are not affected; trying again re-runs the page on the server.
 */
export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <CloudOff className="text-muted size-10" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Couldn&apos;t load your documents</h1>
        <p className="text-muted max-w-sm text-sm">
          The document service could not be reached. Your documents are safe. Check your connection
          and try again.
        </p>
      </div>
      <Button onClick={retry}>Try again</Button>
    </main>
  );
}
