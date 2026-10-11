"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  LexicalEditor,
} from "lexical";
import { $findMatchingParent } from "@lexical/utils";
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableNode,
  $isTableSelection,
  $mergeCells,
  $unmergeCell,
  TableCellNode,
  TableNode,
} from "@lexical/table";
import {
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  ChevronDown,
  Combine,
  Minus,
  PaintBucket,
  Split,
  Square,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import CustomToolbarButton from "@/components/ui/custom/CustomToolbarButton";
import {
  CustomPopover,
  CustomPopoverTrigger,
  CustomPopoverContent,
} from "@/components/ui/custom/CustomPopover";
import {
  CustomDropdown,
  CustomDropdownTrigger,
  CustomDropdownContent,
  CustomDropdownItem,
  CustomDropdownSeparator,
} from "@/components/ui/custom/CustomDropdown";
import CustomColorPicker from "@/components/ui/custom/CustomColorPicker";
import CustomColorModal from "@/components/ui/custom/CustomColorModal";
import { useToolbarState } from "@/context/ToolbarContext";
import { cn } from "@/lib/utils";
import { getStyleProperty, setStyleProperty } from "../utils";

export type BorderTarget = "cell" | "table";

export const TableBorderTargetContext = React.createContext<{
  target: BorderTarget;
  setTarget: (target: BorderTarget) => void;
}>({
  target: "table",
  setTarget: () => {},
});

export function useTableBorderTarget() {
  return React.useContext(TableBorderTargetContext);
}

/**
 * Tracks the count of actively selected table cells.
 */
function useSelectedCellCount(editor: LexicalEditor): number {
  const [count, setCount] = useState(1);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isTableSelection(selection)) {
          const cells = selection.getNodes().filter($isTableCellNode);
          setCount(Math.max(1, cells.length));
        } else {
          setCount(1);
        }
      });
    });
  }, [editor]);

  return count;
}

/**
 * Segmented target selector allowing user to toggle between styling
 * the selected cell(s) or the entire table.
 */
function applyCellStyleToDOM(editor: LexicalEditor, cell: TableCellNode, cellStyle: string): void {
  const domCell = editor.getElementByKey(cell.getKey());
  if (domCell) {
    domCell.style.cssText = cellStyle;
    const bg = cell.getBackgroundColor();
    if (bg) domCell.style.backgroundColor = bg;
    const width = cell.getWidth();
    if (width !== undefined) domCell.style.width = `${width}px`;
    const va = cell.getVerticalAlign();
    if (va) domCell.style.verticalAlign = va;
  }
}

export function TableBorderTargetSelector({
  target,
  onTargetChange,
  selectedCellCount,
}: {
  target: BorderTarget;
  onTargetChange: (target: BorderTarget) => void;
  selectedCellCount: number;
}): React.JSX.Element {
  return (
    <div className="w-full">
      <div className="text-foreground/70 dark:text-muted-foreground mb-1.5 px-0.5 text-[11px] font-semibold tracking-wider uppercase">
        Apply border to
      </div>
      <div
        onMouseDown={(e) => e.preventDefault()}
        className="bg-surface-secondary border-border/80 grid grid-cols-2 gap-1 rounded-lg border p-1 text-xs select-none"
      >
        <button
          type="button"
          data-active={target === "cell"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTargetChange("cell");
          }}
          className="hover:bg-surface/50 hover:text-foreground data-[active=true]:border-border/80 data-[active=true]:bg-surface data-[active=true]:text-foreground flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-all outline-none select-none focus:outline-none data-[active=true]:border data-[active=true]:font-semibold data-[active=true]:shadow-xs dark:text-slate-400"
        >
          <Square className="size-4 shrink-0" />
          <span className="whitespace-nowrap">
            {selectedCellCount > 1 ? `${selectedCellCount} Cells` : "Selected Cell"}
          </span>
        </button>
        <button
          type="button"
          data-active={target === "table"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTargetChange("table");
          }}
          className="hover:bg-surface/50 hover:text-foreground data-[active=true]:border-border/80 data-[active=true]:bg-surface data-[active=true]:text-foreground flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-all outline-none select-none focus:outline-none data-[active=true]:border data-[active=true]:font-semibold data-[active=true]:shadow-xs dark:text-slate-400"
        >
          <TableIcon className="size-4 shrink-0" />
          <span className="whitespace-nowrap">Entire Table</span>
        </button>
      </div>
    </div>
  );
}

