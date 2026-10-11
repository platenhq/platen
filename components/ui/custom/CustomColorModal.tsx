"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CustomModal,
  CustomModalContent,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalFooter,
} from "@/components/ui/custom/CustomModal";

export interface CustomColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectColor: (hexColor: string) => void;
  initialColor?: string;
}

// Utility: Convert HEX to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace(/^#/, "");
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num) || cleaned.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Utility: Convert RGB to HEX
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

// Utility: Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s, v };
}

// Utility: Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = (h % 360) / 60;
  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 1) {
    r = c;
    g = x;
  } else if (h >= 1 && h < 2) {
    r = x;
    g = c;
  } else if (h >= 2 && h < 3) {
    g = c;
    b = x;
  } else if (h >= 3 && h < 4) {
    g = x;
    b = c;
  } else if (h >= 4 && h < 5) {
    r = x;
    b = c;
  } else if (h >= 5 && h < 6) {
    r = c;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export default function CustomColorModal({
  isOpen,
  onClose,
  onSelectColor,
  initialColor = "#000000",
}: CustomColorModalProps): React.JSX.Element | null {
  // Normalize initial color
  const validInitial = initialColor.startsWith("#") ? initialColor : "#000000";
  const initialRgb = hexToRgb(validInitial);
  const initialHsv = rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b);

  const [hue, setHue] = useState<number>(initialHsv.h);
  const [saturation, setSaturation] = useState<number>(initialHsv.s);
  const [value, setValue] = useState<number>(initialHsv.v);

  const [hexInput, setHexInput] = useState<string>(validInitial);
  const [rgbState, setRgbState] = useState<{ r: number; g: number; b: number }>(initialRgb);

  const satValRef = useRef<HTMLDivElement>(null);
  const isDraggingSatVal = useRef(false);
  const isDraggingHue = useRef(false);

  // Sync state on reopen with initialColor
  useEffect(() => {
    if (isOpen) {
      const rgb = hexToRgb(validInitial);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
      setHexInput(validInitial);
      setRgbState(rgb);
    }
  }, [isOpen, validInitial]);

  // Update RGB and HEX from current HSV values
  const syncFromHsv = useCallback((h: number, s: number, v: number) => {
    const rgb = hsvToRgb(h, s, v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setRgbState(rgb);
    setHexInput(hex);
  }, []);

  // Pointer drag for Saturation / Value 2D canvas
  const handleSatValPointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (!satValRef.current) return;
      const rect = satValRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

      const newSat = x / rect.width;
      const newVal = 1 - y / rect.height;

      setSaturation(newSat);
      setValue(newVal);
      syncFromHsv(hue, newSat, newVal);
    },
    [hue, syncFromHsv],
  );

  // Pointer drag for 1D Hue bar
  const handleHuePointer = useCallback(
    (e: React.PointerEvent | PointerEvent, targetElement?: HTMLElement) => {
      const el = targetElement || (e.currentTarget as HTMLElement);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const newHue = Math.round((x / rect.width) * 360) % 360;

      setHue(newHue);
      syncFromHsv(newHue, saturation, value);
    },
    [saturation, value, syncFromHsv],
  );

  // Global mouseup listeners for drag completion
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (isDraggingSatVal.current) {
        handleSatValPointer(e);
      }
    };

    const onPointerUp = () => {
      isDraggingSatVal.current = false;
      isDraggingHue.current = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [handleSatValPointer]);

  // Numerical Hex field edit
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("#")) val = "#" + val;
    setHexInput(val);

    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const rgb = hexToRgb(val);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setRgbState(rgb);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValue(hsv.v);
    }
  };

  // Numerical RGB fields edit
  const handleRgbChange = (field: "r" | "g" | "b", val: number) => {
    const clamped = isNaN(val) ? 0 : Math.max(0, Math.min(255, val));
    const nextRgb = { ...rgbState, [field]: clamped };
    setRgbState(nextRgb);

    const hex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
    setHexInput(hex);

    const hsv = rgbToHsv(nextRgb.r, nextRgb.g, nextRgb.b);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setValue(hsv.v);
  };

  const handleConfirm = () => {
    onSelectColor(hexInput);
    onClose();
  };

  // Background color of the saturation canvas at 100% saturation and 100% value for the current hue
  const pureHueRgb = hsvToRgb(hue, 1, 1);
  const pureHueHex = rgbToHex(pureHueRgb.r, pureHueRgb.g, pureHueRgb.b);

  return (
    <CustomModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <CustomModalContent className="max-w-sm p-5">
        {/* Header */}
        <CustomModalHeader className="mb-2">
          <CustomModalTitle className="text-sm font-semibold">Custom Color</CustomModalTitle>
        </CustomModalHeader>

        {/* 2D Saturation / Value Gradient Canvas */}
        <div
          ref={satValRef}
          onPointerDown={(e) => {
            isDraggingSatVal.current = true;
            handleSatValPointer(e);
          }}
          className="relative h-44 w-full cursor-crosshair rounded-lg select-none"
          style={{
            backgroundColor: pureHueHex,
            backgroundImage: `linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)`,
          }}
        >
          {/* Draggable Circle Handle */}
          <div
            className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/40"
            style={{
              left: `${saturation * 100}%`,
              top: `${(1 - value) * 100}%`,
              backgroundColor: hexInput,
            }}
          />
        </div>

        {/* Hue Slider */}
        <div className="mt-4">
          <div
            onPointerDown={(e) => {
              isDraggingHue.current = true;
              handleHuePointer(e, e.currentTarget);
            }}
            className="relative h-4 w-full cursor-pointer rounded-full select-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/40"
              style={{
                left: `${(hue / 360) * 100}%`,
                backgroundColor: pureHueHex,
              }}
            />
          </div>
        </div>

        {/* Swatch & Numerical Inputs */}
        <div className="mt-4 flex items-center gap-3">
          {/* Live Swatch Preview */}
          <div
            className="border-border size-10 shrink-0 rounded-lg border shadow-inner"
            style={{ backgroundColor: hexInput }}
          />

          {/* Hex Input */}
          <div className="flex-1">
            <label className="text-muted-foreground block text-[10px] font-medium uppercase">
              Hex
            </label>
            <input
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              maxLength={7}
              className="border-border bg-surface text-foreground focus:ring-primary mt-0.5 w-full rounded-md border px-2 py-1 font-mono text-xs uppercase outline-none focus:ring-1"
            />
          </div>

          {/* RGB Inputs */}
          <div className="flex gap-1.5">
            <div>
              <label className="text-muted-foreground block text-[10px] font-medium">R</label>
              <input
                type="number"
                min={0}
                max={255}
                value={rgbState.r}
                onChange={(e) => handleRgbChange("r", parseInt(e.target.value, 10))}
                className="border-border bg-surface text-foreground focus:ring-primary mt-0.5 w-11 rounded-md border px-1 py-1 text-center font-mono text-xs outline-none focus:ring-1"
              />
            </div>
            <div>
              <label className="text-muted-foreground block text-[10px] font-medium">G</label>
              <input
                type="number"
                min={0}
                max={255}
                value={rgbState.g}
                onChange={(e) => handleRgbChange("g", parseInt(e.target.value, 10))}
                className="border-border bg-surface text-foreground focus:ring-primary mt-0.5 w-11 rounded-md border px-1 py-1 text-center font-mono text-xs outline-none focus:ring-1"
              />
            </div>
            <div>
              <label className="text-muted-foreground block text-[10px] font-medium">B</label>
              <input
                type="number"
                min={0}
                max={255}
                value={rgbState.b}
                onChange={(e) => handleRgbChange("b", parseInt(e.target.value, 10))}
                className="border-border bg-surface text-foreground focus:ring-primary mt-0.5 w-11 rounded-md border px-1 py-1 text-center font-mono text-xs outline-none focus:ring-1"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <CustomModalFooter className="border-border mt-5 border-t pt-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary-hover text-xs"
          >
            OK
          </Button>
        </CustomModalFooter>
      </CustomModalContent>
    </CustomModal>
  );
}
