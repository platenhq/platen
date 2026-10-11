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
  Spread,
  createCommand,
} from "lexical";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ExternalLink, Trash2 } from "lucide-react";

export type SerializedYouTubeNode = Spread<
  {
    id: string;
  },
  SerializedLexicalNode
>;

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> =
  createCommand("INSERT_YOUTUBE_COMMAND");

export function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube URL formats
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i,
  );
  return match ? match[1] : null;
}

function YouTubeComponent({ nodeKey, videoId }: { nodeKey: NodeKey; videoId: string }) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

  const onDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node) {
        node.remove();
      }
    });
  };

  return (
    <div
      className={`group relative mx-auto my-4 w-full max-w-2xl overflow-hidden rounded-xl border transition-all select-none ${
        isSelected
          ? "border-primary ring-primary/40 shadow-xl ring-2"
          : "border-border hover:border-border-hover shadow-md"
      }`}
      contentEditable={false}
      onClick={(e) => {
        if (!e.defaultPrevented) {
          clearSelection();
          setSelected(true);
        }
      }}
    >
      {/* Floating Action Overlay */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in YouTube"
          className="flex size-7 items-center justify-center rounded-md bg-black/75 text-white backdrop-blur-xs transition-colors hover:bg-black"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="size-3.5" />
        </a>
        <button
          type="button"
          title="Delete video"
          onClick={onDelete}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md bg-red-600/85 text-white backdrop-blur-xs transition-colors hover:bg-red-600"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* 16:9 Video Player */}
      <div className="aspect-video w-full bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title="YouTube video player"
          className="size-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export class YouTubeNode extends DecoratorNode<JSX.Element> {
  __id: string;

  static getType(): string {
    return "youtube";
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__id, node.__key);
  }

  constructor(id: string, key?: NodeKey) {
    super(key);
    this.__id = id;
  }

  getId(): string {
    return this.__id;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("div");
    el.className = "youtube-embed-wrapper";
    return el;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    return $createYouTubeNode(serializedNode.id);
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      id: this.__id,
      type: "youtube",
      version: 1,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (domNode: HTMLElement) => {
        const src = domNode.getAttribute("src") || "";
        const id = parseYouTubeId(src);
        if (id) {
          return {
            conversion: () => ({ node: $createYouTubeNode(id) }),
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("iframe");
    element.setAttribute("src", `https://www.youtube-nocookie.com/embed/${this.__id}`);
    element.setAttribute("width", "560");
    element.setAttribute("height", "315");
    element.setAttribute("frameborder", "0");
    element.setAttribute("allowfullscreen", "true");
    return { element };
  }

  getTextContent(): string {
    return `https://www.youtube.com/watch?v=${this.__id}`;
  }

  isInline(): false {
    return false;
  }

  decorate(): JSX.Element {
    return <YouTubeComponent nodeKey={this.__key} videoId={this.__id} />;
  }
}

export function $createYouTubeNode(id: string): YouTubeNode {
  return new YouTubeNode(id);
}

export function $isYouTubeNode(node: LexicalNode | null | undefined): node is YouTubeNode {
  return node instanceof YouTubeNode;
}