const BORDER_WIDTH_OPTIONS = [
  { label: "0 pt", value: "0pt" },
  { label: "0.5 pt", value: "0.5pt" },
  { label: "1 pt", value: "1pt" },
  { label: "1.5 pt", value: "1.5pt" },
  { label: "2.25 pt", value: "2.25pt" },
  { label: "3 pt", value: "3pt" },
  { label: "4.5 pt", value: "4.5pt" },
  { label: "6 pt", value: "6pt" },
];

/**
 * Table Cell Fill Color Button (Paint Bucket)
 */
export function TableFillColorButton({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { toolbarState } = useToolbarState();
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [cachedCellKeys, setCachedCellKeys] = useState<string[]>([]);

  const activeColor =
    toolbarState.tableCellBgColor &&
    toolbarState.tableCellBgColor !== "transparent" &&
    toolbarState.tableCellBgColor !== "none" &&
    toolbarState.tableCellBgColor !== "rgba(0, 0, 0, 0)"
      ? toolbarState.tableCellBgColor
      : "";

  const handleOpenChange = (open: boolean) => {
    if (open) {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        const keys: string[] = [];
        if ($isTableSelection(selection)) {
          for (const node of selection.getNodes()) {
            if ($isTableCellNode(node)) {
              keys.push(node.getKey());
            }
          }
        } else if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
          if ($isTableCellNode(cellNode)) {
            keys.push(cellNode.getKey());
          }
        }
        setCachedCellKeys(keys);
      });
    }
    setIsOpen(open);
  };

  const handleSelectColor = (color: string | null) => {
    editor.update(() => {
      const selection = $getSelection();
      const hex = !color || color === "transparent" || color === "none" ? null : color;
      const targetCells: TableCellNode[] = [];

      if ($isTableSelection(selection)) {
        for (const node of selection.getNodes()) {
          if ($isTableCellNode(node)) {
            targetCells.push(node);
          }
        }
      } else if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
        if ($isTableCellNode(cellNode)) {
          targetCells.push(cellNode);
        }
      }

      if (targetCells.length === 0 && cachedCellKeys.length > 0) {
        for (const key of cachedCellKeys) {
          const node = $getNodeByKey(key);
          if ($isTableCellNode(node)) {
            targetCells.push(node);
          }
        }
      }

      for (const cell of targetCells) {
        cell.setBackgroundColor(hex);
        const domCell = editor.getElementByKey(cell.getKey());
        if (domCell) {
          domCell.style.backgroundColor = hex || "";
        }
      }
    });
    setIsOpen(false);
    setIsCustomModalOpen(false);
  };

  const handleOpenCustomModal = () => {
    setIsOpen(false);
    setIsCustomModalOpen(true);
  };

  return (
    <>
      <CustomPopover open={isOpen} onOpenChange={handleOpenChange}>
        <CustomPopoverTrigger asChild>
          <CustomToolbarButton
            disabled={disabled}
            isActive={isOpen}
            tooltip="Fill color"
            className="flex-col gap-0.5"
          >
            <PaintBucket className="format icon size-4" />
            <span
              className="h-1 w-4.5 rounded-full border border-black/10"
              style={{
                backgroundColor: activeColor || "transparent",
                backgroundImage: activeColor
                  ? "none"
                  : "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                backgroundSize: "4px 4px",
              }}
            />
          </CustomToolbarButton>
        </CustomPopoverTrigger>

        <CustomPopoverContent className="border-none bg-transparent p-0 shadow-none" sideOffset={8}>
          <CustomColorPicker
            currentColor={activeColor}
            onSelectColor={handleSelectColor}
            onClose={() => setIsOpen(false)}
            onOpenCustomModal={handleOpenCustomModal}
            showNoneOption
          />
        </CustomPopoverContent>
      </CustomPopover>

      <CustomColorModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSelectColor={handleSelectColor}
        initialColor={activeColor || "#ffffff"}
      />
    </>
  );
}

