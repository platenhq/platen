"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Check } from "lucide-react";

export type SortOption = "created_desc" | "created_asc" | "title_asc" | "title_desc";

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_LABELS: Record<SortOption, string> = {
  created_desc: "Last created",
  created_asc: "Oldest first",
  title_asc: "Title (A-Z)",
  title_desc: "Title (Z-A)",
};

export const SortDropdown = ({ value, onChange }: SortDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-border bg-surface text-foreground hover:bg-surface-hover flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors"
        >
          <ArrowUpDown className="text-muted size-3.5" />
          <span>{SORT_LABELS[value]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-border bg-surface text-foreground w-44 shadow-md"
      >
        {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onChange(option)}
            className="focus:bg-surface-hover focus:text-foreground flex cursor-pointer items-center justify-between px-2.5 py-2 text-xs"
          >
            <span>{SORT_LABELS[option]}</span>
            {value === option && <Check className="text-primary size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortDropdown;
