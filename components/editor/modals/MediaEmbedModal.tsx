"use client";

import React, { useState } from "react";
import { Dialog, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  CustomModalContent,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
} from "@/components/ui/custom/CustomModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Twitter, AlertCircle } from "lucide-react";
import { parseYouTubeId } from "../nodes/YouTubeNode";
import { parseTweetId } from "../nodes/TweetNode";

interface MediaEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "youtube" | "tweet";
  onEmbed: (urlOrId: string) => void;
}

export default function MediaEmbedModal({ isOpen, onClose, type, onEmbed }: MediaEmbedModalProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isYouTube = type === "youtube";
  const title = isYouTube ? "Embed YouTube Video" : "Embed Post from X (Twitter)";
  const description = isYouTube
    ? "Paste a YouTube video link or Shorts URL to embed it directly into your document."
    : "Paste an X / Twitter post URL to display an interactive embed in your document.";
  const placeholder = isYouTube
    ? "https://www.youtube.com/watch?v=..."
    : "https://x.com/username/status/...";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL");
      return;
    }

    if (isYouTube) {
      const id = parseYouTubeId(trimmed);
      if (!id) {
        setError("Invalid YouTube URL. Please enter a valid YouTube link or video ID.");
        return;
      }
      onEmbed(id);
    } else {
      const id = parseTweetId(trimmed);
      if (!id) {
        setError("Invalid X / Twitter link. Please enter a link to a specific post.");
        return;
      }
      onEmbed(id);
    }

    setUrl("");
    setError(null);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setUrl("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <CustomModalContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CustomModalHeader>
            <div className="flex items-center gap-2">
              {isYouTube ? (
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  <Video className="size-4.5" />
                </div>
              ) : (
                <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                  <Twitter className="size-4.5" />
                </div>
              )}
              <CustomModalTitle>{title}</CustomModalTitle>
            </div>
            <CustomModalDescription className="pt-1.5">{description}</CustomModalDescription>
          </CustomModalHeader>

          <div className="flex flex-col gap-1.5">
            <Input
              autoFocus
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder={placeholder}
              className="border-border bg-surface-secondary/40 text-foreground h-9 text-xs"
            />
            {error && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-500">
                <AlertCircle className="size-3 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs font-normal">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" className="h-8 text-xs font-medium">
              Embed
            </Button>
          </DialogFooter>
        </form>
      </CustomModalContent>
    </Dialog>
  );
}