/**
 * Table Border Color Button
 */
export function TableBorderColorButton({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { toolbarState } = useToolbarState();
  const { target, setTarget } = useTableBorderTarget();
  const selectedCellCount = useSelectedCellCount(editor);
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [cachedCellKeys, setCachedCellKeys] = useState<string[]>([]);
  const [cachedTableKey, setCachedTableKey] = useState<string | null>(null);

  const activeColor = toolbarState.tableBorderColor || "#000000";

  const handleOpenChange = (open: boolean) => {
    if (open) {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        const keys: string[] = [];
        let tableKey: string | null = null;
        if ($isTableSelection(selection)) {
          for (const node of selection.getNodes()) {
            if ($isTableCellNode(node)) {
              keys.push(node.getKey());
              if (!tableKey) {
                const tbl = $findMatchingParent(node, $isTableNode);
                if (tbl) tableKey = tbl.getKey();
              }
            }
          }
        } else if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
          if ($isTableCellNode(cellNode)) {
            keys.push(cellNode.getKey());
            const tbl = $findMatchingParent(cellNode, $isTableNode);
            if (tbl) tableKey = tbl.getKey();
          }
        }
        setCachedCellKeys(keys);
        setCachedTableKey(tableKey);
      });
    }
    setIsOpen(open);
  };

  const handleSelectColor = (color: string | null) => {
    if (!color) return;
    editor.update(() => {
      const selection = $getSelection();
      let tableNode: TableNode | null = null;
      const targetCells: TableCellNode[] = [];

      if ($isTableSelection(selection)) {
        for (const node of selection.getNodes()) {
          if ($isTableCellNode(node)) {
            targetCells.push(node);
            if (!tableNode) tableNode = $findMatchingParent(node, $isTableNode);
          }
        }
      } else if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
        if ($isTableCellNode(cellNode)) {
          targetCells.push(cellNode);
          tableNode = $findMatchingParent(cellNode, $isTableNode);
        }
      }

      if (!tableNode && cachedTableKey) {
        const tbl = $getNodeByKey(cachedTableKey);
        if ($isTableNode(tbl)) tableNode = tbl;
      }

      if (targetCells.length === 0 && cachedCellKeys.length > 0) {
        for (const key of cachedCellKeys) {
          const node = $getNodeByKey(key);
          if ($isTableCellNode(node)) {
            targetCells.push(node);
            if (!tableNode) tableNode = $findMatchingParent(node, $isTableNode);
          }
        }
      }

      if (target === "table") {
        if (!tableNode && targetCells.length > 0) {
          tableNode = $findMatchingParent(targetCells[0], $isTableNode);
        }
        if ($isTableNode(tableNode)) {
          let currentTableStyle = tableNode.getStyle() || "";
          currentTableStyle = setStyleProperty(currentTableStyle, "border-color", color);
          tableNode.setStyle(currentTableStyle);

          // Apply directly to EVERY SINGLE CELL in the table so the entire table overrides cleanly
          const allCells = tableNode
            .getChildren()
            .flatMap((row) =>
              $isElementNode(row) ? row.getChildren().filter($isTableCellNode) : [],
            );
          for (const cell of allCells) {
            let cellStyle = cell.getStyle() || "";
            cellStyle = setStyleProperty(cellStyle, "border-color", color);
            const currentStyleVal = getStyleProperty(cellStyle, "border-style");
            if (!currentStyleVal || currentStyleVal === "none" || currentStyleVal === "hidden") {
              cellStyle = setStyleProperty(cellStyle, "border-style", "solid");
            }
            cellStyle = setStyleProperty(cellStyle, "--cell-border-color", null);
            cellStyle = setStyleProperty(cellStyle, "outline", null);
            cellStyle = setStyleProperty(cellStyle, "outline-offset", null);
            cell.setStyle(cellStyle);
            applyCellStyleToDOM(editor, cell, cellStyle);
          }
        }
      } else {
        // Apply directly to selected cell(s)
        for (const cell of targetCells) {
          let cellStyle = cell.getStyle() || "";
          cellStyle = setStyleProperty(cellStyle, "border-color", color);
          const currentStyleVal = getStyleProperty(cellStyle, "border-style");
          if (!currentStyleVal || currentStyleVal === "none" || currentStyleVal === "hidden") {
            cellStyle = setStyleProperty(cellStyle, "border-style", "solid");
          }
          cellStyle = setStyleProperty(cellStyle, "--cell-border-color", null);
          cellStyle = setStyleProperty(cellStyle, "outline", null);
          cellStyle = setStyleProperty(cellStyle, "outline-offset", null);
          cell.setStyle(cellStyle);
          applyCellStyleToDOM(editor, cell, cellStyle);
        }
      }
    });
    setIsOpen(false);
    setIsCustomModalOpen(false);
  };

  const handleOpenCustomModal = () => {
    setIsOpen(false);
    setIsCustomModalOpen(true);
  };

  return (
    <>
      <CustomPopover open={isOpen} onOpenChange={handleOpenChange}>
        <CustomPopoverTrigger asChild>
          <CustomToolbarButton
            disabled={disabled}
            isActive={isOpen}
            tooltip="Border color"
            className="flex-col gap-0.5"
          >
            <Square className="format icon size-4" />
            <span
              className="h-1 w-4.5 rounded-full border border-black/10"
              style={{ backgroundColor: activeColor }}
            />
          </CustomToolbarButton>
        </CustomPopoverTrigger>

        <CustomPopoverContent className="border-none bg-transparent p-0 shadow-none" sideOffset={8}>
          <CustomColorPicker
            currentColor={activeColor}
            onSelectColor={handleSelectColor}
            onClose={() => setIsOpen(false)}
            onOpenCustomModal={handleOpenCustomModal}
            size="lg"
            headerSlot={
              <TableBorderTargetSelector
                target={target}
                onTargetChange={setTarget}
                selectedCellCount={selectedCellCount}
              />
            }
          />
        </CustomPopoverContent>
      </CustomPopover>

      <CustomColorModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSelectColor={handleSelectColor}
        initialColor={activeColor}
      />
    </>
  );
}

