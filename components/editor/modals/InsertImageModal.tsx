"use client";

import React, { useState, useEffect } from "react";
import {
  CustomModal,
  CustomModalContent,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalFooter,
} from "@/components/ui/custom/CustomModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, Loader2, Check, AlertCircle } from "lucide-react";
import { InsertImagePayload } from "@/components/editor/nodes/ImageNode";

interface InsertImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: InsertImagePayload) => void;
}

export const InsertImageModal: React.FC<InsertImageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const resetState = () => {
    setImageUrl("");
    setAltText("");
    setIsLoading(false);
    setPreviewSrc(null);
    setImageDimensions(null);
    setWarning(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  // Debounced image probing
  useEffect(() => {
    const trimmed = imageUrl.trim();
    if (!trimmed || !/^https?:\/\/.+/i.test(trimmed)) {
      setPreviewSrc(null);
      setImageDimensions(null);
      setWarning(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setWarning(null);

    const timer = setTimeout(() => {
      let isCancelled = false;
      const img = new Image();

      img.onload = () => {
        if (!isCancelled) {
          setPreviewSrc(trimmed);
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          setIsLoading(false);
          setWarning(null);
        }
      };

      img.onerror = () => {
        if (!isCancelled) {
          setIsLoading(false);
          setPreviewSrc(null);
          setImageDimensions(null);
          setWarning(
            "Live preview is unavailable for this link, but you can still insert it directly.",
          );
        }
      };

      img.src = trimmed;

      return () => {
        isCancelled = true;
      };
    }, 350);

    return () => clearTimeout(timer);
  }, [imageUrl]);

  const isValidUrl = imageUrl.trim().length > 5 && /^https?:\/\/.+/i.test(imageUrl.trim());

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = imageUrl.trim();
    if (!finalUrl || !isValidUrl) return;

    let initialWidth: number | "inherit" = "inherit";
    let initialHeight: number | "inherit" = "inherit";

    // Large images (>500px) use "inherit" \u2014 wrapper maxWidth:100% fills the page.
    // Small images keep natural pixel dimensions.
    // CORS/network probe failure: imageDimensions is null \u2014 both stay "inherit".
    if (imageDimensions && imageDimensions.width > 0 && imageDimensions.width <= 500) {
      initialWidth = imageDimensions.width;
      initialHeight = imageDimensions.height;
    }
    // else: both remain "inherit" \u2014 CSS handles the sizing

    onConfirm({
      src: finalUrl,
      altText: altText.trim() || "Document image",
      width: initialWidth,
      height: initialHeight,
      maxWidth: 800,
      alignment: "center",
    });

    handleClose();
  };

  return (
    <CustomModal open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <CustomModalContent className="max-w-md p-6">
        <CustomModalHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <LinkIcon className="size-4" />
            </div>
            <div>
              <CustomModalTitle className="text-base font-semibold">
                Insert Image by URL
              </CustomModalTitle>
              <CustomModalDescription className="text-xs">
                Paste the direct web link of the image you want to embed.
              </CustomModalDescription>
            </div>
          </div>
        </CustomModalHeader>

        <form onSubmit={handleInsert} className="mt-4 flex flex-col gap-4">
          {/* Image URL Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="image-url-input" className="text-foreground text-xs font-medium">
              Image Web Link
            </label>
            <div className="relative flex items-center">
              <Input
                id="image-url-input"
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                autoFocus
                className="pr-8 text-xs"
              />
              {isLoading && (
                <div className="absolute right-2.5 flex items-center">
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Alt Text Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="image-alt-input" className="text-foreground text-xs font-medium">
              Alt Text (Description for Accessibility)
            </label>
            <Input
              id="image-alt-input"
              type="text"
              placeholder="e.g. Quarterly revenue growth chart"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Live Preview Thumbnail */}
          {previewSrc && !isLoading && (
            <div className="border-border/60 bg-surface-secondary/40 flex items-center gap-3 rounded-lg border p-2.5">
              <div className="border-border/80 relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc} alt="Preview" className="size-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3.5" />
                  <span className="text-xs font-medium">Image Ready</span>
                </div>
                {imageDimensions && (
                  <span className="text-muted-foreground text-[11px]">
                    Dimensions: {imageDimensions.width} &times; {imageDimensions.height}px
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Warning / Non-blocking Notice */}
          {warning && !isLoading && (
            <div className="flex items-center gap-2 rounded-md bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="size-4 shrink-0" />
              <span>{warning}</span>
            </div>
          )}

          <CustomModalFooter className="mt-2 flex items-center justify-end gap-2 sm:gap-3">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={!isValidUrl}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Insert Image
            </Button>
          </CustomModalFooter>
        </form>
      </CustomModalContent>
    </CustomModal>
  );
};

export default InsertImageModal;
