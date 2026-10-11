import { TableCellNode } from "@lexical/table";
import type { EditorConfig, LexicalEditor } from "lexical";

let isPatched = false;

/**
 * Patches TableCellNode prototype to render inline styles (such as border-color, border-width)
 * directly to the DOM element (`<td>` / `<th>`).
 *
 * Upstream @lexical/table serializes `__style` via `super.exportJSON()` and restores it
 * via `super.updateFromJSON()`, but omits `__style` in `createDOM` and `updateDOM`.
 * This patch ensures cell-specific styling takes visual effect in the browser.
 */
export function patchTableCellNode(): void {
  if (isPatched || typeof TableCellNode === "undefined" || !TableCellNode.prototype) {
    return;
  }
  isPatched = true;

  const originalCreateDOM = TableCellNode.prototype.createDOM;
  TableCellNode.prototype.createDOM = function (config: EditorConfig) {
    const element = originalCreateDOM.call(this, config);
    const style = this.getStyle();
    if (style) {
      element.style.cssText += (element.style.cssText ? "; " : "") + style;
    }
    return element;
  };

  type UpdateDOMFn = (
    this: TableCellNode,
    prevNode: TableCellNode,
    dom?: HTMLElement,
    config?: EditorConfig,
  ) => boolean;

  type ExportDOMFn = (
    this: TableCellNode,
    editor: LexicalEditor,
  ) => { element: HTMLElement | null };

  const originalUpdateDOM = TableCellNode.prototype.updateDOM as unknown as UpdateDOMFn;
  (TableCellNode.prototype as unknown as { updateDOM: UpdateDOMFn }).updateDOM = function (
    this: TableCellNode,
    prevNode: TableCellNode,
    dom?: HTMLElement,
  ): boolean {
    // Only recreate DOM if tag actually changes between <th> and <td>
    if (prevNode.hasHeader() !== this.hasHeader()) {
      return true;
    }

    let targetDom = dom;
    if (!targetDom && typeof document !== "undefined") {
      targetDom =
        document.querySelector<HTMLElement>(
          `[data-temporary-table-cell-lexical-key="${this.getKey()}"]`,
        ) ?? undefined;
    }

    if (targetDom) {
      const currentStyle = this.getStyle() || "";
      const prevStyle = prevNode.getStyle() || "";
      const styleChanged = currentStyle !== prevStyle;
      if (styleChanged) {
        targetDom.style.cssText = currentStyle;
      }

      const currentBg = this.getBackgroundColor();
      const prevBg = prevNode.getBackgroundColor();
      if (styleChanged || currentBg !== prevBg) {
        targetDom.style.backgroundColor = currentBg || "";
      }

      const currentWidth = this.getWidth();
      const prevWidth = prevNode.getWidth();
      if (styleChanged || currentWidth !== prevWidth) {
        if (currentWidth !== undefined) {
          targetDom.style.width = `${currentWidth}px`;
        } else {
          targetDom.style.width = "";
        }
      }

      const currentVA = this.getVerticalAlign();
      const prevVA = prevNode.getVerticalAlign();
      if (styleChanged || currentVA !== prevVA) {
        targetDom.style.verticalAlign = currentVA || "";
      }

      const currentColSpan = this.getColSpan();
      const prevColSpan = prevNode.getColSpan();
      if (currentColSpan !== prevColSpan && targetDom instanceof HTMLTableCellElement) {
        if (currentColSpan > 1) {
          targetDom.colSpan = currentColSpan;
        } else {
          targetDom.removeAttribute("colSpan");
        }
      }

      const currentRowSpan = this.getRowSpan();
      const prevRowSpan = prevNode.getRowSpan();
      if (currentRowSpan !== prevRowSpan && targetDom instanceof HTMLTableCellElement) {
        if (currentRowSpan > 1) {
          targetDom.rowSpan = currentRowSpan;
        } else {
          targetDom.removeAttribute("rowSpan");
        }
      }
    }

    // NEVER return true for style/color/width mutations: prevents unmounting <td> and losing td._cell
    return false;
  };

  const originalExportDOM = TableCellNode.prototype.exportDOM as unknown as ExportDOMFn;
  (TableCellNode.prototype as unknown as { exportDOM: ExportDOMFn }).exportDOM = function (
    this: TableCellNode,
    editor: LexicalEditor,
  ) {
    const output = originalExportDOM.call(this, editor);
    if (output && output.element && typeof output.element.style !== "undefined") {
      const style = this.getStyle();
      if (style) {
        output.element.style.cssText += (output.element.style.cssText ? "; " : "") + style;
      }
    }
    return output;
  };
}

patchTableCellNode();
