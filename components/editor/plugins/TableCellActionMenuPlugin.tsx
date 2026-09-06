"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getNodeTriplet,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableSelection,
  $mergeCells,
  $unmergeCell,
  TableCellNode,
  TableNode,
} from "@lexical/table";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  NodeKey,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  ChevronDown,
  Combine,
  Palette,
  Split,
  Table,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  CustomDropdownContent,
  CustomDropdownItem,
  CustomDropdownSeparator,
  CustomDropdownSub,
  CustomDropdownSubContent,
  CustomDropdownSubTrigger,
} from "@/components/ui/custom/CustomDropdown";

// Curated cell background swatches (transparency, neutral grays, soft document highlight tones)
const CELL_BG_SWATCHES = [
  { name: "None", value: "" },
  { name: "Light Gray", value: "#f1f3f4" },
  { name: "Gray", value: "#e8eaed" },
  { name: "Soft Red", value: "#fce8e6" },
  { name: "Soft Orange", value: "#fef7e0" },
  { name: "Soft Yellow", value: "#feefc3" },
  { name: "Soft Green", value: "#e6f4ea" },
  { name: "Soft Cyan", value: "#e4f7fb" },
  { name: "Soft Blue", value: "#e8f0fe" },
  { name: "Soft Purple", value: "#f3e8fd" },
  { name: "Soft Pink", value: "#fce8e6" },
  { name: "Dark Neutral", value: "#3c4043" },
];

interface TableCellActionMenuPluginProps {
  anchorElem: HTMLElement;
  cellMerge?: boolean;
}

