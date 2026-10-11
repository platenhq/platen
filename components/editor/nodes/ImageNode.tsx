"use client";

import React, { JSX, useCallback, useEffect, useRef, useState } from "react";
import {
  $applyNodeReplacement,
  $getNodeByKey,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  LexicalCommand,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  createCommand,
} from "lexical";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Maximize2,
  Minimize2,
  Square,
  Trash2,
} from "lucide-react";
import { useToolbarState } from "@/context/ToolbarContext";

export type ImageAlignment = "left" | "center" | "right";
export type ImageObjectFit = "fill" | "contain" | "cover";

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width: number | "inherit";
    height: number | "inherit";
    maxWidth: number;
    alignment: ImageAlignment;
    objectFit: ImageObjectFit;
  },
  SerializedLexicalNode
>;

export interface InsertImagePayload {
  src: string;
  altText?: string;
  width?: number | "inherit";
  height?: number | "inherit";
  maxWidth?: number;
  alignment?: ImageAlignment;
  objectFit?: ImageObjectFit;
}

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND");

// Official Lexical bitmask direction encoding
const Direction = {
  east: 1 << 0, // 1
  south: 1 << 1, // 2
  west: 1 << 2, // 4
  north: 1 << 3, // 8
} as const;

const MIN_IMAGE_DIMENSION = 60;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface ImageComponentProps {
  nodeKey: NodeKey;
  src: string;
  altText: string;
  width: number | "inherit";
  height: number | "inherit";
  maxWidth: number;
  alignment: ImageAlignment;
  objectFit: ImageObjectFit;
}

