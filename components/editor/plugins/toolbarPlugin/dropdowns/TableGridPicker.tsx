"use client";

import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_TABLE_COMMAND } from "@lexical/table";

interface TableGridPickerProps {
  maxRows?: number;
  maxCols?: number;
  onClose?: () => void;
}

export const TableGridPicker: React.FC<TableGridPickerProps> = ({
  maxRows = 8,
  maxCols = 8,
  onClose,
}) => {
  const [editor] = useLexicalComposerContext();
  const [hovered, setHovered] = useState<{ rows: number; cols: number }>({
    rows: 1,
    cols: 1,
  });

  const handleCellClick = (rows: number, cols: number) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: String(cols),
      rows: String(rows),
      includeHeaders: false,
    });
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 select-none">
      <div className="text-foreground text-center text-xs font-medium">
        {hovered.rows > 0 && hovered.cols > 0
          ? `${hovered.cols} × ${hovered.rows} Table`
          : "Insert Table"}
      </div>

      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
        }}
        onMouseLeave={() => setHovered({ rows: 1, cols: 1 })}
      >
        {Array.from({ length: maxRows }).map((_, r) =>
          Array.from({ length: maxCols }).map((_, c) => {
            const rowIndex = r + 1;
            const colIndex = c + 1;
            const isHighlighted = rowIndex <= hovered.rows && colIndex <= hovered.cols;

            return (
              <button
                key={`${r}-${c}`}
                type="button"
                className={`size-4 rounded-xs border transition-colors ${
                  isHighlighted
                    ? "border-primary bg-primary/20 dark:bg-primary/30"
                    : "border-border bg-surface-secondary hover:border-primary/70"
                }`}
                onMouseEnter={() => setHovered({ rows: rowIndex, cols: colIndex })}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                title={`${colIndex} × ${rowIndex}`}
              />
            );
          }),
        )}
      </div>
    </div>
  );
};
