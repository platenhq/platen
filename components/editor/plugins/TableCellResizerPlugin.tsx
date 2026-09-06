"use client";

import React, {
  CSSProperties,
  PointerEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import {
  $computeTableMapSkipCellCheck,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  $isTableRowNode,
  getDOMCellFromTarget,
  getTableElement,
  TableCellNode,
  TableDOMCell,
  TableMapType,
  TableNode,
} from "@lexical/table";
import { calculateZoomLevel, mergeRegister } from "@lexical/utils";
import {
  $getNearestNodeFromDOMNode,
  isHTMLElement,
  LexicalEditor,
  NodeKey,
  SKIP_SCROLL_INTO_VIEW_TAG,
} from "lexical";

type PointerPosition = {
  x: number;
  y: number;
};

type PointerDraggingDirection = "right" | "bottom";

const MIN_ROW_HEIGHT = 28;
const MIN_COLUMN_WIDTH = 50;
const ACTIVE_RESIZER_COLOR = "#1a73e8";

/**
 * Accurately determines the printable page width available for tables.
 * Reads directly from the `.page-canvas` container (or `.page-canvas-pageless`),
 * which maintains the fixed document page width (e.g. 816px for Letter with 96px margins = 624px)
 * and is immune to any currently overflowing table children.
 */
function getAvailableTableWidth(editor: LexicalEditor): number {
  const rootEl = editor.getRootElement();
  if (!rootEl) return 624;

  const pageCanvas = rootEl.closest(".page-canvas, .page-canvas-pageless") as HTMLElement | null;
  if (pageCanvas) {
    const style = window.getComputedStyle(pageCanvas);
    const padLeft = parseFloat(style.paddingLeft) || 0;
    const padRight = parseFloat(style.paddingRight) || 0;
    const width = pageCanvas.clientWidth - padLeft - padRight;
    if (width > 0) {
      return Math.floor(width);
    }
  }

  return rootEl.clientWidth > 0 ? rootEl.clientWidth : 624;
}

function TableCellResizer({ editor }: { editor: LexicalEditor }): React.JSX.Element {
  const targetRef = useRef<HTMLElement | null>(null);
  const resizerRef = useRef<HTMLDivElement | null>(null);
  const tableRectRef = useRef<DOMRect | null>(null);
  const [hasTable, setHasTable] = useState(false);

  const pointerStartPosRef = useRef<PointerPosition | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => resizeCleanupRef.current?.(), []);

  const [pointerCurrentPos, setPointerCurrentPos] = useState<PointerPosition | null>(null);
  const [activeCell, setActiveCell] = useState<TableDOMCell | null>(null);
  const [draggingDirection, setDraggingDirection] = useState<PointerDraggingDirection | null>(null);
  const [hoveredDirection, setHoveredDirection] = useState<PointerDraggingDirection | null>(null);
  const [isLastColumn, setIsLastColumn] = useState(false);
  const [colSpanLimits, setColSpanLimits] = useState<{ minX: number; maxX: number } | null>(null);

  const resetState = useCallback(() => {
    setActiveCell(null);
    targetRef.current = null;
    setDraggingDirection(null);
    setHoveredDirection(null);
    pointerStartPosRef.current = null;
    tableRectRef.current = null;
    setIsLastColumn(false);
    setColSpanLimits(null);
  }, []);

  // Track tables and enforce proportional fit-to-page column constraints
  useEffect(() => {
    const tableKeys = new Set<NodeKey>();
    return mergeRegister(
      editor.registerMutationListener(TableNode, (nodeMutations) => {
        for (const [nodeKey, mutation] of nodeMutations) {
          if (mutation === "destroyed") {
            tableKeys.delete(nodeKey);
          } else {
            tableKeys.add(nodeKey);
          }
        }
        setHasTable(tableKeys.size > 0);
      }),
      editor.registerNodeTransform(TableNode, (tableNode) => {
        const numColumns = tableNode.getColumnCount();
        if (numColumns === 0) return tableNode;

        const availableWidth = getAvailableTableWidth(editor);
        const minTableWidth = numColumns * MIN_COLUMN_WIDTH;
        const targetWidth = Math.max(availableWidth, minTableWidth);

        const currentColWidths = tableNode.getColWidths();

        // Case 1: Brand new table with no colWidths set yet
        if (!currentColWidths || currentColWidths.length === 0) {
          const baseWidth = Math.max(Math.floor(targetWidth / numColumns), MIN_COLUMN_WIDTH);
          const widths = Array(numColumns).fill(baseWidth);
          const remainder = targetWidth - baseWidth * numColumns;
          if (remainder > 0) {
            widths[numColumns - 1] += remainder;
          }
          tableNode.setColWidths(widths);
          return tableNode;
        }

        // Case 2: Column count mismatch (column added or deleted via action menu)
        // or total width mismatch (e.g. table currently overflows page canvas)
        const currentSum = currentColWidths.reduce((acc, w) => acc + w, 0);
        const countMismatch = currentColWidths.length !== numColumns;
        const widthMismatch = Math.abs(currentSum - targetWidth) > 2;

        if (countMismatch || widthMismatch) {
          let rawWidths: number[];
          if (countMismatch) {
            if (currentColWidths.length < numColumns) {
              const missing = numColumns - currentColWidths.length;
              const fillWidth = Math.max(Math.floor(targetWidth / numColumns), MIN_COLUMN_WIDTH);
              rawWidths = [...currentColWidths, ...Array(missing).fill(fillWidth)];
            } else {
              rawWidths = currentColWidths.slice(0, numColumns);
            }
          } else {
            rawWidths = [...currentColWidths];
          }

          // Scale proportionally to targetWidth
          const rawSum = rawWidths.reduce((acc, w) => acc + w, 0);
          const scale = rawSum > 0 ? targetWidth / rawSum : 1;
          const scaledWidths = rawWidths.map((w) =>
            Math.max(Math.floor(w * scale), MIN_COLUMN_WIDTH),
          );

          // Fix any residual rounding difference on the last column
          const scaledSum = scaledWidths.reduce((acc, w) => acc + w, 0);
          const diff = targetWidth - scaledSum;
          if (diff !== 0 && scaledWidths.length > 0) {
            scaledWidths[scaledWidths.length - 1] = Math.max(
              scaledWidths[scaledWidths.length - 1] + diff,
              MIN_COLUMN_WIDTH,
            );
          }

          // Strict equality check to avoid infinite transform loops
          const isDifferent =
            currentColWidths.length !== scaledWidths.length ||
            currentColWidths.some((w, idx) => w !== scaledWidths[idx]);

          if (isDifferent) {
            tableNode.setColWidths(scaledWidths);
          }
        }

        return tableNode;
      }),
    );
  }, [editor]);

  // Pointer movement tracking over table cells
  useEffect(() => {
    if (!hasTable) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const target = event.target;
      if (!isHTMLElement(target)) {
        return;
      }

      if (draggingDirection) {
        event.preventDefault();
        event.stopPropagation();
        setPointerCurrentPos({
          x: event.clientX,
          y: event.clientY,
        });
        return;
      }

      if (resizerRef.current && resizerRef.current.contains(target)) {
        return;
      }

      if (targetRef.current !== target) {
        targetRef.current = target;
        const cell = getDOMCellFromTarget(target);

        if (cell && activeCell !== cell) {
          editor.read(() => {
            const tableCellNode = $getNearestNodeFromDOMNode(cell.elem);
            if (!$isTableCellNode(tableCellNode)) {
              return;
            }

            const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
            const tableElement = getTableElement(
              tableNode,
              editor.getElementByKey(tableNode.getKey()),
            );

            if (!tableElement) {
              return;
            }

            const [tableMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
            const colIdx = getCellColumnIndex(tableCellNode, tableMap);
            const numCols = tableNode.getColumnCount();
            const lastCol = colIdx !== undefined && colIdx >= numCols - 1;
            setIsLastColumn(lastCol);

            if (colIdx !== undefined && !lastCol) {
              const colWidths = tableNode.getColWidths();
              const zoom = calculateZoomLevel(cell.elem) || 1;
              const cellRect = cell.elem.getBoundingClientRect();
              if (colWidths && colIdx < colWidths.length - 1) {
                const leftWidth = colWidths[colIdx];
                const rightWidth = colWidths[colIdx + 1];
                const totalSpan = (leftWidth + rightWidth) * zoom;
                setColSpanLimits({
                  minX: cellRect.left + MIN_COLUMN_WIDTH * zoom,
                  maxX: cellRect.left + totalSpan - MIN_COLUMN_WIDTH * zoom,
                });
              } else {
                setColSpanLimits(null);
              }
            } else {
              setColSpanLimits(null);
            }

            targetRef.current = target;
            tableRectRef.current = tableElement.getBoundingClientRect();
            setActiveCell(cell);
          });
        } else if (cell == null) {
          resetState();
        }
      }
    };

    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    rootElement.addEventListener("pointermove", onPointerMove);
    const resizerContainer = resizerRef.current;
    if (resizerContainer) {
      resizerContainer.addEventListener("pointermove", onPointerMove, {
        capture: true,
      });
    }

    return () => {
      rootElement.removeEventListener("pointermove", onPointerMove);
      if (resizerContainer) {
        resizerContainer.removeEventListener("pointermove", onPointerMove, {
          capture: true,
        });
      }
    };
  }, [activeCell, draggingDirection, editor, resetState, hasTable]);

  const isHeightChanging = (direction: PointerDraggingDirection) => direction === "bottom";

  const getCellNodeHeight = (
    cell: TableCellNode,
    activeEditor: LexicalEditor,
  ): number | undefined => {
    const domCellNode = activeEditor.getElementByKey(cell.getKey());
    return domCellNode?.clientHeight;
  };

  const getCellColumnIndex = (
    tableCellNode: TableCellNode,
    tableMap: TableMapType,
  ): number | undefined => {
    for (let row = 0; row < tableMap.length; row++) {
      for (let column = 0; column < tableMap[row].length; column++) {
        if (tableMap[row][column].cell === tableCellNode) {
          return column;
        }
      }
    }
  };

  const updateRowHeight = useCallback(
    (heightChange: number) => {
      if (!activeCell) return;

      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
          if (!$isTableCellNode(tableCellNode)) return;

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
          const baseRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
          const tableRows = tableNode.getChildren();

          const isFullRowMerge = tableCellNode.getColSpan() === tableNode.getColumnCount();
          const tableRowIndex = isFullRowMerge
            ? baseRowIndex
            : baseRowIndex + tableCellNode.getRowSpan() - 1;

          if (tableRowIndex >= tableRows.length || tableRowIndex < 0) return;

          const tableRow = tableRows[tableRowIndex];
          if (!$isTableRowNode(tableRow)) return;

          let height = tableRow.getHeight();
          if (height === undefined) {
            const rowCells = tableRow.getChildren().filter($isTableCellNode);
            height = Math.min(
              ...rowCells.map((cell) => getCellNodeHeight(cell, editor) ?? Infinity),
            );
          }

          const newHeight = Math.max(height + heightChange, MIN_ROW_HEIGHT);
          tableRow.setHeight(newHeight);
        },
        { tag: SKIP_SCROLL_INTO_VIEW_TAG },
      );
    },
    [activeCell, editor],
  );

  const updateColumnWidth = useCallback(
    (widthChange: number) => {
      if (!activeCell) return;

      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);
          if (!$isTableCellNode(tableCellNode)) return;

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
          const [tableMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
          const columnIndex = getCellColumnIndex(tableCellNode, tableMap);

          if (columnIndex === undefined) return;

          const colWidths = tableNode.getColWidths();
          if (!colWidths || columnIndex >= colWidths.length - 1) return;

          const leftWidth = colWidths[columnIndex];
          const rightIndex = columnIndex + 1;
          const rightWidth = colWidths[rightIndex];
          if (leftWidth === undefined || rightWidth === undefined) return;

          // Proportional two-column redistribution:
          // Left column can only grow as much as right column can shrink without dropping below MIN_COLUMN_WIDTH.
          // Left column can only shrink as much as left column can shrink without dropping below MIN_COLUMN_WIDTH.
          const maxDelta = rightWidth - MIN_COLUMN_WIDTH;
          const minDelta = -(leftWidth - MIN_COLUMN_WIDTH);
          const clampedDelta = Math.max(minDelta, Math.min(widthChange, maxDelta));

          if (clampedDelta === 0) return;

          const newColWidths = [...colWidths];
          newColWidths[columnIndex] = leftWidth + clampedDelta;
          newColWidths[rightIndex] = rightWidth - clampedDelta;

          tableNode.setColWidths(newColWidths);
        },
        { tag: SKIP_SCROLL_INTO_VIEW_TAG },
      );
    },
    [activeCell, editor],
  );

  const pointerUpHandler = useCallback(
    (direction: PointerDraggingDirection) => {
      return (event: PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (activeCell) {
          const zoom = calculateZoomLevel(activeCell.elem) || 1;

          if (isHeightChanging(direction)) {
            const { height, top } = activeCell.elem.getBoundingClientRect();
            const heightChange = Math.round((event.clientY - (top + height)) / zoom);
            updateRowHeight(heightChange);
          } else {
            const { left, width } = activeCell.elem.getBoundingClientRect();
            let cursorX = event.clientX;
            if (colSpanLimits) {
              cursorX = Math.max(colSpanLimits.minX, Math.min(cursorX, colSpanLimits.maxX));
            }
            const widthChange = Math.round((cursorX - (left + width)) / zoom);
            updateColumnWidth(widthChange);
          }

          resetState();
          resizeCleanupRef.current?.();
          resizeCleanupRef.current = null;
        }
      };
    },
    [activeCell, colSpanLimits, resetState, updateColumnWidth, updateRowHeight],
  );

  const toggleResize = useCallback(
    (direction: PointerDraggingDirection): PointerEventHandler<HTMLDivElement> =>
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) return;

        pointerStartPosRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
        setPointerCurrentPos(pointerStartPosRef.current);
        setDraggingDirection(direction);

        resizeCleanupRef.current?.();
        const doc = activeCell.elem.ownerDocument;
        const upHandler = pointerUpHandler(direction);
        doc.addEventListener("pointerup", upHandler, { once: true });
        resizeCleanupRef.current = () => doc.removeEventListener("pointerup", upHandler);
      },
    [activeCell, pointerUpHandler],
  );

  const getResizers = useCallback((): Record<string, CSSProperties | null> => {
    if (activeCell) {
      const { height, width, top, left } = activeCell.elem.getBoundingClientRect();
      const zoom = calculateZoomLevel(activeCell.elem) || 1;
      const zoneWidth = 14;

      const styles: Record<string, CSSProperties | null> = {
        bottom: {
          backgroundColor: "transparent",
          cursor: "row-resize",
          height: `${zoneWidth}px`,
          left: `${window.scrollX + left}px`,
          top: `${window.scrollY + top + height - zoneWidth / 2}px`,
          width: `${width}px`,
        },
        right: isLastColumn
          ? null
          : {
              backgroundColor: "transparent",
              cursor: "col-resize",
              height: `${height}px`,
              left: `${window.scrollX + left + width - zoneWidth / 2}px`,
              top: `${window.scrollY + top}px`,
              width: `${zoneWidth}px`,
            },
      };

      const tableRect = tableRectRef.current;

      if (draggingDirection && pointerCurrentPos && tableRect) {
        if (isHeightChanging(draggingDirection)) {
          styles[draggingDirection]!.left = `${window.scrollX + tableRect.left}px`;
          styles[draggingDirection]!.top = `${window.scrollY + pointerCurrentPos.y / zoom}px`;
          styles[draggingDirection]!.height = "3px";
          styles[draggingDirection]!.width = `${tableRect.width}px`;
        } else if (styles[draggingDirection]) {
          let posX = pointerCurrentPos.x;
          if (colSpanLimits) {
            posX = Math.max(colSpanLimits.minX, Math.min(posX, colSpanLimits.maxX));
          }
          styles[draggingDirection]!.top = `${window.scrollY + tableRect.top}px`;
          styles[draggingDirection]!.left = `${window.scrollX + posX / zoom}px`;
          styles[draggingDirection]!.width = "3px";
          styles[draggingDirection]!.height = `${tableRect.height}px`;
        }

        if (styles[draggingDirection]) {
          styles[draggingDirection]!.backgroundColor = ACTIVE_RESIZER_COLOR;
          styles[draggingDirection]!.mixBlendMode = "unset";
        }
      } else if (!draggingDirection && hoveredDirection === "right" && styles.right) {
        const halfZoneWidth = zoneWidth / 2;
        const highlightWidth = 2;
        const highlightStart = halfZoneWidth - highlightWidth / 2;
        styles.right.backgroundImage = `linear-gradient(90deg, transparent ${highlightStart}px, ${ACTIVE_RESIZER_COLOR} ${highlightStart}px, ${ACTIVE_RESIZER_COLOR} ${
          highlightStart + highlightWidth
        }px, transparent ${highlightStart + highlightWidth}px)`;
        styles.right.mixBlendMode = "unset";
        if (tableRect) {
          styles.right.top = `${window.scrollY + tableRect.top}px`;
          styles.right.height = `${tableRect.height}px`;
        }
      }

      return styles;
    }

    return {
      bottom: null,
      right: null,
    };
  }, [
    activeCell,
    colSpanLimits,
    draggingDirection,
    hoveredDirection,
    isLastColumn,
    pointerCurrentPos,
  ]);

  const handlePointerEnter = useCallback(
    (direction: PointerDraggingDirection): PointerEventHandler<HTMLDivElement> =>
      () => {
        if (!draggingDirection) {
          setHoveredDirection(direction);
        }
      },
    [draggingDirection],
  );

  const handlePointerLeave = useCallback(() => {
    if (!draggingDirection) {
      setHoveredDirection(null);
    }
  }, [draggingDirection]);

  const resizerStyles = getResizers();

  return (
    <div ref={resizerRef}>
      {activeCell != null && (
        <>
          {resizerStyles.right && (
            <div
              className="TableCellResizer__resizer TableCellResizer__ui"
              style={resizerStyles.right}
              onPointerEnter={handlePointerEnter("right")}
              onPointerLeave={handlePointerLeave}
              onPointerDown={toggleResize("right")}
            />
          )}
          {resizerStyles.bottom && (
            <div
              className="TableCellResizer__resizer TableCellResizer__ui"
              style={resizerStyles.bottom}
              onPointerDown={toggleResize("bottom")}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function TableCellResizerPlugin(): React.ReactPortal | null {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();

  const portalTarget =
    editor.getRootElement()?.ownerDocument?.body ??
    (typeof document !== "undefined" ? document.body : null);

  return useMemo(
    () =>
      isEditable && portalTarget
        ? createPortal(<TableCellResizer editor={editor} />, portalTarget)
        : null,
    [editor, isEditable, portalTarget],
  );
}
