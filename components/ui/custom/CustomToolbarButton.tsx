"use client";

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CustomToolbarButtonProps extends Omit<ButtonProps, "size"> {
  isActive?: boolean;
  size?: "default" | "sm" | "icon" | "split-left" | "split-right";
  tooltip?: string;
}

const CustomToolbarButton = React.forwardRef<HTMLButtonElement, CustomToolbarButtonProps>(
  (
    {
      className,
      isActive = false,
      size = "icon",
      variant = "ghost",
      onMouseDown,
      tooltip,
      title,
      children,
      ...props
    },
    ref,
  ) => {
    // Default interaction guard: prevent focus loss from editor
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onMouseDown?.(e);
    };

    const sizeClasses = {
      default: "h-8 px-3 text-xs",
      sm: "h-7 px-2 text-xs",
      icon: "size-9 p-0!",
      "split-left": "h-8 w-7 rounded-l-lg! rounded-r-none! p-0",
      "split-right": "h-8 w-4.5 rounded-r-lg! rounded-l-none! border-l! border-border/60 p-0",
    }[size];

    return (
      <Button
        ref={ref}
        variant={variant}
        size="icon"
        title={title || tooltip}
        aria-label={props["aria-label"] || title || tooltip}
        onMouseDown={handleMouseDown}
        className={cn(
          "toolbar-item toolbar-button flex shrink-0 items-center justify-center rounded-lg border-none transition-colors outline-none focus:ring-0! focus:outline-none focus-visible:ring-0! focus-visible:ring-offset-0! focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
          sizeClasses,
          isActive
            ? "active bg-primary/15 text-primary dark:bg-primary/20 dark:text-accent font-semibold"
            : "hover:enabled:bg-surface-hover",
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    );
  },
);

CustomToolbarButton.displayName = "CustomToolbarButton";

export default CustomToolbarButton;
