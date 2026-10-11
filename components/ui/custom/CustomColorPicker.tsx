"use client";

import React, { useState } from "react";
import { Plus, Ban, Check } from "lucide-react";
import CustomColorModal from "@/components/ui/custom/CustomColorModal";
import { cn } from "@/lib/utils";

// 10-column Google Docs Swatch Palette Matrix
export const GOOGLE_DOCS_COLOR_PALETTE = [
  // Row 1: Monochrome / Grayscale
  [
    "#000000",
    "#434343",
    "#666666",
    "#999999",
    "#b7b7b7",
    "#cccccc",
    "#d9d9d9",
    "#efefef",
    "#f3f3f3",
    "#ffffff",
  ],
  // Row 2: Deep Dark Tones
  [
    "#980000",
    "#ff0000",
    "#ff9900",
    "#ffff00",
    "#00ff00",
    "#00ffff",
    "#4a86e8",
    "#0000ff",
    "#9900ff",
    "#ff00ff",
  ],
  // Row 3: Light Tints Level 1
  [
    "#e6b8af",
    "#f4cccc",
    "#fce5cd",
    "#fff2cc",
    "#d9ead3",
    "#d0e0e3",
    "#c9daf8",
    "#cfe2f3",
    "#d9d2e9",
    "#ead1dc",
  ],
  // Row 4: Light Tints Level 2
  [
    "#dd7e6b",
    "#ea9999",
    "#f9cb9c",
    "#ffe599",
    "#b6d7a8",
    "#a2c4c9",
    "#a4c2f4",
    "#9fc5e8",
    "#b4a7d6",
    "#d5a6bd",
  ],
  // Row 5: Medium Tones
  [
    "#cc4125",
    "#e06666",
    "#f6b26b",
    "#ffd966",
    "#93c47d",
    "#76a5af",
    "#6d9eeb",
    "#6fa8dc",
    "#8e7cc3",
    "#c27ba0",
  ],
  // Row 6: Darker Tones
  [
    "#a61c00",
    "#cc0000",
    "#e69138",
    "#f1c232",
    "#6aa84f",
    "#45818e",
    "#3c78d8",
    "#3d85c6",
    "#674ea7",
    "#a64d79",
  ],
  // Row 7: Deep Shades
  [
    "#85200c",
    "#990000",
    "#b45f06",
    "#bf9000",
    "#38761d",
    "#134f5c",
    "#1155cc",
    "#0b5394",
    "#351c75",
    "#741b47",
  ],
  // Row 8: Darkest Shades
  [
    "#5b0f00",
    "#660000",
    "#783f04",
    "#7f6000",
    "#274e13",
    "#0c343d",
    "#1c4587",
    "#073763",
    "#20124d",
    "#4c1130",
  ],
];

export interface CustomColorPickerProps {
  currentColor?: string;
  onSelectColor: (color: string | null) => void;
  showNoneOption?: boolean;
  noneLabel?: string;
  onClose?: () => void;
  onOpenCustomModal?: () => void;
  headerSlot?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function CustomColorPicker({
  currentColor,
  onSelectColor,
  showNoneOption = false,
  noneLabel = "None",
  onClose,
  onOpenCustomModal,
  headerSlot,
  size = "md",
  className,
}: CustomColorPickerProps): React.JSX.Element {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);

  const widthClass = size === "lg" ? "w-80" : size === "sm" ? "w-56" : "w-64";
  const swatchSizeClass = size === "lg" ? "size-6" : "size-5";

  const handleSelect = (color: string | null) => {
    onSelectColor(color);
    if (onClose) onClose();
  };

  const handleCustomColorPicked = (color: string) => {
    setCustomColors((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== color.toLowerCase());
      return [color, ...filtered].slice(0, 8); // Keep up to 8 recent custom colors
    });
    onSelectColor(color);
    if (onClose) onClose();
  };

  const handlePlusClick = () => {
    if (onOpenCustomModal) {
      onOpenCustomModal();
    } else {
      setIsCustomModalOpen(true);
    }
  };

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "border-border bg-surface text-foreground rounded-lg border p-3 shadow-xl select-none",
        widthClass,
        className,
      )}
    >
      {headerSlot && <div className="mb-2.5">{headerSlot}</div>}

      {/* Optional "None / Transparent" option (used for Highlight Background) */}
      {showNoneOption && (
        <div className="border-border mb-2.5 border-b pb-2">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSelect(null)}
            className={`hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
              !currentColor || currentColor === "transparent" || currentColor === "none"
                ? "bg-blue-50 font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                : "text-foreground"
            }`}
          >
            <Ban size={14} className="text-red-500" />
            <span>{noneLabel}</span>
          </button>
        </div>
      )}

      {/* Standard Palette Grid */}
      <div className="flex flex-col gap-1">
        {GOOGLE_DOCS_COLOR_PALETTE.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-between gap-1">
            {row.map((color) => {
              const isSelected = currentColor && currentColor.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(color)}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center justify-center rounded-sm border transition-transform hover:z-10 hover:scale-115 focus:outline-none",
                    swatchSizeClass,
                    color === "#ffffff"
                      ? "border-slate-300 dark:border-slate-600"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                >
                  {isSelected && (
                    <Check
                      size={12}
                      className={
                        color === "#ffffff" ||
                        color === "#f3f3f3" ||
                        color === "#efefef" ||
                        color === "#d9d9d9" ||
                        color === "#ffff00"
                          ? "text-black"
                          : "text-white"
                      }
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* CUSTOM Section */}
      <div className="border-border mt-3 border-t pt-2.5">
        <div className="text-muted-foreground mb-1.5 text-[11px] font-semibold tracking-wider uppercase">
          Custom
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Add Custom Color Button */}
          <button
            type="button"
            title="Custom color..."
            onMouseDown={(e) => e.preventDefault()}
            onClick={handlePlusClick}
            className="border-border hover:bg-muted text-foreground flex size-6 items-center justify-center rounded-full border transition-colors focus:outline-none"
          >
            <Plus size={14} />
          </button>

          {/* Recently Added Custom Swatches */}
          {customColors.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(color)}
              className="size-5 rounded-full border border-slate-300 transition-transform hover:scale-115 dark:border-slate-600"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Picker Modal */}
      <CustomColorModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSelectColor={handleCustomColorPicked}
        initialColor={currentColor || "#000000"}
      />
    </div>
  );
}
