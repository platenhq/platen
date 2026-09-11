"use client";

import {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  LexicalCommand,
  LexicalNode,
  NodeKey,
  ParagraphNode,
  RangeSelection,
  SerializedElementNode,
  Spread,
  createCommand,
} from "lexical";

export type CalloutType = "info" | "warning" | "tip" | "danger" | "note";

export type SerializedCalloutNode = Spread<
  {
    calloutType: CalloutType;
  },
  SerializedElementNode
>;

export const INSERT_CALLOUT_COMMAND: LexicalCommand<{ type?: CalloutType }> =
  createCommand("INSERT_CALLOUT_COMMAND");

export class CalloutNode extends ElementNode {
  __calloutType: CalloutType;

  static getType(): string {
    return "callout";
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__calloutType, node.__key);
  }

  constructor(calloutType: CalloutType = "info", key?: NodeKey) {
    super(key);
    this.__calloutType = calloutType;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement("div");
    dom.className = `editor-callout editor-callout-${this.__calloutType}`;
    dom.setAttribute("data-lexical-callout", this.__calloutType);
    dom.setAttribute("role", "note");
    return dom;
  }

  updateDOM(prevNode: CalloutNode, dom: HTMLElement): boolean {
    if (prevNode.__calloutType !== this.__calloutType) {
      dom.className = `editor-callout editor-callout-${this.__calloutType}`;
      dom.setAttribute("data-lexical-callout", this.__calloutType);
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        const calloutType = domNode.getAttribute("data-lexical-callout") as CalloutType | null;
        if (calloutType) {
          return {
            conversion: () => ({ node: $createCalloutNode(calloutType) }),
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.className = `editor-callout editor-callout-${this.__calloutType}`;
    element.setAttribute("data-lexical-callout", this.__calloutType);
    return { element };
  }

  static importJSON(serializedNode: SerializedCalloutNode): CalloutNode {
    const node = $createCalloutNode(serializedNode.calloutType || "info");
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedCalloutNode {
    return {
      ...super.exportJSON(),
      calloutType: this.__calloutType,
      type: "callout",
      version: 1,
    };
  }

  getCalloutType(): CalloutType {
    return this.getLatest().__calloutType;
  }

  setCalloutType(type: CalloutType): void {
    const writable = this.getWritable();
    writable.__calloutType = type;
  }

  canIndent(): false {
    return false;
  }

  collapseAtStart(selection: RangeSelection): boolean {
    const firstChild = this.getFirstChild();
    if (firstChild === null || firstChild.is(selection.anchor.getNode())) {
      return true;
    }
    return false;
  }

  insertNewAfter(): ParagraphNode {
    return new ParagraphNode();
  }
}

export function $createCalloutNode(calloutType: CalloutType = "info"): CalloutNode {
  return new CalloutNode(calloutType);
}

export function $isCalloutNode(node: LexicalNode | null | undefined): node is CalloutNode {
  return node instanceof CalloutNode;
}
