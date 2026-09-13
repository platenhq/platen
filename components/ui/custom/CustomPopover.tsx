"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const CustomPopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverTrigger>,
  React.ComponentPropsWithoutRef<typeof PopoverTrigger>
>(({ className, ...props }, ref) => (
  <PopoverTrigger
    ref={ref}
    className={cn(
      "outline-none focus:outline-none focus-visible:ring-0 focus-visible:outline-none",
      className,
    )}
    {...props}
  />
));
CustomPopoverTrigger.displayName = "CustomPopoverTrigger";

const CustomPopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverContent>,
  React.ComponentPropsWithoutRef<typeof PopoverContent>
>(
  (
    {
      className,
      align = "start",
      sideOffset = 4,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onMouseDown,
      ...props
    },
    ref,
  ) => (
    <PopoverContent
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      onOpenAutoFocus={(e) => {
        // Prevent stealing focus from the Lexical editor caret
        e.preventDefault();
        onOpenAutoFocus?.(e);
      }}
      onCloseAutoFocus={(e) => {
        // Prevent returning focus to trigger button and blurring editor caret
        e.preventDefault();
        onCloseAutoFocus?.(e);
      }}
      onMouseDown={(e) => {
        // Prevent clicking inside popover from stealing editor focus
        e.preventDefault();
        onMouseDown?.(e);
      }}
      className={cn(
        "border-border bg-surface text-foreground z-50 w-auto rounded-lg border p-1.5 shadow-xl outline-none select-none focus:outline-none focus-visible:ring-0 focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  ),
);
CustomPopoverContent.displayName = "CustomPopoverContent";

export { Popover as CustomPopover, CustomPopoverTrigger, CustomPopoverContent };
