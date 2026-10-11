"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const CustomDropdownTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuTrigger>
>(({ className, ...props }, ref) => (
  <DropdownMenuTrigger
    ref={ref}
    className={cn(
      "outline-none focus:outline-none focus-visible:ring-0 focus-visible:outline-none",
      className,
    )}
    {...props}
  />
));
CustomDropdownTrigger.displayName = "CustomDropdownTrigger";

const CustomDropdownContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuContent>
>(({ className, sideOffset = 4, align = "start", onCloseAutoFocus, ...props }, ref) => (
  <DropdownMenuContent
    ref={ref}
    sideOffset={sideOffset}
    align={align}
    onCloseAutoFocus={(e) => {
      e.preventDefault();
      onCloseAutoFocus?.(e);
    }}
    className={cn(
      "border-border bg-surface text-foreground z-60 min-w-44 overflow-hidden rounded-lg border p-1 shadow-xl outline-none select-none focus:outline-none focus-visible:outline-none",
      className,
    )}
    {...props}
  />
));
CustomDropdownContent.displayName = "CustomDropdownContent";

const CustomDropdownItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuItem> & {
    isActive?: boolean;
  }
>(({ className, isActive, ...props }, ref) => (
  <DropdownMenuItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors outline-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none data-disabled:pointer-events-none data-disabled:opacity-40 [&_svg]:size-3.5 [&_svg]:shrink-0",
      isActive
        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-accent font-medium"
        : "text-foreground hover:bg-surface-hover focus:bg-surface-hover",
      className,
    )}
    {...props}
  />
));
CustomDropdownItem.displayName = "CustomDropdownItem";

const CustomDropdownSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSubTrigger>
>(({ className, ...props }, ref) => (
  <DropdownMenuSubTrigger
    ref={ref}
    className={cn(
      "hover:bg-surface-hover focus:bg-surface-hover text-foreground data-[state=open]:bg-surface-hover flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors outline-none select-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none [&_svg]:size-3.5 [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
));
CustomDropdownSubTrigger.displayName = "CustomDropdownSubTrigger";

const CustomDropdownSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuSubContent
    ref={ref}
    className={cn(
      "border-border bg-surface text-foreground z-60 min-w-40 overflow-hidden rounded-lg border p-1 shadow-xl outline-none select-none focus:outline-none focus-visible:outline-none",
      className,
    )}
    {...props}
  />
));
CustomDropdownSubContent.displayName = "CustomDropdownSubContent";

const CustomDropdownSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSeparator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSeparator>
>(({ className, ...props }, ref) => (
  <DropdownMenuSeparator
    ref={ref}
    className={cn("border-border my-1 border-t", className)}
    {...props}
  />
));
CustomDropdownSeparator.displayName = "CustomDropdownSeparator";

const CustomDropdownLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuLabel>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuLabel>
>(({ className, ...props }, ref) => (
  <DropdownMenuLabel
    ref={ref}
    className={cn(
      "text-muted-foreground px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase",
      className,
    )}
    {...props}
  />
));
CustomDropdownLabel.displayName = "CustomDropdownLabel";

export {
  DropdownMenu as CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
  CustomDropdownSubTrigger,
  CustomDropdownSubContent,
  CustomDropdownSeparator,
  CustomDropdownLabel,
  DropdownMenuGroup as CustomDropdownGroup,
  DropdownMenuSub as CustomDropdownSub,
  DropdownMenuRadioGroup as CustomDropdownRadioGroup,
};