function ImageComponent({
  nodeKey,
  src,
  altText,
  width,
  height,
  alignment,
  objectFit,
}: ImageComponentProps) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const { updateToolbarState } = useToolbarState();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (isSelected) {
      updateToolbarState("isImage", true);
      updateToolbarState("imageAlignment", alignment);
      updateToolbarState("imageObjectFit", objectFit);
      updateToolbarState("selectedImageNodeKey", nodeKey);
      updateToolbarState("isTable", false);
    } else {
      updateToolbarState("isImage", false);
      updateToolbarState("selectedImageNodeKey", null);
    }
  }, [isSelected, alignment, objectFit, nodeKey, updateToolbarState]);

  /**
   * positioningRef: mutable ref for all resize state.
   * Using a ref instead of closure variables prevents stale-closure bugs
   * in pointermove/pointerup handlers and avoids unnecessary re-renders.
   */
  const positioningRef = useRef<{
    currentHeight: number;
    currentWidth: number;
    direction: number;
    isResizing: boolean;
    ratio: number;
    startHeight: number;
    startWidth: number;
    startX: number;
    startY: number;
  }>({
    currentHeight: 0,
    currentWidth: 0,
    direction: 0,
    isResizing: false,
    ratio: 0,
    startHeight: 0,
    startWidth: 0,
    startX: 0,
    startY: 0,
  });

  // ── CLICK HANDLER ───────────────────────────────────────────────────────────
  const onClick = useCallback(
    (payload: MouseEvent) => {
      // Never interfere while a resize drag is in progress
      if (positioningRef.current.isResizing) return true;

      const target = payload.target as Node;

      // Let toolbar clicks pass through without toggling selection
      if (toolbarRef.current && toolbarRef.current.contains(target)) {
        return false;
      }

      if (
        target === imageRef.current ||
        (wrapperRef.current && wrapperRef.current.contains(target))
      ) {
        if (payload.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }
        return true;
      }
      return false;
    },
    [isSelected, setSelected, clearSelection],
  );

  // ── DELETE HANDLER ──────────────────────────────────────────────────────────
  const onDeleteCommand = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected) {
        event.preventDefault();
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            const parent = node.getParent();
            node.remove();
            if (parent && parent.getChildrenSize() === 0) {
              parent.select();
            }
          }
        });
        return true;
      }
      return false;
    },
    [editor, isSelected, nodeKey],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_DELETE_COMMAND, onDeleteCommand, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, onDeleteCommand, COMMAND_PRIORITY_LOW),
    );
  }, [editor, onClick, onDeleteCommand]);

  // Deselect on pointer down outside wrapper
  useEffect(() => {
    if (!isSelected) return;
    const handleWindowPointerDown = (event: PointerEvent) => {
      if (positioningRef.current.isResizing) return;
      const target = event.target as Node;
      if (
        wrapperRef.current?.contains(target) ||
        (target as HTMLElement).closest?.(
          ".toolbar, [data-radix-popper-content-wrapper], [role='dialog'], [role='menu']",
        )
      ) {
        return;
      }
      clearSelection();
    };
    window.addEventListener("pointerdown", handleWindowPointerDown);
    return () => window.removeEventListener("pointerdown", handleWindowPointerDown);
  }, [isSelected, clearSelection]);

  // ── RESIZE LOGIC ────────────────────────────────────────────────────────────
  /**
   * Direction is encoded as a bitmask following the official Lexical pattern:
   *   east=1, south=2, west=4, north=8
   *
   * Corners are bitmask OR combinations:
   *   NW = 8|4=12, NE = 8|1=9, SE = 2|1=3, SW = 2|4=6
   *
   * In pointermove:
   *   isHorizontal = direction & (east|west) → only width changes
   *   isVertical   = direction & (south|north) → only height changes
   *   both         = corner → aspect-ratio locked resize
   *
   * CRITICAL: We only update the WRAPPER element's style during drag.
   * The <img> inside has width: 100%, height: 100% (or auto) and fills
   * the wrapper. This avoids the maxWidth: "100%" CSS constraint bug
   * where the image cannot enlarge past its last-committed size.
   */
  const handleResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, direction: number) => {
      event.preventDefault();
      event.stopPropagation();

      const wrapperEl = wrapperRef.current;
      if (!wrapperEl) return;

      // Measure the wrapper's CURRENT rendered dimensions (not the React props)
      const { width: startWidth, height: startHeight } = wrapperEl.getBoundingClientRect();

      // Use the wrapper's immediate parent (the outer flex div with w-full).
      // Its clientWidth = exact printable content-area width — no padding guesswork.
      const contentAreaWidth = wrapperEl.parentElement?.clientWidth ?? 700;
      const maxWidth = contentAreaWidth;
      const maxHeight = 4000; // not bounded by page height

      // Commit current rendered dimensions as px on the wrapper immediately.
      // This converts 'auto' to a concrete pixel value before drag begins.
      wrapperEl.style.width = `${startWidth}px`;
      wrapperEl.style.height = `${startHeight}px`;

      // Populate the positioningRef for use by move/up handlers
      const pos = positioningRef.current;
      pos.startWidth = startWidth;
      pos.startHeight = startHeight;
      pos.ratio = startWidth / (startHeight || 1);
      pos.currentWidth = startWidth;
      pos.currentHeight = startHeight;
      pos.startX = event.clientX;
      pos.startY = event.clientY;
      pos.direction = direction;
      pos.isResizing = true;

      // Set drag cursor on body
      const isH = direction & (Direction.east | Direction.west);
      const isV = direction & (Direction.south | Direction.north);
      const isDiag = isH && isV;
      const isNWSE =
        (direction & Direction.north && direction & Direction.west) ||
        (direction & Direction.south && direction & Direction.east);
      const cursor = isDiag
        ? isNWSE
          ? "nwse-resize"
          : "nesw-resize"
        : isH
          ? "ew-resize"
          : "ns-resize";

      const body = wrapperEl.ownerDocument?.body;
      if (body) {
        body.style.setProperty("cursor", cursor, "important");
        body.style.setProperty("-webkit-user-select", "none", "important");
      }

      setIsResizing(true);

      // ── pointermove ──────────────────────────────────────────────────────────
      const onPointerMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();
        const p = positioningRef.current;
        if (!p.isResizing || !wrapperEl) return;

        const isHorizontal = p.direction & (Direction.east | Direction.west);
        const isVertical = p.direction & (Direction.south | Direction.north);

        if (isHorizontal && isVertical) {
          // ── CORNER: aspect-ratio locked ──────────────────────────────────────
          // diff = distance dragged in X; negate for east-facing corners
          let diff = p.startX - moveEvent.clientX;
          if (p.direction & Direction.east) diff = -diff;

          const newWidth = clamp(p.startWidth + diff, MIN_IMAGE_DIMENSION, maxWidth);
          const newHeight = newWidth / p.ratio;

          wrapperEl.style.width = `${newWidth}px`;
          wrapperEl.style.height = `${newHeight}px`;
          p.currentWidth = newWidth;
          p.currentHeight = newHeight;
        } else if (isVertical) {
          // ── N/S EDGE: height only (width stays startWidth) ───────────────────
          let diff = p.startY - moveEvent.clientY;
          if (p.direction & Direction.south) diff = -diff;

          const newHeight = clamp(p.startHeight + diff, MIN_IMAGE_DIMENSION, maxHeight);
          wrapperEl.style.height = `${newHeight}px`;
          p.currentHeight = newHeight;
          p.currentWidth = p.startWidth;
        } else {
          // ── E/W EDGE: width only (height stays startHeight) ──────────────────
          let diff = p.startX - moveEvent.clientX;
          if (p.direction & Direction.east) diff = -diff;

          const newWidth = clamp(p.startWidth + diff, MIN_IMAGE_DIMENSION, maxWidth);
          wrapperEl.style.width = `${newWidth}px`;
          p.currentWidth = newWidth;
          p.currentHeight = p.startHeight;
        }
      };

      // ── pointerup ────────────────────────────────────────────────────────────
      const onPointerUp = () => {
        const p = positioningRef.current;
        if (!p.isResizing) return;

        const finalW = Math.round(p.currentWidth);
        const finalH = Math.round(p.currentHeight);
        p.isResizing = false;

        if (body) {
          body.style.removeProperty("cursor");
          body.style.removeProperty("-webkit-user-select");
        }

        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);

        // Small delay prevents the deselect-on-click-outside from firing
        setTimeout(() => setIsResizing(false), 200);

        // Commit final dimensions to the Lexical AST
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            node.setWidthAndHeight(finalW, finalH);
          }
        });
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [editor, nodeKey],
  );

  // ── TOOLBAR ACTIONS ─────────────────────────────────────────────────────────
  const setAlignment = (newAlignment: ImageAlignment) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) node.setAlignment(newAlignment);
    });
  };

  const setObjectFit = (newFit: ImageObjectFit) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) node.setObjectFit(newFit);
    });
  };

  const onDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        const parent = node.getParent();
        node.remove();
        if (parent && parent.getChildrenSize() === 0) parent.select();
      }
    });
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  // Use justify-* on the flex parent to position the wrapper child.
  // mr-auto/ml-auto/mx-auto have no effect on a flex *container* — only on flex children.
  const alignmentClass =
    alignment === "left"
      ? "justify-start"
      : alignment === "right"
        ? "justify-end"
        : "justify-center";

  const isFocused = isSelected || isResizing;

  /**
   * HEIGHT-INHERIT vs FIXED-HEIGHT rendering:
   *
   * When height === "inherit" (initial insertion before any resize):
   *   - Wrapper: width = px or auto, height = auto
   *   - Image:   width = 100%, height = auto (natural aspect ratio)
   *   - No object-fit letterboxing or cropping
   *
   * When height is a fixed number (after first resize):
   *   - Wrapper: width = px, height = px (exact committed size)
   *   - Image:   width = 100%, height = 100% (fills wrapper)
   *   - objectFit applies (contain / cover / fill)
   */
  const hasFixedHeight = height !== "inherit";
  const isControlled = hasFixedHeight || isResizing;

  return (
    <div
      className={`group relative my-4 flex w-full max-w-full select-none ${alignmentClass}`}
      contentEditable={false}
    >
      {/* ── WRAPPER: the ONLY element that carries pixel dimensions ── */}
      <div
        ref={wrapperRef}
        className={`relative inline-block ${
          isFocused
            ? "outline outline-offset-1 outline-blue-600"
            : "hover:outline-1 hover:outline-blue-400/60 hover:outline-dashed"
        }`}
        style={{
          width: width === "inherit" ? "auto" : `${width}px`,
          height: height === "inherit" ? "auto" : `${height}px`,
          // maxWidth keeps the image inside the page on first insert
          maxWidth: "100%",
        }}
      >
        {/* ── IMAGE FRAME: clips overflow for cover/fill objectFit ── */}
        <div className={`w-full ${isControlled ? "h-full overflow-hidden" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={src}
            alt={altText}
            draggable={false}
            className="block w-full cursor-pointer"
            style={{
              height: isControlled ? "100%" : "auto",
              objectFit: objectFit,
            }}
          />
        </div>

        {/* ── FLOATING TOOLBAR ── */}
        {isFocused && (
          <div
            ref={toolbarRef}
            className="border-border/60 text-foreground absolute -bottom-11 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-white px-2 py-1 shadow-lg select-none dark:bg-zinc-900"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Alignment buttons */}
            {(["left", "center", "right"] as ImageAlignment[]).map((a) => {
              const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
              const title = `Align ${a.charAt(0).toUpperCase() + a.slice(1)}`;
              return (
                <button
                  key={a}
                  type="button"
                  title={title}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAlignment(a);
                  }}
                  className={`flex size-6.5 cursor-pointer items-center justify-center rounded transition-colors ${
                    alignment === a
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon className="size-3.5" />
                </button>
              );
            })}

            <div className="bg-border/80 mx-1 h-3.5 w-px" />

            {/* Object-fit: Default (Fill - Google Docs style) */}
            <button
              type="button"
              title="Default (Google Docs) — scale without cropping"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setObjectFit("fill");
              }}
              className={`flex size-6.5 cursor-pointer items-center justify-center rounded transition-colors ${
                objectFit === "fill"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <Square className="size-3.5" />
            </button>

            {/* Object-fit: Contain */}
            <button
              type="button"
              title="Contain — fit inside frame, preserve aspect ratio"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setObjectFit("contain");
              }}
              className={`flex size-6.5 cursor-pointer items-center justify-center rounded transition-colors ${
                objectFit === "contain"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <Minimize2 className="size-3.5" />
            </button>

            {/* Object-fit: Cover */}
            <button
              type="button"
              title="Cover — fill frame, crop edges"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setObjectFit("cover");
              }}
              className={`flex size-6.5 cursor-pointer items-center justify-center rounded transition-colors ${
                objectFit === "cover"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <Maximize2 className="size-3.5" />
            </button>

            <div className="bg-border/80 mx-1 h-3.5 w-px" />

            {/* Delete */}
            <button
              type="button"
              title="Delete image"
              onMouseDown={onDelete}
              className="text-muted-foreground flex size-6.5 cursor-pointer items-center justify-center rounded transition-colors hover:bg-red-500/15 hover:text-red-600"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}

        {/* ── 8-POINT RESIZE HANDLES ── */}
        {isFocused && (
          <>
            {/* Corners */}
            <div
              className="absolute -top-1.5 -left-1.5 z-20 size-2.5 cursor-nwse-resize touch-none rounded-[1px] border border-white bg-blue-600 shadow-xs select-none"
              onPointerDown={(e) => handleResizePointerDown(e, Direction.north | Direction.west)}
            />
            <div
              className="absolute -top-1.5 -right-1.5 z-20 size-2.5 cursor-nesw-resize touch-none rounded-[1px] border border-white bg-blue-600 shadow-xs select-none"
              onPointerDown={(e) => handleResizePointerDown(e, Direction.north | Direction.east)}
            />
            <div
              className="absolute -bottom-1.5 -left-1.5 z-20 size-2.5 cursor-nesw-resize touch-none rounded-[1px] border border-white bg-blue-600 shadow-xs select-none"
              onPointerDown={(e) => handleResizePointerDown(e, Direction.south | Direction.west)}
            />
            <div
              className="absolute -right-1.5 -bottom-1.5 z-20 size-2.5 cursor-nwse-resize touch-none rounded-[1px] border border-white bg-blue-600 shadow-xs select-none"
              onPointerDown={(e) => handleResizePointerDown(e, Direction.south | Direction.east)}
            />

            {/* Edge midpoints */}
            <div
              className="absolute top-1/2 -left-1.5 z-20 size-2.5 -translate-y-1/2 cursor-ew-resize touch-none rounded-[1px] border border-white bg-blue-600 shadow-xs select-none"
              onPointerDown={(e) => handleResizePointerDown(e, Direction.west)}
            />
            <div
              className="absolute top-1/2 -right-1.5 z-20 size-2.5 -translate-y-1/2 cursor-ew-resize touch-none rounded-[1px] border border-white bg-blue-600 shadow-xs select-none"
              onPointerDown={(e) => handleResizePointerDown(e, Direction.east)}
            />
            <div
              className="absolute -top-1.5 left-1/2 z-20 size-2.5 -translate-x-1/2 cursor-ns-resize touch-none rounded-[1px] border border-white bg-blue-600 shadow-xs select-none"
              onPointerDown={(e) => handleResizePointerDown(e, Direction.north)}
            />
            <div
              className="absolute -bottom-1.5 left-1/2 z-20 size-2.5 -translate-x-1/2 cursor-ns-resize touch-none rounded-[1px] border border-white bg-blue-600 shadow-xs select-none"
              onPointerDown={(e) => handleResizePointerDown(e, Direction.south)}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ImageNode — Lexical DecoratorNode
// ────────────────────────────────────────────────────────────────────────────
export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number | "inherit";
  __height: number | "inherit";
  __maxWidth: number;
  __alignment: ImageAlignment;
  __objectFit: ImageObjectFit;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__alignment,
      node.__objectFit,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, maxWidth, width, height, alignment, objectFit } = serializedNode;
    return $createImageNode({
      src,
      altText,
      maxWidth,
      width,
      height,
      alignment,
      // Backwards-compatible: existing docs without objectFit default to "fill"
      objectFit: objectFit ?? "fill",
    });
  }

  exportJSON(): SerializedImageNode {
    return {
      src: this.__src,
      altText: this.__altText,
      maxWidth: this.__maxWidth,
      width: this.__width,
      height: this.__height,
      alignment: this.__alignment,
      objectFit: this.__objectFit,
      type: "image",
      version: 1,
    };
  }

  constructor(
    src: string,
    altText?: string,
    maxWidth?: number,
    width?: number | "inherit",
    height?: number | "inherit",
    alignment?: ImageAlignment,
    objectFit?: ImageObjectFit,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText || "Document image";
    this.__maxWidth = maxWidth || 800;
    this.__width = width || "inherit";
    this.__height = height || "inherit";
    this.__alignment = alignment || "center";
    this.__objectFit = objectFit || "fill";
  }

  setWidthAndHeight(width: number | "inherit", height: number | "inherit"): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setAlignment(alignment: ImageAlignment): void {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  setObjectFit(objectFit: ImageObjectFit): void {
    const writable = this.getWritable();
    writable.__objectFit = objectFit;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  getWidth(): number | "inherit" {
    return this.__width;
  }

  getHeight(): number | "inherit" {
    return this.__height;
  }

  getAlignment(): ImageAlignment {
    return this.__alignment;
  }

  getObjectFit(): ImageObjectFit {
    return this.__objectFit;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    span.className = "editor-image-wrapper";
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (domNode: Node): DOMConversionOutput | null => {
          if (domNode instanceof HTMLImageElement) {
            const { src, alt, width, height } = domNode;
            const node = $createImageNode({
              src,
              altText: alt,
              width: width ? Number(width) : "inherit",
              height: height ? Number(height) : "inherit",
            });
            return { node };
          }
          return null;
        },
        priority: 0,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    if (this.__width !== "inherit") element.setAttribute("width", this.__width.toString());
    if (this.__height !== "inherit") element.setAttribute("height", this.__height.toString());
    return { element };
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        nodeKey={this.__key}
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        alignment={this.__alignment}
        objectFit={this.__objectFit}
      />
    );
  }
}

export function $createImageNode({
  src,
  altText,
  maxWidth,
  width,
  height,
  alignment,
  objectFit,
}: InsertImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(src, altText, maxWidth, width, height, alignment, objectFit),
  );
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