/**
 * Table Border Width Dropdown
 */
export function TableBorderWidthDropdown({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { toolbarState } = useToolbarState();
  const { target, setTarget } = useTableBorderTarget();
  const selectedCellCount = useSelectedCellCount(editor);
  const [isOpen, setIsOpen] = useState(false);
  const [cachedCellKeys, setCachedCellKeys] = useState<string[]>([]);
  const [cachedTableKey, setCachedTableKey] = useState<string | null>(null);

  const activeWidth = toolbarState.tableBorderWidth || "1pt";

  const handleOpenChange = (open: boolean) => {
    if (open) {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        const keys: string[] = [];
        let tableKey: string | null = null;
        if ($isTableSelection(selection)) {
          for (const node of selection.getNodes()) {
            if ($isTableCellNode(node)) {
              keys.push(node.getKey());
              if (!tableKey) {
                const tbl = $findMatchingParent(node, $isTableNode);
                if (tbl) tableKey = tbl.getKey();
              }
            }
          }
        } else if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
          if ($isTableCellNode(cellNode)) {
            keys.push(cellNode.getKey());
            const tbl = $findMatchingParent(cellNode, $isTableNode);
            if (tbl) tableKey = tbl.getKey();
          }
        }
        setCachedCellKeys(keys);
        setCachedTableKey(tableKey);
      });
    }
    setIsOpen(open);
  };

  const handleSelectWidth = (width: string) => {
    editor.update(() => {
      const selection = $getSelection();
      let tableNode: TableNode | null = null;
      const targetCells: TableCellNode[] = [];

      if ($isTableSelection(selection)) {
        for (const node of selection.getNodes()) {
          if ($isTableCellNode(node)) {
            targetCells.push(node);
            if (!tableNode) tableNode = $findMatchingParent(node, $isTableNode);
          }
        }
      } else if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
        if ($isTableCellNode(cellNode)) {
          targetCells.push(cellNode);
          tableNode = $findMatchingParent(cellNode, $isTableNode);
        }
      }

      if (!tableNode && cachedTableKey) {
        const tbl = $getNodeByKey(cachedTableKey);
        if ($isTableNode(tbl)) tableNode = tbl;
      }

      if (targetCells.length === 0 && cachedCellKeys.length > 0) {
        for (const key of cachedCellKeys) {
          const node = $getNodeByKey(key);
          if ($isTableCellNode(node)) {
            targetCells.push(node);
            if (!tableNode) tableNode = $findMatchingParent(node, $isTableNode);
          }
        }
      }

      const isZero = width === "0pt" || width === "0px" || width === "0";

      if (target === "table") {
        if (!tableNode && targetCells.length > 0) {
          tableNode = $findMatchingParent(targetCells[0], $isTableNode);
        }
        if ($isTableNode(tableNode)) {
          let currentTableStyle = tableNode.getStyle() || "";
          currentTableStyle = setStyleProperty(currentTableStyle, "border-width", width);
          tableNode.setStyle(currentTableStyle);

          // Apply directly to EVERY SINGLE CELL in the table so the entire table overrides cleanly
          const allCells = tableNode
            .getChildren()
            .flatMap((row) =>
              $isElementNode(row) ? row.getChildren().filter($isTableCellNode) : [],
            );
          for (const cell of allCells) {
            let cellStyle = cell.getStyle() || "";
            if (isZero) {
              cellStyle = setStyleProperty(cellStyle, "border-width", "0px");
              cellStyle = setStyleProperty(cellStyle, "border-style", "hidden");
            } else {
              cellStyle = setStyleProperty(cellStyle, "border-width", width);
              const currentStyleVal = getStyleProperty(cellStyle, "border-style");
              if (!currentStyleVal || currentStyleVal === "none" || currentStyleVal === "hidden") {
                cellStyle = setStyleProperty(cellStyle, "border-style", "solid");
              }
            }
            cellStyle = setStyleProperty(cellStyle, "--cell-border-width", null);
            cellStyle = setStyleProperty(cellStyle, "--cell-border-style", null);
            cellStyle = setStyleProperty(cellStyle, "outline", null);
            cellStyle = setStyleProperty(cellStyle, "outline-offset", null);
            cell.setStyle(cellStyle);
            applyCellStyleToDOM(editor, cell, cellStyle);
          }
        }
      } else {
        // Apply directly to selected cell(s)
        for (const cell of targetCells) {
          let cellStyle = cell.getStyle() || "";
          if (isZero) {
            cellStyle = setStyleProperty(cellStyle, "border-width", "0px");
            cellStyle = setStyleProperty(cellStyle, "border-style", "hidden");
          } else {
            cellStyle = setStyleProperty(cellStyle, "border-width", width);
            const currentStyleVal = getStyleProperty(cellStyle, "border-style");
            if (!currentStyleVal || currentStyleVal === "none" || currentStyleVal === "hidden") {
              cellStyle = setStyleProperty(cellStyle, "border-style", "solid");
            }
          }
          cellStyle = setStyleProperty(cellStyle, "--cell-border-width", null);
          cellStyle = setStyleProperty(cellStyle, "--cell-border-style", null);
          cellStyle = setStyleProperty(cellStyle, "outline", null);
          cellStyle = setStyleProperty(cellStyle, "outline-offset", null);
          cell.setStyle(cellStyle);
          applyCellStyleToDOM(editor, cell, cellStyle);
        }
      }
    });
    setIsOpen(false);
  };

  return (
    <CustomPopover open={isOpen} onOpenChange={handleOpenChange}>
      <CustomPopoverTrigger asChild>
        <CustomToolbarButton
          disabled={disabled}
          isActive={isOpen}
          tooltip="Border width"
          className="w-fit gap-1 px-1.5!"
        >
          <Minus className="format icon size-4" />
          <ChevronDown className="text-muted-foreground size-3 shrink-0" />
        </CustomToolbarButton>
      </CustomPopoverTrigger>

      <CustomPopoverContent
        onMouseDown={(e) => e.preventDefault()}
        className="border-border bg-surface text-foreground w-80 rounded-lg border p-3 shadow-xl select-none"
        sideOffset={8}
      >
        <TableBorderTargetSelector
          target={target}
          onTargetChange={setTarget}
          selectedCellCount={selectedCellCount}
        />

        <div className="border-border/60 my-2.5 border-t" />

        <div className="flex flex-col gap-0.5">
          {BORDER_WIDTH_OPTIONS.map((opt) => {
            const isActive =
              activeWidth === opt.value || (opt.value === "1pt" && activeWidth === "1px");
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectWidth(opt.value)}
                className={cn(
                  "hover:bg-surface-hover relative flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors outline-none select-none focus:outline-none",
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-accent font-medium"
                    : "text-foreground",
                )}
              >
                <span className="text-xs font-medium">{opt.label}</span>
                <span
                  className="ml-3 h-0 grow border-t border-current opacity-80"
                  style={{
                    borderTopWidth: opt.value === "0pt" ? "1px" : opt.value,
                    borderTopStyle: opt.value === "0pt" ? "dashed" : "solid",
                    opacity: opt.value === "0pt" ? 0.35 : 1,
                  }}
                />
              </button>
            );
          })}
        </div>
      </CustomPopoverContent>
    </CustomPopover>
  );
}