export default function TableCellActionMenuPlugin({
  anchorElem,
  cellMerge = true,
}: TableCellActionMenuPluginProps): React.ReactPortal | null {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();

  const [targetCellKey, setTargetCellKey] = useState<NodeKey | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [canMerge, setCanMerge] = useState(false);
  const [canUnmerge, setCanUnmerge] = useState(false);

  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  const updateMenu = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
        if (!isOpen) {
          setIsVisible(false);
          setTargetCellKey(null);
        }
        return;
      }

      let activeCellNode: TableCellNode | null = null;

      if ($isRangeSelection(selection)) {
        activeCellNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
      } else if ($isTableSelection(selection)) {
        const anchorNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
        if ($isTableCellNode(anchorNode)) {
          activeCellNode = anchorNode;
        }
      }

      if (!activeCellNode || !activeCellNode.isAttached()) {
        if (!isOpen) {
          setIsVisible(false);
          setTargetCellKey(null);
        }
        return;
      }

      const cellDOM = editor.getElementByKey(activeCellNode.getKey());
      if (!cellDOM || !anchorElem.contains(cellDOM)) {
        if (!isOpen) {
          setIsVisible(false);
          setTargetCellKey(null);
        }
        return;
      }

      const cellRect = cellDOM.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();

      // Ensure cell is rendered with reasonable dimensions
      if (cellRect.width < 20 || cellRect.height < 15) {
        return;
      }

      // Position button at top-right corner inside cell
      const top = cellRect.top - anchorRect.top + 4;
      const left = cellRect.right - anchorRect.left - 24;

      setPosition({ top, left });
      setTargetCellKey(activeCellNode.getKey());
      setIsVisible(true);

      // Check merge capabilities
      if (cellMerge) {
        if ($isTableSelection(selection)) {
          const isCollapsed = selection.anchor.is(selection.focus);
          setCanMerge(!isCollapsed);
        } else {
          setCanMerge(false);
        }

        try {
          const [cell] = $getNodeTriplet(selection.anchor);
          if (cell && $isTableCellNode(cell)) {
            setCanUnmerge(cell.getColSpan() > 1 || cell.getRowSpan() > 1);
          } else {
            setCanUnmerge(false);
          }
        } catch {
          setCanUnmerge(false);
        }
      }
    });
  }, [editor, anchorElem, isOpen, cellMerge]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateMenu();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerMutationListener(TableCellNode, () => {
        updateMenu();
      }),
      editor.registerMutationListener(TableNode, () => {
        updateMenu();
      }),
    );
  }, [editor, updateMenu]);

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (isVisible) {
        updateMenu();
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isVisible, updateMenu]);

  const insertRow = (shouldInsertAfter: boolean) => {
    editor.update(() => {
      $insertTableRowAtSelection(shouldInsertAfter);
    });
    setIsOpen(false);
  };

  const deleteRow = () => {
    editor.update(() => {
      $deleteTableRowAtSelection();
    });
    setIsOpen(false);
  };

  const insertColumn = (shouldInsertAfter: boolean) => {
    editor.update(() => {
      $insertTableColumnAtSelection(shouldInsertAfter);
    });
    setIsOpen(false);
  };

  const deleteColumn = () => {
    editor.update(() => {
      $deleteTableColumnAtSelection();
    });
    setIsOpen(false);
  };

  const mergeCells = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isTableSelection(selection)) {
        const nodes = selection.getNodes();
        const tableCells = nodes.filter($isTableCellNode);
        $mergeCells(tableCells);
      }
    });
    setIsOpen(false);
  };

  const unmergeCells = () => {
    editor.update(() => {
      $unmergeCell();
    });
    setIsOpen(false);
  };

  const setCellBackgroundColor = (color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isTableSelection(selection)) {
        const nodes = selection.getNodes();
        for (const node of nodes) {
          if ($isTableCellNode(node)) {
            node.setBackgroundColor(color);
          }
        }
      } else if (targetCellKey) {
        const cellNode = $getNodeByKey(targetCellKey);
        if ($isTableCellNode(cellNode)) {
          cellNode.setBackgroundColor(color);
        }
      }
    });
    setIsOpen(false);
  };

  const deleteTable = () => {
    editor.update(() => {
      if (!targetCellKey) return;
      const cellNode = $getNodeByKey(targetCellKey);
      if (!cellNode || !cellNode.isAttached()) return;
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);

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
    });
    setIsOpen(false);
    setIsVisible(false);
    setTargetCellKey(null);
  };

  if (!isEditable || !isVisible) {
    return null;
  }

  return createPortal(
    <div
      ref={menuContainerRef}
      className="pointer-events-auto absolute z-20"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Table cell actions"
            onMouseDown={(e) => e.preventDefault()}
            className="border-border/80 bg-surface/90 hover:bg-surface-hover text-muted hover:text-foreground flex size-5 cursor-pointer items-center justify-center rounded border shadow-xs backdrop-blur-xs transition-colors focus:outline-none"
          >
            <ChevronDown className="size-3" />
          </button>
        </DropdownMenuTrigger>

        <CustomDropdownContent align="end" side="bottom" className="w-60">
          <DropdownMenuGroup>
            <CustomDropdownItem
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertRow(false)}
            >
              <div className="flex items-center gap-2">
                <ArrowUpToLine className="text-muted-foreground size-4" />
                <span className="text-sm">Insert 1 row above</span>
              </div>
            </CustomDropdownItem>

            <CustomDropdownItem
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertRow(true)}
            >
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="text-muted-foreground size-4" />
                <span className="text-sm">Insert 1 row below</span>
              </div>
            </CustomDropdownItem>

            <CustomDropdownItem
              onMouseDown={(e) => e.preventDefault()}
              onClick={deleteRow}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="size-4" />
                <span className="text-sm">Delete row</span>
              </div>
            </CustomDropdownItem>
          </DropdownMenuGroup>

          <CustomDropdownSeparator />

          <DropdownMenuGroup>
            <CustomDropdownItem
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertColumn(false)}
            >
              <div className="flex items-center gap-2">
                <ArrowLeftToLine className="text-muted-foreground size-4" />
                <span className="text-sm">Insert 1 column left</span>
              </div>
            </CustomDropdownItem>

            <CustomDropdownItem
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertColumn(true)}
            >
              <div className="flex items-center gap-2">
                <ArrowRightToLine className="text-muted-foreground size-4" />
                <span className="text-sm">Insert 1 column right</span>
              </div>
            </CustomDropdownItem>

            <CustomDropdownItem
              onMouseDown={(e) => e.preventDefault()}
              onClick={deleteColumn}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="size-4" />
                <span className="text-sm">Delete column</span>
              </div>
            </CustomDropdownItem>
          </DropdownMenuGroup>

          {cellMerge && (canMerge || canUnmerge) && (
            <>
              <CustomDropdownSeparator />
              <DropdownMenuGroup>
                {canMerge && (
                  <CustomDropdownItem onMouseDown={(e) => e.preventDefault()} onClick={mergeCells}>
                    <div className="flex items-center gap-2">
                      <Combine className="text-muted-foreground size-4" />
                      <span className="text-sm">Merge cells</span>
                    </div>
                  </CustomDropdownItem>
                )}
                {canUnmerge && (
                  <CustomDropdownItem
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={unmergeCells}
                  >
                    <div className="flex items-center gap-2">
                      <Split className="text-muted-foreground size-4" />
                      <span className="text-sm">Unmerge cell</span>
                    </div>
                  </CustomDropdownItem>
                )}
              </DropdownMenuGroup>
            </>
          )}

          <CustomDropdownSeparator />

          <DropdownMenuGroup>
            <CustomDropdownSub>
              <CustomDropdownSubTrigger onMouseDown={(e) => e.preventDefault()}>
                <div className="flex items-center gap-2">
                  <Palette className="text-muted-foreground size-4" />
                  <span className="text-sm">Background color</span>
                </div>
              </CustomDropdownSubTrigger>
              <CustomDropdownSubContent className="w-48 p-2">
                <div className="grid grid-cols-4 gap-1.5">
                  {CELL_BG_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.name}
                      type="button"
                      title={swatch.name}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setCellBackgroundColor(swatch.value)}
                      className="border-border hover:border-primary relative flex size-7 cursor-pointer items-center justify-center rounded border transition-transform hover:scale-110 focus:outline-none"
                      style={{
                        backgroundColor: swatch.value || "transparent",
                      }}
                    >
                      {!swatch.value && (
                        <div className="border-destructive/60 absolute h-5 w-0.5 rotate-45 border-l" />
                      )}
                    </button>
                  ))}
                </div>
              </CustomDropdownSubContent>
            </CustomDropdownSub>
          </DropdownMenuGroup>

          <CustomDropdownSeparator />

          <DropdownMenuGroup>
            <CustomDropdownItem
              onMouseDown={(e) => e.preventDefault()}
              onClick={deleteTable}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <div className="flex items-center gap-2">
                <Table className="size-4" />
                <span className="text-sm">Delete table</span>
              </div>
            </CustomDropdownItem>
          </DropdownMenuGroup>
        </CustomDropdownContent>
      </DropdownMenu>
    </div>,
    anchorElem,
  );
}
