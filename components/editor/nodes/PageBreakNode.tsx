"use client";

import React, { JSX } from "react";
import {
  DecoratorNode,
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalCommand,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  createCommand,
} from "lexical";

export type SerializedPageBreakNode = SerializedLexicalNode;

export const INSERT_PAGE_BREAK_COMMAND: LexicalCommand<void> = createCommand(
  "INSERT_PAGE_BREAK_COMMAND",
);

function PageBreakComponent({ nodeKey: _nodeKey }: { nodeKey: NodeKey }) {
  return (
    <div
      className="page-break-node my-4 flex items-center justify-between py-2 select-none"
      contentEditable={false}
    >
      <div className="border-muted-foreground/30 flex-1 border-t border-dashed" />
      <span className="bg-surface-secondary text-muted-foreground border-border mx-3 rounded-xs border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
        Page Break
      </span>
      <div className="border-muted-foreground/30 flex-1 border-t border-dashed" />
    </div>
  );
}

export class PageBreakNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return "page-break";
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key);
  }

  static importJSON(_serializedNode: SerializedPageBreakNode): PageBreakNode {
    return $createPageBreakNode();
  }

  exportJSON(): SerializedPageBreakNode {
    return {
      type: "page-break",
      version: 1,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.getAttribute("data-lexical-page-break") === "true") {
          return {
            conversion: () => ({ node: $createPageBreakNode() }),
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-page-break", "true");
    return { element };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("div");
    el.className = "page-break-wrapper";
    return el;
  }

  getTextContent(): string {
    return "\n";
  }

  isInline(): false {
    return false;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return <PageBreakComponent nodeKey={this.__key} />;
  }
}

export function $createPageBreakNode(): PageBreakNode {
  return new PageBreakNode();
}

export function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode {
  return node instanceof PageBreakNode;
}