/**
 * Table Cell Vertical Alignment Dropdown (Top, Middle, Bottom)
 */
export function TableCellVerticalAlignDropdown({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { toolbarState } = useToolbarState();

  const [isOpen, setIsOpen] = useState(false);
  const [cachedCellKeys, setCachedCellKeys] = useState<string[]>([]);

  const activeAlign = toolbarState.tableCellVerticalAlign || "top";

  const handleOpenChange = (open: boolean) => {
    if (open) {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        const keys: string[] = [];
        if ($isTableSelection(selection)) {
          for (const node of selection.getNodes()) {
            if ($isTableCellNode(node)) {
              keys.push(node.getKey());
            }
          }
        } else if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
          if ($isTableCellNode(cellNode)) {
            keys.push(cellNode.getKey());
          }
        }
        setCachedCellKeys(keys);
      });
    }
    setIsOpen(open);
  };

  const handleSelectAlign = (align: "top" | "middle" | "bottom") => {
    editor.update(() => {
      const selection = $getSelection();
      const targetCells: TableCellNode[] = [];

      if ($isTableSelection(selection)) {
        const nodes = selection.getNodes();
        for (const node of nodes) {
          if ($isTableCellNode(node)) {
            targetCells.push(node);
          }
        }
      } else if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
        if ($isTableCellNode(cellNode)) {
          targetCells.push(cellNode);
        }
      }

      if (targetCells.length === 0 && cachedCellKeys.length > 0) {
        for (const key of cachedCellKeys) {
          const node = $getNodeByKey(key);
          if ($isTableCellNode(node)) {
            targetCells.push(node);
          }
        }
      }

      for (const cell of targetCells) {
        cell.setVerticalAlign(align);
        const domCell = editor.getElementByKey(cell.getKey());
        if (domCell) {
          domCell.style.verticalAlign = align;
        }
      }
    });
    setIsOpen(false);
  };

  const renderActiveIcon = () => {
    switch (activeAlign) {
      case "middle":
        return <AlignVerticalJustifyCenter className="format icon size-4" />;
      case "bottom":
        return <AlignVerticalJustifyEnd className="format icon size-4" />;
      case "top":
      default:
        return <AlignVerticalJustifyStart className="format icon size-4" />;
    }
  };

  return (
    <CustomDropdown open={isOpen} onOpenChange={handleOpenChange}>
      <CustomDropdownTrigger asChild>
        <CustomToolbarButton
          disabled={disabled}
          tooltip="Vertical alignment"
          className="w-fit gap-1 px-1.5!"
        >
          {renderActiveIcon()}
          <ChevronDown className="text-muted-foreground size-3 shrink-0" />
        </CustomToolbarButton>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-32 p-1">
        <CustomDropdownItem
          isActive={activeAlign === "top"}
          onClick={() => handleSelectAlign("top")}
          className="flex items-center gap-2"
        >
          <AlignVerticalJustifyStart className="size-4" />
          <span className="text-xs font-medium">Top</span>
        </CustomDropdownItem>
        <CustomDropdownItem
          isActive={activeAlign === "middle"}
          onClick={() => handleSelectAlign("middle")}
          className="flex items-center gap-2"
        >
          <AlignVerticalJustifyCenter className="size-4" />
          <span className="text-xs font-medium">Middle</span>
        </CustomDropdownItem>
        <CustomDropdownItem
          isActive={activeAlign === "bottom"}
          onClick={() => handleSelectAlign("bottom")}
          className="flex items-center gap-2"
        >
          <AlignVerticalJustifyEnd className="size-4" />
          <span className="text-xs font-medium">Bottom</span>
        </CustomDropdownItem>
      </CustomDropdownContent>
    </CustomDropdown>
  );
}

