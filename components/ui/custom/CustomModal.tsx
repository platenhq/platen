"use client";

import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CustomModalContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent> & {
    hideCloseButton?: boolean;
  }
>(({ className, children, hideCloseButton = false, ...props }, ref) => (
  <DialogContent
    ref={ref}
    className={cn(
      "border-border bg-surface text-foreground max-w-md rounded-xl border p-6 shadow-2xl",
      hideCloseButton && "[&>button:last-child]:hidden",
      className,
    )}
    {...props}
  >
    {children}
  </DialogContent>
));
CustomModalContent.displayName = "CustomModalContent";

const CustomModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <DialogHeader className={cn("text-left sm:text-left", className)} {...props} />
);
CustomModalHeader.displayName = "CustomModalHeader";

const CustomModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogTitle>,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => (
  <DialogTitle
    ref={ref}
    className={cn("text-foreground text-base font-semibold tracking-tight", className)}
    {...props}
  />
));
CustomModalTitle.displayName = "CustomModalTitle";

const CustomModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogDescription>,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, ...props }, ref) => (
  <DialogDescription
    ref={ref}
    className={cn("text-muted-foreground text-xs", className)}
    {...props}
  />
));
CustomModalDescription.displayName = "CustomModalDescription";

const CustomModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <DialogFooter
    className={cn("flex items-center justify-end gap-2 pt-2 sm:space-x-0", className)}
    {...props}
  />
);
CustomModalFooter.displayName = "CustomModalFooter";

export {
  Dialog as CustomModal,
  DialogTrigger as CustomModalTrigger,
  CustomModalContent,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalFooter,
  DialogClose as CustomModalClose,
};