/**
 * Table Quick Actions Dropdown (Insert/Delete Row/Column/Table, Merge/Unmerge)
 */
export function TableQuickActionsDropdown({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();

  const insertRow = useCallback(
    (insertAfter: boolean) => {
      editor.update(() => {
        $insertTableRowAtSelection(insertAfter);
      });
    },
    [editor],
  );

  const deleteRow = useCallback(() => {
    editor.update(() => {
      $deleteTableRowAtSelection();
    });
  }, [editor]);

  const insertColumn = useCallback(
    (insertAfter: boolean) => {
      editor.update(() => {
        $insertTableColumnAtSelection(insertAfter);
      });
    },
    [editor],
  );

  const deleteColumn = useCallback(() => {
    editor.update(() => {
      $deleteTableColumnAtSelection();
    });
  }, [editor]);

  const mergeCells = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isTableSelection(selection)) {
        const nodes = selection.getNodes();
        const tableCells = nodes.filter($isTableCellNode);
        $mergeCells(tableCells);
      }
    });
  }, [editor]);

  const unmergeCells = useCallback(() => {
    editor.update(() => {
      $unmergeCell();
    });
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      let tableNode: TableNode | null = null;

      if ($isTableSelection(selection)) {
        const firstCell = selection.getNodes().find($isTableCellNode);
        if (firstCell) {
          tableNode = $findMatchingParent(firstCell, $isTableNode);
        }
      } else if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
        if (cellNode) {
          tableNode = $findMatchingParent(cellNode, $isTableNode);
        }
      }

      if ($isTableNode(tableNode)) {
        let nextFocus = tableNode.getNextSibling() || tableNode.getPreviousSibling();
        if (!nextFocus) {
          const p = $createParagraphNode();
          tableNode.insertAfter(p);
          nextFocus = p;
        }
        tableNode.remove();
        if ($isElementNode(nextFocus)) {
          nextFocus.selectStart();
        }
      }
    });
  }, [editor]);

  return (
    <CustomDropdown>
      <CustomDropdownTrigger asChild>
        <CustomToolbarButton
          disabled={disabled}
          tooltip="Table options"
          className="w-fit gap-1 px-1.5!"
        >
          <TableIcon className="format icon size-4" />
          <ChevronDown className="text-muted-foreground size-3 shrink-0" />
        </CustomToolbarButton>
      </CustomDropdownTrigger>

      <CustomDropdownContent className="w-56 p-1">
        <CustomDropdownItem onClick={() => insertRow(false)}>
          <div className="flex items-center gap-2">
            <ArrowUpToLine className="text-muted-foreground size-4" />
            <span className="text-xs">Insert 1 row above</span>
          </div>
        </CustomDropdownItem>
        <CustomDropdownItem onClick={() => insertRow(true)}>
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="text-muted-foreground size-4" />
            <span className="text-xs">Insert 1 row below</span>
          </div>
        </CustomDropdownItem>
        <CustomDropdownItem
          onClick={deleteRow}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="size-4" />
            <span className="text-xs">Delete row</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownSeparator />

        <CustomDropdownItem onClick={() => insertColumn(false)}>
          <div className="flex items-center gap-2">
            <ArrowLeftToLine className="text-muted-foreground size-4" />
            <span className="text-xs">Insert 1 column left</span>
          </div>
        </CustomDropdownItem>
        <CustomDropdownItem onClick={() => insertColumn(true)}>
          <div className="flex items-center gap-2">
            <ArrowRightToLine className="text-muted-foreground size-4" />
            <span className="text-xs">Insert 1 column right</span>
          </div>
        </CustomDropdownItem>
        <CustomDropdownItem
          onClick={deleteColumn}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="size-4" />
            <span className="text-xs">Delete column</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownSeparator />

        <CustomDropdownItem onClick={mergeCells}>
          <div className="flex items-center gap-2">
            <Combine className="text-muted-foreground size-4" />
            <span className="text-xs">Merge cells</span>
          </div>
        </CustomDropdownItem>
        <CustomDropdownItem onClick={unmergeCells}>
          <div className="flex items-center gap-2">
            <Split className="text-muted-foreground size-4" />
            <span className="text-xs">Unmerge cells</span>
          </div>
        </CustomDropdownItem>

        <CustomDropdownSeparator />

        <CustomDropdownItem
          onClick={deleteTable}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="size-4" />
            <span className="text-xs">Delete table</span>
          </div>
        </CustomDropdownItem>
      </CustomDropdownContent>
    </CustomDropdown>
  );
}

/**
 * Main Table Contextual Toolbar
 */
export default function TableContextualToolbar({
  disabled = false,
}: {
  disabled?: boolean;
}): React.JSX.Element {
  const [editor] = useLexicalComposerContext();
  const selectedCellCount = useSelectedCellCount(editor);
  const [userTargetOverride, setUserTargetOverride] = useState<BorderTarget | null>(null);

  // Default to "cell" so formatting immediately targets the active cell or selection; user can toggle to "table"
  const target: BorderTarget = userTargetOverride !== null ? userTargetOverride : "cell";

  return (
    <TableBorderTargetContext.Provider
      value={{
        target,
        setTarget: setUserTargetOverride,
      }}
    >
      <div className="inline-flex items-center gap-0.5">
        <TableFillColorButton disabled={disabled} />
        <TableBorderColorButton disabled={disabled} />
        <TableBorderWidthDropdown disabled={disabled} />
        <TableCellVerticalAlignDropdown disabled={disabled} />
        <TableQuickActionsDropdown disabled={disabled} />
      </div>
    </TableBorderTargetContext.Provider>
  );
}
